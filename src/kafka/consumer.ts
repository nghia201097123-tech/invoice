// Import các thư viện và service cần thiết
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConsumerService, KafkaTopic } from "src/kafka/consumer.service";
import { InvoicesService } from "src/version_3/invoices/invoices.service";
import { InvoiceDetailsService } from "src/version_3/invoice-details/invoice-details.service";
import { KafkaOrderDetail } from "./kafka.entity/kafka.order.details.entity";
import { CategoryType } from "src/common/enums/category_type.enum";
import { KafkaElectricInvoice } from "./kafka.entity/kafka-employee.entity";
import { OrderBuffetTicket } from "src/partner/interface/order.bufet.ticket.interface";
import { InvoiceAppFood } from "src/common/enums/invoice.app-food.enum";
import { CacheService } from "../redis/services/cache.service";
import { RestaurantBrandService } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.service";
import { RestaurantBrandEntity } from "src/common/entities/restaurant-brand.entity";
import { Utils } from "src/common/utils/utils.common.helper";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { Employee } from "src/common/entities/employee.entity";
import { Invoice } from "src/common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedDocument,
} from "src/common/schemas/invoice-send-failed.schema";
import { CronJobService } from "src/job/task/cron-job.service";
import { OrderType } from "src/common/enums/order_type.enum";

// Interface định nghĩa kết quả xử lý đơn hàng
interface ProcessedOrderResult {
  success: boolean; // Trạng thái xử lý thành công
  orderId: string; // ID đơn hàng
  error?: Error; // Lỗi nếu có
  processingTime: number; // Thời gian xử lý (ms)
}

// Interface cấu hình xử lý batch
interface BatchProcessingConfig {
  batchSize: number; // Kích thước batch
  maxConcurrency: number; // Số lượng xử lý đồng thời tối đa
  retryAttempts: number; // Số lần thử lại
  retryDelay: number; // Thời gian delay giữa các lần thử (ms)
}

// Interface thống kê xử lý đơn hàng
interface OrderProcessingMetrics {
  totalProcessed: number; // Tổng số đơn đã xử lý
  successCount: number; // Số đơn xử lý thành công
  errorCount: number; // Số đơn xử lý lỗi
  averageProcessingTime: number; // Thời gian xử lý trung bình
  lastProcessedAt: Date; // Thời điểm xử lý cuối cùng
}

/**
 * Service Consumer xử lý message từ Kafka
 * Chịu trách nhiệm nhận và xử lý các message đơn hàng từ Kafka queue
 *
 * @class Consumer
 * @implements OnModuleInit
 * @description Lớp consumer chính xử lý message đơn hàng với các tính năng:
 * - Xử lý batch với distributed locking
 * - Caching đa tầng (memory + Redis)
 * - Tính toán VAT phức tạp cho các loại đơn hàng khác nhau
 * - Integration với hệ thống third-party
 * - Theo dõi hiệu suất và metrics
 * - Xử lý lỗi với retry mechanism
 */
@Injectable()
export class Consumer implements OnModuleInit {
  private readonly logger = new Logger(Consumer.name);

  // Các hằng số cấu hình
  private readonly PROCESSED_ORDERS_KEY = "processed_order_ids"; // Key cache cho đơn hàng đã xử lý
  private readonly ORDER_EXPIRY_TIME = 60 * 60 * 24; // Thời gian hết hạn cache (24 giờ)

  // Cấu hình xử lý batch - Đã tối ưu cho high throughput
  private readonly BATCH_CONFIG: BatchProcessingConfig = {
    batchSize: 20, // Tăng batch size để xử lý hiệu quả hơn
    maxConcurrency: 15, // Tăng concurrency để xử lý nhiều message đồng thời
    retryAttempts: 3, // Thử lại tối đa 3 lần khi lỗi
    retryDelay: 500, // Giảm delay để xử lý nhanh hơn
  };

  // Constants cho third-party processing
  private readonly THIRD_PARTY_CONFIG = {
    QUEUE_NAME: "invoice-third-party-export",
    MAX_RETRY: 3,
    TIMEOUT: 10000,
    CIRCUIT_BREAKER_THRESHOLD: 50,
  };

  // Memory cache cho restaurant data
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();

  // Queue xử lý đơn hàng để tránh duplicate
  private processingQueue: Map<string, Promise<ProcessedOrderResult>> =
    new Map();

  // Thống kê xử lý
  private metrics: OrderProcessingMetrics = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    averageProcessingTime: 0,
    lastProcessedAt: new Date(),
  };

  /**
   * Constructor khởi tạo Consumer với các dependencies cần thiết
   *
   * @param consumerService - Service xử lý Kafka consumer
   * @param invoicesService - Service quản lý hóa đơn
   * @param invoiceDetailsService - Service quản lý chi tiết hóa đơn
   * @param restaurantBrandService - Service quản lý thương hiệu nhà hàng
   * @param restaurantPartnerInvoiceService - Service quản lý đối tác nhà hàng
   * @param cacheService - Service quản lý cache (Redis)
   * @param cronJobService - Service xử lý cron job
   * @param dataSource - DataSource cho TypeORM
   * @param invoiceSendFailedModel - Model MongoDB cho hóa đơn gửi thất bại
   */
  constructor(
    private readonly consumerService: ConsumerService,
    private readonly invoicesService: InvoicesService,
    private readonly invoiceDetailsService: InvoiceDetailsService,
    private readonly restaurantBrandService: RestaurantBrandService,
    private readonly restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private readonly cacheService: CacheService,
    private readonly cronJobService: CronJobService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectModel(InvoiceSendFailedSchema.name)
    private readonly invoiceSendFailedModel: Model<InvoiceSendFailedDocument>
  ) {}
  /**
   * Khởi tạo Consumer khi module được load
   * Lifecycle hook được gọi tự động khi module NestJS được khởi tạo
   *
   * @returns Promise<void>
   * @throws Error nếu không thể khởi tạo consumer
   *
   * @description Thực hiện các bước khởi tạo:
   * 1. Khởi tạo Kafka consumer với cấu hình tối ưu
   * 2. Bắt đầu quá trình cleanup memory cache
   * 3. Log thông tin khởi tạo thành công
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initializeConsumer();
      this.startMemoryCacheCleanup();
      this.logger.log("Consumer initialized successfully with optimizations");
    } catch (error) {
      this.logger.error("Failed to initialize consumer", error.stack);
      throw error;
    }
  }
  /**
   * Khởi tạo cleanup cho memory cache
   * Thiết lập interval để tự động dọn dẹp cache hết hạn trong memory
   *
   * @returns void
   *
   * @description:
   * - Chạy mỗi 10 phút để dọn dẹp cache expired
   * - Log số lượng cache entries được cleaned
   * - Ngăn ngừa memory leak do cache không được dọn dẹp
   */
  private startMemoryCacheCleanup(): void {
    // Cleanup memory cache mỗi 10 phút
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiry <= now) {
          this.memoryCache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleaned ${cleanedCount} expired cache entries`);
      }
    }, 10 * 60 * 1000); // 10 phút
  }

  /**
   * Lấy thống kê hiệu suất hiện tại
   *
   * @returns Object chứa các metrics hiệu suất:
   * - metrics: Thống kê xử lý đơn hàng
   * - processingQueueSize: Kích thước queue đang xử lý
   * - memoryCacheSize: Kích thước memory cache
   * - batchConfig: Cấu hình batch processing
   * - thirdPartyConfig: Cấu hình third-party integration
   *
   * @description Cung cấp thông tin monitoring cho hệ thống
   */
  getPerformanceMetrics(): any {
    return {
      ...this.metrics,
      processingQueueSize: this.processingQueue.size,
      memoryCacheSize: this.memoryCache.size,
      batchConfig: this.BATCH_CONFIG,
      thirdPartyConfig: this.THIRD_PARTY_CONFIG,
    };
  }
  /**
   * Khởi tạo và cấu hình Kafka consumer
   * Thiết lập 2 consumer: một cho xử lý hóa đơn điện tử, một cho xóa cache
   */
  private async initializeConsumer(): Promise<void> {
    this.consumerService.consumerElectricInvoice({
      autoCommit: true,
      partitionsConsumedConcurrently: this.BATCH_CONFIG.maxConcurrency,
      eachMessage: async ({ topic, partition, message }): Promise<void> => {
        const startTime = Date.now();
        let orderId: string | undefined;
        try {
          const rawData = message.value?.toString();
          console.log("raw-data : ", rawData);
          if (!rawData) {
            this.logger.warn(
              `Empty message received at offset ${message.offset}`
            );
            return;
          }
          const data = this.parseMessageData(rawData);
          let restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[];

          // Sử dụng improved cache strategy
          restaurantPartnerInvoices =
            await this.getRestaurantPartnerInvoicesCached();

          // Lấy danh sách ID nhà hàng được đồng bộ
          const restaurantIdSycn: number[] = restaurantPartnerInvoices.map(
            (restaurant) => restaurant.branch_id
          );

          // Bỏ qua nếu nhà hàng không trong danh sách đồng bộ
          if (!restaurantIdSycn.includes(data.branch_id)) {
            return;
          }

          await this.processMessageByTopic(
            topic,
            data,
            startTime,
            restaurantPartnerInvoices
          );
        } catch (error) {
          const processingTime = Date.now() - startTime;
          this.handleProcessingError(
            error,
            orderId,
            +message.offset,
            processingTime
          );
        }
      },
    });

    this.consumerService.consumerClearCacheInvoice({
      autoCommit: true,
      partitionsConsumedConcurrently: this.BATCH_CONFIG.maxConcurrency,
      eachMessage: async ({ topic, partition, message }): Promise<void> => {
        try {
          const rawData = message.value?.toString();
          if (!rawData) {
            this.logger.warn(
              `Empty message received at offset ${message.offset}`
            );
            return;
          }
          const data = this.parseMessageData(rawData);

          await this.processCacheInvalidationMessage(data);
        } catch (error) {
          console.log(error);
        }
      },
    });
  }
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async batchCreateInvoices(
    bills: KafkaElectricInvoice[]
  ): Promise<Invoice> {
    try {
      // Tối ưu: Sử dụng bulk operations thay vì Promise.all cho hiệu suất tốt hơn
      const result = await this.batchCreateInvoicesOptimized(bills);
      return result[0];
    } catch (error) {
      this.logger.error("Failed to batch create invoices", error.stack);
      throw error;
    }
  }
  /**
   * Tối ưu batch create invoices với bulk operations
   * @param bills - Danh sách bills cần tạo invoice
   * @returns Danh sách invoices đã tạo
   */
  private async batchCreateInvoicesOptimized(
    bills: KafkaElectricInvoice[]
  ): Promise<Invoice[]> {
    try {
      // Chia nhỏ thành batches để tránh quá tải database
      const batches = this.createBatches(bills, this.BATCH_CONFIG.batchSize);
      const results: Invoice[] = [];

      for (const batch of batches) {
        // Xử lý từng batch với concurrency control
        const batchResults = await Promise.all(
          batch.map((bill) => this.invoicesService.createByKafka(bill))
        );
        results.push(...batchResults);

        // Nhỏ delay giữa các batch để tránh overwhelm database
        if (batches.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        "Failed to optimized batch create invoices",
        error.stack
      );
      throw error;
    }
  }

  private async batchCreateInvoiceDetails(
    kafkaOrderDetails: KafkaOrderDetail[],
    vat: number,
    restaurantInvoiceVat: number,
    isApplyRevertVatRestaurant: boolean
  ): Promise<void> {
    try {
      await this.invoiceDetailsService.createInvoiceDetailByKafka(
        kafkaOrderDetails,
        vat,
        restaurantInvoiceVat,
        isApplyRevertVatRestaurant
      );
    } catch (error) {
      this.logger.error("Failed to batch create invoice details", error.stack);
      throw error;
    }
  }
  /**
   * Queue hóa đơn để gửi đến bên thứ ba (async processing)
   * @param invoice - Hóa đơn cần gửi
   * @param restaurantPartnerInvoiceEntity - Thông tin đối tác nhà hàng
   */
  private async queueInvoiceForThirdParty(
    invoice: Invoice,
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): Promise<void> {
    try {
      // Đẩy vào queue để xử lý async
      // TODO: Implement queue service integration

      await this.cronJobService.sendInvoiceToRestaurantQueue(
        [invoice],
        restaurantPartnerInvoiceEntity
      );

      this.logger.log(
        `Queued invoice ${invoice._id} for third-party export to ${restaurantPartnerInvoiceEntity.partner_identify_name}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue invoice ${invoice._id} for third-party:`,
        error.stack
      );
      // Fallback: lưu vào failed invoice để cron job xử lý
      // Fallback: Gọi trực tiếp nếu queue không khả dụng
      await this.sendInvoiceToThirdPartyDirect(
        invoice,
        restaurantPartnerInvoiceEntity
      );
      await this.saveFailedInvoice(invoice, error);
    }
  }
  /**
   * Gửi hóa đơn đến bên thứ ba (direct call - được gọi từ queue hoặc fallback)
   * @param invoice - Hóa đơn cần gửi
   * @param restaurantPartnerInvoiceEntity - Thông tin đối tác nhà hàng
   */
  async sendInvoiceToThirdPartyDirect(
    invoice: Invoice,
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ) {
    const invoiceId = invoice._id.toString();
    const processedInvoicesKey = `processed_invoices_${restaurantPartnerInvoiceEntity.restaurant_id}`;
    const lockKey = `invoice_processing_lock_${invoiceId}`;
    const lockValue = `${Date.now()}_${Math.random()}`;
    const lockTTL = 300; // 5 phút

    try {
      // Sử dụng distributed lock để tránh race condition
      const lockAcquired = await this.cacheService.setCacheWithNX(
        lockKey,
        lockValue,
        "EX",
        lockTTL,
        "NX"
      );

      if (!lockAcquired) {
        this.logger.debug(
          `Invoice ${invoiceId} is being processed by another instance, skipping`
        );
        return;
      }

      try {
        // Double-check: Kiểm tra xem hóa đơn đã được xử lý chưa sau khi có lock
        const processedInvoiceIds = await this.getProcessedInvoiceIds(
          processedInvoicesKey
        );
        if (processedInvoiceIds.includes(invoiceId)) {
          this.logger.debug(`Invoice ${invoiceId} already processed, skipping`);
          return;
        }

        // Kiểm tra invoice status trong database để đảm bảo chưa được xuất
        const currentInvoice = await this.invoicesService.findById(invoiceId);
        if (!currentInvoice || currentInvoice.invoice_status !== 0) {
          this.logger.debug(
            `Invoice ${invoiceId} status is ${currentInvoice?.invoice_status}, skipping`
          );
          return;
        }

        // Đánh dấu invoice đang được xử lý ngay lập tức để tránh duplicate
        await this.storeProcessedInvoiceIds([invoiceId], processedInvoicesKey);

        // Tạo employee mặc định cho việc xuất hóa đơn
        let employee = new Employee();
        employee.jwt_token = "DEFAULT";

        let exportInvoiceDTO = new ExportInvoiceDTO();
        exportInvoiceDTO.id = invoiceId;
        exportInvoiceDTO.customer_name =
          invoice.customer_name === ""
            ? "KHÁCH LẺ KHÔNG LẤY HÓA ĐƠN"
            : invoice.customer_name;
        exportInvoiceDTO.customer_company_name = invoice.customer_name ?? "";
        exportInvoiceDTO.customer_phone = invoice.customer_phone ?? "";
        exportInvoiceDTO.invoice_denominator =
          invoice.invoice_denominator ?? "1";
        exportInvoiceDTO.is_send_mail = 0;

        // Gọi service để xuất hóa đơn tự động
        await this.invoicesService.exportInvoiceAuto(
          exportInvoiceDTO,
          employee,
          restaurantPartnerInvoiceEntity,
          invoice
        );

        this.logger.log(
          `Successfully sent invoice ${invoiceId} to third party`
        );
      } finally {
        // Luôn release lock sau khi xử lý xong
        await this.cacheService.deleteCache(lockKey);
      }
    } catch (error) {
      // Log lỗi chi tiết
      this.logger.error(
        `Failed to send invoice ${invoiceId} to third party:`,
        error.stack
      );

      try {
        // Lưu thông tin hóa đơn gửi thất bại vào database
        await this.saveFailedInvoice(invoice, error);
      } catch (saveError) {
        // Nếu không thể lưu vào database, log lỗi
        this.logger.error(
          `Failed to save failed invoice record for ${invoiceId}:`,
          saveError.stack
        );
      }

      // Nếu có lỗi, remove khỏi processed list để có thể retry
      try {
        await this.cacheService.srem(processedInvoicesKey, invoiceId);
      } catch (removeError) {
        this.logger.error(
          `Failed to remove invoice ${invoiceId} from processed list:`,
          removeError
        );
      }

      // Ném lại lỗi để caller có thể xử lý
      throw error;
    }
  }
  /**
   * Lưu thông tin hóa đơn gửi thất bại vào database
   * @param invoiceId - ID của hóa đơn
   * @param error - Lỗi xảy ra
   */
  private async saveFailedInvoice(invoice: Invoice, error: any): Promise<void> {
    try {
      const failedInvoice = new this.invoiceSendFailedModel({
        invoice_id: invoice._id,
        branch_id: invoice.branch_id,
        order_id: invoice.order_id,
        error_message: error.message || "Unknown error",
        error_details: error.stack || JSON.stringify(error),
        retry_count: 0,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await failedInvoice.save();
      this.logger.log(`Saved failed invoice record for invoice ${invoice._id}`);
    } catch (saveError) {
      this.logger.error(`Error saving failed invoice record:`, saveError.stack);
      throw saveError;
    }
  }

  /**
   * Lấy danh sách ID hóa đơn đã xử lý từ Redis
   * @param setKey Khóa Redis set chứa ID hóa đơn đã xử lý
   * @returns Mảng ID hóa đơn đã xử lý
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
   * Lấy restaurant partner invoices với improved cache strategy
   * Sử dụng multi-level cache: Memory -> Redis -> Database
   */
  private async getRestaurantPartnerInvoicesCached(): Promise<
    RestaurantPartnerInvoiceEntity[]
  > {
    const cacheKey = "techres/restaurant_invoice/info";
    const now = Date.now();

    // Level 1: Memory cache (nhanh nhất)
    const memoryData = this.memoryCache.get(cacheKey);
    if (memoryData && memoryData.expiry > now) {
      return memoryData.data;
    }

    // Level 2: Redis cache
    let data = await this.cacheService.getCachedData(cacheKey);

    if (!data) {
      // Level 3: Database với simple lock để tránh thundering herd
      const lockKey = `${cacheKey}:lock`;
      const lockValue = `${Date.now()}`;

      try {
        // Thử acquire lock
        const lockAcquired = await this.cacheService.setCacheWithNX(
          lockKey,
          lockValue,
          "EX",
          10,
          "NX"
        );

        if (lockAcquired) {
          // Có lock, query database
          data = await this.restaurantPartnerInvoiceService.find();
          await this.cacheService.setCache(cacheKey, data, "EX", 3600);
        } else {
          // Không có lock, chờ một chút rồi thử lại cache
          await new Promise((resolve) => setTimeout(resolve, 100));
          data = await this.cacheService.getCachedData(cacheKey);

          // Nếu vẫn không có, fallback query trực tiếp
          if (!data) {
            data = await this.restaurantPartnerInvoiceService.find();
          }
        }
      } finally {
        // Release lock
        await this.cacheService.deleteCache(lockKey);
      }
    }

    // Cache vào memory với TTL ngắn (5 phút)
    if (data) {
      this.memoryCache.set(cacheKey, {
        data,
        expiry: now + 5 * 60 * 1000, // 5 phút
      });
    }

    return data || [];
  }

  /**
   * Parse dữ liệu message từ Kafka
   * @param rawData - Dữ liệu thô từ Kafka message
   * @returns Dữ liệu đã được parse
   */
  private parseMessageData(rawData: string): any {
    try {
      return JSON.parse(JSON.parse(rawData));
    } catch (error) {
      this.logger.error("Failed to parse message data", error.stack);
      throw new Error("Invalid message format");
    }
  }

  /**
   * Xử lý message theo topic
   * @param topic - Tên topic Kafka
   * @param data - Dữ liệu message
   * @param startTime - Thời điểm bắt đầu xử lý
   */
  private async processMessageByTopic(
    topic: string,
    data: any,
    startTime: number,
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<void> {
    if (topic === KafkaTopic.topics[0]) {
      const orderId = data?.order_id;
      if (!orderId) {
        return;
      }
      await this.processOrderMessage(
        data,
        startTime,
        restaurantPartnerInvoices
      );
    } else {
      this.logger.warn(`Unknown topic: ${topic}`);
    }
  }

  /**
   * Xử lý message đơn hàng
   * Kiểm tra duplicate và đảm bảo không xử lý trùng lặp
   * @param data - Dữ liệu đơn hàng
   * @param startTime - Thời điểm bắt đầu xử lý
   */
  private async processOrderMessage(
    data: any,
    startTime: number,
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<void> {
    const orderId = data.order_id;

    // Kiểm tra đơn hàng đã được xử lý chưa
    if (await this.isOrderProcessed(orderId)) {
      this.logger.debug(`Skipping duplicate order_id: ${orderId}`);
      return;
    }

    // Kiểm tra đơn hàng có đang được xử lý không
    if (this.processingQueue.has(orderId)) {
      this.logger.debug(`Order ${orderId} is already being processed`);
      return;
    }

    // Thêm vào queue xử lý
    const processingPromise = this.processOrderWithTransaction(
      data,
      startTime,
      restaurantPartnerInvoices
    );
    this.processingQueue.set(orderId, processingPromise);

    try {
      const result = await processingPromise;
      this.updateMetrics(result);
    } finally {
      this.processingQueue.delete(orderId);
    }
  }

  /**
   * Xử lý đơn hàng với transaction để đảm bảo tính nhất quán dữ liệu
   * @param data - Dữ liệu đơn hàng
   * @param startTime - Thời điểm bắt đầu xử lý
   * @returns Kết quả xử lý đơn hàng
   */
  private async processOrderWithTransaction(
    data: any,
    startTime: number,
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<ProcessedOrderResult> {
    const orderId = data.order_id;

    try {
      // Validate dữ liệu đầu vào
      this.validateOrderData(data);

      // Lấy thông tin thương hiệu nhà hàng từ cache
      const restaurantBrand = await this.getRestaurantBrandCached(
        data.restaurant_brand_id
      );
      const vat = this.calculateVat(restaurantBrand);
      const restaurantInvoiceVat =
        this.calculateRestaurantInvoiceVat(restaurantBrand);

      // Đánh dấu đã xử lý sớm để tránh duplicate
      await this.markOrderAsProcessed(orderId);

      await this.handleOrderOptimized(
        data,
        vat,
        restaurantInvoiceVat,
        restaurantPartnerInvoices
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully processed order ${orderId} in ${processingTime}ms`
      );

      return {
        success: true,
        orderId,
        processingTime,
      };
    } catch (error) {
      // Xóa khỏi danh sách đã xử lý khi thất bại
      await this.removeOrderFromProcessed(orderId);

      const processingTime = Date.now() - startTime;
      this.logger.error(`Failed to process order ${orderId}`, error.stack);

      return {
        success: false,
        orderId,
        error: error as Error,
        processingTime,
      };
    }
  }

  /**
   * Validate dữ liệu đơn hàng
   * @param data - Dữ liệu đơn hàng cần validate
   */
  private validateOrderData(data: any): void {
    if (!data) {
      throw new Error("Order data is null or undefined");
    }

    if (!data.order_id) {
      throw new Error("Order ID is required");
    }

    if (!data.restaurant_brand_id) {
      throw new Error("Restaurant brand ID is required");
    }

    if (!Array.isArray(data.order_details)) {
      throw new Error("Order details must be an array");
    }
  }

  /**
   * Tính toán thuế VAT dựa trên cấu hình thương hiệu nhà hàng
   * @param restaurantBrand - Thông tin thương hiệu nhà hàng
   * @returns Tỷ lệ VAT (phần trăm)
   */
  private calculateVat(restaurantBrand: RestaurantBrandEntity): number {
    const defaultVat = 8; // VAT mặc định 8%

    if (
      restaurantBrand?.setting?.invoice_vat == null ||
      typeof restaurantBrand.setting.invoice_vat !== "number"
    ) {
      return defaultVat;
    }

    const vat = restaurantBrand.setting.invoice_vat;

    // Validate phạm vi VAT hợp lệ (0-100%)
    if (vat < 0 || vat > 100) {
      this.logger.warn(
        `Invalid VAT value ${vat} for restaurant ${restaurantBrand.id}, using default`
      );
      return defaultVat;
    }

    return vat;
  }

  private calculateRestaurantInvoiceVat(
    restaurantBrand: RestaurantBrandEntity
  ): number {
    const defaultVat = 0; // VAT mặc định 0%

    if (
      restaurantBrand?.setting?.restaurant_invoice_vat == null ||
      typeof restaurantBrand.setting.restaurant_invoice_vat !== "number"
    ) {
      return defaultVat;
    }

    const vat = restaurantBrand.setting.restaurant_invoice_vat;

    if (vat < 0 || vat > 100) {
      this.logger.warn(
        `Invalid restaurant invoice VAT value ${vat} for restaurant ${restaurantBrand.id}, using default`
      );
      return defaultVat;
    }

    return vat;
  }

  private async processCacheInvalidationMessage(data: any): Promise<void> {
    try {
      if (data?.key) {
        await this.cacheService.deleteCache(data.key);
        this.logger.debug(`Cache invalidated for key: ${data.key}`);
      }
    } catch (error) {
      this.logger.error("Failed to invalidate cache", error.stack);
    }
  }

  private handleProcessingError(
    error: Error,
    orderId?: string,
    offset?: number,
    processingTime?: number
  ): void {
    this.metrics.errorCount++;

    const errorContext = {
      orderId,
      offset,
      processingTime,
      error: error.message,
    };

    this.logger.error("Message processing failed", error.stack, errorContext);
  }

  /**
   * Cập nhật thống kê xử lý
   * @param result - Kết quả xử lý đơn hàng
   */
  private updateMetrics(result: ProcessedOrderResult): void {
    this.metrics.totalProcessed++;

    if (result.success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // Cập nhật thời gian xử lý trung bình
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) +
        result.processingTime) /
      this.metrics.totalProcessed;

    this.metrics.lastProcessedAt = new Date();
  }

  private async isOrderProcessed(orderId: string): Promise<boolean> {
    return await this.cacheService.isOrderProcessed(
      orderId,
      this.PROCESSED_ORDERS_KEY
    );
  }

  private async markOrderAsProcessed(orderId: string): Promise<void> {
    await this.cacheService.markOrderAsProcessed(
      orderId,
      this.PROCESSED_ORDERS_KEY,
      this.ORDER_EXPIRY_TIME
    );
  }

  private async removeOrderFromProcessed(orderId: string): Promise<void> {
    await this.cacheService.removeOrderFromProcessed(
      orderId,
      this.PROCESSED_ORDERS_KEY
    );
  }

  private async getRestaurantBrandCached(
    id: number
  ): Promise<RestaurantBrandEntity> {
    return await this.restaurantBrandService.findById(id);
  }

  private async handleOrderOptimized(
    data: any,
    vat: number,
    restaurantInvoiceVat: number,
    restaurantPartnerInvoices: RestaurantPartnerInvoiceEntity[]
  ): Promise<void> {
    try {
      const bills = this.createBillFromData(data);
      const kafkaOrderDetails = [...data.order_details];

      await Promise.all(
        bills.map(async (bill) => {
          try {
            if (InvoiceAppFood.APP_FOOD.includes(bill.order_method)) {
              this.calculateVatAmounts(bill, kafkaOrderDetails, vat, false);
            } else {
              if (restaurantInvoiceVat !== 0) {
                this.calculateVatAmounts(
                  bill,
                  kafkaOrderDetails,
                  restaurantInvoiceVat,
                  true
                );
              }
            }

            await this.processExtraChargesOptimized(bill, kafkaOrderDetails);
            await this.processBuffetTicketOptimized(bill, kafkaOrderDetails);
          } catch (error) {
            this.logger.error(
              `Error processing bill ${bill.order_id}:`,
              error.stack
            );
            throw error;
          }
        })
      );

      const invoice = await this.batchCreateInvoices(bills);
      if (!invoice) {
        throw new Error("Failed to create invoice");
      }
      // Safe null check
      const restaurantInvoice = restaurantPartnerInvoices.find(
        (x) => x.branch_id === invoice.branch_id
      );
      if (!restaurantInvoice) {
        this.logger.warn(
          `Restaurant partner invoice not found for restaurant_id : ${invoice.restaurant_id}- branch_id : ${invoice.branch_id}`
        );
        return;
      }

      await this.processOrderDetailsOptimized(kafkaOrderDetails, data);
      const isApplyRevertVatRestaurant = restaurantInvoiceVat !== 0;
      await this.batchCreateInvoiceDetails(
        kafkaOrderDetails,
        vat,
        restaurantInvoiceVat,
        isApplyRevertVatRestaurant
      );

      if (restaurantInvoice.is_auto_export_third_party !== 1) {
        this.logger.log(
          `[restaurant - ${invoice.restaurant_id}] không được auto export`
        );
        return;
      }

      const applyOrderTypes: number[] = JSON.parse(
        restaurantInvoice.apply_order_types
      ).filter((x: number) => x !== 0);
      let invoiceFilter: Invoice = null;

      // Lọc hóa đơn theo loại đơn hàng được cấu hình
      if (
        applyOrderTypes.includes(OrderType.APP_FOOD) &&
        applyOrderTypes.includes(OrderType.APP_ORDER)
      ) {
        // Nếu áp dụng cho cả APP_FOOD và APP_ORDER thì lấy tất cả hóa đơn
        invoiceFilter = invoice;
      } else if (applyOrderTypes.includes(OrderType.APP_FOOD)) {
        if (InvoiceAppFood.APP_FOOD.includes(invoice.order_method)) {
          invoiceFilter = invoice;
        }
      } else if (applyOrderTypes.includes(OrderType.APP_ORDER)) {
        // Chỉ lấy hóa đơn từ app đặt bàn (không phải app đặt món)
        if (!InvoiceAppFood.APP_FOOD.includes(invoice.order_method)) {
          invoiceFilter = invoice;
        }
      }

      if (invoiceFilter === null) return;

      // Sử dụng queue để xử lý async, không block việc tạo invoice
      await this.queueInvoiceForThirdParty(invoiceFilter, restaurantInvoice);
    } catch (error) {
      this.logger.error("Error in handleOrderOptimized:", error.stack);
      throw error;
    }
  }

  private calculateVatAmounts(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[],
    vat: number,
    isRestaurantOrder: boolean
  ): void {
    if (isRestaurantOrder) {
      this.calculateVatAmountsForRestaurant(invoice, kafkaOrderDetails, vat);
    } else {
      this.calculateVatAmountsForAppFood(invoice, kafkaOrderDetails, vat);
    }
  }

  /**
   * Tính toán VAT cho Restaurant Orders với logic đặc biệt
   *
   * Logic hoạt động:
   * 1. Phát hiện giảm giá từng món (total_amount_without_vat - total_amount > 0)
   * 2. Áp dụng công thức tính ngược VAT từ invoice.total_amount
   * 3. Điều chỉnh tính toán dựa trên việc có giảm giá từng món hay không
   * 4. Phân bổ VAT theo tỷ lệ của từng item
   * 5. Đảm bảo tổng các amounts khớp chính xác với invoice totals
   */
  private calculateVatAmountsForRestaurant(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[],
    vat: number
  ): void {
    const originalTotalAmount = invoice.total_amount;
    const totalSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );

    if (totalSum === 0) {
      this.logger.warn(
        `Zero total sum for restaurant order ${invoice.order_id}`
      );
      return;
    }

    // Kiểm tra có giảm giá tổng bill không ngay từ đầu
    const isDiscountAll: boolean = invoice.total_amount_discount_amount > 0;

    // **BƯỚC MỚI: Phát hiện giảm giá từng món trước khi tính VAT**
    let hasItemDiscount = false;
    let totalItemDiscountAmount = 0;

    // Luôn kiểm tra giảm giá từng món, bất kể có giảm giá tổng bill hay không
    kafkaOrderDetails.forEach((detail) => {
      // **LOGIC MỚI: Tính discount từ chênh lệch thực tế**
      const originalTotalWithoutVat = detail.total_amount_without_vat || 0;
      const actualTotal = detail.total_amount || 0;
      const calculatedDiscount = originalTotalWithoutVat - actualTotal;

      // Nếu có chênh lệch thì đó là discount thực tế
      let itemDiscountAmount = detail.discount_amount || 0;
      if (calculatedDiscount > 0) {
        itemDiscountAmount = calculatedDiscount;
        // **LƯU DISCOUNT_AMOUNT THỰC TẾ**
        detail.discount_amount = itemDiscountAmount;

        if (invoice.order_id == 883016 || invoice.order_id == 883065) {
          console.log(
            "DEBUG Calculated discount for detail",
            detail.order_detail_id,
            "original_total_without_vat:",
            originalTotalWithoutVat,
            "actual_total:",
            actualTotal,
            "calculated_discount:",
            calculatedDiscount
          );
        }
      }

      if (itemDiscountAmount > 0) {
        hasItemDiscount = true;
        totalItemDiscountAmount += itemDiscountAmount;

        if (invoice.order_id == 883016 || invoice.order_id == 883065) {
          console.log(
            "DEBUG Found item discount for detail",
            detail.order_detail_id,
            "discount_amount:",
            itemDiscountAmount
          );
        }
      }
    });

    // **Áp dụng công thức revert VAT với ưu tiên tính đúng tiền**
    let totalVatAmount: number;
    let totalAmountWithoutVat: number;

    if (hasItemDiscount) {
      // **Trường hợp có giảm giá từng món: Tính VAT dựa trên tổng total_amount thực tế của các items**
      // Tổng total_amount thực tế từ các items (đã bao gồm discount)
      const totalActualAmount = kafkaOrderDetails.reduce(
        (sum, detail) => sum + (detail.total_amount || 0),
        0
      );

      // Áp dụng công thức revert VAT trên total_amount thực tế
      totalVatAmount = Math.round((totalActualAmount * vat) / (100 + vat));
      totalAmountWithoutVat = totalActualAmount - totalVatAmount;

      this.logger.debug(
        `Restaurant order ${invoice.order_id} - Item discount detected: ${totalItemDiscountAmount}, VAT calculated on actual total_amount: ${totalActualAmount}`
      );
    } else {
      // **Trường hợp không có giảm giá từng món: Logic gốc**
      // Áp dụng công thức revert VAT, luôn dùng invoice.total_amount làm gốc
      totalVatAmount = Math.round((originalTotalAmount * vat) / (100 + vat));
      totalAmountWithoutVat = originalTotalAmount - totalVatAmount;
    }

    // Xử lý phân bổ VAT cho restaurant order
    this.processVatDistributionForRestaurant(
      invoice,
      kafkaOrderDetails,
      totalVatAmount,
      totalAmountWithoutVat,
      totalSum,
      vat,
      isDiscountAll,
      hasItemDiscount,
      totalItemDiscountAmount
    );
  }

  /**
   * Xử lý tính VAT cho App Food Orders (logic gốc)
   * - Sử dụng logic tính VAT truyền thống
   */
  private calculateVatAmountsForAppFood(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[],
    vat: number
  ): void {
    const originalTotalAmount = invoice.total_amount;
    const totalSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );

    if (totalSum === 0) {
      this.logger.warn(`Zero total sum for app food order ${invoice.order_id}`);
      return;
    }

    // Logic gốc cho App Food orders
    const totalVatAmount = Math.round(
      (originalTotalAmount * vat) / (100 + vat)
    );
    const totalAmountWithoutVat = originalTotalAmount - totalVatAmount;

    // Xử lý phân bổ VAT cho app food order
    this.processVatDistributionForAppFood(
      invoice,
      kafkaOrderDetails,
      totalVatAmount,
      totalAmountWithoutVat,
      totalSum,
      vat
    );
  }

  /**
   * Xử lý phân bổ VAT cho Restaurant Orders
   * - Xử lý discount đặc biệt khi có giảm giá tổng bill
   * - Xử lý giảm giá từng món đã được phát hiện trước đó
   * - Phân bổ VAT theo tỷ lệ
   */
  private processVatDistributionForRestaurant(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[],
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    totalSum: number,
    vat: number,
    isDiscountAll: boolean,
    hasItemDiscount: boolean = false,
    totalItemDiscountAmount: number = 0
  ): void {
    // === BƯỚC 1: PHÂN BỔ VAT AMOUNTS ===
    const detailCalculations: Array<{
      detail: KafkaOrderDetail;
      calculatedVatAmount: number;
      calculatedAmountWithoutVat: number;
      calculatedTotalAmount: number;
      originalTotalAmount: number;
      keepOriginalValues?: boolean;
    }> = [];

    let totalCalculatedVat = 0;
    let totalCalculatedAmountWithoutVat = 0;

    // Phân bổ theo tỷ lệ của từng item so với tổng
    kafkaOrderDetails.forEach((detail: KafkaOrderDetail) => {
      // Khi có giảm giá từng món, phân bổ dựa trên total_amount thực tế
      // Khi không có giảm giá từng món, phân bổ dựa trên total_amount_without_vat
      const baseAmount = hasItemDiscount
        ? detail.total_amount || 0
        : detail.total_amount_without_vat || 0;
      const totalBaseAmount = hasItemDiscount
        ? kafkaOrderDetails.reduce((sum, d) => sum + (d.total_amount || 0), 0)
        : totalSum;

      // Khi có item discount, cần tính lại totalAmountWithoutVat dựa trên tổng total_amount thực tế
      const adjustedTotalAmountWithoutVat = hasItemDiscount
        ? totalBaseAmount
        : totalAmountWithoutVat;

      const itemRatio = baseAmount / totalBaseAmount;
      const calculatedVatAmount = Math.round(totalVatAmount * itemRatio);
      const calculatedAmountWithoutVat = Math.round(
        adjustedTotalAmountWithoutVat * itemRatio
      );
      const calculatedTotalAmount =
        calculatedVatAmount + calculatedAmountWithoutVat;

      detailCalculations.push({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        calculatedTotalAmount,
        originalTotalAmount: detail.total_amount_without_vat || 0,
      });

      totalCalculatedVat += calculatedVatAmount;
      totalCalculatedAmountWithoutVat += calculatedAmountWithoutVat;
    });

    // Điều chỉnh để đảm bảo tổng bằng chính xác với invoice total_amount
    const adjustedTotalAmountWithoutVat = hasItemDiscount
      ? kafkaOrderDetails.reduce((sum, d) => sum + (d.total_amount || 0), 0)
      : totalAmountWithoutVat;

    const vatDifference = totalVatAmount - totalCalculatedVat;
    const amountWithoutVatDifference =
      adjustedTotalAmountWithoutVat - totalCalculatedAmountWithoutVat;

    // Điều chỉnh VAT difference
    let remainingVatDiff = vatDifference;
    for (
      let i = 0;
      i < detailCalculations.length && remainingVatDiff !== 0;
      i++
    ) {
      const adjustment = remainingVatDiff > 0 ? 1 : -1;
      detailCalculations[i].calculatedVatAmount += adjustment;
      remainingVatDiff -= adjustment;
    }

    // Điều chỉnh amount without VAT difference
    let remainingAmountDiff = amountWithoutVatDifference;
    for (
      let i = 0;
      i < detailCalculations.length && remainingAmountDiff !== 0;
      i++
    ) {
      const adjustment = remainingAmountDiff > 0 ? 1 : -1;
      detailCalculations[i].calculatedAmountWithoutVat += adjustment;
      remainingAmountDiff -= adjustment;
    }

    // Cập nhật lại total_amount cho từng item để đảm bảo tổng chính xác
    detailCalculations.forEach((calc) => {
      calc.calculatedTotalAmount =
        calc.calculatedVatAmount + calc.calculatedAmountWithoutVat;
    });

    // === BƯỚC 2: XỬ LÝ DISCOUNT CHO RESTAURANT ORDER ===
    let hasDiscountDifference = hasItemDiscount; // Sử dụng giá trị đã phát hiện từ calculateVatAmountsForRestaurant
    let totalOriginalDiscountAmount = totalItemDiscountAmount; // Sử dụng giá trị đã tính từ calculateVatAmountsForRestaurant
    if (invoice.order_id == 883016 || invoice.order_id == 883065) {
      console.log(
        "DEBUG Order",
        invoice.order_id,
        "hasDiscountDifference",
        hasDiscountDifference,
        "isDiscountAll",
        isDiscountAll,
        "hasItemDiscount",
        hasItemDiscount
      );
    }
    detailCalculations.forEach((calculation) => {
      const { detail } = calculation;

      if (isDiscountAll) {
        detail.discount_amount = 0;
      } else if (hasItemDiscount) {
        // **Trường hợp có giảm giá từng món đã được phát hiện và lưu trước đó**
        // discount_amount đã được tính toán và lưu trong bước phát hiện discount
        if (detail.discount_amount > 0) {
          detail.discount_percent = Math.round(
            Math.abs(
              (detail.discount_amount * 100) / detail.total_amount_without_vat
            )
          );

          // Đánh dấu để xử lý đặc biệt
          calculation.keepOriginalValues = true;
        }
      } else {
        // **Trường hợp không có giảm giá từng món**
        detail.discount_amount = 0;
      }
    });
    // === BƯỚC 2.1: XỬ LÝ PHÂN BỔ VAT KHI CÓ GIẢM GIÁ TỪNG MÓN ===
    if (hasDiscountDifference && !isDiscountAll) {
      // **Khi có giảm giá từng món, VAT đã được tính toán chính xác từ calculateVatAmountsForRestaurant**
      // Phân bổ đã được thực hiện dựa trên total_amount thực tế, không cần phân bổ lại

      this.logger.debug(
        `Restaurant order ${invoice.order_id} - Item discount processing completed, VAT distributed based on actual amounts`
      );
    }

    // === BƯỚC 3: ÁP DỤNG CÁC GIÁ TRỊ ĐÃ TÍNH TOÁN ===
    detailCalculations.forEach(
      ({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        keepOriginalValues,
      }) => {
        // Lưu giá trị food_unit_price gốc trước khi ghi đè
        const originalFoodUnitPrice = detail.food_unit_price;
        detail.vat = vat;

        if (hasDiscountDifference && !isDiscountAll && keepOriginalValues) {
          // Trường hợp có giảm giá theo từng món:
          // - total_amount_without_vat: thành tiền (đã giảm giá, chưa bao gồm VAT)
          // - price: giá bán = total_amount_without_vat (thành tiền)
          // - food_unit_price: giá gốc trước giảm giá (tính từ total_amount_without_vat + discount_amount)

          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;

          // price = giá thực tế khách trả = total_amount (đã bao gồm VAT và discount)
          detail.price = calculatedAmountWithoutVat + calculatedVatAmount;

          // food_unit_price = giữ nguyên giá gốc (không thay đổi khi có discount)
          // Chỉ cập nhật food_unit_price nếu chưa có giá trị hợp lệ
          if (!detail.food_unit_price || detail.food_unit_price <= 0) {
            const discountAmount = detail.discount_amount || 0;
            detail.food_unit_price =
              detail.quantity > 0
                ? Math.round(
                    (calculatedAmountWithoutVat + discountAmount) /
                      detail.quantity
                  )
                : 0;
          }
        } else if (keepOriginalValues) {
          // Logic gốc cho trường hợp giữ nguyên giá trị
          detail.vat_amount =
            detail.total_amount_without_vat - detail.total_amount;
          // price là giá gốc trước discount (không bao gồm VAT) - sử dụng giá trị gốc
          detail.price = originalFoodUnitPrice || 0;
        } else {
          // Logic cho trường hợp không có discount/extra-charge
          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;

          // **FIX: Đảm bảo price = food_unit_price = total_amount_without_vat khi không có discount**
          // Khi không có discount/extra-charge, sau khi áp dụng VAT ngược từ restaurantInvoiceVat
          // price, food_unit_price và total_amount_without_vat phải bằng nhau
          detail.price =
            detail.quantity > 0
              ? Math.round(calculatedAmountWithoutVat / detail.quantity)
              : 0;
          detail.food_unit_price = detail.price;
        }
      }
    );

    // === BƯỚC 4: ĐIỀU CHỈNH SAI SỐ LÀM TRÒN ===
    // Với logic mới: price = total_amount_without_vat (cho trường hợp có discount)
    // Nên không cần điều chỉnh price nữa vì price đã bằng total_amount_without_vat
    const finalCalculatedAmountWithoutVat = detailCalculations.reduce(
      (sum, { detail }) => sum + (detail.total_amount_without_vat || 0),
      0
    );
    const targetTotalAmountWithoutVat = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );
    const amountDifference =
      targetTotalAmountWithoutVat - finalCalculatedAmountWithoutVat;

    if (amountDifference !== 0) {
      // Find the largest item to adjust total_amount_without_vat
      const largestAmountItem = detailCalculations.reduce((max, current) =>
        (current.detail.total_amount_without_vat || 0) >
        (max.detail.total_amount_without_vat || 0)
          ? current
          : max
      );

      if (largestAmountItem.detail) {
        largestAmountItem.detail.total_amount_without_vat =
          (largestAmountItem.detail.total_amount_without_vat || 0) +
          amountDifference;

        // Cập nhật lại price cho item có discount (price = total_amount_without_vat)
        if (hasDiscountDifference && !isDiscountAll) {
          largestAmountItem.detail.price =
            largestAmountItem.detail.total_amount_without_vat;
        }
      }
    }

    // === BƯỚC 5: ĐIỀU CHỈNH FINAL TOTALS ===
    const finalVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.vat_amount || 0),
      0
    );
    const finalAmountWithoutVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );

    // Sử dụng adjustedTotalAmountWithoutVat cho việc điều chỉnh final totals
    const targetAmountWithoutVat = hasItemDiscount
      ? kafkaOrderDetails.reduce((sum, d) => sum + (d.total_amount || 0), 0)
      : totalAmountWithoutVat;

    if (finalVatSum !== totalVatAmount) {
      const vatAdjustment = totalVatAmount - finalVatSum;
      const largestItem = detailCalculations[0];
      largestItem.detail.vat_amount += vatAdjustment;
    }

    if (finalAmountWithoutVatSum !== targetAmountWithoutVat) {
      const amountAdjustment =
        targetAmountWithoutVat - finalAmountWithoutVatSum;
      const largestItem = detailCalculations[0];
      largestItem.detail.total_amount_without_vat += amountAdjustment;
    }

    // === BƯỚC 6: CẬP NHẬT INVOICE TOTALS ===
    invoice.total_amount_without_vat = totalAmountWithoutVat;
    invoice.vat_amount = totalVatAmount;
    invoice.amount = totalAmountWithoutVat;
    invoice.vat = vat;

    // === BƯỚC 7: VERIFICATION CUỐI CÙNG ===
    const verifyVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.vat_amount || 0),
      0
    );
    const verifyAmountSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );
    const verifyTotalSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount || 0),
      0
    );
    const verifyDiscountSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.discount_amount || 0),
      0
    );

    // Thông báo rõ ràng về logic discount
    let discountInfo = "";
    if (isDiscountAll) {
      discountInfo = `with total discount: ${invoice.total_amount_discount_amount}`;
    } else if (hasDiscountDifference) {
      discountInfo = `with item discount detected early, total item discounts: ${verifyDiscountSum}`;
    } else {
      discountInfo = "no discount";
    }

    const isRestaurantWithTotalDiscount = isDiscountAll;

    if (isRestaurantWithTotalDiscount) {
      this.logger.debug(
        `Restaurant order ${invoice.order_id} with total bill discount - Individual item discounts: ${verifyDiscountSum} (should be 0), Total discount applied at invoice level`
      );
    } else if (hasDiscountDifference) {
      this.logger.debug(
        `Restaurant order ${
          invoice.order_id
        } with item discount detected early - Individual item discounts: ${verifyDiscountSum}, VAT calculated on amount after discount: ${
          totalAmountWithoutVat + totalVatAmount
        }`
      );
    }

    if (
      verifyVatSum !== totalVatAmount ||
      verifyAmountSum !== totalAmountWithoutVat ||
      verifyTotalSum !== invoice.total_amount
    ) {
      this.logger.error(
        `Critical VAT calculation error for Restaurant order ${
          invoice.order_id
        } (${discountInfo}): VAT diff=${
          verifyVatSum - totalVatAmount
        }, Amount diff=${verifyAmountSum - totalAmountWithoutVat}, Total diff=${
          verifyTotalSum - invoice.total_amount
        }, Item discount sum=${verifyDiscountSum}`
      );
    } else {
      this.logger.debug(
        `VAT calculation successful for Restaurant order ${invoice.order_id} (${discountInfo}): All totals match exactly - Total: ${verifyTotalSum}, VAT: ${verifyVatSum}, Without VAT: ${verifyAmountSum}, Item discount sum=${verifyDiscountSum}`
      );
    }
  }

  /**
   * Xử lý phân bổ VAT cho App Food Orders
   * - Logic gốc đơn giản hơn
   */
  private processVatDistributionForAppFood(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[],
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    totalSum: number,
    vat: number
  ): void {
    // Thực hiện phân bổ VAT với logic gốc
    const detailCalculations = this.distributeVatAmounts(
      kafkaOrderDetails,
      totalVatAmount,
      totalAmountWithoutVat,
      totalSum
    );

    // Áp dụng các giá trị đã tính toán (không có logic discount đặc biệt)
    this.applyCalculatedValues(detailCalculations, vat);

    // Điều chỉnh làm tròn
    this.adjustRoundingDifferences(kafkaOrderDetails, detailCalculations);

    // Điều chỉnh final totals
    this.adjustFinalTotals(
      kafkaOrderDetails,
      detailCalculations,
      totalVatAmount,
      totalAmountWithoutVat
    );

    // Cập nhật invoice
    this.updateInvoiceTotals(
      invoice,
      totalVatAmount,
      totalAmountWithoutVat,
      vat
    );

    // Verification
    const verifyVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.vat_amount || 0),
      0
    );
    const verifyAmountSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );
    const verifyTotalSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount || 0),
      0
    );

    if (
      verifyVatSum !== totalVatAmount ||
      verifyAmountSum !== totalAmountWithoutVat ||
      verifyTotalSum !== invoice.total_amount
    ) {
      this.logger.error(
        `Critical VAT calculation error for App Food order ${
          invoice.order_id
        }: VAT diff=${verifyVatSum - totalVatAmount}, Amount diff=${
          verifyAmountSum - totalAmountWithoutVat
        }, Total diff=${verifyTotalSum - invoice.total_amount}`
      );
    } else {
      this.logger.debug(
        `VAT calculation successful for App Food order ${invoice.order_id}: All totals match exactly - Total: ${verifyTotalSum}, VAT: ${verifyVatSum}, Without VAT: ${verifyAmountSum}`
      );
    }
  }

  /**
   * Phân bổ VAT amounts cho các order details (dùng cho AppFood)
   */
  private distributeVatAmounts(
    kafkaOrderDetails: KafkaOrderDetail[],
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    totalSum: number
  ): Array<{
    detail: KafkaOrderDetail;
    calculatedVatAmount: number;
    calculatedAmountWithoutVat: number;
    calculatedTotalAmount: number;
    originalTotalAmount: number;
    keepOriginalValues?: boolean;
  }> {
    const detailCalculations: Array<{
      detail: KafkaOrderDetail;
      calculatedVatAmount: number;
      calculatedAmountWithoutVat: number;
      calculatedTotalAmount: number;
      originalTotalAmount: number;
      keepOriginalValues?: boolean;
    }> = [];

    let totalCalculatedVat = 0;
    let totalCalculatedAmountWithoutVat = 0;

    // Phân bổ theo tỷ lệ của từng item so với tổng
    kafkaOrderDetails.forEach((detail: KafkaOrderDetail) => {
      const itemRatio = (detail.total_amount_without_vat || 0) / totalSum;
      const calculatedVatAmount = Math.round(totalVatAmount * itemRatio);
      const calculatedAmountWithoutVat = Math.round(
        totalAmountWithoutVat * itemRatio
      );
      const calculatedTotalAmount =
        calculatedVatAmount + calculatedAmountWithoutVat;

      detailCalculations.push({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        calculatedTotalAmount,
        originalTotalAmount: detail.total_amount_without_vat || 0,
      });

      totalCalculatedVat += calculatedVatAmount;
      totalCalculatedAmountWithoutVat += calculatedAmountWithoutVat;
    });

    // Điều chỉnh để đảm bảo tổng bằng chính xác với invoice total_amount
    const vatDifference = totalVatAmount - totalCalculatedVat;
    const amountWithoutVatDifference =
      totalAmountWithoutVat - totalCalculatedAmountWithoutVat;

    // Điều chỉnh VAT difference
    let remainingVatDiff = vatDifference;
    for (
      let i = 0;
      i < detailCalculations.length && remainingVatDiff !== 0;
      i++
    ) {
      const adjustment = remainingVatDiff > 0 ? 1 : -1;
      detailCalculations[i].calculatedVatAmount += adjustment;
      remainingVatDiff -= adjustment;
    }

    // Điều chỉnh amount without VAT difference
    let remainingAmountDiff = amountWithoutVatDifference;
    for (
      let i = 0;
      i < detailCalculations.length && remainingAmountDiff !== 0;
      i++
    ) {
      const adjustment = remainingAmountDiff > 0 ? 1 : -1;
      detailCalculations[i].calculatedAmountWithoutVat += adjustment;
      remainingAmountDiff -= adjustment;
    }

    // Cập nhật lại total_amount cho từng item để đảm bảo tổng chính xác
    detailCalculations.forEach((calc) => {
      calc.calculatedTotalAmount =
        calc.calculatedVatAmount + calc.calculatedAmountWithoutVat;
    });

    return detailCalculations;
  }

  /**
   * Áp dụng các giá trị đã tính toán cho order details (dùng cho AppFood)
   */
  private applyCalculatedValues(
    detailCalculations: Array<{
      detail: KafkaOrderDetail;
      calculatedVatAmount: number;
      calculatedAmountWithoutVat: number;
      calculatedTotalAmount: number;
      originalTotalAmount: number;
      keepOriginalValues?: boolean;
    }>,
    vat: number
  ): void {
    detailCalculations.forEach(
      ({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        keepOriginalValues,
      }) => {
        detail.food_unit_price = calculatedAmountWithoutVat;
        detail.vat = vat;

        // Nếu có flag keepOriginalValues, giữ nguyên total_amount_without_vat và total_amount
        if (keepOriginalValues) {
          // Giữ nguyên total_amount_without_vat và total_amount của từng món
          // Chỉ cập nhật các trường khác
          detail.vat_amount =
            detail.total_amount_without_vat - detail.total_amount;
          detail.price =
            detail.quantity > 0
              ? Math.round(detail.total_amount_without_vat / detail.quantity)
              : 0;
        } else {
          // Logic gốc
          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.price =
            detail.quantity > 0
              ? Math.round(calculatedAmountWithoutVat / detail.quantity)
              : 0;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;
        }
      }
    );
  }

  /**
   * Điều chỉnh sai số làm tròn trong tính toán giá (dùng cho AppFood)
   */
  private adjustRoundingDifferences(
    kafkaOrderDetails: KafkaOrderDetail[],
    detailCalculations: Array<{
      detail: KafkaOrderDetail;
      calculatedVatAmount: number;
      calculatedAmountWithoutVat: number;
      calculatedTotalAmount: number;
      originalTotalAmount: number;
      keepOriginalValues?: boolean;
    }>
  ): void {
    const totalCalculatedPrice = detailCalculations.reduce(
      (sum, { detail }) => sum + detail.price * detail.quantity,
      0
    );
    const priceDifference =
      kafkaOrderDetails.reduce(
        (sum, detail) => sum + (detail.total_amount_without_vat || 0),
        0
      ) - totalCalculatedPrice;

    if (priceDifference !== 0) {
      // Find the largest item to adjust
      const largestPriceItem = detailCalculations.reduce((max, current) =>
        current.detail.price * current.detail.quantity >
        max.detail.price * max.detail.quantity
          ? current
          : max
      );

      if (largestPriceItem.detail.quantity > 0) {
        const priceAdjustment = Math.round(
          priceDifference / largestPriceItem.detail.quantity
        );
        largestPriceItem.detail.price += priceAdjustment;
      }
    }
  }

  /**
   * Điều chỉnh final totals để đảm bảo chính xác (dùng cho AppFood)
   */
  private adjustFinalTotals(
    kafkaOrderDetails: KafkaOrderDetail[],
    detailCalculations: Array<{
      detail: KafkaOrderDetail;
      calculatedVatAmount: number;
      calculatedAmountWithoutVat: number;
      calculatedTotalAmount: number;
      originalTotalAmount: number;
      keepOriginalValues?: boolean;
    }>,
    totalVatAmount: number,
    totalAmountWithoutVat: number
  ): void {
    const finalVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.vat_amount || 0),
      0
    );
    const finalAmountWithoutVatSum = kafkaOrderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );

    if (finalVatSum !== totalVatAmount) {
      const vatAdjustment = totalVatAmount - finalVatSum;
      const largestItem = detailCalculations[0];
      largestItem.detail.vat_amount += vatAdjustment;
    }

    if (finalAmountWithoutVatSum !== totalAmountWithoutVat) {
      const amountAdjustment = totalAmountWithoutVat - finalAmountWithoutVatSum;
      const largestItem = detailCalculations[0];
      largestItem.detail.total_amount_without_vat += amountAdjustment;
    }
  }

  /**
   * Cập nhật totals cho invoice (dùng cho AppFood)
   */
  private updateInvoiceTotals(
    invoice: KafkaElectricInvoice,
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    vat: number
  ): void {
    invoice.total_amount_without_vat = totalAmountWithoutVat;
    invoice.vat_amount = totalVatAmount;
    invoice.amount = totalAmountWithoutVat;
    invoice.vat = vat;
  }

  private createBillFromData(data: any): KafkaElectricInvoice[] {
    try {
      return [new KafkaElectricInvoice(data)];
    } catch (error) {
      this.logger.error("Failed to create bill from data", error.stack);
      throw new Error("Invalid bill data format");
    }
  }

  private async processExtraChargesOptimized(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[]
  ): Promise<void> {
    const extraCharges: KafkaOrderDetail[] = [];

    // if (invoice.total_amount_extra_charge_amount !== 0) {
    //   extraCharges.push(this.createExtraChargeDetail(invoice));
    // }

    if (invoice.extra_charge_amount !== 0) {
      extraCharges.push(this.createServiceChargeDetail(invoice));
    }

    if (invoice.total_amount_discount_amount !== 0) {
      extraCharges.push(this.createDiscountDetail(invoice));
    }

    kafkaOrderDetails.push(...extraCharges);
  }

  // private createExtraChargeDetail(invoice: KafkaElectricInvoice): KafkaOrderDetail | any {
  //   const amount = invoice.total_amount_extra_charge_amount || 0;

  //   return {
  //     commodity_nature_type: 1,
  //     order_id: invoice.order_id,
  //     order_detail_id: invoice.order_id,
  //     food_code: "PTTB",
  //     food_name: "Phụ thu tổng bill",
  //     quantity: 1,
  //     food_unit_price: amount,
  //     discount_percent: 0,
  //     discount_amount: 0,
  //     vat: 0, // Sẽ được tính lại trong calculateVatAmounts
  //     vat_amount: 0, // Sẽ được tính lại trong calculateVatAmounts
  //     total_amount: amount,
  //     is_gift: 0,
  //     price: amount,
  //     food_unit: "Lần",
  //     status: 1,
  //     category_type: 0,
  //     food_id: -1,
  //     total_amount_without_vat: amount, // Sẽ được tính lại trong calculateVatAmounts
  //     ref_code: "",
  //     code: "PTTB",
  //     is_extra_charge: 0
  //   };
  // }

  private createServiceChargeDetail(
    invoice: KafkaElectricInvoice
  ): KafkaOrderDetail | any {
    const amount = invoice.extra_charge_amount || 0;

    return {
      commodity_nature_type: 1,
      order_id: invoice.order_id,
      order_detail_id: invoice.order_id,
      food_code: "PPV",
      food_name: "Phí phục vụ",
      quantity: 1,
      food_unit_price: amount,
      discount_percent: 0,
      discount_amount: 0,
      vat: 0, // Sẽ được tính lại trong calculateVatAmounts
      vat_amount: 0, // Sẽ được tính lại trong calculateVatAmounts
      total_amount: amount,
      is_gift: 0,
      price: amount,
      food_unit: "Lần",
      status: 1,
      category_type: 0,
      food_id: -1,
      total_amount_without_vat: amount, // Sẽ được tính lại trong calculateVatAmounts
      ref_code: "",
      code: "PPV",
      is_extra_charge: 0,
    };
  }

  private createDiscountDetail(
    invoice: KafkaElectricInvoice
  ): KafkaOrderDetail | any {
    const amount = invoice.total_amount_discount_amount || 0;

    return {
      commodity_nature_type: 3,
      order_id: invoice.order_id,
      order_detail_id: invoice.order_id,
      food_code: "GGTB",
      food_name: "Giảm Giá tổng bill",
      quantity: 1,
      food_unit_price: amount,
      discount_percent: 0,
      discount_amount: 0,
      vat: 0,
      vat_amount: 0,
      total_amount: amount,
      is_gift: 0,
      price: amount,
      food_unit: "Lần",
      status: 1,
      category_type: 0,
      food_id: -1,
      total_amount_without_vat: amount,
      ref_code: "",
      code: "GGTB",
      is_extra_charge: 0,
    };
  }

  private async processBuffetTicketOptimized(
    invoice: KafkaElectricInvoice,
    kafkaOrderDetails: KafkaOrderDetail[]
  ): Promise<void> {
    if (
      invoice.order_buffet_ticket &&
      this.isValidBuffetTicket(invoice.order_buffet_ticket)
    ) {
      kafkaOrderDetails.push(this.createBuffetTicketDetail(invoice));
    }
  }

  private isValidBuffetTicket(ticket: OrderBuffetTicket): boolean {
    if (!ticket) return false;

    const adultQty = ticket.adult_quantity || 0;
    const childQty = ticket.child_quantity || 0;

    return !isNaN(adultQty + childQty) && adultQty + childQty > 0;
  }

  private createBuffetTicketDetail(
    invoice: KafkaElectricInvoice
  ): KafkaOrderDetail | any {
    const ticket = invoice.order_buffet_ticket;
    const totalQuantity =
      (ticket.adult_quantity || 0) + (ticket.child_quantity || 0);
    const totalAmount = ticket.total_final_amount || 0;

    return {
      commodity_nature_type: 1,
      order_id: invoice.order_id,
      order_detail_id: invoice.order_id,
      food_code: "BF",
      food_name: `Buffet ${totalQuantity} người`,
      quantity: 1,
      food_unit_price: 0,
      discount_percent: 0,
      discount_amount: 0,
      vat: 0,
      vat_amount: 0,
      total_amount: totalAmount,
      is_gift: 0,
      price: 0,
      food_unit: "Vé",
      status: 1,
      category_type: 0,
      food_id: -2,
      total_amount_without_vat: totalAmount,
      ref_code: "",
      code: "VBF",
      is_extra_charge: 0,
      is_buffet: 1,
    };
  }

  private async processOrderDetailsOptimized(
    kafkaOrderDetails: KafkaOrderDetail[],
    data: any
  ): Promise<void> {
    const invoice = new KafkaElectricInvoice(data);

    // Process in batches to avoid memory issues
    const batches = this.createBatches(
      kafkaOrderDetails,
      this.BATCH_CONFIG.batchSize
    );

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (element) => {
          try {
            const discountPercent = Utils.getDiscountPercentFood(
              invoice,
              element
            );
            this.applyDiscountsOptimized(element, discountPercent, invoice);
            this.handleSpecialCasesOptimized(element);
          } catch (error) {
            this.logger.error(
              `Failed to process order detail ${element.order_detail_id}`,
              error.stack
            );
            throw error;
          }
        })
      );
    }
  }

  private applyDiscountsOptimized(
    element: KafkaOrderDetail,
    discountPercent: number,
    invoice: KafkaElectricInvoice
  ): void {
    if (invoice.total_amount_discount_amount === 0 && discountPercent > 0) {
      const discountAmount =
        (element.quantity * element.price * discountPercent) / 100;
      element.discount_amount = Math.round(discountAmount);
      element.discount_percent = discountPercent;
    }
  }

  private handleSpecialCasesOptimized(element: KafkaOrderDetail): void {
    if (element.category_type === CategoryType.SERVICEFOOD) {
      element.quantity = 1;
      element.total_amount_without_vat = element.price;
    }

    if (element.food_id === 0) {
      element.food_unit = "Phần";
    }

    // Ensure non-negative values
    element.quantity = Math.max(0, element.quantity || 0);
    element.price = Math.max(0, element.price || 0);
    element.total_amount = Math.max(0, element.total_amount || 0);
  }

  // Các phương thức monitoring và health check

  /**
   * Lấy thống kê xử lý hiện tại
   * @returns Bản sao của metrics hiện tại
   */
  getMetrics(): OrderProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Lấy kích thước queue đang xử lý
   * @returns Số lượng đơn hàng đang trong queue
   */
  getProcessingQueueSize(): number {
    return this.processingQueue.size;
  }

  /**
   * Xóa cache các đơn hàng đã xử lý
   */
  async clearProcessedOrdersCache(): Promise<void> {
    try {
      await this.cacheService.clearProcessedOrders(this.PROCESSED_ORDERS_KEY);
      this.logger.log("Processed orders cache cleared");
    } catch (error) {
      this.logger.error("Failed to clear processed orders cache", error.stack);
      throw error;
    }
  }

  /**
   * Graceful shutdown - đóng consumer một cách an toàn
   * Chờ tất cả các đơn hàng đang xử lý hoàn thành trước khi tắt
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log("Shutting down consumer...");

    // Chờ tất cả các đơn hàng đang xử lý hoàn thành
    const pendingPromises = Array.from(this.processingQueue.values());
    if (pendingPromises.length > 0) {
      this.logger.log(
        `Waiting for ${pendingPromises.length} pending orders to complete...`
      );
      await Promise.allSettled(pendingPromises);
    }

    this.logger.log("Consumer shutdown complete");
  }
}
