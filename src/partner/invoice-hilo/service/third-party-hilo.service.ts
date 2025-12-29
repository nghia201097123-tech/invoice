import { Injectable, HttpStatus, HttpException } from "@nestjs/common";
import { IHiloInvoice } from "src/partner/interface/hilo-invoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import {
  HiloInvoiceExportDto,
  HiloAuthDto,
  InvoiceConvertPartnerHiloDTO,
} from "../dto/export.dto";
import { HiloInvoiceCancelDto } from "../dto/cancel.dto";
import { HiloInvoiceUpdateDto } from "../dto/update.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice, InvoiceDocument } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { InvoiceHandlerException } from "src/common/utils/ultis.hanlder.exception.ts/invoice.handler.exception";
import { HiloHelper } from "../utils/hilo.helper";
import { HILO_CONSTANTS } from "../constants/hilo.constants";
import {
  HiloInvoiceCreateResponse,
  HiloInvoiceSignResponse,
} from "../dto/response.dto";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";

@Injectable()
export class ThirdPartyHilo implements ThirdParty, IHiloInvoice {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel?: Model<InvoiceDocument>,
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper?: InvoiceHelper,
    private readonly hiloHelper?: HiloHelper
  ) {}

  async getThirdParty(): Promise<ThirdPartyHilo> {
    return this;
  }

  async export(request: {
    loginToPartNer: {
      token: string;
      data: any;
      partner_electronic_invoice_type: number;
    };
    invoice: Invoice;
    invoiceConvertPartnerHiloDTO: InvoiceConvertPartnerHiloDTO;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );
      const dataMinVoice = await new UtilsHttpServiceCustom(
        apiPartner.apiHiloCreate,
        request.invoiceConvertPartnerHiloDTO,
        request.loginToPartNer.token,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        Authentication: request.loginToPartNer.token,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      if (dataMinVoice.error) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            dataMinVoice.messages
          ),
          HttpStatus.OK
        );
      }

      await Promise.all([
        this.invoiceModel.findByIdAndUpdate(request.invoice._id, {
          customer_name:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO.customer_name,
          customer_phone:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_phone,
          customer_company_name:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_company_name,
          customer_company_tax_code:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_company_tax_code,
          customer_company_address:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_company_address,
          customer_company_email:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_company_email,
          customer_bank_account:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_bank_account,
          customer_bank_account_name:
            request.invoiceConvertPartnerHiloDTO.exportInvoiceDTO
              .customer_company_name,
          ref_code: dataMinVoice.data.at(0).fkey,
          exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()),
          invoice_status: InvoiceStatusEnum.EXPORT,
          voice_series: request.restaurantPartnerInvoiceEntity.invoice_series,
          partner_type:
            request.restaurantPartnerInvoiceEntity
              .partner_electronic_invoice_type,
          is_send_mail: 0,
        }),
      ]);
    } catch (error) {
      console.log("[HILO-ERROR] Error export invoice:", error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async cancel(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const cancelData: HiloInvoiceCancelDto = {
        pattern: request.invoice.voice_series || "",
        serial: request.invoice.invoice_denominator || "",
        invoiceNo: request.invoice.code || "",
        reason: "Hủy hóa đơn theo yêu cầu",
        additionalReferenceDesc: "Hủy từ hệ thống POS",
        additionalReferenceDate: new UtilsDate().getCurrentDate(),
      };

      const response = await new UtilsHttpServiceCustom(
        apiPartner.apiHiloCancel,
        cancelData,
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async update(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const invoiceDetails: InvoiceDetail[] =
        await this.invoiceDetailModel.find({
          order_id: request.invoice.order_id,
        });

      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const updateData = this.convertToHiloUpdateFormat(
        request.invoice,
        invoiceDetails
      );

      const response = await new UtilsHttpServiceCustom(
        apiPartner.apiHiloUpdate,
        updateData,
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getDetail(
    request:
      | {
          loginToPartNer: { token: string };
          invoice: Invoice | Invoice[];
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
        }
      | any
  ): Promise<any> {
    const apiPartner: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    try {
      const response = await new UtilsHttpServiceCustom(
        `${apiPartner.apiHiloGetInfo}fkey=${request.invoice.ref_code}&mst=${request.restaurantPartnerInvoiceEntity.tax_code}`,
        {},
        request.loginToPartNer.token,
        HttpServiceBase.getHttpServiceInstance()
      ).getWithHeader1({
        Authentication: `${request.loginToPartNer.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      return response.data.data.at(0);
    } catch (error) {
      // throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async signInvoice(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const signData = {
        invoiceId: request.invoiceId,
        signMethod: "HSM", // Sử dụng HSM để ký
      };

      const response = await new UtilsHttpServiceCustom(
        apiPartner.apiHiloSign,
        signData,
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getInvoicePdf(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const response = await new UtilsHttpServiceCustom(
        `${apiPartner.apiHiloGetPdf}/${request.invoiceId}`,
        {},
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).getWithHeader({
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });
      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getInvoiceXml(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const response = await new UtilsHttpServiceCustom(
        `${apiPartner.apiHiloGetXml}/${request.invoiceId}`,
        {},
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).getWithHeader({
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  private convertToHiloFormat(
    invoice: Invoice,
    invoiceDetails: InvoiceDetail[],
    exportDto: ExportInvoiceDTO
  ): HiloInvoiceExportDto {
    return {
      pattern:
        invoice.invoice_denominator || HILO_CONSTANTS.DEFAULTS.INVOICE_TYPE,
      serial: invoice.voice_series || "KT0001",
      invoiceType: HILO_CONSTANTS.INVOICE_TYPES.VAT_INVOICE,
      templateCode: HILO_CONSTANTS.TEMPLATE_CODES.DEFAULT,
      invoiceDate: UtilsDate.formatDateTimeVNToStringV1(
        UtilsDate.parseFromDateString(invoice.payment_date)
      ),
      currencyCode:
        invoice.currency_code || HILO_CONSTANTS.DEFAULTS.CURRENCY_CODE,
      exchangeRate: HILO_CONSTANTS.DEFAULTS.EXCHANGE_RATE,
      buyerName: invoice.customer_company_name,
      buyerTaxCode: invoice.customer_company_tax_code,
      buyerAddress: invoice.customer_company_address,
      buyerEmail: invoice.customer_company_email,
      buyerPhone: invoice.customer_phone || "",
      totalAmountWithoutVat: invoice.total_amount_without_vat || 0,
      totalVatAmount: invoice.vat_amount || 0,
      totalAmount: invoice.total_amount || 0,
      totalDiscountAmount: invoice.discount_amount || 0,
      paymentMethod: HILO_CONSTANTS.DEFAULTS.PAYMENT_METHOD,
      note: this.hiloHelper?.sanitizeString(invoice.ref_code || "") || "",
      invoiceDetails: invoiceDetails.map((detail) => ({
        itemName: this.hiloHelper?.sanitizeString(detail.food_name || "") || "",
        unitName: detail.food_unit || HILO_CONSTANTS.DEFAULTS.UNIT_NAME,
        quantity: detail.quantity || 1,
        unitPrice: detail.food_unit_price || 0,
        discountAmount: detail.discount_amount || 0,
        discountRate: detail.discount_percent || 0,
        lineAmount: detail.total_amount || 0,
        vatRate: detail.vat || HILO_CONSTANTS.DEFAULTS.VAT_RATE,
        vatAmount: detail.vat_amount || 0,
      })),
    };
  }

  private convertToHiloUpdateFormat(
    invoice: Invoice,
    invoiceDetails: InvoiceDetail[]
  ): HiloInvoiceUpdateDto {
    return {
      pattern: invoice.voice_series || "",
      serial: invoice.invoice_denominator || "",
      invoiceNo: invoice.code || "",
      adjustmentType: HILO_CONSTANTS.ADJUSTMENT_TYPES.INFO_CHANGE,
      originalInvoiceId: invoice.order_parent_id?.toString() || "",
      invoiceDate: UtilsDate.formatDateTimeVNToStringV1(
        UtilsDate.parseFromDateString(invoice.payment_date)
      ),
      currencyCode:
        invoice.currency_code || HILO_CONSTANTS.DEFAULTS.CURRENCY_CODE,
      exchangeRate: HILO_CONSTANTS.DEFAULTS.EXCHANGE_RATE,
      buyerName:
        this.hiloHelper?.sanitizeString(
          invoice.customer_company_name || invoice.customer_name || ""
        ) || "",
      buyerTaxCode: invoice.customer_company_tax_code,
      buyerAddress:
        this.hiloHelper?.sanitizeString(
          invoice.customer_company_address || invoice.customer_address
        ) || "",
      buyerEmail: invoice.customer_company_email,
      buyerPhone:
        this.hiloHelper?.formatPhoneNumber(invoice.customer_phone) || "",
      totalAmountWithoutVat: invoice.total_amount_without_vat || 0,
      totalVatAmount: invoice.vat_amount || 0,
      totalAmount: invoice.total_amount || 0,
      totalDiscountAmount: invoice.discount_amount || 0,
      paymentMethod: HILO_CONSTANTS.DEFAULTS.PAYMENT_METHOD,
      note: this.hiloHelper?.sanitizeString(invoice.ref_code || "") || "",
      adjustmentNote: "Điều chỉnh thông tin hóa đơn",
      invoiceDetails: invoiceDetails.map((detail) => ({
        itemName: this.hiloHelper?.sanitizeString(detail.food_name || "") || "",
        unitName: detail.food_unit || HILO_CONSTANTS.DEFAULTS.UNIT_NAME,
        quantity: detail.quantity || 1,
        unitPrice: detail.food_unit_price || 0,
        discountAmount: detail.discount_amount || 0,
        discountRate: detail.discount_percent || 0,
        lineAmount: detail.total_amount || 0,
        vatRate: detail.vat || HILO_CONSTANTS.DEFAULTS.VAT_RATE,
        vatAmount: detail.vat_amount || 0,
      })),
    };
  }
}
