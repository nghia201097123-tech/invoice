import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { ThirdPartyMinVoice } from "../invoice-minvoice/service/third-party-minvoice.service";
import { ThirdPartyFpt } from "../invoice-fpt/fpt-invoice/service/third-party-fpt.service";
import { ThirdPartyMiFi } from "../invoice-mifi/servcie/third-party-mifi.service";
import { ThirdPartyVnPt } from "../invoice-vnpt/service/third-party-vnpt.service";
import { ThirdPartyMisa } from "../invoice-misa/service/third-party-misa.service";
import { ThirdPartyHilo } from "../invoice-hilo/service/third-party-hilo.service";
// import { ThirdPartyViettel } from "../invoice-viettel/service/third-party-viettel.service";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { Invoice, InvoiceDocument } from "src/common/schemas/invoice.schema";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { InvoiceSendThirdPartyLogSchema } from "src/common/schemas/invoice-send-third-party-log.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { ThirdPartyViettel } from "../invoice-viettel/service/third-party-viettel.service";
import { RestaurantBrandService } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.service";

@Injectable()
export class ThirdPartyFactory {
  // Static variables to store constructor parameters
  private static invoiceModel: Model<InvoiceDocument>;
  private static invoiceSendThirdPartyLogSchema: Model<InvoiceSendThirdPartyLogSchema>;
  private static invoiceDetailModel: Model<InvoiceDetailDocument>;
  private static invoiceHelper: InvoiceHelper;
  private static restaurantBrandService: RestaurantBrandService;

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    @InjectModel(InvoiceSendThirdPartyLogSchema.name)
    private readonly invoiceSendThirdPartyLogSchema: Model<InvoiceSendThirdPartyLogSchema>,

    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel: Model<InvoiceDetailDocument>,

    private readonly invoiceHelper?: InvoiceHelper,

    private readonly restaurantBrandService?: RestaurantBrandService
  ) {
    ThirdPartyFactory.invoiceModel = this.invoiceModel;
    ThirdPartyFactory.invoiceSendThirdPartyLogSchema =
      this.invoiceSendThirdPartyLogSchema;
    ThirdPartyFactory.invoiceDetailModel = this.invoiceDetailModel;
    ThirdPartyFactory.invoiceHelper = this.invoiceHelper;
    ThirdPartyFactory.restaurantBrandService = this.restaurantBrandService;
  }

  public static async ThirdParty(type: number) {
    switch (type) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        return await new ThirdPartyMinVoice(
          ThirdPartyFactory.invoiceModel,
          ThirdPartyFactory.invoiceDetailModel,
          this.invoiceHelper
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.FPT:
        return await new ThirdPartyFpt(
          this.invoiceDetailModel,
          this.invoiceHelper
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.MIFI:
        return await new ThirdPartyMiFi(
          this.invoiceDetailModel,
          this.invoiceHelper
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.VNPT:
        return await new ThirdPartyVnPt(
          this.invoiceDetailModel,
          this.invoiceHelper,
          this.restaurantBrandService
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.MISA:
        return await new ThirdPartyMisa(
          this.invoiceModel,
          this.invoiceSendThirdPartyLogSchema,
          this.invoiceDetailModel
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.HILO:
        return await new ThirdPartyHilo(
          this.invoiceModel,
          this.invoiceDetailModel,
          this.invoiceHelper
        ).getThirdParty();

      case PartnerElectronicInvoiceTypeEnum.VIETTEL:
        return await new ThirdPartyViettel(
          this.invoiceModel,
          this.invoiceDetailModel,
          this.invoiceHelper
        ).getThirdParty();

      default:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Đối tác không tồn tại trong hệ thống"
          ),
          HttpStatus.OK
        );
    }
  }
}
