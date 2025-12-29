import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { KafkaElectronicInvoiceDetail } from "src/kafka/kafka.entity/kafka-electric-invoice-detail.entity";
import { LoginOauthDTO } from "src/common/dto/login.oauth.dto";
import { OauthService } from "src/oauth/oauth.service";
import { FoodDto } from "src/restaurant-service/food/food/food.dto";
import { FoodService } from "src/restaurant-service/food/food/food.service";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { InvoiceFormUpdateInvoicePartNerFpt } from "../../partner/invoice-fpt/fpt-invoice/dto/update.dto";
import { InvoiceConvertPartnerUpdateMInvoiceDTO } from "../../partner/invoice-minvoice/dto/update.dto";
import { GetFKeyMiFiDto } from "../../partner/invoice-mifi/dto/get_fkey.dto";
import { Invoice } from "../../common/schemas/invoice.schema";
import { InvoiceDetailUpdatePartNer } from "../../common/dto/map_detail_partner.dto";
import { InvoiceDetailDto } from "../../common/dto/Invoice-detail.dto";
import { InvoiceDetailUpdateBase } from "../../common/dto/invoice-update-multi.dto";
import { InvoiceUpdateConVerPartNerMiFiDto } from "../../partner/invoice-mifi/dto/update.dto";
import { InvoiceDetailMap } from "../../common/dto/Invoice_map_details.dto";
import { GetDetailInvoiceMifiDto } from "../../partner/invoice-mifi/dto/get_detail.dto";
import { InvoiceDetailResponse } from "../../common/responses/invoice-detail.reponse";
import { InvoiceDetailModelMap } from "../../common/models/invoice-detail.model";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "../../common/schemas/invoice-detail.schema";
import { DiscountType } from "src/common/enums/discount-type";
import { KafkaOrderDetail } from "../../kafka/kafka.entity/kafka.order.details.entity";
import { InvoiceConvertUpdatePartNerFptDto } from "src/partner/invoice-fpt/fpt-invoice/dto/update_inv_invoice.dto";
import { InvoiceDetailElasticImport } from "src/common/responses/invoice-detail-elastic-import";
import { ThirdPartyServiceAdapter } from "src/partner/apdater/third-party.adapter";
import { InvoiceDetailCreateByDto } from "src/common/dto/Invoice-detail.create.dto";
import { Utils } from "src/common/utils/utils.common.helper";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { InvoiceHandlerException } from "src/common/utils/ultis.hanlder.exception.ts/invoice.handler.exception";
import {
  InvoiceCreateMultiDto,
  InvoiceDetaiLCreateMulti,
} from "src/common/dto/invoice-detail-create-multi.dto";
import { Calculate } from "src/common/utils/ultils.calculate";
import { CacheService } from "../../redis/services/cache.service";
import { InvoiceAppFood } from "src/common/enums/invoice.app-food.enum";
import { RestaurantBrandService } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.service";
import { RestaurantBrandEntity } from "src/common/entities/restaurant-brand.entity";

@Injectable()
export class InvoiceDetailsService {
  constructor(
    @InjectModel(InvoiceDetail.name)
    private invoiceDetailModel: Model<InvoiceDetailDocument>,
    @Inject(forwardRef(() => RestaurantPartnerInvoiceService))
    private restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private foodService: FoodService,
    private oauthService: OauthService,
    private invoiceHelper: InvoiceHelper,
    private readonly cacheService: CacheService,
    private readonly restaurantBrandService: RestaurantBrandService
  ) {}

  /**
   * Calculate restaurant invoice VAT from restaurant brand settings
   */
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
      return defaultVat;
    }

    return vat;
  }

  /**
   * Check if restaurant invoice VAT should be applied (reverse VAT logic)
   */
  private shouldApplyRevertVatRestaurant(
    restaurantInvoiceVat: number,
    orderMethod: string
  ): boolean {
    return (
      restaurantInvoiceVat > 0 &&
      !InvoiceAppFood.APP_FOOD.includes(+orderMethod)
    );
  }

  /**
   * Creates invoice details from Kafka message data
   * @param kafkaElectronicInvoiceDetail Array of invoice detail data from Kafka
   * @returns Promise<void>
   */
  async createInvoiceDetailByKafka(
    kafkaElectronicInvoiceDetail:
      | KafkaElectronicInvoiceDetail[]
      | KafkaOrderDetail[],
    vat: number,
    restaurantInvoiceVat: number,
    isApplyRevertVatRestaurant: boolean
  ) {
    // Validate input
    if (
      !kafkaElectronicInvoiceDetail ||
      kafkaElectronicInvoiceDetail.length === 0
    ) {
      throw new Error("Invoice detail data is required");
    }

    const invoice: Invoice = await this.invoiceHelper.findOneByOrderId(
      kafkaElectronicInvoiceDetail.at(0).order_id
    );
    const isDisCountAll: boolean = invoice.total_amount_discount_amount > 0;
    // Check if invoice exists
    if (!invoice) {
      throw new Error(
        `Invoice not found for order_id: ${
          kafkaElectronicInvoiceDetail.at(0).order_id
        }`
      );
    }

    const isAppFood = InvoiceAppFood.APP_FOOD.includes(invoice.order_method);
    const processedDetails = [];
    let total_discount_amount = 0;
    let total_vat_amount = 0;

    // Process each order detail
    for (const orderDetail of kafkaElectronicInvoiceDetail) {
      if (isApplyRevertVatRestaurant) {
        // **LUỒNG 1: Restaurant Orders (đã được xử lý bởi calculateVatAmounts)**
        // Không tính toán lại VAT và discount vì đã được xử lý trong calculateVatAmounts
        // Chỉ cần tính discount_percent nếu có discount_amount
        if (isDisCountAll) {
          // Khi có giảm giá tổng bill: discount đã được set = 0 trong calculateVatAmounts
          // Không cần xử lý gì thêm, discount được áp dụng ở cấp độ invoice
          orderDetail.discount_percent = 0;
        } else {
          // Khi không có giảm giá tổng bill: có thể có discount từng món
          if (orderDetail.discount_amount > 0) {
            const totalItemAmount =
              orderDetail.total_amount_without_vat +
              orderDetail.discount_amount +
              orderDetail.vat_amount;
            orderDetail.discount_percent = Math.round(
              Math.abs((orderDetail.discount_amount * 100) / totalItemAmount)
            );
          }

          // **FIX: Phát hiện và xử lý giảm giá từng món cho Restaurant Orders**
          // Đồng bộ với logic trong consumer.ts
          const discountDifference =
            (orderDetail.total_amount_without_vat || 0) -
            (orderDetail.total_amount || 0);
          if (discountDifference > 0) {
            // Có giảm giá từng món: tính lại total_amount_without_vat từ total_amount
            const vatRate = (orderDetail.vat || 0) / 100;
            if (vatRate > 0) {
              orderDetail.total_amount_without_vat = Math.round(
                orderDetail.total_amount / (1 + vatRate)
              );
              orderDetail.vat_amount =
                orderDetail.total_amount - orderDetail.total_amount_without_vat;
              orderDetail.discount_amount = discountDifference;
              orderDetail.discount_percent = Math.round(
                Math.abs(
                  (orderDetail.discount_amount * 100) /
                    (orderDetail.total_amount_without_vat +
                      orderDetail.discount_amount)
                )
              );
            }
          }
        }
      } else {
        // **LUỒNG 2: App Food Orders (logic gốc)**
        const discountPercent = Utils.getDiscountPercentFood(
          invoice,
          orderDetail
        );
        // Apply discount if applicable
        if (discountPercent !== 0) {
          orderDetail.discount_amount =
            (orderDetail.quantity * orderDetail.price * discountPercent) / 100;
        }

        if (!isAppFood && orderDetail.discount_amount > 0) {
          orderDetail.discount_percent = Math.round(
            Math.abs(
              (orderDetail.discount_amount * 100) /
                orderDetail.total_amount_without_vat
            )
          );
        }

        // Additional discount logic for non-APP_FOOD orders
        if (
          !isAppFood &&
          orderDetail.total_amount_without_vat - orderDetail.total_amount > 0
        ) {
          orderDetail.discount_amount =
            orderDetail.total_amount_without_vat - orderDetail.total_amount;
          orderDetail.discount_percent = Math.round(
            Math.abs(
              (orderDetail.discount_amount * 100) /
                orderDetail.total_amount_without_vat
            )
          );

          // **FIX: Khi có giảm giá từng món, tính lại total_amount_without_vat từ total_amount**
          // Đồng bộ với logic trong consumer.ts: total_amount_without_vat = total_amount / (1 + vat_rate)
          const vatRate = (orderDetail.vat || 0) / 100;
          if (vatRate > 0) {
            orderDetail.total_amount_without_vat = Math.round(
              orderDetail.total_amount / (1 + vatRate)
            );
            orderDetail.vat_amount =
              orderDetail.total_amount - orderDetail.total_amount_without_vat;
            // Tính lại discount_amount dựa trên total_amount_without_vat mới
            orderDetail.discount_amount =
              orderDetail.quantity * orderDetail.price -
              orderDetail.total_amount_without_vat;
            if (orderDetail.discount_amount > 0) {
              orderDetail.discount_percent = Math.round(
                Math.abs(
                  (orderDetail.discount_amount * 100) /
                    (orderDetail.quantity * orderDetail.price)
                )
              );
            }
          }
        }
      }

      orderDetail.quantity = Number(orderDetail.quantity.toFixed(2));
      total_discount_amount += orderDetail.discount_amount;
      if (orderDetail.food_id != 0) {
        total_vat_amount += orderDetail.vat_amount;
      }
      processedDetails.push(new this.invoiceDetailModel(orderDetail));
    }
    // Tính tổng các cột từ invoice detail (loại bỏ is_gift = 1)
    const totalQuantity = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.quantity || 0), 0);
    const totalDiscountAmount = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.discount_amount || 0), 0);
    const totalAmountWithoutVat = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.total_amount_without_vat || 0), 0);
    const totalVatAmount = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.vat_amount || 0), 0);
    const totalAmount = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => {
        return sum + (detail.total_amount || 0);
      }, 0);
    const totalPrice = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.price || 0), 0);

    // Kiểm tra xem tất cả item có VAT khác 0 hay không
    const allItemsHaveVat = processedDetails
      .filter((detail) => detail.is_gift !== 1)
      .every((detail) => (detail.vat || 0) > 0);

    // Batch save for better performance
    await this.invoiceDetailModel.insertMany(processedDetails);
    // Invalidate invoice caches once at the end
    await this.invalidateInvoiceCaches(invoice.restaurant_id);

    await this.invoiceHelper.updateDiscountInvoice(
      invoice,
      {
        total_discount_amount: totalDiscountAmount,
        total_vat_amount: totalVatAmount,
      },
      isAppFood,
      {
        totalQuantity,
        totalDiscountAmount,
        totalAmountWithoutVat,
        totalVatAmount,
        totalAmount,
        totalPrice,
      },
      isDisCountAll,
      isApplyRevertVatRestaurant,
      allItemsHaveVat
    );
  }

  async findByIdAndUpdate(
    id: string,
    order_id: number
  ): Promise<InvoiceDetail> {
    return await this.invoiceDetailModel
      .findByIdAndUpdate(id, { order_id })
      .exec();
  }

  async findOneByOrderId(orderId: number): Promise<InvoiceDetail> {
    return await this.invoiceDetailModel
      .findOne({
        order_id: orderId,
      })
      .exec();
  }

  async findOneByOrderDetailId(orderDetailId: number): Promise<InvoiceDetail> {
    return await this.invoiceDetailModel
      .findOne({
        order_detail_id: orderDetailId,
      })
      .exec();
  }

  async findAllByOrderId(orderId: number): Promise<any[]> {
    // Generate cache key for this specific order
    const cacheKey = `invoice_details:order_${orderId}`;

    try {
      // Try to get from cache first
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    } catch (error) {
      this.logger.warn(`Cache read error for invoice details: ${error.message}`);
    }

    try {
      const invoiceDetails = await this.invoiceDetailModel
        .find(
          {
            order_id: orderId,
            status: 1,
          },
          {
            _id: 1,
            order_id: 1,
            invoice_id: 1,
            food_id: 1,
            food_name: 1,
            quantity: 1,
            price: 1,
            food_code: 1,
            vat: 1,
            food_unit_price: 1,
            vat_amount: 1,
            total_amount: 1,
            total_amount_without_vat: 1,
            food_unit: 1,
            discount_amount: 1,
            discount_percent: 1,
            is_gift: 1,
            status: 1,
            created_at: 1,
            updated_at: 1,
          }
        )
        .lean()
        .exec();

      // Cache the result for 3 minutes (shorter TTL since this is detail data)
      try {
        await this.setCachedData(cacheKey, invoiceDetails, 180);
      } catch (error) {
        this.logger.warn(`Cache write error for invoice details: ${error.message}`);
      }

      return invoiceDetails;
    } catch (error) {
      this.logger.error("Error fetching invoice details by order_id:", error);
      throw error;
    }
  }

  async findByInvoiceDetail(id: string): Promise<any> {
    return this.invoiceDetailModel.findById(id);
  }

  public async createInvoiceDetail(invoiceDetailDto: InvoiceDetailDto) {
    if (invoiceDetailDto.id === "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_ID_INPUT
        ),
        HttpStatus.OK
      );
    }

    let invoices = await this.invoiceHelper.findById(invoiceDetailDto.id);
    let invoiceDetail: InvoiceDetailCreateByDto = new InvoiceDetailCreateByDto(
      invoiceDetailDto,
      invoices,
      0
    );
    const [data] = await Promise.all([
      new this.invoiceDetailModel(invoiceDetail).save(),
    ]);

    // Invalidate invoice caches when detail is created
    await this.invalidateInvoiceCaches(invoices.restaurant_id);

    return data;
  }

  public async createMultiFood(
    invoiceCreateMultiDto: InvoiceCreateMultiDto
  ): Promise<InvoiceDetail[]> {
    return;

    const invoice = await this.validateInvoiceExists(invoiceCreateMultiDto.id);

    if (invoice.invoice_status !== 0) {
      await this.validatePartnerAndInvoiceStatus(invoice);
    }
    const partnerConfig =
      await this.restaurantPartnerInvoiceService.findOneByBranchId(
        invoice.branch_id
      );

    if (partnerConfig.apply_discount !== null) {
      if (partnerConfig.apply_discount === 1) {
        return this.invoiceDetailModel.find({ order_id: invoice.order_id });
      }
    }

    const filteredFoods = await this.filterExistingFoods(
      invoice.order_id.toString(),
      invoiceCreateMultiDto.foods
    );

    if (filteredFoods.length === 0) {
      return this.invoiceDetailModel.find({ order_id: invoice.order_id });
    }

    const foodDto = await this.getFoodData(invoice, filteredFoods);
    const invoiceDetailCreateMulti = new InvoiceDetaiLCreateMulti().mapToList(
      filteredFoods,
      foodDto,
      invoice
    );

    if (invoiceDetailCreateMulti.length > 0) {
      await this.createAndUpdateInvoiceDetails(
        invoiceDetailCreateMulti,
        invoice
      );
      //      await this.recalculateInvoiceTotals(invoice);
      await this.invalidateInvoiceCaches(invoice.restaurant_id);
    }

    return this.invoiceDetailModel.find({ order_id: invoice.order_id });
  }

  private async validateInvoiceExists(invoiceId: string) {
    const invoice = await this.invoiceHelper.findById(invoiceId);

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVOICE_NOT_EXIST_ID(invoiceId)
        ),
        HttpStatus.OK
      );
    }

    return invoice;
  }

  private async validatePartnerAndInvoiceStatus(invoice: any): Promise<void> {
    const restaurantPartnerInvoiceEntity = await this.getPartnerEntity(invoice);
    const loginOauthDTO = new LoginOauthDTO(restaurantPartnerInvoiceEntity);

    await this.validateInvoiceWithPartner(
      loginOauthDTO,
      invoice,
      restaurantPartnerInvoiceEntity
    );
  }

  private async getPartnerEntity(invoice: any) {
    const restaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceService.findOneByRestaurantAndRestaurantBrandAndBranchId(
        invoice.restaurant_id,
        invoice.restaurant_brand_id,
        invoice.branch_id,
        invoice.partner_type
      );

    if (
      !restaurantPartnerInvoiceEntity ||
      restaurantPartnerInvoiceEntity.status === 0
    ) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.PARTNER_WAS_TURN_OFF
        ),
        HttpStatus.OK
      );
    }

    return restaurantPartnerInvoiceEntity;
  }

  private async validateInvoiceWithPartner(
    loginOauthDTO: LoginOauthDTO,
    invoice: any,
    restaurantPartnerInvoiceEntity: any
  ): Promise<void> {
    const partnerType = loginOauthDTO.partnerElectronicInvoiceType;

    let loginToPartner:
      | { token: string; partner_electronic_invoice_type: number }
      | any;

    if (
      partnerType === PartnerElectronicInvoiceTypeEnum.M_INVOICE ||
      partnerType === PartnerElectronicInvoiceTypeEnum.FPT
    ) {
      loginToPartner = await this.oauthService.login(loginOauthDTO);
    }

    switch (partnerType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
      case PartnerElectronicInvoiceTypeEnum.FPT:
        await ThirdPartyServiceAdapter.getDetail(
          {
            token: loginToPartner.token,
            invoice: invoice,
            restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
          },
          "",
          partnerType
        );
        break;

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        const data = await ThirdPartyServiceAdapter.getDetail(
          {
            getFKeyMiFiDto: new GetDetailInvoiceMifiDto(
              restaurantPartnerInvoiceEntity,
              invoice
            ),
            restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
          },
          "",
          PartnerElectronicInvoiceTypeEnum.MIFI
        );

        if (data.ma_thong_diep !== "") {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.INVOICE_HAS_SEND_TO_TAX_AUTHORITIES
            ),
            HttpStatus.OK
          );
        }
        break;

      default:
        break;
    }
  }

  private async filterExistingFoods(
    orderId: string,
    foods: any[]
  ): Promise<any[]> {
    const invoiceDetail = await this.invoiceDetailModel.find({
      order_id: orderId,
      status: 1,
    });

    if (invoiceDetail.length === 0) {
      return foods;
    }

    const existingFoodIds = new Set(invoiceDetail.map((x) => x.food_id));
    return foods.filter((food) => !existingFoodIds.has(food.food_id));
  }

  private async getFoodData(invoice: any, foods: any[]) {
    const foodIds = foods.map((food) => food.food_id);
    const foodData = await this.foodService.spGFoodByIds(
      invoice.restaurant_id,
      invoice.restaurant_brand_id,
      foodIds
    );

    return new FoodDto().mapToList(foodData);
  }

  private async createAndUpdateInvoiceDetails(
    invoiceDetailCreateMulti: any[],
    invoice: any
  ): Promise<void> {
    const insertedInvoiceDetails = await this.invoiceDetailModel.insertMany(
      invoiceDetailCreateMulti
    );

    // Prepare bulk operations for better performance
    const bulkOps = insertedInvoiceDetails.map((detail) => {
      const discountPercent = Utils.getDiscountPercentFood(invoice, detail);
      const updateData = this.calculateInvoiceDetailAmounts(
        detail,
        invoice,
        discountPercent
      );

      return {
        updateOne: {
          filter: { _id: detail._id },
          update: updateData,
        },
      };
    });

    // Execute bulk update for better performance
    if (bulkOps.length > 0) {
      await this.invoiceDetailModel.bulkWrite(bulkOps);
    }
  }

  private calculateInvoiceDetailAmounts(
    detail: any,
    invoice: any,
    discountPercent: number
  ) {
    const baseAmount = detail.quantity * detail.price;
    const discountAmount =
      discountPercent > 0 ? (baseAmount * discountPercent) / 100 : 0;
    const amountAfterDiscount = baseAmount - discountAmount;

    // Skip VAT calculation if VAT rate is 0
    let vatAmount: number;
    let totalAmount: number;

    if (detail.vat === 0) {
      vatAmount = 0;
      totalAmount = amountAfterDiscount;
    } else {
      vatAmount = (amountAfterDiscount * detail.vat) / 100;
      totalAmount = amountAfterDiscount + vatAmount;
    }

    return {
      order_id: invoice.order_id,
      food_name: detail.food_name,
      quantity: detail.quantity,
      price: detail.price,
      vat: detail.vat,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      total_amount_without_vat: baseAmount,
      food_unit: detail.food_unit,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
    };
  }

  async updateMultiFoodInInvoice(
    invoiceDetailUpdateBase: InvoiceDetailUpdateBase
  ): Promise<any> {
    if (invoiceDetailUpdateBase.foods.length === 0) {
      return;
    }

    // Input validation
    this.validateUpdateInput(invoiceDetailUpdateBase);

    const invoice = await this.invoiceHelper.findById(
      invoiceDetailUpdateBase.invoice_id
    );
    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.ID_NOT_EXIST(
            invoiceDetailUpdateBase.invoice_id
          )
        ),
        HttpStatus.OK
      );
    }

    const partnerConfig =
      await this.restaurantPartnerInvoiceService.findOneByBranchId(
        invoice.branch_id
      );

    if (partnerConfig.apply_discount !== null) {
      if (partnerConfig.apply_discount === 1) {
        return this.invoiceDetailModel.find({ order_id: invoice.order_id });
      }
    }

    // Validate invoice status
    this.validateInvoiceStatus(invoice);

    // Get partner and login info
    const { restaurantPartnerInvoiceEntity, loginOauthDTO, loginToPartNer } =
      await this.getPartnerAndLoginInfo(invoice);

    // Validate partner status with third party
    await this.validatePartnerStatus(
      loginOauthDTO,
      loginToPartNer,
      invoice,
      restaurantPartnerInvoiceEntity
    );

    // Update invoice details in batch
    await this.updateInvoiceDetailsBatch(invoiceDetailUpdateBase, invoice);

    // Recalculate invoice totals
    //  await this.recalculateInvoiceTotals(invoice);

    // Prepare complete food list for partner update
    const completeFoodList = await this.prepareCompleteFoodList(
      invoiceDetailUpdateBase,
      invoice
    );

    // Update with partner service
    await this.updateWithPartnerService(
      loginOauthDTO.partnerElectronicInvoiceType,
      completeFoodList,
      invoice,
      restaurantPartnerInvoiceEntity,
      loginToPartNer,
      invoiceDetailUpdateBase.invoice_id
    );

    // Invalidate invoice caches when details are updated
    await this.invalidateInvoiceCaches(invoice.restaurant_id);
  }

  private validateUpdateInput(
    invoiceDetailUpdateBase: InvoiceDetailUpdateBase
  ): void {
    if (invoiceDetailUpdateBase.invoice_id === "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_INPUT_ID
        ),
        HttpStatus.OK
      );
    }
    if (invoiceDetailUpdateBase.foods.length === 0) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVOICE_DETAIL_NOT_EMPTY
        ),
        HttpStatus.OK
      );
    }
  }

  private validateInvoiceStatus(invoice: any): void {
    switch (invoice.invoice_status) {
      case 0:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            InvoiceHandlerException.INVOICE_CAN_NOT_UPDATE
          ),
          HttpStatus.OK
        );
      case 2:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            InvoiceHandlerException.INVOICE_HAS_BEEN_UPDATED
          ),
          HttpStatus.OK
        );
    }
  }

  private async getPartnerAndLoginInfo(invoice: any) {
    const restaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceService.findOneByRestaurantAndRestaurantBrandAndBranchId(
        invoice.restaurant_id,
        invoice.restaurant_brand_id,
        invoice.branch_id,
        invoice.partner_type
      );

    if (
      !restaurantPartnerInvoiceEntity ||
      restaurantPartnerInvoiceEntity.status === 0
    ) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.PARTNER_WAS_TURN_OFF
        ),
        HttpStatus.OK
      );
    }

    const loginOauthDTO = new LoginOauthDTO(restaurantPartnerInvoiceEntity);
    let loginToPartNer: any = null;

    // Login only for required partner types
    const requiresLogin = [
      PartnerElectronicInvoiceTypeEnum.M_INVOICE,
      PartnerElectronicInvoiceTypeEnum.FPT,
      PartnerElectronicInvoiceTypeEnum.MISA,
    ].includes(loginOauthDTO.partnerElectronicInvoiceType);

    if (requiresLogin) {
      loginToPartNer = await this.oauthService.login(loginOauthDTO);
    }

    return { restaurantPartnerInvoiceEntity, loginOauthDTO, loginToPartNer };
  }

  private async validatePartnerStatus(
    loginOauthDTO: LoginOauthDTO,
    loginToPartNer: any,
    invoice: any,
    restaurantPartnerInvoiceEntity: any
  ): Promise<void> {
    const partnerType = loginOauthDTO.partnerElectronicInvoiceType;
    const commonParams = {
      invoice,
      restaurantPartnerInvoiceEntity,
    };

    switch (partnerType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
      case PartnerElectronicInvoiceTypeEnum.FPT:
        await ThirdPartyServiceAdapter.getDetail(
          { ...commonParams, token: loginToPartNer.token },
          "",
          partnerType
        );
        break;

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        const mifiData = await ThirdPartyServiceAdapter.getDetail(
          {
            ...commonParams,
            getDetailInvoiceMifiDto: new GetDetailInvoiceMifiDto(
              restaurantPartnerInvoiceEntity,
              invoice
            ),
          },
          "",
          partnerType
        );
        if (mifiData.ma_thong_diep !== "") {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.INVOICE_HAS_SEND_TO_TAX_AUTHORITIES
            ),
            HttpStatus.OK
          );
        }
        break;

      case PartnerElectronicInvoiceTypeEnum.MISA:
        const misaData = await ThirdPartyServiceAdapter.getDetail(
          { ...commonParams, loginToPartNer },
          "",
          partnerType
        );
        if (
          misaData.length > 0 &&
          (!Number.isNaN(+misaData[0].InvNo) || misaData[0].InvoiceCode != null)
        ) {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.INVOICE_HAS_SEND_TO_TAX_AUTHORITIES
            ),
            HttpStatus.OK
          );
        }
        break;
    }
  }

  private async updateInvoiceDetailsBatch(
    invoiceDetailUpdateBase: InvoiceDetailUpdateBase,
    invoice: any
  ): Promise<void> {
    // Validate all invoice detail IDs first
    invoiceDetailUpdateBase.foods.forEach((food, index) => {
      if (food.invoice_detail_id === "") {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            `Bạn cần truyền id của chi tiết Hóa đơn tại vị trí thứ ${index} để biết cập nhật cho phần chi tiết nào!`
          ),
          HttpStatus.OK
        );
      }
    });

    // Batch fetch all invoice details and discount percentages
    const invoiceDetailIds = invoiceDetailUpdateBase.foods.map(
      (f) => f.invoice_detail_id
    );
    const invoiceDetails = await Promise.all(
      invoiceDetailIds.map((id) => this.invoiceDetailModel.findById(id))
    );

    const discountPercentages = invoiceDetails.map((detail) =>
      Utils.getDiscountPercentFood(invoice, detail)
    );

    // Batch update all invoice details
    const updatePromises = invoiceDetailUpdateBase.foods.map(
      async (food, index) => {
        const discountPercent = discountPercentages[index];
        const invoiceDetail = invoiceDetails[index];
        const baseAmount = food.quantity * food.price;

        let updateData: any;

        if (discountPercent === 0) {
          const vatAmount = (food.vat * baseAmount) / 100;
          updateData = {
            order_id: invoice.order_id,
            food_name: food.food_name,
            quantity: food.quantity,
            price: food.price,
            vat: food.vat,
            vat_amount: vatAmount,
            total_amount: baseAmount + vatAmount,
            total_amount_without_vat: baseAmount,
            food_unit: food.food_unit,
            discount_amount: 0,
            discount_percent: 0,
          };
        } else {
          const discountAmount = (baseAmount * discountPercent) / 100;
          const amountAfterDiscount = baseAmount - discountAmount;
          const vatAmount = (food.vat * amountAfterDiscount) / 100;

          updateData = {
            order_id: invoice.order_id,
            food_name: food.food_name,
            quantity: food.quantity,
            price: food.price,
            vat: food.vat,
            vat_amount: vatAmount,
            total_amount: amountAfterDiscount + vatAmount,
            total_amount_without_vat: baseAmount,
            food_unit: food.food_unit,
            discount_amount: discountAmount,
            discount_percent: discountPercent,
          };
        }

        return this.invoiceDetailModel.updateOne(
          { _id: invoiceDetail._id },
          updateData
        );
      }
    );

    await Promise.all(updatePromises);
  }

  private async recalculateInvoiceTotals(invoice: any): Promise<void> {
    const invoiceDetailModelMap = await this.invoiceDetailModel.find({
      order_id: invoice.order_id,
      status: 1,
      food_id: { $nin: [-1] },
    });

    const calculate = new Calculate(this.invoiceHelper);

    if (InvoiceAppFood.APP_FOOD.includes(invoice.order_method)) {
      const invoiceDetail: InvoiceDetailDocument[] =
        await this.invoiceDetailModel.find({
          order_id: invoice.order_id,
          status: 1,
        });
      const updatedInvoiceDetails = invoiceDetail.filter(
        (x: InvoiceDetail): boolean => x.is_gift !== 1
      );

      if (updatedInvoiceDetails.length > 0 && updatedInvoiceDetails[0].vat) {
        calculate.calculateVatAmountsForAppFood(
          invoice,
          updatedInvoiceDetails,
          updatedInvoiceDetails[0].vat
        );

        // Save the updated invoice details with precise VAT calculations
        for (const detail of updatedInvoiceDetails) {
          await this.invoiceDetailModel.updateOne(
            { _id: detail._id },
            {
              vat_amount: detail.vat_amount,
              total_amount_without_vat: detail.total_amount_without_vat,
              total_amount: detail.total_amount,
              price: detail.price,
            }
          );
        }

        await this.invoiceHelper.findByIdAndUpdateDiscount(
          invoice._id,
          invoice
        );
      }
    } else {
      await calculate.calculateAndUpdate(
        invoiceDetailModelMap.filter((x) => x.is_gift !== 1),
        invoice
      );
    }
  }

  private async prepareCompleteFoodList(
    invoiceDetailUpdateBase: InvoiceDetailUpdateBase,
    invoice: any
  ): Promise<any[]> {
    // Get all invoice details for the order
    const allInvoiceDetails = await this.invoiceDetailModel.find({
      order_id: invoice.order_id,
      status: 1,
    });

    const invoiceDetailElastic =
      InvoiceDetailElasticImport.mapToList(allInvoiceDetails);
    const invoiceDetailMap = InvoiceDetailMap.mapToList(invoiceDetailElastic);

    // Get IDs that are being updated
    const updatedIds = new Set(
      invoiceDetailUpdateBase.foods.map((f) => f.invoice_detail_id)
    );

    // Add details that weren't updated to the foods list
    const missingDetails = invoiceDetailMap.filter(
      (detail) => !updatedIds.has(detail.invoice_detail_id)
    );

    return [...invoiceDetailUpdateBase.foods, ...missingDetails];
  }

  private async updateWithPartnerService(
    partnerType: number,
    foods: any[],
    invoice: any,
    restaurantPartnerInvoiceEntity: any,
    loginToPartNer: any,
    invoiceId: string
  ): Promise<void> {
    switch (partnerType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        await this.updateMInvoicePartner(
          foods,
          invoice,
          restaurantPartnerInvoiceEntity,
          loginToPartNer,
          invoiceId
        );
        break;

      case PartnerElectronicInvoiceTypeEnum.FPT:
        await this.updateFPTPartner(
          invoice,
          restaurantPartnerInvoiceEntity,
          loginToPartNer,
          invoiceId
        );
        break;

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        await this.updateMIFIPartner(invoice, restaurantPartnerInvoiceEntity);
        break;

      case PartnerElectronicInvoiceTypeEnum.VNPT:
        await this.updateVNPTPartner(invoice, restaurantPartnerInvoiceEntity);
        break;

      case PartnerElectronicInvoiceTypeEnum.MISA:
        await this.updateMISAPartner(
          invoice,
          restaurantPartnerInvoiceEntity,
          loginToPartNer
        );
        break;
    }
  }

  private async updateMInvoicePartner(
    foods: any[],
    invoice: any,
    restaurantPartnerInvoiceEntity: any,
    loginToPartNer: any,
    invoiceId: string
  ): Promise<void> {
    // Validate VAT for M_INVOICE
    for (const food of foods) {
      if (+food.vat > 10) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            InvoiceHandlerException.FOOD_VAT_NOT_GREATER_THAN_TEN_PERCENT
          ),
          HttpStatus.OK
        );
      }
      if (![0, 3, 5, 8, 10].includes(+food.vat)) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            InvoiceHandlerException.FOOD_VAT_MUST_BE_IN_VALUE
          ),
          HttpStatus.OK
        );
      }
    }

    const invoiceDetailUpdatePartNer = InvoiceDetailUpdatePartNer.mapToList(
      foods,
      invoice
    );

    await ThirdPartyServiceAdapter.update(
      {
        invoiceId,
        token: loginToPartNer.token,
        invoiceUpdatePartNer: new InvoiceConvertPartnerUpdateMInvoiceDTO(
          invoice,
          invoiceDetailUpdatePartNer
        ),
        invoice,
        restaurantPartnerInvoiceEntity,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.M_INVOICE
    );
  }

  private async updateFPTPartner(
    invoice: any,
    restaurantPartnerInvoiceEntity: any,
    loginToPartNer: any,
    invoiceId: string
  ): Promise<void> {
    const invoiceDetails = await this.invoiceDetailModel.find({
      order_id: invoice.order_id,
      status: 1,
    });

    const calculate = new Calculate(this.invoiceHelper);
    await calculate.calculate(
      invoiceDetails.filter((x) => x.is_gift !== 1),
      invoice
    );
    const calculationResults = calculate.getCalculationResults();

    const isSpecialDiscount =
      invoice.discount_type === DiscountType.FOOD ||
      invoice.discount_type === DiscountType.DRINK;

    const updateParams = {
      token: loginToPartNer.token,
      invoiceFormUpdateInvoicePartNerFpt:
        new InvoiceFormUpdateInvoicePartNerFpt(
          new InvoiceConvertUpdatePartNerFptDto(
            restaurantPartnerInvoiceEntity,
            invoice,
            invoiceDetails,
            calculationResults.amount,
            isSpecialDiscount
              ? calculationResults.amount -
                calculationResults.discount_amount +
                calculationResults.vat_amount +
                invoice.total_amount_extra_charge_amount +
                invoice.extra_charge_amount
              : calculationResults.total_amount +
                invoice.total_amount_extra_charge_amount +
                invoice.extra_charge_amount,
            isSpecialDiscount
              ? calculationResults.amount
              : calculationResults.vat_amount
          )
        ),
      invoice,
      restaurantPartnerInvoiceEntity,
      invoiceId,
    };

    await ThirdPartyServiceAdapter.update(
      updateParams,
      "",
      PartnerElectronicInvoiceTypeEnum.FPT
    );
  }

  private async updateMIFIPartner(
    invoice: any,
    restaurantPartnerInvoiceEntity: any
  ): Promise<void> {
    const [invoiceDetails, invoiceAfter, fKeyResult] = await Promise.all([
      this.invoiceDetailModel.find({ order_id: invoice.order_id, status: 1 }),
      this.invoiceHelper.findById(invoice._id),
      ThirdPartyServiceAdapter.getFkey({
        getFKeyMiFiDto: new GetFKeyMiFiDto(restaurantPartnerInvoiceEntity),
        restaurantPartnerInvoiceEntity,
      }),
    ]);

    let invoiceTypeUpdate: number;
    if (invoice.total_amount < invoiceAfter.total_amount) {
      invoiceTypeUpdate = 2;
    } else if (invoice.total_amount > invoiceAfter.total_amount) {
      invoiceTypeUpdate = 3;
    } else {
      invoiceTypeUpdate = 4;
    }

    await ThirdPartyServiceAdapter.update(
      {
        invoice,
        invoiceUpdateConverPartNerMiFiDto:
          new InvoiceUpdateConVerPartNerMiFiDto(
            restaurantPartnerInvoiceEntity,
            invoiceDetails,
            invoiceAfter,
            invoiceTypeUpdate,
            fKeyResult.fkey
          ),
        restaurantPartnerInvoiceEntity,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.MIFI
    );
  }

  private async updateVNPTPartner(
    invoice: any,
    restaurantPartnerInvoiceEntity: any
  ): Promise<void> {
    const invoiceDetails = await this.invoiceDetailModel.find({
      order_id: invoice.order_id,
      status: 1,
    });

    const calculate = new Calculate(this.invoiceHelper);
    await calculate.calculate(
      invoiceDetails.filter((x) => x.is_gift !== 1),
      invoice
    );
    const calculationResults = calculate.getCalculationResults();

    const isSpecialDiscount =
      invoice.discount_type === DiscountType.FOOD ||
      invoice.discount_type === DiscountType.DRINK;

    const updateParams = {
      restaurantPartnerInvoiceEntity,
      invoiceDetail: invoiceDetails,
      invoice,
      amount: calculationResults.amount,
      totalAmount: isSpecialDiscount
        ? calculationResults.amount -
          calculationResults.discount_amount +
          calculationResults.vat_amount +
          invoice.total_amount_extra_charge_amount +
          invoice.extra_charge_amount
        : calculationResults.total_amount +
          invoice.total_amount_extra_charge_amount +
          invoice.extra_charge_amount,
      vatAmount: isSpecialDiscount
        ? calculationResults.amount
        : calculationResults.vat_amount,
    };

    await ThirdPartyServiceAdapter.update(
      updateParams,
      "",
      PartnerElectronicInvoiceTypeEnum.VNPT
    );
  }

  private async updateMISAPartner(
    invoice: any,
    restaurantPartnerInvoiceEntity: any,
    loginToPartNer: any
  ): Promise<void> {
    await ThirdPartyServiceAdapter.update(
      { loginToPartNer, invoice, restaurantPartnerInvoiceEntity },
      "",
      PartnerElectronicInvoiceTypeEnum.MISA
    );
  }

  async getListInvoiceDetailByInvoiceId(invoice_id: string): Promise<any> {
    let invoice: Invoice = await this.invoiceHelper.findById(invoice_id);

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.ID_NOT_EXIST(invoice._id)
        ),
        HttpStatus.OK
      );
    }

    let result = await this.invoiceDetailModel.find({
      order_id: invoice.order_id,
      status: 1,
    });

    const list: InvoiceDetailResponse[] = InvoiceDetailResponse.mapToList(
      result
    ).filter((x) => x.food_id !== -1);
    const totalRecord = result.length;

    return { list, totalRecord };
  }

  async updateMultiFoodInInvoiceInDashBoard(
    invoiceDetailUpdateBase: InvoiceDetailUpdateBase
  ): Promise<any> {
    if (invoiceDetailUpdateBase.invoice_id == "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_INPUT_ID
        ),
        HttpStatus.OK
      );
    }

    if (invoiceDetailUpdateBase.foods.length === 0) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVOICE_DETAIL_NOT_EMPTY
        ),
        HttpStatus.OK
      );
    }
    const invoice: Invoice = await this.invoiceHelper.findById(
      invoiceDetailUpdateBase.invoice_id
    );

    // Lấy restaurant brand để tính restaurant invoice VAT
    const restaurantBrand: RestaurantBrandEntity =
      await this.restaurantBrandService.findById(invoice.restaurant_brand_id);
    const restaurantInvoiceVat: number =
      this.calculateRestaurantInvoiceVat(restaurantBrand);
    const isApplyRevertVatRestaurant: boolean =
      this.shouldApplyRevertVatRestaurant(
        restaurantInvoiceVat,
        invoice.order_method.toString()
      );

    let index = 0;

    let hasChanges = false;

    // @ts-ignore
    for (const e of invoiceDetailUpdateBase.foods) {
      if (e.invoice_detail_id == "") {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            `Bạn cần truyền id của chi tiết Hóa đơn tại vị trí thứ ${index} để biết cập nhật cho phần chi tiết nào!`
          ),
          HttpStatus.OK
        );
      }

      const discountPercent: number = Utils.getDiscountPercentFood(
        invoice,
        await this.invoiceDetailModel.findById(e.invoice_detail_id)
      );

      let invoiceDetail: InvoiceDetail = await this.invoiceDetailModel.findById(
        e.invoice_detail_id
      );

      // Kiểm tra xem dữ liệu có thay đổi không (với type conversion)
      const isDataChanged =
        Number(invoiceDetail.quantity) !== Number(e.quantity) ||
        Number(invoiceDetail.price) !== Number(e.price) ||
        Number(invoiceDetail.vat) !== Number(e.vat) ||
        String(invoiceDetail.food_unit).trim() !== String(e.food_unit).trim();

      // Chỉ update nếu có thay đổi dữ liệu
      if (isDataChanged && discountPercent === 0) {
        // Lưu giá trị gốc của price để đảm bảo tính nhất quán với logic consumer.ts
        const originalPrice = Number(e.price);

        let updateData: any = {
          order_id: invoice.order_id,
          food_name: e.food_name,
          quantity: Number(e.quantity),
          price: originalPrice, // Giữ nguyên giá gốc
          vat: Number(e.vat),
          food_unit: e.food_unit,
          discount_amount: 0,
          discount_percent: 0,
        };

        if (isApplyRevertVatRestaurant) {
          // **LUỒNG 1: Restaurant Orders - đồng bộ với logic consumer.ts**
          // Tính toán dựa trên price gốc, sau đó cập nhật food_unit_price
          const baseAmount = Number(e.quantity) * originalPrice;
          updateData.total_amount_without_vat = Math.round(baseAmount);
          updateData.vat_amount = Math.round(
            (Number(e.vat) * baseAmount) / 100
          );
          updateData.total_amount = Math.round(
            baseAmount + updateData.vat_amount
          );

          // **FIX: Đảm bảo price = food_unit_price = total_amount_without_vat khi không có discount**
          // Đồng bộ với logic consumer.ts: price và food_unit_price được tính từ total_amount_without_vat
          updateData.price =
            Number(e.quantity) > 0
              ? Math.round(
                  updateData.total_amount_without_vat / Number(e.quantity)
                )
              : 0;
          updateData.food_unit_price = updateData.price;
        } else {
          // **LUỒNG 2: App Food Orders - đồng bộ với logic consumer.ts**
          const baseAmount = Number(e.quantity) * originalPrice;
          updateData.vat_amount = Math.round(
            (Number(e.vat) * baseAmount) / 100
          );
          updateData.total_amount = Math.round(
            baseAmount + updateData.vat_amount
          );
          updateData.total_amount_without_vat = Math.round(baseAmount);

          // **FIX: Đảm bảo price = food_unit_price = total_amount_without_vat khi không có discount**
          // Đồng bộ với logic consumer.ts: price và food_unit_price được tính từ total_amount_without_vat
          updateData.price =
            Number(e.quantity) > 0
              ? Math.round(
                  updateData.total_amount_without_vat / Number(e.quantity)
                )
              : 0;
          updateData.food_unit_price = updateData.price;
        }

        await this.invoiceDetailModel.updateOne(invoiceDetail, updateData);
        hasChanges = true;
      } else if (discountPercent > 0) {
        break;
      }
      index++;
    }

    // Chỉ query lại dữ liệu nếu có thay đổi để tối ưu performance
    let invoiceDetailModelMap: InvoiceDetailModelMap[];
    if (hasChanges) {
      // Đảm bảo tất cả write operations đã hoàn tất trước khi read
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay for DB consistency

      invoiceDetailModelMap = await this.invoiceDetailModel.find({
        order_id: invoice.order_id,
        status: 1,
      });

      this.logger.debug(
        `Re-queried data after update - Found ${invoiceDetailModelMap.length} records`
      );
    } else {
      // Sử dụng dữ liệu hiện tại nếu không có thay đổi
      invoiceDetailModelMap = await this.invoiceDetailModel.find({
        order_id: invoice.order_id,
        status: 1,
      });

      this.logger.debug(
        `Using current data - Found ${invoiceDetailModelMap.length} records`
      );
    }
    const isDisCountAll: boolean = invoice.total_amount_discount_amount > 0;

    // Tính tổng các cột từ invoice detail (loại bỏ is_gift = 1)
    const totalQuantity = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.quantity || 0), 0);
    const totalDiscountAmount = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.discount_amount || 0), 0);
    const totalAmountWithoutVat = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.total_amount_without_vat || 0), 0);
    const totalVatAmount = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.vat_amount || 0), 0);
    const totalAmount = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => {
        if (detail.food_id === 0) {
          return sum + (detail.total_amount_without_vat || 0);
        }
        return sum + (detail.total_amount || 0);
      }, 0);
    const totalPrice = invoiceDetailModelMap
      .filter((detail) => detail.is_gift !== 1)
      .reduce((sum, detail) => sum + (detail.price || 0), 0);

    let calculate: Calculate = new Calculate(this.invoiceHelper);

    if (totalVatAmount > 0 && hasChanges) {
      invoice.vat_amount = totalAmount;
    }

    if (InvoiceAppFood.APP_FOOD.includes(invoice.order_method)) {
      const invoiceDetail: InvoiceDetailDocument[] =
        await this.invoiceDetailModel.find({
          order_id: invoice.order_id,
          status: 1,
        });
      const updatedInvoiceDetails = invoiceDetail.filter(
        (x: InvoiceDetail): boolean => x.is_gift !== 1
      );

      if (updatedInvoiceDetails.length > 0 && updatedInvoiceDetails[0].vat) {
        calculate.calculateVatAmountsForAppFood(
          invoice,
          updatedInvoiceDetails,
          updatedInvoiceDetails[0].vat
        );

        // Save the updated invoice details with precise VAT calculations
        for (const detail of updatedInvoiceDetails) {
          await this.invoiceDetailModel.updateOne(
            { _id: detail._id },
            {
              vat_amount: detail.vat_amount,
              total_amount_without_vat: detail.total_amount_without_vat,
              total_amount: detail.total_amount,
              price: detail.price,
            }
          );
        }

        await this.invoiceHelper.findByIdAndUpdateDiscount(
          invoice._id,
          invoice
        );
      }
    } else {
      // Sử dụng logic updateDiscountInvoice để đồng bộ với createInvoiceDetailByKafka
      const isAppFood = InvoiceAppFood.APP_FOOD.includes(invoice.order_method);

      // Kiểm tra xem tất cả item có VAT khác 0 hay không
      const allItemsHaveVat = invoiceDetailModelMap
        .filter((detail) => detail.is_gift !== 1)
        .every((detail) => (detail.vat || 0) > 0);

      await this.invoiceHelper.updateDiscountInvoice(
        invoice,
        {
          total_discount_amount: totalDiscountAmount,
          total_vat_amount: totalVatAmount,
        },
        isAppFood,
        {
          totalQuantity,
          totalDiscountAmount,
          totalAmountWithoutVat,
          totalVatAmount,
          totalAmount,
          totalPrice,
        },
        isDisCountAll,
        isApplyRevertVatRestaurant,
        allItemsHaveVat
      );
    }

    // Invalidate invoice caches only when there are actual changes
    await this.invalidateInvoiceCaches(invoice.restaurant_id);

    let arrInvoiceDetailId: string[] = [];

    invoiceDetailUpdateBase.foods.forEach((e) => {
      return arrInvoiceDetailId.push(e.invoice_detail_id);
    });

    return this.invoiceDetailModel.find({
      _id: { $in: arrInvoiceDetailId },
    });
  }

  async changeStatusDetailInvoice(id: string): Promise<void> {
    const invoiceDetail: InvoiceDetail = await this.invoiceDetailModel.findById(
      new mongoose.Types.ObjectId(id)
    );

    const invoice: Invoice = await this.invoiceHelper.findOneByOrderId(
      invoiceDetail.order_id
    );

    if (invoiceDetail.status === 0) {
      await this.invoiceDetailModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(id),
        {
          status: 1,
        }
      );
    } else {
      await this.invoiceDetailModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(id),
        {
          status: 0,
        }
      );

      let invoiceDetailModelMap: InvoiceDetailModelMap[] =
        await this.invoiceDetailModel.find({
          order_id: invoice.order_id,
          status: 1,
        });

      let calculate: Calculate = new Calculate(this.invoiceHelper);

      await calculate.calculateAndUpdate(
        invoiceDetailModelMap.filter((x) => x.is_gift !== 1),
        invoice
      );
      await this.invoiceDetailModel.findByIdAndDelete(
        new mongoose.Types.ObjectId(id)
      );
    }

    // Invalidate invoice caches when detail status changes
    await this.invalidateInvoiceCaches(invoice.restaurant_id);
  }

  /**
   * Invalidate cache by pattern
   * @param pattern Cache key pattern
   */
  private async invalidateCache(pattern: string): Promise<void> {
    await this.cacheService.invalidateCache(pattern);
  }

  /**
   * Invalidate all invoice-related caches for a specific restaurant
   * @param restaurant_id Restaurant ID to invalidate caches for
   */
  private async invalidateInvoiceCaches(restaurant_id: number): Promise<void> {
    await this.cacheService.invalidateInvoiceCaches(restaurant_id);
  }

  /**
   * Get cached data by key
   * @param key Cache key
   * @returns Cached data or null
   */
  private async getCachedData(key: string): Promise<any> {
    return await this.cacheService.getCachedData(key);
  }

  /**
   * Set cached data with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   */
  private async setCachedData(
    key: string,
    data: any,
    ttl: number
  ): Promise<void> {
    await this.cacheService.setCachedData(key, data, ttl);
  }
}
