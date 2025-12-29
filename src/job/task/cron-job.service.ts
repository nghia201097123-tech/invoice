import { HttpService } from "@nestjs/axios";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { LoginOauthDTO } from "src/common/dto/login.oauth.dto";
import { OauthService } from "src/oauth/oauth.service";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { Repository } from "typeorm/repository/Repository";
import { Invoice } from "../../common/schemas/invoice.schema";
import { MapSchedule } from "../../common/responses/map_schedule";
import { GetDetailInvoiceMifiDto } from "../../partner/invoice-mifi/dto/get_detail.dto";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { ThirdPartyServiceAdapter } from "src/partner/apdater/third-party.adapter";
import { CacheService } from "src/redis/services/cache.service";
import { TaskEnum } from "../enums/task.enum";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { Utils } from "src/common/utils/utils.common.helper";
import { QueueManagerService } from "../services/queue-manager.service";
import { InvoiceQueueSendConsumer } from "src/queue/invoice-queue.processor";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedDocument,
} from "src/common/schemas/invoice-send-failed.schema";
import { Invoice as InvoiceSchema } from "src/common/schemas/invoice.schema";
import * as moment from "moment-timezone";
import { OrderType } from "src/common/enums/order_type.enum";
import { InvoiceAppFood } from "src/common/enums/invoice.app-food.enum";

/**
 * Service quản lý các tác vụ cron job cho hệ thống hóa đơn điện tử
 * Bao gồm: kiểm tra trạng thái hóa đơn, tự động gửi hóa đơn, dọn dẹp queue
 */
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);
  private isRunningAutoSend = false;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(RestaurantPartnerInvoiceEntity)
    private restaurantPartnerInvoiceRepository: Repository<RestaurantPartnerInvoiceEntity>,
    private restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private oauthService: OauthService,
    private invoiceHelper: InvoiceHelper,
    private readonly cacheService: CacheService,
    private readonly queueManagerService: QueueManagerService,
    @Inject(forwardRef(() => InvoiceQueueSendConsumer))
    private readonly invoiceQueueProcessor: InvoiceQueueSendConsumer,
    @InjectModel(InvoiceSendFailedSchema.name)
    private readonly invoiceSendFailedModel: Model<InvoiceSendFailedDocument>,
    @InjectModel(InvoiceSchema.name)
    private readonly invoiceModel: Model<InvoiceSchema>
  ) {}
  /**
   * Cron job kiểm tra trạng thái hóa đơn hàng ngày
   * Chạy vào lúc 00:00 mỗi ngày để kiểm tra hóa đơn đã gửi đến các nhà cung cấp
   * Hỗ trợ các nhà cung cấp: M_INVOICE, FPT, MIFI
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkInvoice() {
    const startTime = Date.now();
    this.logger.log(
      "[CRON-CHECK-INVOICE] Bắt đầu quy trình kiểm tra hóa đơn hàng ngày"
    );
    try {
      let restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[];
      let invoice: Invoice;
      let invoices: Invoice[];
      let loginOauthDTO: LoginOauthDTO;
      let loginToPartNer: { token: string } | any;

      // Lấy danh sách nhà hàng sử dụng dịch vụ hóa đơn từ cache hoặc database
      const restaurantUseInvoiceServiceKey: string =
        "techres/restaurant_invoice/info";
      restaurantPartnerInvoices = await this.cacheService.getCachedData(
        restaurantUseInvoiceServiceKey
      );
      if (!restaurantPartnerInvoices) {
        // Nếu không có trong cache, lấy từ database và lưu vào cache
        restaurantPartnerInvoices =
          await this.restaurantPartnerInvoiceRepository.find();
        await this.cacheService.setCache(
          restaurantUseInvoiceServiceKey,
          restaurantPartnerInvoices,
          "EX",
          3600
        );
      }

      // Duyệt qua từng nhà hàng để kiểm tra hóa đơn
      for (const e of restaurantPartnerInvoices) {
        // Lấy danh sách hóa đơn của nhà hàng theo restaurant_id, brand_id và branch_id
        invoices =
          await this.invoiceHelper.findByRestaurantIdAndRestaurantBrandAndBranchId(
            e.restaurant_id,
            e.restaurant_brand_id,
            e.branch_id
          );

        // Xử lý theo từng loại nhà cung cấp dịch vụ hóa đơn điện tử
        if (
          e.partner_electronic_invoice_type ===
          PartnerElectronicInvoiceTypeEnum.M_INVOICE
        ) {
          // Xử lý nhà cung cấp M_INVOICE (MinVoice)
          let tokenPartNer = { minVoice_token: "" };

          for (const i of invoices) {
            // Kiểm tra điều kiện: có ref_code, có password và trạng thái hóa đơn là 1 hoặc 2
            if (
              i.ref_code !== "" &&
              e.password !== "" &&
              [1, 2].includes(i.invoice_status)
            ) {
              loginOauthDTO = new LoginOauthDTO(e);
              let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
                loginOauthDTO.restaurantPartnerInvoiceEntity
              );

              // Đăng nhập để lấy token nếu chưa có
              if (tokenPartNer.minVoice_token == "") {
                loginToPartNer = await this.oauthService.loginHandleForSchedule(
                  loginOauthDTO
                );

                if (!loginToPartNer) {
                  continue; // Bỏ qua nếu không đăng nhập được
                }
                tokenPartNer.minVoice_token = loginToPartNer.token;
              }

              // Tạo URL để lấy thông tin chi tiết hóa đơn
              let url: string = new UtilsParamHttpService(
                { id: i.ref_code },
                apiPartNer.apiMinVoiceGetInfo
              ).getUrl();

              // Gọi API để lấy thông tin hóa đơn
              let dataResult = await new UtilsHttpServiceCustom(
                url,
                {},
                tokenPartNer.minVoice_token,
                this.httpService
              ).get();

              // Kiểm tra kết quả trả về
              if (dataResult.message && dataResult.data === null) {
                continue; // Bỏ qua nếu không có dữ liệu
              }

              if (dataResult.ok === false) {
                continue; // Bỏ qua nếu API trả về lỗi
              }

              // Nếu hóa đơn đã được xử lý thành công (is_success = 1)
              if (dataResult.data.is_success == 1) {
                invoice = (await this.invoiceHelper.find(i.ref_code)).at(0);
                // Cập nhật trạng thái hóa đơn đã được cơ quan thuế chấp nhận
                await this.invoiceHelper.findByIdAndUpdateCct(invoice._id);
              }
            }
          }
        } else if (
          e.partner_electronic_invoice_type ===
          PartnerElectronicInvoiceTypeEnum.FPT
        ) {
          // Xử lý nhà cung cấp FPT
          loginOauthDTO = new LoginOauthDTO(e);
          let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
            loginOauthDTO.restaurantPartnerInvoiceEntity
          );
          let tokenPartNer = { fpt_token: "" };

          // Đăng nhập để lấy token FPT
          if (tokenPartNer.fpt_token == "") {
            loginToPartNer = await this.oauthService.loginHandleForSchedule(
              loginOauthDTO
            );

            if (!loginToPartNer) {
              continue; // Bỏ qua nếu không đăng nhập được
            }
            tokenPartNer.fpt_token = loginToPartNer.token;
          }

          // Lấy danh sách hóa đơn theo branch_id
          let listInvoice: Invoice[] = await this.invoiceHelper.findByBranchId(
            e.branch_id
          );

          for (const i of listInvoice) {
            if (i.ref_code !== "") {
              let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;

              // Lấy thông tin cấu hình hóa đơn của nhà hàng
              restaurantPartnerInvoiceEntity =
                await this.restaurantPartnerInvoiceService.findOneByBranchId(
                  i.branch_id
                );

              // Tạo URL để lấy thông tin hóa đơn FPT
              let url: string = new UtilsParamHttpService(
                {
                  sid: i.ref_code,
                  type: "json",
                  stax: restaurantPartnerInvoiceEntity.tax_code,
                  serial: i.voice_series,
                  form: "1",
                  seq: ConvertNumberToString.numberToSeq(i.order_id),
                },
                apiPartNer.apiFptGetInfo
              ).getUrl();

              // Gọi API FPT để lấy thông tin hóa đơn
              let dataResult = await new UtilsHttpServiceCustom(
                url,
                {},
                tokenPartNer.fpt_token,
                this.httpService
              ).get();

              // Kiểm tra trạng thái hóa đơn (status_recived = 10 nghĩa là đã được chấp nhận)
              if (new MapSchedule(dataResult[0].doc).status_recived === 10) {
                invoice = (await this.invoiceHelper.find(i.ref_code)).at(0);
                // Cập nhật trạng thái hóa đơn đã được cơ quan thuế chấp nhận
                await this.invoiceHelper.findByIdAndUpdateCct(invoice._id);
              }
            }
          }
        } else if (
          e.partner_electronic_invoice_type ===
          PartnerElectronicInvoiceTypeEnum.MIFI
        ) {
          // Xử lý nhà cung cấp MIFI
          let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
          restaurantPartnerInvoiceEntity =
            await this.restaurantPartnerInvoiceService.findOneByBranchId(
              e.branch_id
            );

          // Lấy danh sách hóa đơn theo branch_id
          let listInvoice: Invoice[] = await this.invoiceHelper.findByBranchId(
            e.branch_id
          );

          let apiPartNer: ApiPartNer = ApiPartNer.getInstance(e);

          for (const e of listInvoice) {
            if (e.ref_code !== "") {
              // Gọi API MIFI để lấy thông tin chi tiết hóa đơn
              let dataResult = await new UtilsHttpServiceCustom(
                apiPartNer.apiMifiGetInfo,
                new GetDetailInvoiceMifiDto(restaurantPartnerInvoiceEntity, e),
                "",
                this.httpService
              ).post();

              // Kiểm tra mã cơ quan thuế (ma_cqt) để xác định hóa đơn đã được chấp nhận
              if (dataResult.ma_cqt !== "" && dataResult.ma_cqt !== null) {
                await this.invoiceHelper.findByIdAndUpdateCct(e._id);
              }

              // Kiểm tra ghi chú cơ quan thuế để xử lý trường hợp hóa đơn bị hủy
              if (
                dataResult.ghi_chu_cqt !== "" &&
                dataResult.status !== "Fault"
              ) {
                await this.invoiceHelper.findByIdAndUpdateCctWhenCctCancel(
                  e._id
                );
              }
            }
          }
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[CRON-CHECK-INVOICE] Thất bại sau ${duration}ms`, {
        error: error.message,
        stack: error.stack,
        duration,
      });
    } finally {
      const duration = Date.now() - startTime;
      this.logger.log(`[CRON-CHECK-INVOICE] Hoàn thành trong ${duration}ms`);
    }
  }

  /**
   * Cron job tổng hợp: xử lý hóa đơn thất bại và gửi hóa đơn tồn đọng
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processInvoicesComprehensive(): Promise<void> {
    const startTime = Date.now();
    if (this.isRunningAutoSend) return;
    this.isRunningAutoSend = true;

    this.logger.log(
      "[CRON-COMPREHENSIVE] Bắt đầu quy trình xử lý tổng hợp hóa đơn"
    );

    try {
      // Lấy danh sách nhà hàng từ cache (dùng chung cho cả hai tác vụ)
      let restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[];
      const restaurantUseInvoiceServiceKey: string =
        "techres/restaurant_invoice/info";
      restaurantPartnerInvoices = await this.cacheService.getCachedData(
        restaurantUseInvoiceServiceKey
      );

      if (!restaurantPartnerInvoices) {
        restaurantPartnerInvoices =
          await this.restaurantPartnerInvoiceRepository.find();
        await this.cacheService.setCache(
          restaurantUseInvoiceServiceKey,
          restaurantPartnerInvoices,
          "EX",
          3600
        );
      }

      // PHASE 1: Xử lý hóa đơn thất bại (retry)
      await this.processFailedInvoicesPhase(restaurantPartnerInvoices);

      // PHASE 2: Xử lý hóa đơn tồn đọng (auto send)
      await this.processPendingInvoicesPhase(restaurantPartnerInvoices);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[CRON-COMPREHENSIVE] Hoàn thành quy trình xử lý tổng hợp trong ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(
        `[CRON-COMPREHENSIVE] Lỗi trong quy trình xử lý tổng hợp sau ${duration}ms:`,
        {
          error: error.message,
          stack: error.stack,
          duration,
        }
      );
    } finally {
      this.isRunningAutoSend = false;
    }
  }

  /**
   * Phase 1: Xử lý hóa đơn thất bại (retry)
   */
  private async processFailedInvoicesPhase(
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<void> {
    this.logger.log("[CRON-RETRY-FAILED] Bắt đầu phase xử lý hóa đơn thất bại");

    try {
      // Lấy danh sách hóa đơn thất bại cần xử lý
      const failedInvoices = await this.invoiceSendFailedModel
        .find({
          status: { $in: ["PENDING", "FAILED"] },
          retry_count: { $lt: 3 }, // Chỉ retry tối đa 3 lần
          $or: [
            { last_retry_at: { $exists: false } }, // Chưa từng retry
            { last_retry_at: { $lt: new Date(Date.now() - 30 * 60 * 1000) } }, // Retry sau 30 phút
          ],
        })
        .limit(50); // Giới hạn 50 hóa đơn mỗi lần

      if (failedInvoices.length === 0) {
        this.logger.log(
          "[CRON-RETRY-FAILED] Không có hóa đơn thất bại nào cần xử lý"
        );
        return;
      }

      this.logger.log(
        `[CRON-RETRY-FAILED] Tìm thấy ${failedInvoices.length} hóa đơn thất bại cần xử lý`
      );

      let successCount = 0;
      let failedCount = 0;

      // Xử lý từng hóa đơn thất bại
      for (const failedInvoice of failedInvoices) {
        try {
          // Cập nhật trạng thái đang xử lý
          await this.invoiceSendFailedModel.updateOne(
            { _id: failedInvoice._id },
            {
              status: "PROCESSING",
              last_retry_at: new Date(),
              $inc: { retry_count: 1 },
            }
          );

          // Lấy thông tin hóa đơn gốc
          const invoice = await this.invoiceModel.findById(
            failedInvoice.invoice_id
          );
          if (!invoice) {
            this.logger.warn(
              `[CRON-RETRY-FAILED] Không tìm thấy hóa đơn ${failedInvoice.invoice_id}`
            );
            await this.invoiceSendFailedModel.updateOne(
              { _id: failedInvoice._id },
              { status: "FAILED" }
            );
            failedCount++;
            continue;
          }

          const restaurantPartnerInvoice = restaurantPartnerInvoices.find(
            (x) => x.restaurant_id === invoice.restaurant_id
          );

          if (restaurantPartnerInvoice) {
            // Thử gửi lại hóa đơn thông qua queue
            await this.sendInvoiceToRestaurantQueue(
              [invoice],
              restaurantPartnerInvoice
            );
            // Cập nhật trạng thái thành công
            await this.invoiceSendFailedModel.updateOne(
              { _id: failedInvoice._id },
              { status: "RESOLVED" }
            );

            successCount++;
            this.logger.log(
              `[CRON-RETRY-FAILED] Đã gửi lại thành công hóa đơn ${failedInvoice.invoice_id}`
            );
          } else {
            this.logger.warn(
              `[CRON-RETRY-FAILED] Không tìm thấy cấu hình nhà hàng cho hóa đơn ${failedInvoice.invoice_id}`
            );
            await this.invoiceSendFailedModel.updateOne(
              { _id: failedInvoice._id },
              { status: "FAILED" }
            );
            failedCount++;
          }
        } catch (retryError) {
          failedCount++;
          this.logger.error(
            `[CRON-RETRY-FAILED] Lỗi khi thử gửi lại hóa đơn ${failedInvoice.invoice_id}:`,
            {
              error: retryError.message,
              stack: retryError.stack,
            }
          );

          // Cập nhật trạng thái thất bại nếu đã retry quá số lần cho phép
          const updateData: any = { status: "FAILED" };
          if (failedInvoice.retry_count >= 2) {
            // Đã retry 3 lần (0,1,2)
            updateData.status = "FAILED";
          } else {
            updateData.status = "PENDING"; // Cho phép retry lần sau
          }

          await this.invoiceSendFailedModel.updateOne(
            { _id: failedInvoice._id },
            updateData
          );
        }

        // Delay nhỏ giữa các lần xử lý để tránh quá tải
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.logger.log(
        `[CRON-RETRY-FAILED] Hoàn thành phase xử lý hóa đơn thất bại`,
        {
          total: failedInvoices.length,
          success: successCount,
          failed: failedCount,
        }
      );
    } catch (error) {
      this.logger.error(
        `[CRON-RETRY-FAILED] Lỗi trong phase xử lý hóa đơn thất bại:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
    }
  }

  /**
   * Phase 2: Xử lý hóa đơn tồn đọng (auto send)
   */
  private async processPendingInvoicesPhase(
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<void> {
    this.logger.log("[CRON-AUTO-SEND] Bắt đầu phase xử lý hóa đơn tồn đọng");

    try {
      // Tạo khoảng thời gian cho ngày hiện tại (00:00:00 đến 23:59:59)
      const nowMoment = moment.utc();
      const fromDate = nowMoment.clone().startOf("day").toDate(); // ISODate format: 00:00:00.000Z
      const toDate = nowMoment.clone().add(1, "day").startOf("day").toDate(); // ISODate format: 00:00:00.000Z

      // Xử lý song song các nhà hàng có bật tự động xuất hóa đơn
      const promises = restaurantPartnerInvoices
        .filter((e) => e.is_auto_export_third_party === 1) // Chỉ lấy nhà hàng có bật tự động xuất
        .map(async (e) => {
          try {
            const processedInvoicesKey = `processed_invoices_${e.restaurant_id}`;
            const processedInvoiceIds = await this.getProcessedInvoiceIds(
              processedInvoicesKey
            );
            const allInvoices =
              await this.invoiceHelper.findByRestaurantIdAndRestaurantBrandAndBranchIdAndStatusWithLimit(
                e.restaurant_id,
                e.restaurant_brand_id,
                e.branch_id,
                0, // Trạng thái 0: chưa gửi
                1000, // Giới hạn 100 hóa đơn mỗi lần
                processedInvoiceIds, // Loại trừ các ID đã xử lý
                // fromDate, // Từ ngày (00:00:00 hôm nay)
                // toDate // Đến ngày (00:00:00 ngày mai) -> bỏ lọc ngày , xuất lại  toàn bộ các hóa đơn tồn đọng
                null,
                null
              );
            let invoiceFilter: Invoice[] = [];

            if (allInvoices.length > 0) {
              // Lấy danh sách loại đơn hàng áp dụng từ cấu hình nhà hàng
              const applyOrderTypes: number[] = JSON.parse(
                e.apply_order_types
              ).filter((x: number) => x !== 0);

              // Lọc hóa đơn theo loại đơn hàng được cấu hình
              if (
                applyOrderTypes.includes(OrderType.APP_FOOD) &&
                applyOrderTypes.includes(OrderType.APP_ORDER)
              ) {
                // Nếu áp dụng cho cả APP_FOOD và APP_ORDER thì lấy tất cả hóa đơn
                invoiceFilter = allInvoices;
              } else if (applyOrderTypes.includes(OrderType.APP_FOOD)) {
                // Chỉ lấy hóa đơn từ app đặt món
                invoiceFilter = allInvoices.filter((x: any) => {
                  return InvoiceAppFood.APP_FOOD.includes(x.order_method);
                });
              } else if (applyOrderTypes.includes(OrderType.APP_ORDER)) {
                // Chỉ lấy hóa đơn từ app đặt bàn (không phải app đặt món)
                invoiceFilter = allInvoices.filter((x: any) => {
                  return !InvoiceAppFood.APP_FOOD.includes(x.order_method);
                });
              }

              await this.storeProcessedInvoiceIds(
                invoiceFilter.map((invoice) => invoice._id.toString()),
                processedInvoicesKey
              );
              const filteredInvoices = invoiceFilter; // Tất cả hóa đơn đã được lọc bởi query
              if (filteredInvoices.length > 0) {
                this.logger.log(
                  `[CRON-AUTO-SEND] Nhà hàng ${e.restaurant_id} gửi ${filteredInvoices.length} hóa đơn đến ${e.partner_electronic_invoice_type} (đã lọc từ ${allInvoices.length})`,
                  {
                    restaurantId: e.restaurant_id,
                    invoiceCount: filteredInvoices.length,
                    totalFound: allInvoices.length,
                    partnerType: e.partner_electronic_invoice_type,
                    branchId: e.branch_id,
                  }
                );
                return this.sendInvoiceToRestaurantQueue(filteredInvoices, e);
              } else {
                this.logger.debug(
                  `[CRON-AUTO-SEND] Nhà hàng ${e.restaurant_id} - tất cả ${allInvoices.length} hóa đơn đang được xử lý`,
                  {
                    restaurantId: e.restaurant_id,
                    totalFound: allInvoices.length,
                  }
                );
              }
            }
          } catch (error) {
            this.logger.error(
              `[CRON-AUTO-SEND] Lỗi khi xử lý nhà hàng ${e.restaurant_id}`,
              {
                restaurantId: e.restaurant_id,
                error: error.message,
                stack: error.stack,
              }
            );
          }
        });

      // Chờ tất cả promises hoàn thành (không quan tâm kết quả thành công hay thất bại)
      await Promise.allSettled(promises);

      this.logger.log(
        `[CRON-AUTO-SEND] Hoàn thành phase xử lý hóa đơn tồn đọng`
      );
    } catch (error) {
      this.logger.error(
        "[CRON-AUTO-SEND] Lỗi trong phase xử lý hóa đơn tồn đọng:",
        error
      );
    }
  }

  /**
   * Cron job kiểm tra hóa đơn MISA
   * Chạy mỗi 2 giờ một lần để kiểm tra trạng thái hóa đơn từ nhà cung cấp MISA
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async checkInvoiceMisa() {
    const startTime = Date.now();
    this.logger.log("[CRON-MISA] Bắt đầu quy trình kiểm tra hóa đơn MISA");
    let loginOauthDTO: LoginOauthDTO;
    let loginToPartNer: { token: string } | any;

    // Lấy danh sách nhà hàng từ cache hoặc database
    const restaurantUseInvoiceServiceKey: string =
      "techres/restaurant_invoice/info";
    let restaurantPartnerInvoices = await this.cacheService.getCachedData(
      restaurantUseInvoiceServiceKey
    );

    if (!restaurantPartnerInvoices) {
      restaurantPartnerInvoices =
        await this.restaurantPartnerInvoiceRepository.find();
      await this.cacheService.setCache(
        restaurantUseInvoiceServiceKey,
        restaurantPartnerInvoices,
        "EX",
        3600
      );
    }

    // Duyệt qua từng nhà hàng
    for (const e of restaurantPartnerInvoices) {
      // Chỉ xử lý nhà hàng sử dụng dịch vụ MISA
      if (
        e.partner_electronic_invoice_type !==
        PartnerElectronicInvoiceTypeEnum.MISA
      ) {
        continue;
      }

      // Đăng nhập để lấy token MISA
      loginOauthDTO = new LoginOauthDTO(e);
      loginToPartNer = await this.oauthService.loginHandleForSchedule(
        loginOauthDTO
      );
      if (!loginToPartNer) return;

      let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
      restaurantPartnerInvoiceEntity = restaurantPartnerInvoices.find(
        (x) => x.branch_id == e.branch_id
      );

      // Lấy danh sách hóa đơn có ref_code hợp lệ
      let listInvoice: Invoice[] = (
        await this.invoiceHelper.findByBranchId(e.branch_id)
      ).filter((x) => x.ref_code != "" && Utils.isValidRefCode(x.ref_code));

      if (listInvoice.length == 0) {
        continue; // Bỏ qua nếu không có hóa đơn nào
      }

      // Gọi adapter để lấy thông tin chi tiết hóa đơn từ MISA
      let dataResult: any[] = await ThirdPartyServiceAdapter.getDetail(
        {
          loginToPartNer,
          invoice: listInvoice,
          restaurantPartnerInvoiceEntity,
        },
        "",
        PartnerElectronicInvoiceTypeEnum.MISA
      );

      if (!dataResult) continue;

      // Cập nhật trạng thái hóa đơn có số hóa đơn hợp lệ
      dataResult.forEach((x) => {
        if (!Number.isNaN(+x.InvNo)) {
          this.invoiceHelper.findOneByRefCodeAndUpdate(x.RefID);
        }
      });
    }
  }

  /**
   * Cron job kiểm tra hóa đơn HILO
   * Chạy mỗi 2 giờ một lần để kiểm tra trạng thái hóa đơn từ nhà cung cấp HILO
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkInvoiceHilo() {
    const startTime = Date.now();
    console.log("[CRON-HILO] Bắt đầu quy trình kiểm tra hóa đơn HILO");
    let loginOauthDTO: LoginOauthDTO;
    let loginToPartNer: { token: string } | any;

    // Lấy danh sách nhà hàng từ cache hoặc database
    const restaurantUseInvoiceServiceKey: string =
      "techres/restaurant_invoice/info";
    let restaurantPartnerInvoices = await this.cacheService.getCachedData(
      restaurantUseInvoiceServiceKey
    );

    if (!restaurantPartnerInvoices) {
      restaurantPartnerInvoices =
        await this.restaurantPartnerInvoiceRepository.find();
      await this.cacheService.setCache(
        restaurantUseInvoiceServiceKey,
        restaurantPartnerInvoices,
        "EX",
        3600
      );
    }

    // Duyệt qua từng nhà hàng
    for (const e of restaurantPartnerInvoices) {
      // Chỉ xử lý nhà hàng sử dụng dịch vụ HILO
      if (
        e.partner_electronic_invoice_type !==
        PartnerElectronicInvoiceTypeEnum.HILO
      ) {
        continue;
      }

      // Đăng nhập để lấy token HILO
      loginOauthDTO = new LoginOauthDTO(e);
      loginToPartNer = await this.oauthService.loginHandleForSchedule(
        loginOauthDTO
      );

      if (!loginToPartNer) return;

      let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
      restaurantPartnerInvoiceEntity = restaurantPartnerInvoices.find(
        (x) => x.branch_id == e.branch_id
      );

      // Lấy danh sách hóa đơn có ref_code
      let listInvoice: Invoice[] = (
        await this.invoiceHelper.findByBranchIdAndPartnerTypeAndCctDuyet(
          e.branch_id,
          PartnerElectronicInvoiceTypeEnum.HILO
        )
      ).filter((x) => x.ref_code != "");

      if (listInvoice.length == 0) {
        continue; // Bỏ qua nếu không có hóa đơn nào
      }

      let dataResult: any[] = [];

      // Lấy thông tin chi tiết từng hóa đơn từ HILO
      for (const invoice of listInvoice) {
        let invoiceHilo: any = await ThirdPartyServiceAdapter.getDetail(
          {
            loginToPartNer,
            invoice: invoice,
            restaurantPartnerInvoiceEntity,
          },
          "",
          PartnerElectronicInvoiceTypeEnum.HILO
        );
        if (invoiceHilo) {
          dataResult.push(invoiceHilo);
        }
      }

      if (!dataResult) continue;
      // Cập nhật trạng thái hóa đơn có mã cơ quan thuế
      dataResult
        .filter((x) => x !== undefined)
        .forEach((x) => {
          if (+x.TaxOfCodeStatus === 1) {
            this.invoiceHelper.findOneByRefCodeAndUpdate(x.key);
          }
        });
    }
  }

  /**
   * Lấy danh sách ID hóa đơn đã xử lý từ Redis
   * @param setKey Khóa Redis set chứa ID hóa đơn đã xử lý
   * @returns Mảng các ID hóa đơn đã xử lý
   */
  private async getProcessedInvoiceIds(setKey: string): Promise<string[]> {
    try {
      const processedIds = await this.cacheService.smembers(setKey);
      return processedIds || [];
    } catch (error) {
      this.logger.error(
        `Không thể lấy danh sách ID hóa đơn đã xử lý từ key ${setKey}`,
        error
      );
      return [];
    }
  }

  /**
   * Lưu trữ ID hóa đơn đã xử lý vào Redis
   * @param invoiceIds Mảng ID hóa đơn cần lưu trữ
   * @param setKey Khóa Redis set để lưu trữ
   */
  private async storeProcessedInvoiceIds(
    invoiceIds: string[],
    setKey: string
  ): Promise<void> {
    try {
      if (invoiceIds.length > 0) {
        await this.cacheService.sadd(setKey, ...invoiceIds);
        await this.cacheService.expire(setKey, 3600); // TTL 1 giờ
        this.logger.debug(
          `Đã lưu ${invoiceIds.length} ID hóa đơn vào Redis set ${setKey}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Không thể lưu ID hóa đơn đã xử lý vào key ${setKey}`,
        error
      );
    }
  }

  /**
   * Gửi hóa đơn vào queue riêng của nhà hàng
   * Mỗi nhà hàng sẽ có queue riêng để tối ưu hiệu suất xử lý
   * @param invoices Danh sách hóa đơn cần gửi
   * @param restaurantPartnerInvoiceEntity Thông tin cấu hình hóa đơn của nhà hàng
   */
  public async sendInvoiceToRestaurantQueue(
    invoices: Invoice[],
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ) {
    try {
      // Lấy hoặc tạo queue riêng cho nhà hàng
      const restaurantQueue =
        await this.queueManagerService.getOrCreateRestaurantQueue(
          restaurantPartnerInvoiceEntity.restaurant_id
        );

      // Cấu hình tùy chọn cho job
      const jobOptions = {
        removeOnComplete: true, // Xóa job khi hoàn thành
        removeOnFail: true, // Xóa job khi thất bại
        attempts: this.getRestaurantRetryAttempts(
          restaurantPartnerInvoiceEntity
        ), // Số lần thử lại
        priority: this.getRestaurantPriority(restaurantPartnerInvoiceEntity), // Độ ưu tiên
        backoff: {
          type: "exponential" as const, // Kiểu backoff: tăng dần theo cấp số nhân
          delay: this.getRestaurantBackoffDelay(restaurantPartnerInvoiceEntity), // Thời gian chờ giữa các lần thử
        },
        delay: this.getRestaurantJobDelay(restaurantPartnerInvoiceEntity), // Thời gian delay trước khi bắt đầu job
      };

      // Thêm job vào queue với tên có chứa restaurant_id để phân biệt
      const jobName = `${TaskEnum.INVOICE_QUEUE_SEND}`;
      await restaurantQueue.add(
        jobName,
        {
          restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
          invoices: invoices,
          restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
        },
        jobOptions
      );

      this.logger.log(
        `[QUEUE-ADD] Đã thêm thành công ${invoices.length} hóa đơn vào queue riêng cho nhà hàng ${restaurantPartnerInvoiceEntity.restaurant_id}`,
        {
          restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
          invoiceCount: invoices.length,
          queueName: restaurantQueue.name,
          jobOptions: {
            attempts: jobOptions.attempts,
            priority: jobOptions.priority,
            delay: jobOptions.delay,
          },
        }
      );
    } catch (error) {
      this.logger.error(
        `[QUEUE-ADD] Lỗi khi thêm job vào queue nhà hàng ${restaurantPartnerInvoiceEntity.restaurant_id}`,
        {
          restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
          invoiceCount: invoices.length,
          error: error.message,
          stack: error.stack,
        }
      );
      // Fallback về method cũ nếu có lỗi
      this.logger.warn(
        `[QUEUE-ADD] Chuyển về queue mặc định cho nhà hàng ${restaurantPartnerInvoiceEntity.restaurant_id}`
      );
      await this.sendInvoiceToThirdParty(
        invoices,
        restaurantPartnerInvoiceEntity
      );
    }
  }

  /**
   * Method dự phòng - giữ lại để tương thích ngược
   * Sử dụng queue mặc định khi queue riêng gặp lỗi
   * @param invoices Danh sách hóa đơn cần gửi
   * @param restaurantPartnerInvoiceEntity Thông tin cấu hình hóa đơn của nhà hàng
   */
  public async sendInvoiceToThirdParty(
    invoices: Invoice[],
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ) {
    const startTime = Date.now();
    this.logger.log(
      `[FALLBACK-QUEUE] Thêm ${invoices.length} hóa đơn vào queue mặc định cho nhà hàng ${restaurantPartnerInvoiceEntity.restaurant_id}`,
      {
        restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
        invoiceCount: invoices.length,
        partnerType:
          restaurantPartnerInvoiceEntity.partner_electronic_invoice_type,
      }
    );

    try {
      // Lấy queue mặc định
      const defaultQueue = await this.queueManagerService.getDefaultQueue();
      await defaultQueue.add(
        TaskEnum.INVOICE_QUEUE_SEND,
        {
          invoices: invoices,
          restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
        },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3, // Số lần thử lại mặc định
          backoff: {
            type: "exponential",
            delay: 500, // Thời gian chờ ngắn hơn cho queue mặc định
          },
        }
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `[FALLBACK-QUEUE] Đã thêm thành công job vào queue mặc định trong ${duration}ms`,
        {
          restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
          invoiceCount: invoices.length,
          duration,
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[FALLBACK-QUEUE] Thất bại khi thêm job vào queue mặc định sau ${duration}ms`,
        {
          restaurantId: restaurantPartnerInvoiceEntity.restaurant_id,
          invoiceCount: invoices.length,
          error: error.message,
          stack: error.stack,
          duration,
        }
      );
    }
  }

  /**
   * Cấu hình số lần retry cho từng nhà hàng
   * @param restaurantPartnerInvoiceEntity Thông tin nhà hàng
   * @returns Số lần thử lại
   */
  private getRestaurantRetryAttempts(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): number {
    // Có thể tùy chỉnh theo từng nhà hàng hoặc loại dịch vụ
    return 3;
  }

  /**
   * Cấu hình độ ưu tiên cho từng nhà hàng
   * @param restaurantPartnerInvoiceEntity Thông tin nhà hàng
   * @returns Độ ưu tiên (số càng cao càng ưu tiên)
   */
  private getRestaurantPriority(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): number {
    // Tất cả nhà hàng đều có priority cao để đảm bảo xử lý ổn định
    return 10;
  }

  /**
   * Cấu hình thời gian chờ backoff cho từng nhà hàng
   * @param restaurantPartnerInvoiceEntity Thông tin nhà hàng
   * @returns Thời gian chờ backoff (milliseconds)
   */
  private getRestaurantBackoffDelay(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): number {
    // Tất cả nhà hàng đều có backoff delay ngắn để xử lý nhanh chóng
    return 300;
  }

  /**
   * Cấu hình thời gian delay giữa các job cho từng nhà hàng
   * @param restaurantPartnerInvoiceEntity Thông tin nhà hàng
   * @returns Thời gian delay (milliseconds)
   */
  private getRestaurantJobDelay(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): number {
    // Tất cả nhà hàng đều có delay ngắn để đảm bảo xử lý ổn định mà không quá tải hệ thống
    return 50;
  }

  /**
   * Lấy thống kê queue cho tất cả nhà hàng
   * @returns Thống kê của tất cả queue nhà hàng
   */
  async getQueueStats(): Promise<any[]> {
    return await this.queueManagerService.getAllRestaurantQueueStats();
  }

  /**
   * Tạm dừng queue của nhà hàng cụ thể
   * @param restaurantId ID nhà hàng
   */
  async pauseRestaurantQueue(restaurantId: number): Promise<void> {
    await this.queueManagerService.pauseRestaurantQueue(restaurantId);
  }

  /**
   * Tiếp tục queue của nhà hàng cụ thể
   * @param restaurantId ID nhà hàng
   */
  async resumeRestaurantQueue(restaurantId: number): Promise<void> {
    await this.queueManagerService.resumeRestaurantQueue(restaurantId);
  }

  /**
   * Dọn dẹp các queue không sử dụng (chạy hàng ngày)
   * Giải phóng tài nguyên cho các queue không còn hoạt động
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupUnusedQueues(): Promise<void> {
    const startTime = Date.now();
    this.logger.log("[CRON-CLEANUP] Bắt đầu quy trình dọn dẹp queue hàng ngày");
    try {
      await this.queueManagerService.cleanupUnusedQueues();
      const duration = Date.now() - startTime;
      this.logger.log(
        `[CRON-CLEANUP] Hoàn thành dọn dẹp queue trong ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[CRON-CLEANUP] Thất bại sau ${duration}ms`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Lấy thống kê hóa đơn thất bại
   * @returns Thống kê các hóa đơn thất bại theo trạng thái
   */
  async getFailedInvoicesStats(): Promise<any> {
    try {
      const stats = await this.invoiceSendFailedModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgRetryCount: { $avg: "$retry_count" },
          },
        },
      ]);

      const totalFailed = await this.invoiceSendFailedModel.countDocuments();

      return {
        total: totalFailed,
        byStatus: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error("Lỗi khi lấy thống kê hóa đơn thất bại:", error);
      throw error;
    }
  }
}
