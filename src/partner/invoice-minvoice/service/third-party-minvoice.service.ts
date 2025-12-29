import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { IMinVoice } from "src/partner/interface/minvoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import { InvoiceConvertPartnerMInvoiceDTO } from "src/partner/invoice-minvoice/dto/export.dto";
import { ExportInvoiceDto } from "src/common/dto/invoice-export.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { InvoiceResponse } from "src/common/responses/invoice.response.Minvoice";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice, InvoiceDocument } from "src/common/schemas/invoice.schema";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { InvoiceConvertPartnerCancelMInvoiceDTO } from "../dto/cancle.dto";
import { InvoiceConvertPartnerUpdateMInvoiceDTO } from "src/partner/invoice-minvoice/dto/update.dto";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";

@Injectable()
export class ThirdPartyMinVoice implements ThirdParty, IMinVoice {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel?: Model<InvoiceDocument>,
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper?: InvoiceHelper
  ) {}
  async getThirdParty(): Promise<ThirdPartyMinVoice> {
    return this;
  }

  async update(request: {
    invoiceId: string;
    token: string;
    invoiceUpdatePartNer: InvoiceConvertPartnerUpdateMInvoiceDTO;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let dataMInvoice: any = await new UtilsHttpServiceCustom(
      apiPartNer.apiMinVoiceUpdate,
      request.invoiceUpdatePartNer,
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    if (dataMInvoice.message && dataMInvoice.data == null) {
      if (
        dataMInvoice.message ===
        "Can't adjustment invoice because invoice status send tax  it is status new or adjusted"
      ) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Không thể điều chỉnh hóa đơn vì trạng thái hóa đơn gửi thuế là trạng thái mới"
          ),
          HttpStatus.OK
        );
      }

      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          dataMInvoice.message
        ),
        HttpStatus.OK
      );
    }

    let data = await new UtilsHttpServiceCustom(
      apiPartNer.apiMinVoiceSign,
      { hoadon68_id: dataMInvoice.data.hoadon68_id },
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    if (data.code == "99") {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, data.message),
        HttpStatus.OK
      );
    }

    await this.invoiceHelper.findByIdAndUpdateInvoiceStatusAndRefCodeAndExportTime(
      request.invoiceId,
      {
        invoice_status: InvoiceStatusEnum.UPDATE_IN_PARTNER,
        ref_code: request.invoice.ref_code,
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

  async getDetail(request: {
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let url: string = new UtilsParamHttpService(
      { id: request.invoice.ref_code },
      apiPartNer.apiMinVoiceGetInfo
    ).getUrlSingleParam();

    let dataResult = await new UtilsHttpServiceCustom(
      url,
      {},
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).get();

    if (dataResult.message && dataResult.data == null) {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, dataResult.message),
        HttpStatus.OK
      );
    }
    if (dataResult.data.is_success == 1) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          "Chi cục thuế đã duyệt.Sau 3h sáng sẽ được chuyển qua mục được duyệt"
        ),
        HttpStatus.OK
      );
    }
    if ("error" in dataResult) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          dataResult["error"]
        ),
        HttpStatus.OK
      );
    }
  }

  async cancel(request: {
    invoice: Invoice;
    token: string;
    invoiceConvertPartnerCancelMInvoiceDTO: InvoiceConvertPartnerCancelMInvoiceDTO;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  }) {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );

    let dataInvoice = await new UtilsHttpServiceCustom(
      apiPartNer.apiMinVoiceCancel,
      request.invoiceConvertPartnerCancelMInvoiceDTO,
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    if (dataInvoice.message && dataInvoice.data == null) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          dataInvoice.message
        ),
        HttpStatus.OK
      );
    }

    await this.invoiceHelper.findByIdAndUpdateExportTime(
      request.invoice._id,
      UtilsDate.formatFullDateTimeInvoice(new Date())
    );
  }

  async export(request: {
    token: string;
    invoice: Invoice;
    invoiceConvertPartnerMInvoiceDTO: InvoiceConvertPartnerMInvoiceDTO;
    exportInvoiceDTO: ExportInvoiceDTO;
    restaurantPartnerInvoiceEntity;
  }): Promise<any> {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    let dataMinVoice: any = await new UtilsHttpServiceCustom(
      apiPartNer.apiMinVoiceCreate,
      new ExportInvoiceDto(
        PartnerElectronicInvoiceTypeEnum.M_INVOICE,
        request.invoiceConvertPartnerMInvoiceDTO
      ),
      request.token,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    // if (dataMinVoice.data == null && dataMinVoice.message) {
    //   throw new HttpException(
    //     new ExceptionResponseDetail(
    //       HttpStatus.BAD_REQUEST,
    //       dataMinVoice.message
    //     ),
    //     HttpStatus.OK
    //   );
    // }

    await this.invoiceModel.findByIdAndUpdate(request.exportInvoiceDTO.id, {
      customer_name: request.exportInvoiceDTO.customer_name,
      customer_phone: request.exportInvoiceDTO.customer_phone,
      customer_company_name: request.exportInvoiceDTO.customer_company_name,
      customer_company_tax_code:
        request.exportInvoiceDTO.customer_company_tax_code,
      customer_company_address:
        request.exportInvoiceDTO.customer_company_address,
      customer_company_email: request.exportInvoiceDTO.customer_company_email,
      customer_bank_account: request.exportInvoiceDTO.customer_bank_account,
      customer_bank_account_name:
        request.exportInvoiceDTO.customer_company_name,
      ref_code: dataMinVoice.data?.hoadon68_id || "",
      exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()),
      invoice_status: InvoiceStatusEnum.EXPORT,
      voice_series: request.restaurantPartnerInvoiceEntity.invoice_series,
      partner_type:
        request.restaurantPartnerInvoiceEntity.partner_electronic_invoice_type,
      is_send_mail: request.exportInvoiceDTO.is_send_mail,
    });

    return new InvoiceResponse(dataMinVoice.data, "Đã gửi lên chi cục thuế");
  }
}
