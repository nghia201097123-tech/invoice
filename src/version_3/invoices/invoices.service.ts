import { HttpService } from "@nestjs/axios";
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { KafkaElectricInvoice } from "src/kafka/kafka.entity/kafka-employee.entity";
import { LoginOauthDTO } from "src/common/dto/login.oauth.dto";
import { OauthService } from "src/oauth/oauth.service";
import { BranchService } from "src/restaurant-service/branches/branch.service";
import { Employee } from "src/common/entities/employee.entity";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import {
  InvoiceCancelFPT,
  InvoiceConvertPartnerCancelFptInvoiceDTO,
} from "../../partner/invoice-fpt/fpt-invoice/dto/cancel.dto";
import { InvoiceConvertPartnerMInvoiceDTO } from "../../partner/invoice-minvoice/dto/export.dto";
import { InvoiceConvertPartnerHiloDTO } from "../../partner/invoice-hilo/dto/export.dto";
import { InvoiceConvertPartnerViettelDTO } from "../../partner/invoice-viettel/dto/export.dto";
import { ViettelInvoiceCancelDto } from "../../partner/invoice-viettel/dto/cancel.dto";
import { InvoiceCancelConvertPartnerMifiDto } from "../../partner/invoice-mifi/dto/cancel.dto";
import { InvoiceUpdateDto } from "../../common/dto/invoice-update.dto";
import { GetFKeyMiFiDto } from "../../partner/invoice-mifi/dto/get_fkey.dto";
import { CancelInvoiceDto } from "../../common/dto/invoice.cancel.dto";
import { InvoiceDetailParamDTO } from "../../common/dto/invoice.detail.dto";
import { ExportInvoiceDTO } from "../../common/dto/invoice.export.dto";
import { InvoiceCreateBySidFpt } from "../../partner/invoice-fpt/fpt-invoice/dto/create_by_sid.dto";
import { InvoiceResponse } from "../../common/responses/invoice.response.Minvoice";
import { Invoice, InvoiceDocument } from "../../common/schemas/invoice.schema";
import { InvoiceDetailsService } from "../invoice-details/invoice-details.service";
import { InvoiceConvertPartNerMiFiDto } from "src/partner/invoice-mifi/dto/export.dto";
import { ThirdPartyServiceAdapter } from "src/partner/apdater/third-party.adapter";
import { PartnerApiDefault } from "src/partner/api/partner-api.default";
import { CacheService } from "../../redis/services/cache.service";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { InvoiceHandlerException } from "src/common/utils/ultis.hanlder.exception.ts/invoice.handler.exception";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { InvoiceConvertPartnerCancelMInvoiceDTO } from "src/partner/invoice-minvoice/dto/cancle.dto";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";
import { SagaOrchestratorService } from "src/saga-orchestrator/services/saga_orchestrator.service";
import { InvoiceExportSagaRequest } from "src/common/interfaces/saga.interface";
import { v4 as uuidv4 } from "uuid";
import { InvoiceAppFood } from "src/common/enums/invoice.app-food.enum";
import { Calculate } from "src/common/utils/ultils.calculate";
import { log } from "@grpc/grpc-js/build/src/logging";
import { RestaurantService } from "src/restaurant-service/restaurant/restaurant/restaurant.service";
import { Restaurant } from "src/common/entities/restaurant.entity";
import { KafkaService } from "src/kafka/kafka.service";
import { SyncInvoicesDto } from "src/common/dto/sync-invoices.dto";
import { CheckMissingOrdersDto } from "src/common/dto/check-missing-orders.dto";
import { SyncSpecificOrdersDto } from "src/common/dto/sync-specific-orders.dto";
import { SyncSpecificOrdersResponse } from "src/common/responses/sync-specific-orders.response";
import { InjectModel as InjectMongooseModel } from "@nestjs/mongoose";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import {
  BulkExportInvoiceDTO,
  BulkExportResponseDTO,
} from "../../common/dto/bulk-export-invoice.dto";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { TaskEnum } from "../../job/enums/task.enum";
import {
  InvoiceSendFailedDocument,
  InvoiceSendFailedSchema,
} from "src/common/schemas/invoice-send-failed.schema";
import { FailedInvoicesQueryDto } from "../../common/dto/failed-invoices-query.dto";
import {
  FailedInvoicesResponseDto,
  FailedInvoicesStatsResponseDto,
} from "../../common/responses/failed-invoices.response";
import { Branch } from "src/common/entities/branch.entity";
import { RestaurantBrandService } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.service";
import { RestaurantBrandEntity } from "src/common/entities/restaurant-brand.entity";

require("dotenv").config();

@Injectable()
export class InvoicesService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => InvoiceDetailsService))
    private readonly invoiceDetailsService: InvoiceDetailsService,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectMongooseModel(InvoiceDetail.name)
    private invoiceDetailModel: Model<InvoiceDetailDocument>,
    private restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private oauthService: OauthService,
    private invoiceHelper: InvoiceHelper,
    private branchService: BranchService,
    private restaurantService: RestaurantService,
    private restaurantBrandService: RestaurantBrandService,
    private readonly sagaOrchestratorService: SagaOrchestratorService,
    private readonly cacheService: CacheService,
    private readonly kafkaService: KafkaService,
    @InjectModel(InvoiceSendFailedSchema.name)
    private readonly invoiceSendFailedModel: Model<InvoiceSendFailedDocument>,
    @InjectQueue(TaskEnum.INVOICE_BULK_EXPORT_QUEUE)
    private readonly bulkExportQueue: Queue
  ) { }

  public async findById(invoiceId: string): Promise<Invoice> {
    return await this.invoiceModel.findById(invoiceId);
  }

  public async createByKafka(
    kafkaElectricInvoice: KafkaElectricInvoice
  ): Promise<Invoice> {
    const result = await new this.invoiceModel(
      new Invoice(kafkaElectricInvoice)
    ).save();

    // Invalidate related caches when new invoice is created
    await this.invalidateInvoiceCaches(result.restaurant_id);

    return result;
  }

  public async getInvoiceDoc(): Promise<Model<InvoiceDocument>> {
    return this.invoiceModel;
  }

  public async create(
    invoiceCreateBySidFpt: InvoiceCreateBySidFpt
  ): Promise<Invoice> {
    const result = await new this.invoiceModel(
      new Invoice(invoiceCreateBySidFpt)
    ).save();

    // Invalidate related caches when new invoice is created
    await this.invalidateInvoiceCaches(result.restaurant_id);

    return result;
  }

  /**
   * @param invoiceDetailParamDTO
   * @returns Lấy chi tiết hoá đơn của bên thứ 3
   */
  async partnerDetail(
    invoiceDetailParamDTO: InvoiceDetailParamDTO
  ): Promise<InvoiceResponse> {
    let invoice: Invoice = await this.invoiceModel.findOne({
      ref_code: invoiceDetailParamDTO.id,
    });

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.E_INVOICE_NOT_SEND_YET_TO_PARTNER
        ),
        HttpStatus.OK
      );
    }

    let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;

    restaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceService.findOneByBranchId(
        invoice.branch_id
      );

    if (!restaurantPartnerInvoiceEntity) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.BRANCH_HAS_NO_PARTNER
        ),
        HttpStatus.OK
      );
    }
    let loginOauthDTO: LoginOauthDTO;
    loginOauthDTO = new LoginOauthDTO(restaurantPartnerInvoiceEntity);
    let loginToPartNer = await this.oauthService.login(loginOauthDTO);

    if (
      loginToPartNer.partner_electronic_invoice_type ===
      PartnerElectronicInvoiceTypeEnum.M_INVOICE
    ) {
      let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
        restaurantPartnerInvoiceEntity
      );

      let url: string = new UtilsParamHttpService(
        { id: invoice.ref_code },
        apiPartNer.apiMinVoiceGetInfo
      ).getUrl();

      let dataResult = await new UtilsHttpServiceCustom(
        url,
        {},
        loginToPartNer.token,
        this.httpService
      ).get();

      return dataResult.data;
    } else if (
      loginToPartNer.partner_electronic_invoice_type ===
      PartnerElectronicInvoiceTypeEnum.FPT
    ) {
      let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
        restaurantPartnerInvoiceEntity
      );

      let url: string = new UtilsParamHttpService(
        {
          sid: invoice.ref_code,
          type: "json",
          stax: invoice.customer_company_tax_code,
          serial: invoice.voice_series,
          form: "1",
          seq: ConvertNumberToString.numberToSeq(invoice.order_id),
        },
        apiPartNer.apiFptGetInfo
      ).getUrl();

      let dataResult = await new UtilsHttpServiceCustom(
        url,
        {},
        loginToPartNer.token,
        this.httpService
      ).get();

      return dataResult[0].doc;
    }
  }

  /**
   *
   * @returns  Lấy chi tiết hoá đơn điện tử techres
   * @param id
   */
  public async getDetail(id: string): Promise<Invoice> {
    let invoice: Invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.ID_NOT_EXIST(id)
        ),
        HttpStatus.OK
      );
    }
    return invoice;
  }

  /**
   * Export invoice to third-party partner
   * @param exportInvoiceDTO - Export invoice data
   * @param employee - Employee information
   * @returns Export result
   */
  public async exportInvoice(
    exportInvoiceDTO: ExportInvoiceDTO,
    employee: Employee
  ): Promise<any> {
    // try {

    const invoice = await this.validateAndGetInvoice(exportInvoiceDTO.id);

    const partnerConfig: RestaurantPartnerInvoiceEntity =
      await this.getPartnerConfiguration(invoice.branch_id);

    const authToken = await this.authenticateWithPartner(
      partnerConfig,
      employee
    );

    this.validateInvoiceStatus(invoice);

    const invoiceData = await this.prepareInvoiceData(
      exportInvoiceDTO.id,
      invoice.order_id
    );

    if (partnerConfig.apply_discount !== null) {
      if (partnerConfig.apply_discount === 1) {
        let calculate: Calculate = new Calculate(this.invoiceHelper);
        const result = await calculate.recalculateWithoutDiscountAndUpdate(
          invoiceData.invoiceDetails,
          invoice
        );
        invoiceData.invoiceDetails = result.invoiceDetails.filter(
          (x: InvoiceDetail) => {
            return x.food_code !== "GGTB";
          }
        );
        invoiceData.invoiceTwoTime = result.invoiceTwoTime;
      }
    }
    return await this.exportToPartner(
      partnerConfig.partner_electronic_invoice_type,
      {
        authToken,
        invoice,
        invoiceData,
        exportInvoiceDTO,
        partnerConfig,
      }
    );
    // } catch (e) {

    //   // Tạo thông báo lỗi thân thiện dựa trên loại lỗi
    //   let userMessage = "Xuất hóa đơn điện tử thất bại";

    //   if (e.message?.includes('timeout') || e.message?.includes('ECONNRESET') || e.message?.includes('ENOTFOUND')) {
    //     userMessage = "Không thể kết nối đến hệ thống đối tác. Vui lòng thử lại sau ít phút.";
    //   } else if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
    //     userMessage = "Phiên đăng nhập đối tác đã hết hạn. Vui lòng liên hệ quản trị viên để cập nhật thông tin xác thực.";
    //   } else if (e.message?.includes('400') || e.message?.includes('Bad Request')) {
    //     userMessage = "Dữ liệu hóa đơn không hợp lệ. Vui lòng kiểm tra lại thông tin hóa đơn.";
    //   } else if (e.message?.includes('500') || e.message?.includes('Internal Server Error')) {
    //     userMessage = "Hệ thống đối tác đang bảo trì. Vui lòng thử lại sau.";
    //   } else {
    //     userMessage = `Xuất hóa đơn thất bại: ${e.message}`;
    //   }

    //   throw new HttpException( new ExceptionResponseDetail(
    //         HttpStatus.BAD_REQUEST,
    //        userMessage
    //       ),
    //       HttpStatus.OK);

    // }
  }

  /**
   * Prepare invoice data for export
   */
  private async prepareInvoiceData(
    invoiceId: string,
    orderId: number
  ): Promise<any> {
    const [invoiceDetails, invoiceTwoTime] = await Promise.all([
      this.invoiceDetailsService.findAllByOrderId(orderId),
      this.invoiceModel.findById(invoiceId),
    ]);

    return { invoiceDetails, invoiceTwoTime };
  }

  /**
   * Export invoice to specific partner
   */
  private async exportToPartner(
    partnerType: PartnerElectronicInvoiceTypeEnum,
    exportData: {
      authToken: any;
      invoice: any;
      invoiceData: any;
      exportInvoiceDTO: ExportInvoiceDTO;
      partnerConfig: RestaurantPartnerInvoiceEntity;
    }
  ): Promise<any> {
    // Sử dụng Saga Pattern thay vì direct calls
    // return await this.exportInvoiceWithSaga(partnerType, exportData);

    // Legacy implementation - giữ lại để tham khảo
    const { authToken, invoice, invoiceData, exportInvoiceDTO, partnerConfig } =
      exportData;
    const { invoiceDetails, invoiceTwoTime } = invoiceData;

    const restaurant: Restaurant =
      await this.restaurantService.findRestaurantByRestaurantId(
        invoice.restaurant_id
      );

    switch (partnerType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        return await this.exportToMInvoice({
          token: authToken.token,
          invoice,
          invoiceDetails,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.FPT:
        return await this.exportToFPT({
          token: authToken.token,
          invoice: invoiceTwoTime,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        return await this.exportToMiFi({
          invoice: invoiceTwoTime,
          invoiceDetails,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.VNPT:
        return await this.exportToVNPT({
          invoice: invoiceTwoTime,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.MISA:
        return await this.exportToMISA({
          authToken,
          invoice: invoiceTwoTime,
          invoiceDetails,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.HILO:
        return await this.exportToHilo({
          authToken,
          invoice: invoiceTwoTime,
          invoiceDetails,
          exportInvoiceDTO,
          partnerConfig,
        });

      case PartnerElectronicInvoiceTypeEnum.VIETTEL:
        return await this.exportToViettel({
          authToken,
          invoice,
          invoiceDetails,
          exportInvoiceDTO,
          partnerConfig,
          restaurant,
        });

      default:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Unsupported partner type"
          ),
          HttpStatus.OK
        );
    }
  }

  /**
   * Export invoice using Saga Pattern for transactional consistency
   */
  public async exportInvoiceWithSaga(
    partnerType: PartnerElectronicInvoiceTypeEnum,
    exportData: {
      authToken: any;
      invoice: any;
      invoiceData: any;
      exportInvoiceDTO: ExportInvoiceDTO;
      partnerConfig: RestaurantPartnerInvoiceEntity;
    }
  ): Promise<any> {
    const { authToken, invoice, invoiceData, exportInvoiceDTO, partnerConfig } =
      exportData;
    const { invoiceDetails, invoiceTwoTime } = invoiceData;

    let fkey = "";
    if (partnerType === PartnerElectronicInvoiceTypeEnum.MIFI) {
      fkey = await this.getMiFiFKey(partnerConfig);
    }
    // Chuẩn bị request data cho Saga theo từng partner type
    const sagaRequest: InvoiceExportSagaRequest = (() => {
      const baseRequest = {
        invoiceId: invoice._id || invoice.id,
        invoiceDetails: invoiceDetails || [],
        restaurantId: partnerConfig?.restaurant_id || invoice?.restaurant_id,
        partnerType: partnerType,
        token: authToken?.token,
      };

      switch (partnerType) {
        case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
          // Theo interface IMinVoice.export()
          return {
            ...baseRequest,
            logData: {
              token: authToken?.token,
              invoice,
              invoiceConvertPartnerMInvoiceDTO:
                new InvoiceConvertPartnerMInvoiceDTO(
                  exportInvoiceDTO,
                  invoice,
                  invoiceDetails,
                  partnerConfig
                ),
              exportInvoiceDTO,
              restaurantPartnerInvoiceEntity: partnerConfig,
            },
          };

        case PartnerElectronicInvoiceTypeEnum.FPT:
          // Theo interface IFptInvoice.export()
          return {
            ...baseRequest,
            logData: {
              token: authToken?.token,
              invoice,
              exportInvoiceDTO,
              restaurantPartnerInvoiceEntity: partnerConfig,
            },
          };

        case PartnerElectronicInvoiceTypeEnum.MIFI:
          // Theo interface IInvoiceMiFi.export()
          return {
            ...baseRequest,
            logData: {
              restaurantPartnerInvoiceEntity: partnerConfig,
              exportInvoiceDTO,
              invoice,
              invoiceConverPartNerMiFiDto: new InvoiceConvertPartNerMiFiDto(
                partnerConfig,
                exportInvoiceDTO,
                invoiceDetails,
                invoice,
                fkey // Note: fkey cần được xử lý async trước đó
              ),
            },
          };

        case PartnerElectronicInvoiceTypeEnum.VNPT:
          // Theo interface IInvoiceVNPt.export()
          return {
            ...baseRequest,
            logData: {
              restaurantPartnerInvoiceEntity: partnerConfig,
              exportInvoiceDTO,
              invoice,
            },
          };

        case PartnerElectronicInvoiceTypeEnum.MISA:
          // Theo interface IMisa.export() - cấu trúc request đã được chuẩn hóa
          return {
            ...baseRequest,
            logData: {
              loginToPartNer: {
                token: authToken?.token,
                data: invoice,
                partner_electronic_invoice_type: partnerType,
              },
              invoice,
              invoiceDetails: invoiceDetails,
              exportInvoiceDTO,
              restaurantPartnerInvoiceEntity: partnerConfig,
              dataTemplate: [], // Optional field, có thể để empty array hoặc undefined
            },
          };

        case PartnerElectronicInvoiceTypeEnum.VIETTEL:
          // Theo interface IViettel.export()
          return {
            ...baseRequest,
            logData: {
              loginToPartNer: authToken,
              invoice,
              invoiceConvertPartnerViettelDTO:
                new InvoiceConvertPartnerViettelDTO(
                  invoice,
                  invoiceDetails,
                  partnerConfig,
                  exportInvoiceDTO,
                  new Restaurant()
                ),
              restaurantPartnerInvoiceEntity: partnerConfig,
            },
          };

        default:
          break;
      }
    })();
    try {
      // Thực thi Saga Pattern
      const sagaResult =
        await this.sagaOrchestratorService.executeInvoiceExportSaga(
          sagaRequest
        );

      if (sagaResult.success) {
        return sagaResult.data;
      } else {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            sagaResult.error || "Saga execution failed"
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      console.error("Saga execution error:", error);
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Export failed: ${error.message}`
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Export to M-Invoice partner
   */
  private async exportToMInvoice(params: {
    token: string;
    invoice: any;
    invoiceDetails: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const { token, invoice, invoiceDetails, exportInvoiceDTO, partnerConfig } =
      params;

    return await ThirdPartyServiceAdapter.export(
      {
        token,
        invoice,
        invoiceConvertPartnerMInvoiceDTO: new InvoiceConvertPartnerMInvoiceDTO(
          exportInvoiceDTO,
          invoice,
          invoiceDetails,
          partnerConfig
        ),
        exportInvoiceDTO,
        restaurantPartnerInvoiceEntity: partnerConfig,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.M_INVOICE
    );
  }

  /**
   * Export to FPT partner
   */
  private async exportToFPT(params: {
    token: string;
    invoice: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const { token, invoice, exportInvoiceDTO, partnerConfig } = params;

    return await ThirdPartyServiceAdapter.export(
      {
        token,
        invoice,
        exportInvoiceDTO,
        restaurantPartnerInvoiceEntity: partnerConfig,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.FPT
    );
  }

  /**
   * Export to MiFi partner
   */
  private async exportToMiFi(params: {
    invoice: any;
    invoiceDetails: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const { invoice, invoiceDetails, exportInvoiceDTO, partnerConfig } = params;

    const fKey = await this.getMiFiFKey(partnerConfig);

    return await ThirdPartyServiceAdapter.export(
      {
        restaurantPartnerInvoiceEntity: partnerConfig,
        exportInvoiceDTO,
        invoice,
        invoiceConvertPartNerMiFiDto: new InvoiceConvertPartNerMiFiDto(
          partnerConfig,
          exportInvoiceDTO,
          invoiceDetails,
          invoice,
          fKey
        ),
      },
      "",
      PartnerElectronicInvoiceTypeEnum.MIFI
    );
  }

  /**
   * Export to VNPT partner
   */
  private async exportToVNPT(params: {
    invoice: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const { invoice, exportInvoiceDTO, partnerConfig } = params;

    return await ThirdPartyServiceAdapter.export(
      {
        restaurantPartnerInvoiceEntity: partnerConfig,
        exportInvoiceDTO,
        invoice,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.VNPT
    );
  }

  /**
   * Export to MISA partner
   */
  private async exportToMISA(params: {
    authToken: any;
    invoice: any;
    invoiceDetails: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const {
      authToken,
      invoice,
      invoiceDetails,
      exportInvoiceDTO,
      partnerConfig,
    } = params;

    return await ThirdPartyServiceAdapter.export(
      {
        loginToPartNer: authToken,
        invoice,
        invoiceDetails,
        exportInvoiceDTO,
        restaurantPartnerInvoiceEntity: partnerConfig,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.MISA
    );
  }

  /**
   * Export to HILO partner
   */
  private async exportToHilo(params: {
    authToken: any;
    invoice: any;
    invoiceDetails: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    const {
      authToken,
      invoice,
      invoiceDetails,
      exportInvoiceDTO,
      partnerConfig,
    } = params;

    return await ThirdPartyServiceAdapter.export(
      {
        loginToPartNer: authToken,
        invoice,
        invoiceDetails,
        invoiceConvertPartnerHiloDTO: new InvoiceConvertPartnerHiloDTO(
          exportInvoiceDTO,
          invoice,
          invoiceDetails,
          partnerConfig // Truyền thông tin người tạo hóa đơn
        ),
        exportInvoiceDTO,
        restaurantPartnerInvoiceEntity: partnerConfig,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.HILO
    );
  }

  /**
   * Export to VIETTEL partner
   */
  private async exportToViettel(params: {
    authToken: any;
    invoice: any;
    invoiceDetails: any;
    exportInvoiceDTO: ExportInvoiceDTO;
    partnerConfig: RestaurantPartnerInvoiceEntity;
    restaurant: Restaurant;
  }): Promise<any> {
    const {
      authToken,
      invoice,
      invoiceDetails,
      exportInvoiceDTO,
      partnerConfig,
      restaurant,
    } = params;

    return await ThirdPartyServiceAdapter.export(
      {
        loginToPartNer: authToken,
        invoice,
        invoiceConvertPartnerViettelDTO: new InvoiceConvertPartnerViettelDTO(
          invoice,
          invoiceDetails,
          partnerConfig,
          exportInvoiceDTO,
          restaurant
        ),
        restaurantPartnerInvoiceEntity: partnerConfig,
      },
      "",
      PartnerElectronicInvoiceTypeEnum.VIETTEL
    );
  }

  public async exportInvoiceAuto(
    exportInvoiceDTO: ExportInvoiceDTO,
    employee: Employee,
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    invoice: Invoice
  ): Promise<any> {
    try {
      if (invoice) {
        let loginToPartNer:
          | {
            token: string;
            data: any;
            partner_electronic_invoice_type: number;
          }
          | any;

        switch (
        restaurantPartnerInvoiceEntity.partner_electronic_invoice_type
        ) {
          case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
          case PartnerElectronicInvoiceTypeEnum.FPT:
          case PartnerElectronicInvoiceTypeEnum.MISA:
          case PartnerElectronicInvoiceTypeEnum.HILO:
          case PartnerElectronicInvoiceTypeEnum.VIETTEL:
            loginToPartNer = await this.loginToPartner(
              restaurantPartnerInvoiceEntity
            );
            break;
          default:
            loginToPartNer = employee.jwt_token;
            break;
        }

        let [invoiceDetails, invoiceTwoTime] = await Promise.all([
          this.invoiceDetailsService.findAllByOrderId(invoice.order_id),
          this.invoiceModel.findById(exportInvoiceDTO.id),
        ]);

        if (restaurantPartnerInvoiceEntity.apply_discount === 1) {
          let calculate: Calculate = new Calculate(this.invoiceHelper);
          await calculate.recalculateWithoutDiscountAndUpdate(
            invoiceDetails,
            invoiceTwoTime
          );
        }
        const restaurant: Restaurant =
          await this.restaurantService.findRestaurantByRestaurantId(
            invoice.restaurant_id
          );

        switch (
        restaurantPartnerInvoiceEntity.partner_electronic_invoice_type
        ) {
          case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
            return await ThirdPartyServiceAdapter.export(
              {
                token: loginToPartNer.token,
                invoice: invoice,
                invoiceConvertPartnerMInvoiceDTO:
                  new InvoiceConvertPartnerMInvoiceDTO(
                    exportInvoiceDTO,
                    invoiceTwoTime,
                    invoiceDetails,
                    restaurantPartnerInvoiceEntity
                  ),
                exportInvoiceDTO: exportInvoiceDTO,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.M_INVOICE
            );
          case PartnerElectronicInvoiceTypeEnum.FPT:
            return await ThirdPartyServiceAdapter.export(
              {
                token: loginToPartNer.token,
                invoice: invoiceTwoTime,
                exportInvoiceDTO: exportInvoiceDTO,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.FPT
            );
          case PartnerElectronicInvoiceTypeEnum.MIFI:
            let fKey;
            fKey = await this.getMiFiFKey(restaurantPartnerInvoiceEntity);

            return await ThirdPartyServiceAdapter.export(
              {
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
                exportInvoiceDTO: exportInvoiceDTO,
                invoice: invoiceTwoTime,
                invoiceConvertPartNerMiFiDto: new InvoiceConvertPartNerMiFiDto(
                  restaurantPartnerInvoiceEntity,
                  exportInvoiceDTO,
                  invoiceDetails,
                  invoiceTwoTime,
                  fKey
                ),
              },
              "",
              PartnerElectronicInvoiceTypeEnum.MIFI
            );
          case PartnerElectronicInvoiceTypeEnum.VNPT:
            return await ThirdPartyServiceAdapter.export(
              {
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
                exportInvoiceDTO: exportInvoiceDTO,
                invoice: invoiceTwoTime,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.VNPT
            );
          case PartnerElectronicInvoiceTypeEnum.MISA:
            const invocieTemplateKey = `techres/misa/${invoice.restaurant_id}/template`;

            const dataTemplate = await this.cacheService.getCachedData(
              invocieTemplateKey
            );
            if (!dataTemplate) {
              let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
                restaurantPartnerInvoiceEntity
              );
              const dataTemplate: any = await new UtilsHttpServiceCustom(
                apiPartNer.apiMisaGetTemplate + "?invoiceWithCode=true",
                {
                  TypeInvoice: 0,
                  taxcode: restaurantPartnerInvoiceEntity.tax_code,
                  username: restaurantPartnerInvoiceEntity.username,
                  password: restaurantPartnerInvoiceEntity.password,
                },
                "",
                HttpServiceBase.getHttpServiceInstance()
              ).post();
              await this.cacheService.setCache(
                invocieTemplateKey,
                dataTemplate.data
              );
            }
            return await ThirdPartyServiceAdapter.export(
              {
                loginToPartNer,
                invoice: invoiceTwoTime,
                invoiceDetails: invoiceDetails,
                exportInvoiceDTO: exportInvoiceDTO,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
                dataTemplate: JSON.parse(dataTemplate),
              },
              "",
              PartnerElectronicInvoiceTypeEnum.MISA
            );
          case PartnerElectronicInvoiceTypeEnum.HILO:
            return await ThirdPartyServiceAdapter.export(
              {
                loginToPartNer,
                invoice,
                invoiceDetails,
                invoiceConvertPartnerHiloDTO: new InvoiceConvertPartnerHiloDTO(
                  exportInvoiceDTO,
                  invoice,
                  invoiceDetails,
                  restaurantPartnerInvoiceEntity
                ),
                exportInvoiceDTO,
                restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.HILO
            );
          case PartnerElectronicInvoiceTypeEnum.VIETTEL:
            return await ThirdPartyServiceAdapter.export(
              {
                loginToPartNer,
                invoice,
                invoiceConvertPartnerViettelDTO:
                  new InvoiceConvertPartnerViettelDTO(
                    invoice,
                    invoiceDetails,
                    restaurantPartnerInvoiceEntity,
                    exportInvoiceDTO,
                    restaurant
                  ),
                restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.VIETTEL
            );
        }
      } else {
        console.log(InvoiceHandlerException.ID_NOT_EXIST(exportInvoiceDTO.id));
      }
    } catch (e) {
      console.log(e);
      console.log("error on auto export , infomation : ", invoice);
    }
  }

  private async loginToPartner(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): Promise<any> {
    const loginOauthDTO: LoginOauthDTO = new LoginOauthDTO(
      restaurantPartnerInvoiceEntity
    );
    return await this.oauthService.login(loginOauthDTO);
  }

  private async getMiFiFKey(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): Promise<any> {
    const fKey = await ThirdPartyServiceAdapter.getFkey({
      getFKeyMiFiDto: new GetFKeyMiFiDto(restaurantPartnerInvoiceEntity),
      restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
    });
    return fKey;
  }
  /**
   *
   * @param invoiceUpdateDto
   * @returns cập nhật các phiếu chưa được xuất
   */
  public async updateInvoices(
    invoiceUpdateDto: InvoiceUpdateDto
  ): Promise<Invoice> {
    if (invoiceUpdateDto.id === "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_ID_INPUT
        ),
        HttpStatus.OK
      );
    }
    let [invoice] = await Promise.all([
      this.invoiceModel.findById(invoiceUpdateDto.id),
    ]);

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.ID_NOT_EXIST(invoiceUpdateDto.id)
        ),
        HttpStatus.OK
      );
    }
    await this.invoiceModel.findByIdAndUpdate(
      invoiceUpdateDto.id,
      invoiceUpdateDto
    );

    const updatedInvoice = await this.invoiceModel.findById(
      invoiceUpdateDto.id
    );

    // Invalidate related caches when invoice is updated
    await this.invalidateInvoiceCaches(updatedInvoice.restaurant_id);

    return updatedInvoice;
  }

  public async getListByBranchIdAndInvoiceStatus(
    branch_id,
    status
  ): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({
      branch_id: branch_id,
      invoice_status: status,
    });
    return listInvoices;
  }

  public async getListByBranchIdAndInvoiceStatusAndCcduyet(
    branch_id,
    status,
    cct_duyet: number
  ): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({
      branch_id: branch_id,
      invoice_status: status,
      cct_duyet: cct_duyet,
    });
    return listInvoices;
  }

  //=============
  public async getListByBranchId(branch_id): Promise<Invoice[]> {
    let listInvoices: Invoice[] = [];
    listInvoices = await this.invoiceModel.find({ branch_id: branch_id });
    return listInvoices;
  }

  //=====================================================
  /**
   *
   * @param cancelInvoiceDto
   * @param employee
   * @returns
   */
  public async cancelInvoicePartner(
    cancelInvoiceDto: CancelInvoiceDto
  ): Promise<any> {
    if (cancelInvoiceDto.id === "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          "Bạn cần truyền Id Hóa Đơn"
        ),
        HttpStatus.OK
      );
    }
    const invoice: Invoice = await this.invoiceModel.findById(
      cancelInvoiceDto.id
    );

    if (invoice) {
      let [invoiceDetail] = await Promise.all([
        this.invoiceDetailsService.getListInvoiceDetailByInvoiceId(invoice._id),
      ]);
      let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
      restaurantPartnerInvoiceEntity =
        await this.restaurantPartnerInvoiceService.findOneByRestaurantAndRestaurantBrandAndBranchId(
          invoice.restaurant_id,
          invoice.restaurant_brand_id,
          invoice.branch_id,
          invoice.partner_type
        );
      if (
        !restaurantPartnerInvoiceEntity ||
        restaurantPartnerInvoiceEntity.status === 0
      )
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            InvoiceHandlerException.PARTNER_WAS_TURN_OFF
          ),
          HttpStatus.OK
        );

      let loginOauthDTO: LoginOauthDTO;
      loginOauthDTO = new LoginOauthDTO(restaurantPartnerInvoiceEntity);
      let loginToPartNer = await this.oauthService.login(loginOauthDTO);

      switch (loginOauthDTO.partnerElectronicInvoiceType) {
        case PartnerElectronicInvoiceTypeEnum.M_INVOICE: {
          loginToPartNer.token, invoice, restaurantPartnerInvoiceEntity;

          await Promise.all([
            await ThirdPartyServiceAdapter.getDetail(
              {
                token: loginToPartNer.token,
                invoice: invoice,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.M_INVOICE
            ),
            await ThirdPartyServiceAdapter.cancel(
              {
                invoice: invoice,
                token: loginToPartNer.token,
                invoiceConvertPartnerCancelMInvoiceDTO:
                  new InvoiceConvertPartnerCancelMInvoiceDTO(
                    cancelInvoiceDto,
                    invoice
                  ),
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.M_INVOICE
            ),
            await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
              invoice_status: InvoiceStatusEnum.CANCEL,
            }),
          ]);
          break;
        }
        case PartnerElectronicInvoiceTypeEnum.FPT: {
          let invoiceConvertPartnerCancelFptInvoiceDTO: InvoiceConvertPartnerCancelFptInvoiceDTO;

          invoiceConvertPartnerCancelFptInvoiceDTO =
            new InvoiceConvertPartnerCancelFptInvoiceDTO(
              cancelInvoiceDto,
              invoice,
              invoiceDetail,
              restaurantPartnerInvoiceEntity,
              await this.branchService.getCityNameByBranchId(invoice.branch_id)
            );

          await Promise.all([
            await ThirdPartyServiceAdapter.cancel(
              {
                invoice: invoice,
                token: loginToPartNer.token,
                invoiceCancelFPT: new InvoiceCancelFPT(
                  invoiceConvertPartnerCancelFptInvoiceDTO
                ),
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.FPT
            ),
            await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
              invoice_status: InvoiceStatusEnum.CANCEL,
            }),
          ]);

          break;
        }
        case PartnerElectronicInvoiceTypeEnum.MIFI: {
          await Promise.all([
            await ThirdPartyServiceAdapter.cancel(
              {
                invoice: invoice,
                invoiceCancelConvertPartnerMifiDto:
                  new InvoiceCancelConvertPartnerMifiDto(
                    invoice,
                    restaurantPartnerInvoiceEntity,
                    cancelInvoiceDto
                  ),
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.MIFI
            ),

            await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
              invoice_status: InvoiceStatusEnum.CANCEL,
            }),
          ]);
          break;
        }
        case PartnerElectronicInvoiceTypeEnum.MISA: {
          let data = await ThirdPartyServiceAdapter.getDetail(
            {
              loginToPartNer,
              invoice,
              restaurantPartnerInvoiceEntity,
            },
            "",
            PartnerElectronicInvoiceTypeEnum.MISA
          );

          if (data.length != 0) {
            if (!Number.isNaN(+data[0].InvNo)) {
              throw new HttpException(
                new ExceptionResponseDetail(
                  HttpStatus.BAD_REQUEST,
                  InvoiceHandlerException.INVOICE_HAS_SEND_TO_TAX_AUTHORITIES
                ),
                HttpStatus.OK
              );
            }
          }

          await Promise.all([
            await ThirdPartyServiceAdapter.cancel(
              {
                loginToPartNer: loginToPartNer,
                invoice: invoice,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.MISA
            ),

            await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
              invoice_status: InvoiceStatusEnum.CANCEL,
            }),
          ]);
          break;
        }
        case PartnerElectronicInvoiceTypeEnum.VNPT: {
          await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
            invoice_status: InvoiceStatusEnum.CANCEL,
          });

          break;
        }
        case PartnerElectronicInvoiceTypeEnum.VIETTEL: {
          const viettelCancelDto = new ViettelInvoiceCancelDto();
          viettelCancelDto.pattern = invoice.voice_series || "";
          viettelCancelDto.serial = invoice.voice_series || "";
          viettelCancelDto.fkey = invoice.ref_code || "";
          viettelCancelDto.reason = cancelInvoiceDto.note || "Hủy hóa đơn";
          viettelCancelDto.type = 1; // 1: Hủy bỏ

          await Promise.all([
            await ThirdPartyServiceAdapter.cancel(
              {
                invoice: invoice,
                token: loginToPartNer.token,
                viettelInvoiceCancelDto: viettelCancelDto,
                restaurantPartnerInvoiceEntity: restaurantPartnerInvoiceEntity,
              },
              "",
              PartnerElectronicInvoiceTypeEnum.VIETTEL
            ),
            await this.invoiceModel.findByIdAndUpdate(cancelInvoiceDto.id, {
              invoice_status: InvoiceStatusEnum.CANCEL,
            }),
          ]);

          break;
        }
        default:
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.INVOICE_NOT_EXIST
            ),
            HttpStatus.OK
          );
      }
    }
  }

  /**
   * Count invoices by different status tabs
   * @param query - Filter query parameters
   * @param searchKeyword - Search keyword
   * @param restaurant_id - Restaurant ID
   * @param from_date - Start date
   * @param to_date - End date
   * @returns Count of invoices by status
   */
  async countTab(
    query: any,
    searchKeyword: any,
    restaurant_id: number,
    from_date: string,
    to_date: string,
    apply_order_type: number
  ) {
    const cleanedQuery = await this.prepareCountTabQuery(
      query[0],
      restaurant_id,
      from_date,
      to_date,
      apply_order_type
    );

    // Build search conditions
    const searchConditions = this.buildCountTabSearchConditions(searchKeyword);

    // Combine all conditions
    const finalQuery = { $and: [cleanedQuery, searchConditions] };

    // Use Promise.all for better performance
    const [countResults] = await Promise.all([
      this.getCountTabResults(finalQuery),
    ]);

    return countResults;
  }

  /**
   * Prepare and clean query parameters for countTab
   */
  private async prepareCountTabQuery(
    queryParams: any,
    restaurant_id: number,
    from_date: string,
    to_date: string,
    apply_order_type: number
  ): Promise<any> {
    const fieldsToRemove = ["is_force_online", "from", "to"];
    fieldsToRemove.forEach((field) => {
      if (queryParams.hasOwnProperty(field)) {
        delete queryParams[field];
      }
    });

    const branch: Branch = await this.branchService.findOneByBranchId(
      queryParams.branch_id
    );

    const restaurantBrand: RestaurantBrandEntity =
      await this.restaurantBrandService.findById(branch.restaurant_brand_id);
    const housrToReport: number = restaurantBrand.setting.hour_to_take_report;

    // Parse dates with hour adjustment if needed
    let fromDateObj, toDateObj;

    if (housrToReport !== 0) {
      const [dayFrom, monthFrom, yearFrom] = from_date.split("/").map(Number);
      const [dayTo, monthTo, yearTo] = to_date.split("/").map(Number);

      fromDateObj = new Date(
        Date.UTC(yearFrom, monthFrom - 1, dayFrom, housrToReport - 7, 0, 0, 0)
      );

      // End date
      let endYear = yearTo;
      let endMonth = monthTo;
      let endDay = dayTo;

      if (from_date === to_date) {
        const tmp = new Date(yearTo, monthTo - 1, dayTo);
        tmp.setDate(tmp.getDate() + 1);
        endYear = tmp.getFullYear();
        endMonth = tmp.getMonth() + 1;
        endDay = tmp.getDate();
      }

      toDateObj = new Date(
        Date.UTC(endYear, endMonth - 1, endDay, housrToReport - 7, 0, 0, 0)
      );
    } else {
      fromDateObj = UtilsDate.parseFromDateString(from_date);
      toDateObj = UtilsDate.parseToDateString(to_date);
    }

    let order_method;
    switch (apply_order_type) {
      case 1:
        order_method = { order_method: { $nin: InvoiceAppFood.APP_FOOD } };
        break;
      case 2:
        order_method = { order_method: { $in: InvoiceAppFood.APP_FOOD } };
        break;
      default:
        order_method = {}; // Lấy tất cả, không filter theo order_method
        break;
    }
    return {
      ...queryParams,
      restaurant_id,
      createdAt: { $gte: fromDateObj, $lte: toDateObj },
      ...order_method,
    };
  }

  /**
   * Build search conditions for countTab
   */
  private buildCountTabSearchConditions(searchKeyword: any): any {
    if (!searchKeyword) {
      return {};
    }

    const textFields = [
      "payment_date",
      "voice_series",
      "currency_code",
      "customer_name",
      "customer_phone",
      "customer_company_name",
      "customer_company_tax_code",
      "customer_company_address",
      "customer_company_email",
      "customer_bank_account",
      "customer_bank_account_name",
    ];

    const numericFields = [
      "discount_percent",
      "discount_amount",
      "vat",
      "partner_type",
      "vat_amount",
      "total_amount",
      "amount",
      "order_id",
      "order_parent_id",
    ];

    const searchConditions = [];

    // Add text search conditions
    textFields.forEach((field) => {
      searchConditions.push({
        [field]: { $regex: searchKeyword, $options: "i" },
      });
    });

    // Add numeric search conditions
    const numericValue = parseInt(searchKeyword);
    if (!isNaN(numericValue)) {
      numericFields.forEach((field) => {
        searchConditions.push({ [field]: numericValue });
      });
    }

    return { $or: searchConditions };
  }

  /**
   * Get count results for different status tabs
   */
  private async getCountTabResults(finalQuery: any): Promise<any> {
    const statusConfigs = [
      { name: "waiting_export", conditions: { invoice_status: 0 } },
      {
        name: "waiting_browse",
        conditions: { invoice_status: 1, cct_duyet: 0 },
      },
      { name: "exported", conditions: { cct_duyet: 1 } },
      { name: "canceled", conditions: { invoice_status: 3, cct_duyet: 0 } },
      {
        name: "have_update_in_partner",
        conditions: { invoice_status: 2, cct_duyet: 0 },
      },
    ];

    // Execute all count queries in parallel for better performance
    const countPromises = statusConfigs.map(async (config) => {
      const statusQuery = {
        $and: [finalQuery, config.conditions],
      };

      const count = await this.invoiceModel.countDocuments(statusQuery);
      return { [config.name]: count };
    });

    const countResults = await Promise.all(countPromises);

    // Combine results into single object
    return countResults.reduce((acc, result) => {
      return { ...acc, ...result };
    }, {});
  }

  /**
   * Get paginated invoice list with search and filters
   * @param query - Filter query parameters
   * @param limit - Number of records per page
   * @param page - Page number
   * @param searchKeyword - Search keyword
   * @param restaurant_id - Restaurant ID
   * @param from_date - Start date
   * @param to_date - End date
   * @returns Paginated invoice list with totals
   */
  async getList(
    query: any,
    limit: number,
    page: number,
    searchKeyword: any,
    branch_id: number,
    from_date: string,
    to_date: string,
    apply_order_type: number
  ) {
    const skipPage = (page - 1) * limit;
    const cleanedQuery = await this.prepareQuery(
      query[0],
      branch_id,
      from_date,
      to_date
    );

    const searchConditions = await this.buildSearchConditions(searchKeyword);
    const finalQuery = { $and: [cleanedQuery, searchConditions] };

    const [countResult, listResult] = await Promise.all([
      this.getInvoiceCount(cleanedQuery),
      this.getInvoiceList(finalQuery, skipPage, limit),
    ]);

    let filteredListResult;
    switch (apply_order_type) {
      case 1:
        filteredListResult = listResult
          .filter(
            (bill) => !InvoiceAppFood.APP_FOOD.includes(bill.order_method)
          )
          .map((bill) => ({
            ...bill,
            is_order: 1,
            is_app_food: 0,
          }));
        break;
      case 2:
        filteredListResult = listResult
          .filter((bill) => InvoiceAppFood.APP_FOOD.includes(bill.order_method))
          .map((bill) => ({
            ...bill,
            is_order: 0,
            is_app_food: 1,
          }));
        break;
      default:
        filteredListResult = listResult.map((bill) => ({
          ...bill,
          is_order: InvoiceAppFood.APP_FOOD.includes(bill.order_method) ? 0 : 1,
          is_app_food: InvoiceAppFood.APP_FOOD.includes(bill.order_method)
            ? 1
            : 0,
        }));
    }

    const result = {
      list: filteredListResult,
      total_record: countResult,
      limit,
    };

    // // Cache the result with TTL (5 minutes for list data)
    // await this.setCachedData(cacheKey, result, 300);

    return result;
  }

  async getTotals(
    query: any,
    searchKeyword: any,
    branch_id: number,
    from_date: string,
    to_date: string,
    apply_order_type: number
  ) {
    const cleanedQuery = await this.prepareQuery(
      query[0],
      branch_id,
      from_date,
      to_date
    );

    const searchConditions = await this.buildSearchConditions(searchKeyword);
    const finalQuery = { $and: [cleanedQuery, searchConditions] };

    if (apply_order_type === 1) {
      finalQuery.$and.push({ order_method: { $nin: InvoiceAppFood.APP_FOOD } });
    } else if (apply_order_type === 2) {
      finalQuery.$and.push({ order_method: { $in: InvoiceAppFood.APP_FOOD } });
    }

    const result = await this.invoiceModel.aggregate([
      { $match: finalQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalVatAmount: { $sum: "$vat_amount" },
          totalDiscountAmount: {
            $sum: {
              $cond: [
                { $gt: ["$discount_amount", 0] },
                "$discount_amount",
                { $ifNull: ["$total_amount_discount_amount", 0] },
              ],
            },
          },
          extraChargeAmount: { $sum: "$extra_charge_amount" },
          totalAmountExtraChargeAmount: {
            $sum: "$total_amount_extra_charge_amount",
          },
        },
      },
    ]);

    if (result.length > 0) {
      const totals = result[0];
      const totalPaymentAmount =
        totals.totalAmount +
        totals.totalVatAmount -
        totals.totalDiscountAmount +
        totals.extraChargeAmount +
        totals.totalAmountExtraChargeAmount;
      return {
        totalAmount: totals.totalAmount,
        totalVatAmount: totals.totalVatAmount,
        totalDiscountAmount: totals.totalDiscountAmount,
        totalPaymentAmount,
      };
    }

    return {
      totalAmount: 0,
      totalVatAmount: 0,
      totalDiscountAmount: 0,
      totalPaymentAmount: 0,
    };
  }

  /**
   * Get total amounts for all invoices matching the filter criteria (without pagination and date filter)
   * @param query - Filter query parameters (without date range)
   * @param searchKeyword - Search keyword
   * @param branch_id - Branch ID
   * @param apply_order_type - Order type filter
   * @returns Total amounts for all matching invoices (all time)
   */
  async getTotalAmounts(
    query: any,
    searchKeyword: any,
    branch_id: number,
    apply_order_type: number,
    from_date: string,
    to_date: string,
  ): Promise<{
    totalAmount: number;
    totalVatAmount: number;
    totalDiscountAmount: number;
    totalPaymentAmount: number;
  }> {

    // Create query without date filter - only use branch_id and other filters
    const cleanedQuery = await this.prepareQuery(
      query[0],
      branch_id,
      from_date,
      to_date
    );
    console.log(123);

    const searchConditions = await this.buildSearchConditions(searchKeyword);
    const finalQuery = { $and: [cleanedQuery, searchConditions] };


    // Get all invoices without pagination - only select necessary fields for calculation
    const allInvoices = await this.invoiceModel
      .find(finalQuery)
      .select({
        amount: 1,
        vat_amount: 1,
        discount_amount: 1,
        total_amount_discount_amount: 1,
        extra_charge_amount: 1,
        total_amount_extra_charge_amount: 1,
        order_method: 1,
      })
      .lean()
      .exec();

    // Apply order type filter
    let filteredInvoices;
    switch (apply_order_type) {
      case 1:
        filteredInvoices = allInvoices.filter(
          (invoice) => !InvoiceAppFood.APP_FOOD.includes(invoice.order_method)
        );
        break;
      case 2:
        filteredInvoices = allInvoices.filter((invoice) =>
          InvoiceAppFood.APP_FOOD.includes(invoice.order_method)
        );
        break;
      default:
        filteredInvoices = allInvoices;
    }

    // Calculate totals
    const totals = filteredInvoices.reduce(
      (acc, invoice) => {
        acc.totalAmount += invoice.amount || 0;
        acc.totalVatAmount += invoice.vat_amount || 0;
        acc.totalDiscountAmount +=
          invoice.discount_amount || invoice.total_amount_discount_amount || 0;
        acc.extraChargeAmount += invoice.extra_charge_amount || 0;
        acc.totalAmountExtraChargeAmount +=
          invoice.total_amount_extra_charge_amount || 0;
        return acc;
      },
      {
        totalAmount: 0,
        totalVatAmount: 0,
        totalDiscountAmount: 0,
        extraChargeAmount: 0,
        totalAmountExtraChargeAmount: 0,
      }
    );

    const totalPaymentAmount =
      totals.totalAmount +
      totals.totalVatAmount -
      totals.totalDiscountAmount +
      totals.extraChargeAmount +
      totals.totalAmountExtraChargeAmount;

    return {
      totalAmount: totals.totalAmount,
      totalVatAmount: totals.totalVatAmount,
      totalDiscountAmount: totals.totalDiscountAmount,
      totalPaymentAmount,
    };
  }

  /**
   * Generate cache key based on prefix and parameters
   * @param prefix Cache key prefix
   * @param params Parameters to include in cache key
   * @returns Generated cache key
   */
  private generateCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const paramString = JSON.stringify(sortedParams);
    const hash = require("crypto")
      .createHash("md5")
      .update(paramString)
      .digest("hex");
    return `${prefix}:${hash}`;
  }

  /**
   * Set data to Redis cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   */
  private async setCachedData(
    key: string,
    data: any,
    ttl: number
  ): Promise<void> {
    try {
      await this.cacheService.setCachedData(key, data, ttl);
    } catch (error) {
      console.error("Error setting cached data:", error);
    }
  }

  /**
   * Invalidate cache by pattern
   * @param pattern Cache key pattern to invalidate
   */
  private async invalidateCache(pattern: string): Promise<void> {
    try {
      await this.cacheService.invalidateCache(pattern);
    } catch (error) {
      console.error("Error invalidating cache:", error);
    }
  }

  /**
   * Invalidate all invoice-related caches for a specific restaurant
   * @param restaurant_id Restaurant ID to invalidate caches for
   */
  private async invalidateInvoiceCaches(restaurant_id: number): Promise<void> {
    await this.cacheService.invalidateInvoiceCaches(restaurant_id);
  }

  /**
   * Prepare and clean query parameters
   */
  private async prepareQuery(
    queryParams: any,
    branch_id: number,
    from_date: string,
    to_date: string
  ): Promise<any> {
    // Remove unwanted properties
    const fieldsToRemove = ["is_force_online", "from", "to"];
    fieldsToRemove.forEach((field) => {
      if (queryParams.hasOwnProperty(field)) {
        delete queryParams[field];
      }
    });
    console.log(queryParams);

    const branch: Branch = await this.branchService.findOneByBranchId(
      branch_id
    );

    console.log("branch", branch);

    const restaurantBrand: RestaurantBrandEntity =
      await this.restaurantBrandService.findById(branch.restaurant_brand_id);
    const housrToReport: number = restaurantBrand.setting.hour_to_take_report;
    console.log("housrToReport ", housrToReport);

    let fromDateObj, toDateObj;
    if (housrToReport !== 0) {
      const [dayFrom, monthFrom, yearFrom] = from_date.split("/").map(Number);
      const [dayTo, monthTo, yearTo] = to_date.split("/").map(Number);
      fromDateObj = new Date(
        Date.UTC(yearFrom, monthFrom - 1, dayFrom, housrToReport - 7, 0, 0, 0)
      );

      let endYear = yearTo;
      let endMonth = monthTo;
      let endDay = dayTo;

      if (from_date === to_date) {
        const tmp = new Date(yearTo, monthTo - 1, dayTo);
        tmp.setDate(tmp.getDate() + 1);
        endYear = tmp.getFullYear();
        endMonth = tmp.getMonth() + 1;
        endDay = tmp.getDate();
      }

      toDateObj = new Date(
        Date.UTC(endYear, endMonth - 1, endDay, housrToReport - 7, 0, 0, 0)
      );
    } else {
      fromDateObj = UtilsDate.parseFromDateString(from_date);
      toDateObj = UtilsDate.parseToDateString(to_date);
    }

    return {
      ...queryParams,
      branch_id,
      createdAt: { $gte: fromDateObj, $lte: toDateObj },
    };
  }
  /**
   * Build search conditions for text and numeric fields
   */
  private async buildSearchConditions(searchKeyword: any): Promise<any> {
    if (!searchKeyword) {
      return {};
    }
    const textFields = [
      "payment_date",
      "voice_series",
      "currency_code",
      "customer_name",
      "customer_phone",
      "customer_company_name",
      "customer_company_tax_code",
      "customer_company_address",
      "customer_company_email",
      "customer_bank_account",
      "customer_bank_account_name",
    ];

    const numericFields = [
      "discount_percent",
      "discount_amount",
      "vat",
      "partner_type",
      "vat_amount",
      "total_amount",
      "amount",
      "order_id",
      "order_parent_id",
    ];

    const searchConditions = [];

    // Add text search conditions
    textFields.forEach((field) => {
      searchConditions.push({
        [field]: { $regex: searchKeyword, $options: "i" },
      });
    });

    // Add numeric search conditions
    const numericValue = parseInt(searchKeyword);
    if (!isNaN(numericValue)) {
      numericFields.forEach((field) => {
        searchConditions.push({ [field]: { $eq: numericValue } });
      });
    }

    return { $or: searchConditions };
  }
  /**
   * Get total count of invoices
   */
  private async getInvoiceCount(query: any): Promise<number> {
    return this.invoiceModel.countDocuments(query);
  }
  /**
   * Get paginated invoice list with optimized aggregation
   */
  private async getInvoiceList(
    query: any,
    skip: number,
    limit: number
  ): Promise<any[]> {
    const selectFields = {
      restaurant_id: 1,
      restaurant_brand_id: 1,
      branch_id: 1,
      payment_date: 1,
      voice_series: 1,
      order_id: 1,
      currency_code: 1,
      customer_name: 1,
      customer_phone: 1,
      customer_id: 1,
      customer_company_name: 1,
      customer_company_tax_code: 1,
      customer_company_address: 1,
      customer_company_email: 1,
      customer_bank_account: 1,
      customer_bank_account_name: 1,
      discount_type: 1,
      discount_percent: 1,
      discount_amount: 1,
      extra_charge_amount: 1,
      partner_type: 1,
      vat: 1,
      vat_amount: 1,
      total_amount: 1,
      amount: 1,
      type: 1,
      ref_code: 1,
      code: 1,
      invoice_status: 1,
      exported_time: 1,
      cct_duyet: 1,
      invoice_denominator: 1,
      food_discount_amount: 1,
      order_method: 1,
      food_discount_percent: 1,
      drink_discount_percent: 1,
      drink_discount_amount: 1,
      total_amount_discount_percent: 1,
      total_amount_discount_amount: 1,
      total_amount_extra_charge_amount: 1,
      total_amount_extra_charge_percent: 1,
      createdAt: 1,
    };

    const docs = await this.invoiceModel
      .find(query)
      .select(selectFields)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return docs.map((doc) => this.transformInvoiceData(doc));
  }

  /**
   * Transform invoice data for response
   */
  private transformInvoiceData(doc: any): any {
    return {
      ...doc,
      payment_date: doc.payment_date,
      discount_amount: this.formatNumber(doc.discount_amount),
      extra_charge_amount: this.formatNumber(doc.extra_charge_amount),
      vat_amount: this.formatNumber(doc.vat_amount),
      total_amount: this.formatNumber(doc.total_amount),
      amount: this.formatNumber(doc.amount),
      created_at: this.formatDate(doc.createdAt),
    };
  }

  /**
   * Format number to 1 decimal place
   */
  private formatNumber(value: number): number {
    return value ? Number(value.toFixed(1)) : 0;
  }

  /**
   * Format date to Vietnamese timezone
   */
  private formatDate(date: Date): string {
    return new Date(date)
      .toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/-/g, "/");
  }

  public async findOneByOrderId(orderId: number): Promise<Invoice> {
    return await this.invoiceModel
      .findOne({
        order_id: orderId,
      })
      .exec();
  }

  async findByIdAndUpdateInvoiceStatusAndRefcodeAndOrderIdAndExportedTime(
    id: string,
    { invoice_status, ref_code, order_id, exported_time }
  ): Promise<any> {
    return this.invoiceModel.findByIdAndUpdate(id, {
      invoice_status,
      ref_code,
      order_id,
      exported_time,
    });
  }

  async checkAccountPartner(
    partner_type: number,
    username: string,
    password: string,
    endpoint: string,
    username_access_service: string,
    password_access_service: string,
    taxcode?: string
  ) {
    let loginDataResponse: any;
    let responseData: {
      token: string;
      partner_electronic_invoice_type: number;
    } = { token: "", partner_electronic_invoice_type: 0 };

    const partnerApiDefault: PartnerApiDefault = new PartnerApiDefault();

    switch (+partner_type) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        [loginDataResponse] = await Promise.all([
          new UtilsHttpService(
            `${endpoint}` + partnerApiDefault.CONFIG_MINVOCE_INVOICE_LOGIN_PATH,
            { username, password },
            null,
            this.httpService
          ).post(),
        ]);

        if ("error" in loginDataResponse) {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              loginDataResponse["error"]
            ),
            HttpStatus.OK
          );
        }

        responseData.token = loginDataResponse.token;
        responseData.partner_electronic_invoice_type =
          PartnerElectronicInvoiceTypeEnum.M_INVOICE;

        return {
          status: HttpStatus.OK,
          message: "Success",
          data: null,
        };

      case PartnerElectronicInvoiceTypeEnum.FPT:
        loginDataResponse = await new UtilsHttpService(
          `${endpoint}` + partnerApiDefault.CONFIG_FPT_INVOICE_LOGIN_PATH,
          { username, password },
          null,
          this.httpService
        ).post();

        responseData.token = loginDataResponse;
        responseData.partner_electronic_invoice_type =
          PartnerElectronicInvoiceTypeEnum.M_INVOICE;

        return { status: HttpStatus.OK, message: "OK", data: [responseData] };

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        loginDataResponse = await new UtilsHttpServiceCustom(
          `${endpoint}` + partnerApiDefault.CONFIG_MIFI_INVOICE_LOGIN_PATH,
          {
            ApiUserName: username,
            ApiPassword: password,
            ApiInvPattern: "InvPattern",
            ApiInvSerial: "InvSerial",
            fkey: "fkey",
          },
          null,
          this.httpService
        ).post();

        if (loginDataResponse.status === "Fault") {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: "Tài khoản hoặc mật khẩu không đúng",
            data: null,
          };
        } else {
          return {
            status: HttpStatus.OK,
            message: "Success",
            data: null,
          };
        }
      case PartnerElectronicInvoiceTypeEnum.VNPT: {
        const soapRequest: string = `<?xml version="1.0" encoding="utf-8"?>
                    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                        <soap12:Body>
                            <cancelInv xmlns="http://tempuri.org/">
                            <Account>${username}</Account>
                                <ACpass>${password}</ACpass>
                                <fkey>TESTLOGIN0000</fkey>
                                <userName>${username_access_service}</userName>
                                <userPass>${password_access_service}</userPass>
                            </cancelInv>
                        </soap12:Body>
                    </soap12:Envelope>
                    `;

        let dataInvoice: any = await new UtilsHttpService(
          `${endpoint}` + partnerApiDefault.CONFIG_VNPT_INVOICE_LOGIN_PATH,
          soapRequest,
          new Employee(),
          this.httpService
        ).postSoap();

        if (dataInvoice.status !== HttpStatus.OK) {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: "Success",
            data: null,
          };
        }
        return {
          status: HttpStatus.OK,
          message: "Success",
          data: null,
        };
      }
      case PartnerElectronicInvoiceTypeEnum.MISA: {
        loginDataResponse = await new UtilsHttpServiceCustom(
          `${endpoint}` + partnerApiDefault.CONFIG_MISA_INVOICE_LOGIN_PATH,
          {
            taxcode: taxcode,
            username: username,
            password: password,
          },
          null,
          this.httpService
        ).post();

        if (loginDataResponse.error !== "") {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: loginDataResponse.error,
            data: null,
          };
        } else {
          return {
            status: HttpStatus.OK,
            message: "Success",
            data: null,
          };
        }
      }
      case PartnerElectronicInvoiceTypeEnum.HILO: {
        const authentString = `${username}:${password}:${uuidv4()}`;
        const encoded = Buffer.from(authentString).toString("base64");

        const loginResponse = await new UtilsHttpServiceCustom(
          `${endpoint}` + partnerApiDefault.CONFIG_HILO_INVOICE_LOGIN_PATH,
          {},
          null,
          HttpServiceBase.getHttpServiceInstance()
        ).getWithHeader({
          "Content-Type": "application/json",
          taxcode: taxcode,
          Authentication: encoded,
        });

        if ("Code" in loginResponse) {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: loginResponse.messages,
            data: null,
          };
        } else {
          return {
            status: HttpStatus.OK,
            message: "Success",
            data: null,
          };
        }
      }
      case PartnerElectronicInvoiceTypeEnum.VIETTEL: {
        try {
          // Chuẩn bị dữ liệu đăng nhập với username và password
          const loginData = {
            username: username,
            password: password,
          };

          // Gửi request đăng nhập đến API Viettel
          const response = await new UtilsHttpServiceCustom(
            `${endpoint}` + partnerApiDefault.CONFIG_VIETTEL_INVOICE_LOGIN_PATH,
            loginData,
            null,
            HttpServiceBase.getHttpServiceInstance()
          ).postWithHeader({
            "Content-Type": "application/json",
          });

          // Kiểm tra response có chứa access_token không
          if (
            response.status === HttpStatus.UNAUTHORIZED ||
            !response.access_token
          ) {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.UNAUTHORIZED,
                "Failed to authenticate with Viettel API"
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          // Trả về response chứa access_token
          return {
            status: HttpStatus.OK,
            message: "Success",
            data: null,
          };
        } catch (error) {
          // Xử lý lỗi và throw exception với thông tin chi tiết
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              `Viettel login failed: ${error.message}`
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      default:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Đối tác không tồn tại trong hệ thống !"
          ),
          HttpStatus.OK
        );
    }
  }

  /**
   * Validate and get invoice by ID
   */
  private async validateAndGetInvoice(invoiceId: string): Promise<any> {
    const invoice = await this.invoiceHelper.findById(invoiceId);

    if (!invoice) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.ID_NOT_EXIST(invoiceId)
        ),
        HttpStatus.OK
      );
    }

    return invoice;
  }

  /**
   * Chuyển đổi format ngày từ dd/mm/yyyy sang Date object
   * @param dateString - Chuỗi ngày theo format dd/mm/yyyy
   * @returns Date object
   */
  private convertDateFormat(dateString: string): Date {
    const [day, month, year] = dateString.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  /**
   * Get partner configuration for branch
   */
  private async getPartnerConfiguration(
    branchId: number
  ): Promise<RestaurantPartnerInvoiceEntity> {
    const partnerConfig =
      await this.restaurantPartnerInvoiceService.findOneByBranchId(branchId);

    if (!partnerConfig) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.BRANCH_HAS_NO_PARTNER
        ),
        HttpStatus.OK
      );
    }

    return partnerConfig;
  }

  /**
   * Authenticate with partner based on partner type
   */
  private async authenticateWithPartner(
    partnerConfig: RestaurantPartnerInvoiceEntity,
    employee: Employee
  ): Promise<any> {
    const partnersRequiringAuth = [
      PartnerElectronicInvoiceTypeEnum.M_INVOICE,
      PartnerElectronicInvoiceTypeEnum.FPT,
      PartnerElectronicInvoiceTypeEnum.MISA,
      PartnerElectronicInvoiceTypeEnum.HILO,
      PartnerElectronicInvoiceTypeEnum.VIETTEL,
    ];

    if (
      partnersRequiringAuth.includes(
        partnerConfig.partner_electronic_invoice_type
      )
    ) {
      return await this.loginToPartner(partnerConfig);
    }

    return employee.jwt_token;
  }

  /**
   * Validate invoice export status
   */
  private validateInvoiceStatus(invoice: any): void {
    if (invoice.invoice_status === InvoiceStatusEnum.EXPORT) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.E_INVOICE_HAS_SEND_TO_PARTNER
        ),
        HttpStatus.OK
      );
    }
  }

  /**
   * Đồng bộ hóa đơn chưa xuất qua Kafka
   * @param syncInvoicesDto - Dữ liệu đồng bộ hóa đơn
   * @returns Số lượng hóa đơn đã gửi
   */
  async syncInvoices(syncInvoicesDto: SyncInvoicesDto): Promise<number> {
    try {
      const { branch_id, fromDate, toDate, limit } = syncInvoicesDto;

      // Chuyển đổi format ngày từ dd/mm/yyyy sang Date object
      const startDate = this.convertDateFormat(fromDate);
      const endDate = this.convertDateFormat(toDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

      // Tìm hóa đơn chưa xuất theo điều kiện
      const invoices = await this.invoiceModel
        .find({
          branch_id: branch_id,
          invoice_status: 0, // Chưa xuất
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .limit(limit)
        .select("order_id _id")
        .lean();

      if (invoices.length === 0) {
        return 0;
      }

      // Lấy danh sách order_id
      const orderIds = invoices.map((invoice) => invoice.order_id);

      // Lưu danh sách order_id vào Redis
      const redisKey = `sync_invoices_${branch_id}_${Date.now()}`;
      await this.cacheService.setCachedData(redisKey, orderIds, 3600); // TTL 1 giờ

      // Xóa invoice details trước
      await this.invoiceDetailModel.deleteMany({
        order_id: { $in: orderIds },
      });

      // Xóa invoices
      await this.invoiceModel.deleteMany({
        order_id: { $in: orderIds },
      });

      // Gửi danh sách order_id qua Kafka
      await this.kafkaService.sendMessage(
        "kafka.topic.sync-invoice-from-order",
        orderIds
      );

      // Xóa những order_id đã sync khỏi Redis cache processed orders
      const PROCESSED_ORDERS_KEY = "processed_order_ids";
      for (const orderId of orderIds) {
        try {
          await this.cacheService.removeOrderFromProcessed(
            orderId.toString(),
            PROCESSED_ORDERS_KEY
          );
        } catch (error) {
          console.warn(
            `Failed to remove order ${orderId} from processed cache:`,
            error.message
          );
        }
      }

      console.log(
        `Đã xóa ${orderIds.length} order_id khỏi Redis cache processed orders`
      );

      return invoices.length;
    } catch (error) {
      console.error("Error in syncInvoices:", error);
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Lỗi khi đồng bộ hóa đơn: ${error.message}`
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Kiểm tra những order_id bị thiếu trong quá trình sync
   * @param checkMissingOrdersDto - Dữ liệu kiểm tra missing orders
   * @returns Danh sách order_id bị thiếu
   */
  async checkMissingOrders(
    checkMissingOrdersDto: CheckMissingOrdersDto
  ): Promise<number[]> {
    try {
      const { redis_key, is_sync_again } = checkMissingOrdersDto;

      // Lấy danh sách order_id từ Redis
      const cachedOrderIds = await this.cacheService.getCachedData(redis_key);

      if (!cachedOrderIds || !Array.isArray(cachedOrderIds)) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.NOT_FOUND,
            "Redis key không tồn tại hoặc đã hết hạn"
          ),
          HttpStatus.NOT_FOUND
        );
      }

      // Kiểm tra những order_id nào vẫn còn tồn tại trong database
      const existingInvoices = await this.invoiceModel
        .find({
          order_id: { $in: cachedOrderIds },
          invoice_status: 0, // Chỉ kiểm tra những hóa đơn chưa xuất
        })
        .select("order_id")
        .lean();

      const existingOrderIds = existingInvoices.map(
        (invoice) => invoice.order_id
      );

      // Tìm những order_id bị thiếu (đã được sync thành công)
      const missingOrderIds = cachedOrderIds.filter(
        (orderId) => !existingOrderIds.includes(orderId)
      );

      // Xóa những order_id đã sync thành công khỏi Redis cache processed orders
      const PROCESSED_ORDERS_KEY = "processed_order_ids";
      if (missingOrderIds.length > 0) {
        for (const orderId of missingOrderIds) {
          try {
            await this.cacheService.removeOrderFromProcessed(
              orderId.toString(),
              PROCESSED_ORDERS_KEY
            );
          } catch (error) {
            console.warn(
              `Failed to remove missing order ${orderId} from processed cache:`,
              error.message
            );
          }
        }
        console.log(
          `Đã xóa ${missingOrderIds.length} missing order_id khỏi Redis cache processed orders`
        );
      }

      // Nếu is_sync_again = 1, gửi lại tất cả order_id từ Redis qua Kafka (không xóa MongoDB)
      if (is_sync_again === 1) {
        await this.kafkaService.sendMessage(
          "kafka.topic.sync-invoice-from-order",
          missingOrderIds
        );
        console.log(
          `Đã gửi lại ${cachedOrderIds.length} order_id qua Kafka từ Redis key: ${redis_key}`
        );
      }

      return missingOrderIds;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error("Error in checkMissingOrders:", error);
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Lỗi khi kiểm tra missing orders"
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Đồng bộ những order_id cụ thể qua Kafka
   * @param syncSpecificOrdersDto - Dữ liệu đồng bộ order_id cụ thể
   * @returns Kết quả đồng bộ với thông tin chi tiết
   */
  async syncSpecificOrders(
    syncSpecificOrdersDto: SyncSpecificOrdersDto
  ): Promise<SyncSpecificOrdersResponse> {
    try {
      const { branch_id, order_ids } = syncSpecificOrdersDto;

      // Tìm những hóa đơn tồn tại và chưa xuất theo order_id
      const existingInvoices = await this.invoiceModel
        .find({
          branch_id: branch_id,
          order_id: { $in: order_ids },
          invoice_status: 0, // Chỉ lấy hóa đơn chưa xuất
        })
        .select("order_id _id")
        .lean();

      const existingOrderIds = existingInvoices.map(
        (invoice) => invoice.order_id
      );
      const skippedOrderIds = order_ids.filter(
        (orderId) => !existingOrderIds.includes(orderId)
      );

      if (existingOrderIds.length === 0) {
        return new SyncSpecificOrdersResponse(0, [], skippedOrderIds);
      }

      // Lưu danh sách order_id vào Redis để tracking
      const redisKey = `sync_specific_orders_${branch_id}_${Date.now()}`;
      await this.cacheService.setCachedData(redisKey, existingOrderIds, 3600); // TTL 1 giờ

      // Xóa invoice details trước
      await this.invoiceDetailModel.deleteMany({
        order_id: { $in: existingOrderIds },
      });

      // Xóa invoices
      await this.invoiceModel.deleteMany({
        order_id: { $in: existingOrderIds },
      });

      // Gửi danh sách order_id qua Kafka
      await this.kafkaService.sendMessage(
        "kafka.topic.sync-invoice-from-order",
        existingOrderIds
      );

      // Xóa những order_id đã sync khỏi Redis cache processed orders
      const PROCESSED_ORDERS_KEY = "processed_order_ids";
      for (const orderId of existingOrderIds) {
        try {
          await this.cacheService.removeOrderFromProcessed(
            orderId.toString(),
            PROCESSED_ORDERS_KEY
          );
        } catch (error) {
          console.warn(
            `Failed to remove order ${orderId} from processed cache:`,
            error.message
          );
        }
      }

      console.log(
        `Đã sync ${existingOrderIds.length} order_id cụ thể và xóa khỏi Redis cache processed orders`
      );
      console.log(`Redis tracking key: ${redisKey}`);

      return new SyncSpecificOrdersResponse(
        existingOrderIds.length,
        existingOrderIds,
        skippedOrderIds
      );
    } catch (error) {
      console.error("Error in syncSpecificOrders:", error);
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Lỗi khi đồng bộ order_id cụ thể: ${error.message}`
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Xuất tất cả hóa đơn chưa xuất sử dụng Redis Queue
   * @param bulkExportDto DTO chứa restaurant_id và limit
   * @param employee Thông tin nhân viên thực hiện
   * @returns Response chứa job_id để theo dõi tiến trình
   */
  async bulkExportInvoices(
    bulkExportDto: BulkExportInvoiceDTO,
    employee: Employee
  ): Promise<BulkExportResponseDTO> {
    try {
      const { limit = 100, invoice_ids, await_result = false } = bulkExportDto;

      // Làm sạch danh sách yêu cầu (DTO đã unique nhưng vẫn bảo vệ)
      const requestedIds = Array.isArray(invoice_ids)
        ? [...new Set(invoice_ids)]
        : [];

      if (requestedIds.length === 0) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Không có invoice_id hợp lệ để xử lý"
          ),
          HttpStatus.OK
        );
      }

      // Lấy trạng thái tất cả invoice theo requestedIds
      const requestedDocs = await this.invoiceModel
        .find({ _id: { $in: requestedIds } })
        .select("_id invoice_status")
        .lean();

      const foundIds = requestedDocs.map((d) => d._id.toString());
      const excludedNotFoundIds = requestedIds.filter(
        (id) => !foundIds.includes(id)
      );

      const unexportedAllIds = requestedDocs
        .filter((d) => d.invoice_status === 0)
        .map((d) => d._id.toString());

      const excludedAlreadyExportedIds = requestedDocs
        .filter((d) => d.invoice_status !== 0)
        .map((d) => d._id.toString());

      const excludedInvoiceIds = Array.from(
        new Set([...excludedNotFoundIds, ...excludedAlreadyExportedIds])
      );

      // Áp dụng limit cho danh sách ứng viên được xét enqueue
      const candidateIds = unexportedAllIds.slice(0, limit);

      // Phân loại queued/accepted
      const alreadyQueuedInvoiceIds: string[] = [];
      const acceptedInvoiceIds: string[] = [];
      for (const invoiceId of candidateIds) {
        const isQueued = await this.cacheService.getCachedData(
          `bulk_export_queue:${invoiceId}`
        );
        if (isQueued) {
          alreadyQueuedInvoiceIds.push(invoiceId);
        } else {
          acceptedInvoiceIds.push(invoiceId);
        }
      }

      // Lấy danh sách invoice_id đã có bản ghi lỗi trước đó trong invoice_send_failed
      const failedDocs = await this.invoiceSendFailedModel
        .find({ invoice_id: { $in: requestedIds } })
        .select({ invoice_id: 1, _id: 0 })
        .lean()
        .exec();
      const failedInvoiceIds = Array.from(
        new Set((failedDocs || []).map((d: any) => d.invoice_id))
      );

      // Tạo job nếu có hóa đơn được chấp nhận
      let jobId: string | null = null;
      let createdJob: any = null;
      if (acceptedInvoiceIds.length > 0) {
        jobId = `bulk-export-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        createdJob = await this.bulkExportQueue.add(
          "bulk-export-invoices",
          {
            job_id: jobId,
            invoice_ids: acceptedInvoiceIds,
            branch_id: employee.branch_id,
            is_send_mail: 0,
            employee: {
              id: employee.id,
              jwt_token: employee.jwt_token,
              name: "",
            },
            created_at: new Date(),
          },
          {
            priority: 10,
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 10,
            removeOnFail: 5,
            jobId: jobId,
          }
        );

        // Đánh dấu các invoice_id đã được đưa vào queue (TTL 1 giờ)
        for (const invoiceId of acceptedInvoiceIds) {
          await this.cacheService.setCachedData(
            `bulk_export_queue:${invoiceId}`,
            jobId,
            3600
          );
        }
      }

      // Trả về response chi tiết
      const response = new BulkExportResponseDTO();
      response.job_id = jobId ?? "";
      response.jobId = response.job_id;
      response.total_invoices = acceptedInvoiceIds.length;
      response.total_requested = requestedIds.length;
      response.total_found_unexported = unexportedAllIds.length;
      response.accepted_invoice_ids = acceptedInvoiceIds;
      response.already_queued_invoice_ids = alreadyQueuedInvoiceIds;
      response.excluded_invoice_ids = excludedInvoiceIds;
      response.failed_invoice_ids = failedInvoiceIds;
      response.message =
        acceptedInvoiceIds.length > 0
          ? `Đã enqueue ${acceptedInvoiceIds.length} hóa đơn chưa xuất. Sử dụng job_id để theo dõi tiến trình.`
          : "Không có hóa đơn phù hợp để enqueue (đã queue trước đó hoặc không đủ điều kiện).";
      response.created_at = new Date();

      // Nếu yêu cầu đồng bộ, chờ job hoàn thành và trả về danh sách hóa đơn lỗi chi tiết
      if (await_result && createdJob && jobId) {
        try {
          const jobResult = await createdJob.finished();
          console.log(jobResult);

          const failures = Array.isArray(jobResult?.results)
            ? jobResult.results.filter((r: any) => !r.success)
            : [];

          // Lấy order_id cho các hóa đơn lỗi để trả về id = order_id (fallback sang invoice_id nếu không có)
          let failedInvoicesList: { id: string; error: string }[] = [];
          if (failures.length > 0) {
            const failedIds = failures.map((r: any) => r.invoice_id);
            const failedDocs = await this.invoiceModel
              .find({ _id: { $in: failedIds } })
              .select({ _id: 1, order_id: 1 })
              .lean()
              .exec();

            const orderIdMap = new Map(
              (failedDocs || []).map((doc: any) => [
                doc._id.toString(),
                doc.order_id || doc._id.toString(),
              ])
            );

            failedInvoicesList = failures.map((r: any) => ({
              id: orderIdMap.get(r.invoice_id) || r.invoice_id,
              error: r.error || "Unknown error",
            }));
          }

          if (failedInvoicesList.length > 0) {
            const failedOrderIds = failedInvoicesList
              .map((fi: any) => fi.id)
              .filter((id: any) => id !== undefined && id !== null);
            throw new Error(
              `Những hóa đơn [${failedOrderIds.join(", ")}] bị lỗi`
            );
          }

          response.failed_invoices = failedInvoicesList;
          // Alias camelCase để phù hợp với sample của client
          (response as any).failedInvoices = failedInvoicesList;
          response.message =
            jobResult?.message || `Job ${jobId} đã xử lý xong đồng bộ`;
        } catch (waitErr) {
          // Ném lỗi ra để được xử lý bởi catch bên ngoài (L2720-2727)
          throw waitErr;
        }
      }

      return response;
    } catch (error) {
      console.error("[BULK-EXPORT] Error creating bulk export job:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errMsg = error?.message || "Không xác định lỗi";
      const isFailedInvoicesMsg = errMsg.startsWith("Những hóa đơn [");
      const finalErrMsg = isFailedInvoicesMsg
        ? errMsg
        : `Lỗi khi tạo job xuất hóa đơn hàng loạt: ${errMsg}`;
      throw new HttpException(
        new ExceptionResponseDetail(
          isFailedInvoicesMsg
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR,
          finalErrMsg
        ),
        isFailedInvoicesMsg ? HttpStatus.BAD_REQUEST : HttpStatus.OK
      );
    }
  }

  /**
   * Lấy danh sách hóa đơn lỗi từ collection invoice_send_failed
   * @param queryDto - Query parameters cho pagination và filtering
   * @returns Danh sách hóa đơn lỗi với thông tin phân trang
   */
  async getFailedInvoices(
    queryDto: FailedInvoicesQueryDto
  ): Promise<FailedInvoicesResponseDto> {
    try {
      const { page = 1, limit = 10, status, from_date, to_date } = queryDto;
      const skip = (page - 1) * limit;

      // Xây dựng query filter
      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (from_date || to_date) {
        filter.created_at = {};
        if (from_date) {
          filter.created_at.$gte = new Date(from_date);
        }
        if (to_date) {
          filter.created_at.$lte = new Date(to_date);
        }
      }

      // Thực hiện query với pagination
      const [failedInvoices, totalCount] = await Promise.all([
        this.invoiceSendFailedModel
          .find(filter)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.invoiceSendFailedModel.countDocuments(filter).exec(),
      ]);

      // Transform data
      const items = failedInvoices.map((item) => ({
        _id: item._id.toString(),
        invoice_id: item.invoice_id,
        status: item.status,
        error_message: item.error_message,
        error_details: item.error_details,
        retry_count: item.retry_count,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: items,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total: totalCount,
          per_page: limit,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
        },
      };
    } catch (error) {
      console.error("[FAILED-INVOICES] Error getting failed invoices:", error);

      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Lỗi khi lấy danh sách hóa đơn lỗi: ${error.message}`
        ),
        HttpStatus.OK
      );
    }
  }

  // Trả về danh sách _id (invoice_id) của hóa đơn lỗi
  async getFailedInvoiceIds(
    queryDto: FailedInvoicesQueryDto
  ): Promise<string[]> {
    try {
      const { status, from_date, to_date } = queryDto;
      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (from_date || to_date) {
        filter.created_at = {};
        if (from_date) {
          filter.created_at.$gte = new Date(from_date);
        }
        if (to_date) {
          filter.created_at.$lte = new Date(to_date);
        }
      }

      const failedDocs = await this.invoiceSendFailedModel
        .find(filter)
        .select({ invoice_id: 1, _id: 0 })
        .lean()
        .exec();

      const ids = Array.from(
        new Set((failedDocs || []).map((d: any) => d.invoice_id))
      );
      return ids;
    } catch (error) {
      console.error(
        "[FAILED-INVOICE-IDS] Error getting failed invoice ids:",
        error
      );

      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Lỗi khi lấy danh sách _id hóa đơn lỗi: ${error.message}`
        ),
        HttpStatus.OK
      );
    }
  }

  /**
   * Lấy thống kê hóa đơn lỗi
   * @returns Thống kê tổng quan về hóa đơn lỗi
   */
  async getFailedInvoicesStats(): Promise<FailedInvoicesStatsResponseDto> {
    try {
      const [totalFailed, totalRetrying] = await Promise.all([
        this.invoiceSendFailedModel.countDocuments().exec(),
        this.invoiceSendFailedModel
          .countDocuments({ status: "retrying" })
          .exec(),
      ]);

      return {
        total_failed: totalFailed,
        total_retry: totalRetrying,
        total_resolved: 0, // Sẽ được tính khi có logic xử lý resolved
        daily_stats: [], // Tạm thời trả về mảng rỗng, có thể implement sau
      };
    } catch (error) {
      console.error(
        "[FAILED-INVOICES-STATS] Error getting failed invoices stats:",
        error
      );

      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Lỗi khi lấy thống kê hóa đơn lỗi: ${error.message}`
        ),
        HttpStatus.OK
      );
    }
  }
}
