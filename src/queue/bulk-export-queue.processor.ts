import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import { TaskEnum } from "../job/enums/task.enum";
import { InvoicesService } from "../version_3/invoices/invoices.service";
import { CacheService } from "../redis/services/cache.service";
import { ExportInvoiceDTO } from "../common/dto/invoice.export.dto";
import { Employee } from "../common/entities/employee.entity";
import { InvoiceStatusEnum } from "../common/enums/invoice-status.enum";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Invoice, InvoiceDocument } from "../common/schemas/invoice.schema";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedDocument,
} from "../common/schemas/invoice-send-failed.schema";

/**
 * Interface định nghĩa cấu trúc dữ liệu job bulk export
 */
interface BulkExportJobData {
  job_id: string;
  invoice_ids: string[];
  branch_id: number;
  is_send_mail: number;
  employee: {
    id: string;
    jwt_token: string;
    name: string;
  };
  created_at: Date;
}

/**
 * Interface cho kết quả xử lý từng hóa đơn
 */
interface InvoiceProcessResult {
  invoice_id: string;
  success: boolean;
  error?: string;
  ref_code?: string;
}

/**
 * Consumer xử lý queue bulk export hóa đơn
 * Chịu trách nhiệm xử lý job xuất nhiều hóa đơn cùng lúc
 * Hỗ trợ xử lý song song và logging chi tiết
 */
@Injectable()
@Processor(TaskEnum.INVOICE_BULK_EXPORT_QUEUE)
export class BulkExportQueueProcessor {
  private readonly logger = new Logger(BulkExportQueueProcessor.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(InvoiceSendFailedSchema.name)
    private invoiceSendFailedModel: Model<InvoiceSendFailedDocument>,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Method chính xử lý job bulk export
   * Được BullMQ tự động gọi khi có job mới trong queue
   * @param job Job chứa dữ liệu bulk export
   * @returns Kết quả xử lý job
   */
  @Process("bulk-export-invoices")
  async processBulkExport(job: Job<BulkExportJobData>): Promise<any> {
    const { job_id, invoice_ids, branch_id, is_send_mail, employee } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `[BULK-EXPORT] Bắt đầu xử lý job ${job_id} với ${invoice_ids.length} hóa đơn`,
      {
        jobId: job_id,
        invoiceCount: invoice_ids.length,
        employeeId: employee.id,
        attempt: job.attemptsMade + 1,
      }
    );

    try {
      // Lấy thông tin chi tiết các hóa đơn - BỎ điều kiện invoice_status để tránh race condition
      const invoices = await this.invoiceModel
        .find({
          _id: { $in: invoice_ids },
        })
        .lean();

      if (invoices.length === 0) {
        throw new Error("Không tìm thấy hóa đơn hợp lệ để xuất");
      }

      // Phân loại hóa đơn theo trạng thái để xử lý chính xác
      const pendingInvoices = invoices.filter(
        (inv) => inv.invoice_status === 0
      );
      const alreadyProcessed = invoices.filter(
        (inv) => inv.invoice_status !== 0
      );

      // Log thông tin phân loại
      if (alreadyProcessed.length > 0) {
        this.logger.warn(
          `[BULK-EXPORT] ${alreadyProcessed.length} hóa đơn đã được xử lý trước đó`,
          {
            jobId: job_id,
            alreadyProcessedIds: alreadyProcessed.map((inv) =>
              inv._id.toString()
            ),
            alreadyProcessedStatuses: alreadyProcessed.map((inv) => ({
              id: inv._id,
              status: inv.invoice_status,
            })),
          }
        );
      }

      // Nếu tất cả hóa đơn đã được xử lý, trả về kết quả ngay
      if (pendingInvoices.length === 0) {
        this.logger.warn(
          `[BULK-EXPORT] Tất cả hóa đơn đã được xử lý, job kết thúc`,
          {
            jobId: job_id,
            totalRequested: invoice_ids.length,
            alreadyProcessed: alreadyProcessed.length,
          }
        );

        // Xóa cache và trả về kết quả
        await this.clearJobCache(job_id, invoice_ids);

        return {
          job_id,
          total_invoices: invoices.length,
          pending_invoices: 0,
          already_processed_count: alreadyProcessed.length,
          success_count: 0,
          fail_count: 0,
          duration: Date.now() - startTime,
          message: "Tất cả hóa đơn đã được xử lý trước đó",
          results: [],
        };
      }

      this.logger.log(
        `[BULK-EXPORT] Tìm thấy ${pendingInvoices.length}/${invoice_ids.length} hóa đơn chưa xử lý`,
        {
          jobId: job_id,
          pendingCount: pendingInvoices.length,
          totalRequested: invoice_ids.length,
          alreadyProcessed: alreadyProcessed.length,
        }
      );

      // Tạo employee object từ data
      const employeeObj = new Employee();
      employeeObj.jwt_token = employee.jwt_token;

      // Xử lý từng hóa đơn song song với concurrency limit - chỉ xử lý hóa đơn chưa xuất
      const results: InvoiceProcessResult[] = [];
      const concurrencyLimit = 3; // Giảm xuống 3 để tránh race condition

      for (let i = 0; i < pendingInvoices.length; i += concurrencyLimit) {
        const batch = pendingInvoices.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map((invoice) =>
          this.processInvoice(invoice, is_send_mail, employeeObj, job_id)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Xử lý kết quả từng batch
        batchResults.forEach((result, index) => {
          const invoice = batch[index];
          if (result.status === "fulfilled") {
            results.push(result.value);
          } else {
            results.push({
              invoice_id: invoice._id.toString(),
              success: false,
              error: result.reason?.message || "Unknown error",
            });
          }
        });

        // Log progress chi tiết
        const processed = Math.min(
          i + concurrencyLimit,
          pendingInvoices.length
        );
        this.logger.log(
          `[BULK-EXPORT] Đã xử lý batch ${
            Math.floor(i / concurrencyLimit) + 1
          }: ${processed}/${pendingInvoices.length} hóa đơn`,
          {
            jobId: job_id,
            batchNumber: Math.floor(i / concurrencyLimit) + 1,
            batchSize: batch.length,
            processed,
            total: pendingInvoices.length,
            percentage: Math.round((processed / pendingInvoices.length) * 100),
          }
        );
      }

      // Tổng hợp kết quả chi tiết
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      const alreadyProcessedCount = results.filter(
        (r) => !r.success && r.error?.includes("đã được xử lý")
      ).length;
      const actualFailCount = failCount - alreadyProcessedCount;
      const duration = Date.now() - startTime;

      this.logger.log(
        `[BULK-EXPORT] Hoàn thành job ${job_id} trong ${duration}ms`,
        {
          jobId: job_id,
          totalInvoices: invoices.length,
          pendingInvoices: pendingInvoices.length,
          alreadyProcessed: alreadyProcessed.length,
          successCount,
          actualFailCount,
          alreadyProcessedInBatch: alreadyProcessedCount,
          totalFailCount: failCount,
          duration,
          successRate:
            pendingInvoices.length > 0
              ? Math.round((successCount / pendingInvoices.length) * 100)
              : 0,
        }
      );

      // Log chi tiết các hóa đơn thất bại và lưu vào database
      const failedInvoices = results.filter((r) => !r.success);
      if (failedInvoices.length > 0) {
        this.logger.warn(
          `[BULK-EXPORT] ${failedInvoices.length} hóa đơn xử lý thất bại:`,
          {
            jobId: job_id,
            failedInvoices: failedInvoices.map((f) => ({
              id: f.invoice_id,
              error: f.error,
            })),
          }
        );

        // Lưu các hóa đơn thất bại vào database
        for (const failedInvoice of failedInvoices) {
          await this.saveInvoiceSendFailed(
            failedInvoice.invoice_id,
            failedInvoice.error || "Unknown error",
            "",
            `Bulk export job ${job_id} - Invoice processing failed`
          );
        }
      }

      // Xóa cache khi job hoàn thành
      await this.clearJobCache(job_id, invoice_ids);

      return {
        job_id,
        total_invoices: invoices.length,
        pending_invoices: pendingInvoices.length,
        already_processed_count: alreadyProcessed.length,
        success_count: successCount,
        fail_count: failCount,
        duration,
        results,
        summary: {
          requested: invoice_ids.length,
          found_in_db: invoices.length,
          pending_to_process: pendingInvoices.length,
          already_processed: alreadyProcessed.length,
          processed_successfully: successCount,
          failed_to_process: failCount,
          success_rate:
            pendingInvoices.length > 0
              ? Math.round((successCount / pendingInvoices.length) * 100)
              : 0,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[BULK-EXPORT] Lỗi xử lý job ${job_id} sau ${duration}ms`,
        {
          jobId: job_id,
          error: error.message,
          stack: error.stack,
          duration,
        }
      );

      // Lưu tất cả invoice_ids vào invoice_send_failed khi job thất bại hoàn toàn
      for (const invoiceId of invoice_ids) {
        await this.saveInvoiceSendFailed(
          invoiceId,
          error.message,
          error.stack || "",
          `Bulk export job ${job_id} failed completely - Timeout or system error`
        );
      }

      // Xóa cache khi job thất bại
      await this.clearJobCache(job_id, invoice_ids);

      throw error;
    }
  }

  /**
   * Xử lý xuất một hóa đơn đơn lẻ
   * @param invoice Thông tin hóa đơn
   * @param is_send_mail Có gửi email không
   * @param employee Thông tin nhân viên
   * @param job_id ID của job để logging
   * @returns Kết quả xử lý
   */
  private async processInvoice(
    invoice: any,
    is_send_mail: number,
    employee: Employee,
    job_id: string
  ): Promise<InvoiceProcessResult> {
    try {
      // Kiểm tra lại trạng thái hóa đơn trước khi xử lý để tránh race condition
      if (invoice.invoice_status !== 0) {
        this.logger.warn(
          `[BULK-EXPORT] Hóa đơn ${invoice._id} đã được xử lý (status: ${invoice.invoice_status}), bỏ qua`,
          {
            jobId: job_id,
            invoiceId: invoice._id,
            currentStatus: invoice.invoice_status,
          }
        );

        return {
          invoice_id: invoice._id.toString(),
          success: false,
          error: `Hóa đơn đã được xử lý với trạng thái ${invoice.invoice_status}`,
        };
      }

      // Tạo DTO để xuất hóa đơn
      const exportInvoiceDTO = new ExportInvoiceDTO();
      exportInvoiceDTO.id = invoice._id.toString();
      exportInvoiceDTO.customer_name =
        invoice.customer_name === ""
          ? "KHÁCH LẺ KHÔNG LẤY HÓA ĐƠN"
          : invoice.customer_name;
      exportInvoiceDTO.customer_company_name =
        invoice.customer_company_name ?? "";
      exportInvoiceDTO.customer_phone = invoice.customer_phone ?? "";
      exportInvoiceDTO.invoice_denominator = invoice.invoice_denominator ?? "1";
      exportInvoiceDTO.is_send_mail = is_send_mail;

      this.logger.debug(`[BULK-EXPORT] Bắt đầu xử lý hóa đơn ${invoice._id}`, {
        jobId: job_id,
        invoiceId: invoice._id,
        customerName: exportInvoiceDTO.customer_name,
      });

      // Gọi service để xuất hóa đơn
      const result = await this.invoicesService.exportInvoice(
        exportInvoiceDTO,
        employee
      );

      // Tự động xóa record khỏi invoice_send_failed khi xuất thành công
      await this.removeFromFailedInvoices(invoice._id.toString());

      this.logger.debug(
        `[BULK-EXPORT] Xuất thành công hóa đơn ${invoice._id}`,
        {
          jobId: job_id,
          invoiceId: invoice._id,
          refCode: result.ref_code,
        }
      );

      return {
        invoice_id: invoice._id.toString(),
        success: true,
        ref_code: result.ref_code,
      };
    } catch (error) {
      this.logger.error(`[BULK-EXPORT] Lỗi xuất hóa đơn ${invoice._id}`, {
        jobId: job_id,
        invoiceId: invoice._id,
        error: error.message,
      });

      // Insert vào invoice_send_failed khi có lỗi
      await this.saveInvoiceSendFailed(
        invoice._id.toString(),
        error.message,
        error.stack || "",
        `Bulk export job ${job_id} failed`
      );

      return {
        invoice_id: invoice._id.toString(),
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lưu thông tin hóa đơn gửi thất bại vào database
   * @param invoice_id ID của hóa đơn
   * @param error_message Thông báo lỗi
   * @param error_details Chi tiết lỗi (stack trace)
   * @param note Ghi chú bổ sung
   */
  private async saveInvoiceSendFailed(
    invoice_id: string,
    error_message: string,
    error_details: string,
    note: string
  ): Promise<void> {
    try {
      const invoiceSendFailed = new this.invoiceSendFailedModel({
        invoice_id,
        error_message,
        error_details,
        note,
        retry_count: 0,
        status: "FAILED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await invoiceSendFailed.save();

      this.logger.debug(
        `[BULK-EXPORT] Đã lưu thông tin hóa đơn thất bại ${invoice_id}`
      );
    } catch (error) {
      this.logger.error(
        `[BULK-EXPORT] Lỗi khi lưu invoice_send_failed cho ${invoice_id}:`,
        error.message
      );
    }
  }

  /**
   * Xóa cache liên quan đến job và validate Redis cho hóa đơn lỗi
   * @param job_id ID của job
   * @param invoice_ids Danh sách invoice IDs
   */
  private async clearJobCache(
    job_id: string,
    invoice_ids: string[]
  ): Promise<void> {
    try {
      // Xóa cache job
      await this.cacheService.deleteCache(`bulk_export_job:${job_id}`);
      await this.cacheService.deleteCache(`bulk_export_progress:${job_id}`);

      // Xóa cache cho từng invoice_id
      for (const invoiceId of invoice_ids) {
        await this.cacheService.deleteCache(`bulk_export_queue:${invoiceId}`);
      }

      // Xóa validate Redis cho hóa đơn lỗi để có thể xuất lại
      await this.clearFailedInvoiceValidation(invoice_ids);

      this.logger.debug(
        `[BULK-EXPORT] Đã xóa cache cho job ${job_id} và ${invoice_ids.length} invoice IDs`
      );
    } catch (error) {
      this.logger.warn(
        `[BULK-EXPORT] Lỗi khi xóa cache cho job ${job_id}:`,
        error.message
      );
    }
  }

  /**
   * Xóa validate Redis cho hóa đơn lỗi để có thể xuất lại
   * @param invoice_ids Danh sách invoice IDs
   */
  private async clearFailedInvoiceValidation(
    invoice_ids: string[]
  ): Promise<void> {
    try {
      // Lấy danh sách hóa đơn lỗi từ database
      const failedInvoices = await this.invoiceSendFailedModel
        .find({
          invoice_id: { $in: invoice_ids },
          status: "FAILED",
        })
        .lean();

      if (failedInvoices.length > 0) {
        // Xóa các key validation Redis cho hóa đơn lỗi
        for (const failedInvoice of failedInvoices) {
          const validationKeys = [
            `invoice_validation:${failedInvoice.invoice_id}`,
            `invoice_processing:${failedInvoice.invoice_id}`,
            `invoice_export_lock:${failedInvoice.invoice_id}`,
            `bulk_export_queue:${failedInvoice.invoice_id}`,
          ];

          for (const key of validationKeys) {
            await this.cacheService.deleteCache(key);
          }
        }

        this.logger.log(
          `[BULK-EXPORT] Đã xóa validate Redis cho ${failedInvoices.length} hóa đơn lỗi để có thể xuất lại`
        );
      }
    } catch (error) {
      this.logger.error(
        `[BULK-EXPORT] Lỗi khi xóa validate Redis cho hóa đơn lỗi:`,
        error.message
      );
    }
  }

  /**
   * Xóa record khỏi invoice_send_failed khi hóa đơn xuất thành công
   * @param invoice_id ID của hóa đơn
   */
  private async removeFromFailedInvoices(invoice_id: string): Promise<void> {
    try {
      const result = await this.invoiceSendFailedModel.deleteMany({
        invoice_id: invoice_id,
      });

      if (result.deletedCount > 0) {
        this.logger.debug(
          `[BULK-EXPORT] Đã xóa ${result.deletedCount} record lỗi cho hóa đơn ${invoice_id}`
        );
      }
    } catch (error) {
      this.logger.warn(
        `[BULK-EXPORT] Lỗi khi xóa record lỗi cho hóa đơn ${invoice_id}:`,
        error.message
      );
    }
  }
}
