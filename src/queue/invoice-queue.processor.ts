import { Process, Processor } from "@nestjs/bull";
import { InvoicesService } from "src/version_3/invoices/invoices.service";
import Redlock from "redlock";
import { Employee } from "src/common/entities/employee.entity";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InjectRedis } from "@liaoliaots/nestjs-redis";
import Redis from "ioredis";
import { TaskEnum } from "src/job/enums/task.enum";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

/**
 * Interface định nghĩa cấu trúc dữ liệu job hóa đơn
 */
interface InvoiceJobData {
  restaurantId?: number;
  invoices: any[];
  restaurantPartnerInvoiceEntity: any;
}

/**
 * Consumer xử lý queue gửi hóa đơn điện tử
 * Chịu trách nhiệm xử lý các job gửi hóa đơn đến nhà cung cấp bên thứ ba
 * Hỗ trợ xử lý đồng thời và quản lý lock để tránh trùng lặp
 */
@Injectable()
@Processor(TaskEnum.INVOICE_QUEUE_SEND)
export class InvoiceQueueSendConsumer implements OnModuleInit {
  private readonly logger = new Logger(InvoiceQueueSendConsumer.name);
  private redlock: Redlock;
  constructor(
    private readonly invoicesService: InvoicesService,
    @InjectRedis("redis") private readonly cacheManager: Redis
  ) {
    // Khởi tạo Redlock để quản lý distributed lock
    this.redlock = new Redlock([this.cacheManager], {
      retryCount: 5, // Số lần thử lại khi không thể acquire lock
      retryDelay: 100, // Thời gian chờ giữa các lần thử (ms)
    });
  }
  /**
   * Hook khởi tạo module - chạy khi NestJS khởi động
   * Ghi log thông báo processor đã sẵn sàng xử lý job
   */
  async onModuleInit() {
    this.logger.log(
      "[DYNAMIC-PROCESSOR] Khởi tạo processor xử lý queue hóa đơn"
    );
    this.logger.log(
      "[DYNAMIC-PROCESSOR] Processor sẵn sàng cho queue:",
      TaskEnum.INVOICE_QUEUE_SEND
    );
  }

  /**
   * Method chính xử lý job gửi hóa đơn
   * Được BullMQ tự động gọi khi có job mới trong queue
   * @param job Job chứa dữ liệu hóa đơn cần xử lý
   * @returns Kết quả xử lý job
   */
  @Process({ name: TaskEnum.INVOICE_QUEUE_SEND, concurrency: 5 })
  async processInvoiceQueueSend(
    job: Job<InvoiceJobData, any, string>
  ): Promise<any> {
    return this.processInvoiceJob(job);
  }

  /**
   * Xử lý job hóa đơn với hỗ trợ queue động
   * Phân loại và điều hướng job đến method xử lý phù hợp
   * @param job Job cần xử lý
   * @param processorKey Khóa định danh processor (để phân biệt các queue khác nhau)
   * @returns Kết quả xử lý
   */
  async processInvoiceJob(job: Job<InvoiceJobData, any, string>): Promise<any> {
    const { name } = job;
    const startTime = Date.now();
    try {
      await this.processSend(job);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[DYNAMIC-PROCESSOR] Xử lý job thất bại sau ${duration}ms`,
        {
          jobId: job.id,
          jobName: name,
          error: error.message,
          stack: error.stack,
          duration,
        }
      );
      throw error;
    }
  }

  /**
   * Xử lý gửi hóa đơn đến nhà cung cấp bên thứ ba
   * Bao gồm: lọc hóa đơn theo loại đơn hàng, xử lý song song, quản lý lock
   * @param job Job chứa dữ liệu hóa đơn
   * @param processorKey Khóa định danh processor
   * @returns Kết quả xử lý
   */
  async processSend(job: Job<InvoiceJobData, any, string>): Promise<any> {
    const data = job.data;
    const startTime = Date.now();

    this.logger.log(
      `[PROCESSOR] Bắt đầu xử lý hóa đơn cho nhà hàng ${data.restaurantPartnerInvoiceEntity.restaurant_id}`,
      {
        jobId: job.id,
        restaurantId: data.restaurantPartnerInvoiceEntity.restaurant_id,
        invoiceCount: data.invoices.length,
        partnerType:
          data.restaurantPartnerInvoiceEntity.partner_electronic_invoice_type,
        attempt: job.attemptsMade + 1,
      }
    );

    try {
      // Tạo employee mặc định cho việc xuất hóa đơn
      let employee = new Employee();
      employee.jwt_token = "DEFAULT";

      this.logger.debug(
        `[PROCESSOR] Đã lọc ${data.invoices.length} hóa đơn để xử lý`,
        {
          jobId: job.id,
          restaurantId: data.restaurantPartnerInvoiceEntity.restaurant_id,
          filteredCount: data.invoices.length,
          originalCount: data.invoices.length,
        }
      );

      // Xử lý song song tất cả hóa đơn
      const promises = data.invoices.map(async (invoice) => {
        const processedKey = `processed_invoices_${data.restaurantPartnerInvoiceEntity.restaurant_id}`;
        const lockKey = `invoice_lock_${invoice._id}`;
        let interval: NodeJS.Timeout | null = null;
        let lock: any = null;

        try {
          // Acquire distributed lock cho hóa đơn (timeout 5 giây)
          lock = await this.redlock.acquire([lockKey], 5000);

          // Thiết lập interval để extend lock định kỳ
          interval = setInterval(async () => {
            try {
              await lock.extend(3000); // Extend thêm 3 giây
            } catch (error) {
              this.logger.warn(
                `Không thể extend lock cho hóa đơn ${invoice._id}`,
                {
                  jobId: job.id,
                  invoiceId: invoice._id,
                  error: error.message,
                }
              );
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
            }
          }, 2000); // Extend mỗi 2 giây

          try {
            // Double-check: Kiểm tra xem hóa đơn đã được xử lý chưa sau khi có lock
            const processedInvoiceIds = await this.cacheManager.smembers(
              processedKey
            );
            if (processedInvoiceIds.includes(invoice._id.toString())) {
              this.logger.debug(
                `Invoice ${invoice._id} already processed, skipping`,
                {
                  jobId: job.id,
                  invoiceId: invoice._id,
                }
              );
              return { success: true, invoiceId: invoice._id, skipped: true };
            }

            // Kiểm tra invoice status trong database để đảm bảo chưa được xuất
            const currentInvoice = await this.invoicesService.findById(
              invoice._id
            );
            if (!currentInvoice || currentInvoice.invoice_status !== 0) {
              this.logger.debug(
                `Invoice ${invoice._id} status is ${currentInvoice?.invoice_status}, skipping`,
                {
                  jobId: job.id,
                  invoiceId: invoice._id,
                  status: currentInvoice?.invoice_status,
                }
              );
              return { success: true, invoiceId: invoice._id, skipped: true };
            }

            // Đánh dấu invoice đang được xử lý ngay lập tức để tránh duplicate
            await this.cacheManager.sadd(processedKey, invoice._id.toString());
            await this.cacheManager.expire(processedKey, 3600); // TTL 1 giờ

            // Tạo DTO để xuất hóa đơn
            let exportInvoiceDTO = new ExportInvoiceDTO();
            exportInvoiceDTO.id = invoice._id;
            exportInvoiceDTO.customer_name =
              invoice.customer_name === ""
                ? "KHÁCH LẺ KHÔNG LẤY HÓA ĐƠN"
                : invoice.customer_name;
            exportInvoiceDTO.customer_company_name =
              invoice.customer_company_name ?? "";
            exportInvoiceDTO.customer_phone = invoice.customer_phone ?? "";
            exportInvoiceDTO.invoice_denominator =
              invoice.invoice_denominator ?? "1";
            exportInvoiceDTO.is_send_mail = 0;

            // Gọi service để xuất hóa đơn tự động
            await this.invoicesService.exportInvoiceAuto(
              exportInvoiceDTO,
              employee,
              data.restaurantPartnerInvoiceEntity,
              invoice
            );

            this.logger.debug(`Xử lý thành công hóa đơn ${invoice._id}`, {
              jobId: job.id,
              invoiceId: invoice._id,
              restaurantId: data.restaurantPartnerInvoiceEntity.restaurant_id,
            });

            return { success: true, invoiceId: invoice._id };
          } catch (error) {
            this.logger.error(`Lỗi khi xử lý hóa đơn ${invoice._id}`, {
              jobId: job.id,
              invoiceId: invoice._id,
              error: error.message,
              stack: error.stack,
            });

            // Nếu có lỗi, remove khỏi processed list để có thể retry
            try {
              await this.cacheManager.srem(
                processedKey,
                invoice._id.toString()
              );
            } catch (removeError) {
              this.logger.error(
                `Failed to remove invoice ${invoice._id} from processed list:`,
                removeError
              );
            }

            return {
              success: false,
              invoiceId: invoice._id,
              error: error.message,
            };
          } finally {
            // Đảm bảo dọn dẹp interval và release lock
            if (interval) {
              clearInterval(interval);
            }
            if (lock) {
              await lock.release();
            }
          }
        } catch (lockError) {
          this.logger.warn(
            `Không thể acquire lock cho hóa đơn ${invoice._id}`,
            {
              jobId: job.id,
              invoiceId: invoice._id,
              error: lockError.message,
            }
          );
          return {
            success: false,
            invoiceId: invoice._id,
            error: "Không thể acquire lock",
          };
        }
      });
      // Chờ tất cả promises hoàn thành
      await Promise.allSettled(promises);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[PROCESSOR] Hoàn thành xử lý ${data.invoices.length} hóa đơn cho nhà hàng ${data.restaurantPartnerInvoiceEntity.restaurant_id} trong ${duration}ms`,
        {
          jobId: job.id,
          restaurantId: data.restaurantPartnerInvoiceEntity.restaurant_id,
          totalInvoices: data.invoices.length,
          duration,
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[PROCESSOR] Lỗi xử lý job sau ${duration}ms`, {
        jobId: job.id,
        restaurantId: data.restaurantPartnerInvoiceEntity?.restaurant_id,
        error: error.message,
        stack: error.stack,
        duration,
      });
    }
  }
}
