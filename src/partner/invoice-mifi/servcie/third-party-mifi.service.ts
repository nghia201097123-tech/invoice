import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { IInvoiceMiFi } from "src/partner/interface/mifi-invoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import { InvoiceConvertPartNerMiFiDto } from "src/partner/invoice-mifi/dto/export.dto";
import { InvoiceCancelConvertPartnerMifiDto } from "src/partner/invoice-mifi/dto/cancel.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceUpdateConVerPartNerMiFiDto } from "src/partner/invoice-mifi/dto/update.dto";
import { GetDetailInvoiceMifiDto } from "src/partner/invoice-mifi/dto/get_detail.dto";
import { GetFKeyMiFiDto } from "src/partner/invoice-mifi/dto/get_fkey.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { InvoiceMifiResponse } from "src/common/responses/invoice-response-mifi";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { Employee } from "src/common/entities/employee.entity";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";

@Injectable()
export class ThirdPartyMiFi implements ThirdParty, IInvoiceMiFi {
  constructor(
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper?: InvoiceHelper
  ) {}

  async getThirdParty(): Promise<ThirdPartyMiFi> {
    return this;
  }

  async export(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    exportInvoiceDTO?: ExportInvoiceDTO;
    invoice?: Invoice;
    invoiceConvertPartNerMiFiDto?: InvoiceConvertPartNerMiFiDto;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let dataInvoice: any = await new UtilsHttpService(
      apiPartNer.apiMifiCreate,
      request.invoiceConvertPartNerMiFiDto,
      new Employee(),
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await this.invoiceHelper.findByIdAndUpdateInvoiceHaveFkey(
      request.exportInvoiceDTO.id,
      request.exportInvoiceDTO.customer_name,
      request.exportInvoiceDTO.customer_phone,
      request.exportInvoiceDTO.customer_company_name,
      request.exportInvoiceDTO.customer_company_tax_code,
      request.exportInvoiceDTO.customer_company_address,
      request.exportInvoiceDTO.customer_company_email,
      request.exportInvoiceDTO.customer_bank_account,
      request.exportInvoiceDTO.customer_company_name,
      dataInvoice.data[0].Key,
      request.invoice.order_id.toString(),
      dataInvoice.data[0].InvNo,
      UtilsDate.formatFullDateTimeInvoice(new Date()),
      InvoiceStatusEnum.EXPORT,
      request.restaurantPartnerInvoiceEntity.invoice_series,
      request.restaurantPartnerInvoiceEntity.partner_electronic_invoice_type
    );

    (
      await Promise.all([
        await this.invoiceDetailModel.find({
          order_id: request.invoice.order_id,
        }),
      ])
    ).map(
      async (invDe: any) =>
        await this.invoiceDetailModel.findByIdAndUpdate(invDe._id, {
          order_id: request.invoice.order_id,
        })
    );
    return new InvoiceMifiResponse(
      dataInvoice,
      request.exportInvoiceDTO,
      request.invoice
    );
  }

  async cancel(request: {
    invoice?: Invoice;
    invoiceCancelConvertPartnerMifiDto?: InvoiceCancelConvertPartnerMifiDto;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    await new UtilsHttpServiceCustom(
      apiPartNer.apiMifiCancel,
      request.invoiceCancelConvertPartnerMifiDto,
      "",
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    await this.invoiceHelper.findByIdAndUpdateExportTime(
      request.invoice._id,
      UtilsDate.formatFullDateTimeInvoice(new Date())
    );
  }

  async update(request: {
    invoice: Invoice;
    invoiceUpdateConverPartNerMiFiDto: InvoiceUpdateConVerPartNerMiFiDto;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }) {
    await this.invoiceHelper.findByIdAndUpdateInvoiceStatusAndRefCodeAndExportTime(
      request.invoice._id,
      {
        invoice_status: InvoiceStatusEnum.UPDATE_IN_PARTNER,
        ref_code: request.invoiceUpdateConverPartNerMiFiDto.Fkey,
        exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()),
      }
    );

    let invoiceDetailUpdate: InvoiceDetail[] =
      await this.invoiceDetailModel.find({
        order_id: request.invoice.order_id,
      });
    for (const e of invoiceDetailUpdate) {
      await this.invoiceDetailModel.findByIdAndUpdate(e["_id"], {
        order_id: request.invoice.order_id,
      });
    }
  }

  async getFkey(request: {
    getFKeyMiFiDto: GetFKeyMiFiDto;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    return await new UtilsHttpServiceCustom(
      apiPartNer.apiMifiFkey,
      request.getFKeyMiFiDto,
      "",
      HttpServiceBase.getHttpServiceInstance()
    ).post();
  }

  async getDetail(request: {
    getDetailInvoiceMifiDto: GetDetailInvoiceMifiDto;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    return await new UtilsHttpServiceCustom(
      apiPartNer.apiMifiGetInfo,
      request.getDetailInvoiceMifiDto,
      "",
      HttpServiceBase.getHttpServiceInstance()
    ).post();
  }
}
