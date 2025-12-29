import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { IFptInvoice } from "src/partner/interface/fpt-invoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import {
  InvoiceConvertPartNerFptDto,
  InvoiceFormExportInvoicePartNerFpt,
} from "src/partner/invoice-fpt/fpt-invoice/dto/export_invoice.dto";
import { InvoiceFormUpdateInvoicePartNerFpt } from "src/partner/invoice-fpt/fpt-invoice/dto/update.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceCancelFPT } from "src/partner/invoice-fpt/fpt-invoice/dto/cancel.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { InvoiceResponseFpt } from "src/common/responses/InvoiceFptResponse";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
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

@Injectable()
export class ThirdPartyFpt implements ThirdParty, IFptInvoice {
  constructor(
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper?: InvoiceHelper
  ) {}

  async getThirdParty(): Promise<ThirdPartyFpt> {
    return this;
  }

  async export(request: {
    token: string;
    invoice: Invoice;
    exportInvoiceDTO: ExportInvoiceDTO;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    let invoiceDetails: InvoiceDetail[] = await this.invoiceDetailModel.find({
      order_id: request.invoice.order_id,
    });

    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let dataInvoice: any = await new UtilsHttpServiceCustom(
      apiPartNer.apiFptCreate,
      new InvoiceFormExportInvoicePartNerFpt(
        new InvoiceConvertPartNerFptDto(
          request.exportInvoiceDTO,
          request.invoice,
          invoiceDetails,
          request.restaurantPartnerInvoiceEntity
        )
      ),
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await this.invoiceHelper.findByIdAndUpdateInvoice(
      request.exportInvoiceDTO.id,
      request.exportInvoiceDTO.customer_name,
      request.exportInvoiceDTO.customer_phone,
      request.exportInvoiceDTO.customer_company_name,
      request.exportInvoiceDTO.customer_company_tax_code,
      request.exportInvoiceDTO.customer_company_address,
      request.exportInvoiceDTO.customer_company_email,
      request.exportInvoiceDTO.customer_bank_account,
      request.exportInvoiceDTO.customer_company_name,
      dataInvoice.ic,
      dataInvoice.idt,
      InvoiceStatusEnum.EXPORT,
      request.restaurantPartnerInvoiceEntity.invoice_series,
      request.restaurantPartnerInvoiceEntity.partner_electronic_invoice_type,
      request.exportInvoiceDTO.is_send_mail
    );

    return new InvoiceResponseFpt(dataInvoice, "Đã gửi hóa đơn thành công");
  }

  async cancel(request: {
    invoice: Invoice;
    token: string;
    invoiceCancelFPT: InvoiceCancelFPT;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    await new UtilsHttpServiceCustom(
      apiPartNer.apiFptCancel,
      request.invoiceCancelFPT,
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await this.invoiceHelper.findByIdAndUpdateExportTime(
      request.invoice._id,
      UtilsDate.formatFullDateTimeInvoice(new Date())
    );
  }

  async update(request: {
    token: string;
    invoiceFormUpdateInvoicePartNerFpt: InvoiceFormUpdateInvoicePartNerFpt;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    invoiceId: string;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let dataInvoice: any = await new UtilsHttpServiceCustom(
      apiPartNer.apiFptUpdate,
      request.invoiceFormUpdateInvoicePartNerFpt,
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await new UtilsHttpServiceCustom(
      apiPartNer.apiFptSigning,
      {
        inv: {
          sid: dataInvoice.sid,
          form: "1",
          serial: request.invoice.voice_series,
          seq: dataInvoice.seq,
          stax: request.restaurantPartnerInvoiceEntity.tax_code,
        },
      },
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await this.invoiceHelper.findByIdAndUpdateInvoiceStatusAndRefcodeAndOrderIdAndExportedTime(
      request.invoiceId,
      {
        invoice_status: InvoiceStatusEnum.UPDATE_IN_PARTNER,
        ref_code: dataInvoice.sid,
        order_id: parseInt(dataInvoice.seq),
        exported_time: dataInvoice.idt,
      }
    );

    let invoiceDetailUpdate: InvoiceDetail[] =
      await this.invoiceDetailModel.find({
        order_id: request.invoice.order_id,
      });

    for (const e of invoiceDetailUpdate) {
      await this.invoiceDetailModel.findByIdAndUpdate(e["_id"], {
        order_id: parseInt(dataInvoice.seq),
      });
    }
  }

  async getDetail(request: {
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let url: string = new UtilsParamHttpService(
      {
        sid: request.invoice.ref_code,
        type: "json",
        stax: request.restaurantPartnerInvoiceEntity.tax_code,
        serial: request.invoice.voice_series,
        form: "1",
        seq: ConvertNumberToString.numberToSeq(request.invoice.order_id),
      },
      apiPartNer.apiFptGetInfo
    ).getUrl();

    let dataResult = await new UtilsHttpServiceCustom(
      url,
      {},
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).get();

    if (dataResult[0].doc.status_received === 10) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.TAX_AUTHORITIES_WAS_ACCEPTED_INVOICE
        ),
        HttpStatus.OK
      );
    }
  }
}
