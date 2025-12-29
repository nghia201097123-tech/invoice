import { IMisa } from "src/partner/interface/misa-invoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { Invoice, InvoiceDocument } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { InvoiceTemplateDto } from "src/common/dto/invoice-template.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { InvoiceSendThirdPartyLogSchema } from "src/common/schemas/invoice-send-third-party-log.schema";
import {
  InvoiceMisaInsertByNewInvoiceDto,
  InvoiceMisaInsertDto,
} from "../dto/insert.dto";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { InvoiceHandlerException } from "src/common/utils/ultis.hanlder.exception.ts/invoice.handler.exception";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { Utils } from "src/common/utils/utils.common.helper";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";

@Injectable()
export class ThirdPartyMisa implements ThirdParty, IMisa {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel?: Model<InvoiceDocument>,

    @InjectModel(InvoiceSendThirdPartyLogSchema.name)
    private readonly invoiceSendThirdPartyLogSchema?: Model<InvoiceSendThirdPartyLogSchema>,

    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>
  ) { }

  async getThirdParty(): Promise<Object | any> {
    return this;
  }

  async export(
    request:
      | {
        loginToPartNer: {
          token: string;
          data: any;
          partner_electronic_invoice_type: number;
        };
        invoice: Invoice;
        invoiceDetails: InvoiceDetail[];
        exportInvoiceDTO: ExportInvoiceDTO;
        restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
        dataTemplate?: any[];
      }
      | any
  ): Promise<any> {
    try {
      for (const e of request.invoiceDetails) {
        if (![0, 5, 8, 10].includes(+e.vat)) {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.FOOD_VAT_MUST_BE_IN_VALUE_MISA
            ),
            HttpStatus.OK
          );
        }
      }

      let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );
      let dataTemplate: any;
      let dataTemplateFilter: any[];

      if (!request.dataTemplate || request.dataTemplate.length === 0) {
        dataTemplate = await new UtilsHttpServiceCustom(
          apiPartNer.apiMisaGetTemplate + "?invoiceWithCode=true",
          {
            TypeInvoice: 0,
            taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
            username: request.restaurantPartnerInvoiceEntity.username,
            password: request.restaurantPartnerInvoiceEntity.password,
          },
          "",
          HttpServiceBase.getHttpServiceInstance()
        ).post();

        dataTemplateFilter = JSON.parse(dataTemplate.data).filter(
          (item: any) =>
            item.InvSeries ===
            request.restaurantPartnerInvoiceEntity.invoice_series
        );
      } else {
        dataTemplateFilter = request.dataTemplate.filter(
          (item: any) =>
            item.InvSeries ===
            request.restaurantPartnerInvoiceEntity.invoice_series
        );
      }

      if (dataTemplateFilter.length !== 0) {
        const invoiceTemplateDto: InvoiceTemplateDto = new InvoiceTemplateDto(
          dataTemplateFilter.at(0)
        );

        const refId = Utils.getUUID();

        const invoiceMisaInsertDto: InvoiceMisaInsertDto =
          new InvoiceMisaInsertDto(
            refId,
            request.invoice,
            request.exportInvoiceDTO,
            request.invoiceDetails,
            invoiceTemplateDto,
            request.loginToPartNer
          );

        let dataMinVoice: any = await new UtilsHttpServiceCustom(
          apiPartNer.apiMisaCreate,
          [invoiceMisaInsertDto],
          request.loginToPartNer.token.access_token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
          "Content-Type": "application/json",
          taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
        });

        const invoiceMisaInsertDtoSave =
          this.invoiceSendThirdPartyLogSchema.create(invoiceMisaInsertDto);

        (await invoiceMisaInsertDtoSave).save();

        if (dataMinVoice.error) {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              dataMinVoice.error
            ),
            HttpStatus.OK
          );
        }

        await Promise.all([
          this.invoiceModel.findByIdAndUpdate(request.exportInvoiceDTO.id, {
            customer_name: request.exportInvoiceDTO.customer_name,
            customer_phone: request.exportInvoiceDTO.customer_phone,
            customer_company_name:
              request.exportInvoiceDTO.customer_company_name,
            customer_company_tax_code:
              request.exportInvoiceDTO.customer_company_tax_code,
            customer_company_address:
              request.exportInvoiceDTO.customer_company_address,
            customer_company_email:
              request.exportInvoiceDTO.customer_company_email,
            customer_bank_account:
              request.exportInvoiceDTO.customer_bank_account,
            customer_bank_account_name:
              request.exportInvoiceDTO.customer_company_name,
            ref_code: refId,
            exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()),
            invoice_status: InvoiceStatusEnum.EXPORT,
            voice_series: request.restaurantPartnerInvoiceEntity.invoice_series,
            partner_type:
              request.restaurantPartnerInvoiceEntity
                .partner_electronic_invoice_type,
            is_send_mail: request.exportInvoiceDTO.is_send_mail,
          }),
        ]);
      } else {
        console.log(
          `Nhà hàng ${request.restaurantPartnerInvoiceEntity.restaurant_id} đã cấu hình sai chữ ký điện tử`
        );
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, error.message),
        HttpStatus.OK
      );
    }
    return "ok";
  }

  async cancel(
    request:
      | {
        loginToPartNer: {
          token: string;
          data: any;
          partner_electronic_invoice_type: number;
        };
        invoice: Invoice;
        restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
      }
      | any
  ) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    const deleteUrl = new UtilsParamHttpService(
      {
        invoiceWithCode: true,
        refid: request.invoice.ref_code,
      },
      apiPartNer.apiMisaCancel
    ).getUrl();

    const dataResponse = await new UtilsHttpServiceCustom(
      deleteUrl,
      "",
      request.loginToPartNer.token.access_token,
      HttpServiceBase.getHttpServiceInstance()
    ).delete({
      Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
      taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
    });

    if (dataResponse.error) {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, dataResponse.error),
        HttpStatus.OK
      );
    }
  }

  async getDetail(
    request:
      | {
        loginToPartNer: {
          token: string;
          data: any;
          partner_electronic_invoice_type: number;
        };
        invoice: Invoice | Invoice[];
        restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
      }
      | any
  ) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    let dataApiGetDetail: any;

    try {
      if (Array.isArray(request.invoice)) {
        const invoices: Invoice[] = request.invoice as Invoice[];

        const refIds: Array<string> = invoices.map((x) => x.ref_code);

        dataApiGetDetail = await new UtilsHttpServiceCustom(
          apiPartNer.apiMisaGetInfoByRefIds + "?invoiceWithCode=true",
          refIds,
          request.loginToPartNer.token.access_token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
          "Content-Type": "application/json",
          taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
        });
      } else {
        dataApiGetDetail = await new UtilsHttpServiceCustom(
          apiPartNer.apiMisaGetInfoByRefIds + "?invoiceWithCode=true",
          [request.invoice.ref_code],
          request.loginToPartNer.token.access_token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
          "Content-Type": "application/json",
          taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
        });
      }
    } catch (error) {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, error.message),
        HttpStatus.OK
      );
    }
    if (dataApiGetDetail.error) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          dataApiGetDetail.error
        ),
        HttpStatus.OK
      );
    }
    if (dataApiGetDetail.data) {
      return JSON.parse(dataApiGetDetail.data);
    } else {
      return;
    }
  }

  async update(
    request:
      | {
        loginToPartNer: {
          token: string;
          data: any;
          partner_electronic_invoice_type: number;
        };
        invoice: Invoice;
        restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
      }
      | any
  ) {
    try {
      let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      const invoiceDetail: InvoiceDetail[] = await this.invoiceDetailModel.find(
        {
          order_id: request.invoice.order_id,
          status: 1,
        }
      );

      const deleteUrl = new UtilsParamHttpService(
        {
          invoiceWithCode: true,
          refid: request.invoice.ref_code,
        },
        apiPartNer.apiMisaCancel
      ).getUrl();

      await new UtilsHttpServiceCustom(
        deleteUrl,
        "",
        request.loginToPartNer.token.access_token,
        HttpServiceBase.getHttpServiceInstance()
      ).delete({
        Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
        taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
      });

      let dataTemplate: any = await new UtilsHttpServiceCustom(
        apiPartNer.apiMisaGetTemplate + "?invoiceWithCode=true",
        {
          TypeInvoice: 0,
          taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
          username: request.restaurantPartnerInvoiceEntity.username,
          password: request.restaurantPartnerInvoiceEntity.password,
        },
        "",
        HttpServiceBase.getHttpServiceInstance()
      ).post();

      const dataTemplateFilter: any[] = JSON.parse(dataTemplate.data).filter(
        (item: any) =>
          item.InvSeries ===
          request.restaurantPartnerInvoiceEntity.invoice_series
      );

      const invoiceTemplateDto: InvoiceTemplateDto = new InvoiceTemplateDto(
        dataTemplateFilter.at(0)
      );

      const refId = Utils.getUUID();

      for (const e of invoiceDetail) {
        if (![0, 5, 8, 10].includes(+e.vat)) {
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              InvoiceHandlerException.FOOD_VAT_MUST_BE_IN_VALUE_MISA
            ),
            HttpStatus.OK
          );
        }
      }

      const invoiceMisaInsertByNewInvoiceDto: InvoiceMisaInsertByNewInvoiceDto =
        new InvoiceMisaInsertByNewInvoiceDto(
          refId,
          request.invoice,
          invoiceDetail,
          invoiceTemplateDto,
          request.loginToPartNer
        );

      let [dataMinVoice] = await Promise.all([
        new UtilsHttpServiceCustom(
          apiPartNer.apiMisaCreate,
          [invoiceMisaInsertByNewInvoiceDto],
          request.loginToPartNer.token.access_token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          Authorization: `Bearer ${request.loginToPartNer.token.access_token}`,
          "Content-Type": "application/json",
          taxcode: request.restaurantPartnerInvoiceEntity.tax_code,
        }),

        await this.invoiceModel.findByIdAndUpdate(request.invoice._id, {
          ref_code: refId,
        }),
      ]);
    } catch (error) {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, error.message),
        HttpStatus.OK
      );
    }
  }
}
