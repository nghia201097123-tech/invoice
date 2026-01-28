import { IInvoiceVNPt } from "src/partner/interface/invoice-vnpt.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { ExceptionType } from "src/common/enums/exception-type.enum";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import { InvoiceResponseVnpt } from "src/common/responses/invoice-vnpt.response";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { Employee } from "src/common/entities/employee.entity";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import * as xml2js from "xml2js";
import { ExceptionVnpt } from "../exception.vnpt";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { CacheService } from "src/redis/services/cache.service";
import { RestaurantBrandEntity } from "src/common/entities/restaurant-brand.entity";
import { RestaurantBrandService } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ThirdPartyVnPt implements ThirdParty, IInvoiceVNPt {
  constructor(
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper: InvoiceHelper,
    private readonly restaurantBrandService: RestaurantBrandService
  ) {}

  getDetail() {
    throw new Error("Method not implemented.");
  }
  cancel() {
    throw new Error("Method not implemented.");
  }

  private async getRestaurantBrandCached(
    id: number
  ): Promise<RestaurantBrandEntity> {
    try {
      if (!this.restaurantBrandService) {
        throw new Error("RestaurantBrandService is not injected properly");
      }

      return await this.restaurantBrandService.findById(id);
    } catch (error) {
      console.error(`❌ Error getting restaurant brand ${id}:`, error.message);
      throw error;
    }
  }

  async export(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    exportInvoiceDTO?: ExportInvoiceDTO;
    invoice?: Invoice;
  }) {
    const restaurantBrand = await this.getRestaurantBrandCached(
      request.invoice.restaurant_brand_id
    );
    const { restaurantPartnerInvoiceEntity, exportInvoiceDTO, invoice } =
      request;
    const restaurantInvoiceVat =
      this.calculateRestaurantInvoiceVat(restaurantBrand);

    const invoiceDetails = await this.getInvoiceDetails(
      invoice.order_id.toString()
    );

    const DSHHDVu = this.mapInvoiceDetails(
      invoiceDetails,
      restaurantInvoiceVat
    );
    const xmlData = this.generateXmlData(DSHHDVu);
    const soapEnvelope = this.generateSoapEnvelope(request, xmlData);

    const apiPartner = ApiPartNer.getInstance(restaurantPartnerInvoiceEntity);
    const dataInvoice = await this.postSoapRequest(
      apiPartner.apiVnptPublish,
      soapEnvelope
    );

    const jsonResult = await this.parseXmlToJson(dataInvoice);
    this.validateVnptResponse(jsonResult);

    const stringResult = this.extractStringResult(jsonResult);
    const refCode = this.extractRefCode(stringResult);

    await this.updateInvoice(
      exportInvoiceDTO,
      refCode,
      restaurantPartnerInvoiceEntity
    );
    return this.createInvoiceResponse(exportInvoiceDTO, stringResult);
  }

  async update(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    invoiceDetail: InvoiceDetail[];
    invoice?: Invoice;
    amount?: number;
    totalAmount?: number;
    vatAmount?: number;
    restaurantInvoiceVat?: number;
  }) {
    const { restaurantPartnerInvoiceEntity, invoiceDetail, invoice } = request;

    const apiPartner = ApiPartNer.getInstance(restaurantPartnerInvoiceEntity);
    const DSHHDVu = this.mapInvoiceDetails(
      invoiceDetail,
      request.restaurantInvoiceVat
    );
    const xmlData = this.generateXmlData(DSHHDVu);
    const fkey = this.generateFkey();

    const soapEnvelope = this.generateAdjustSoapEnvelope(
      request,
      xmlData,
      fkey
    );

    const dataInvoice = await this.postSoapRequest(
      apiPartner.apiVnptBusiness,
      soapEnvelope
    );

    const jsonResult = await this.parseXmlToJson(dataInvoice);

    this.validateVnptResponseUpdate(jsonResult, ExceptionType.BUSINESSSERVICE);

    const stringResult = this.extractStringResultUpdate(
      jsonResult,
      "AdjustInvMTTResponse"
    );
    const refCode = this.extractRefCode(stringResult);

    await this.updateInvoiceStatus(invoice._id, fkey, refCode);
    await this.updateInvoiceDetails(invoice.order_id.toString(), fkey);

    return jsonResult;
  }

  private generateFkey(): string {
    return uuidv4();
  }

  private generateAdjustSoapEnvelope(
    request: any,
    xmlData: string,
    fkey: string
  ): string {
    const {
      restaurantPartnerInvoiceEntity,
      invoice,
      amount,
      totalAmount,
      vatAmount,
    } = request;

    const calculateAmount = (
      amount: number,
      totalAmount: number,
      discountPercent: number
    ) =>
      Math.floor(amount - Math.floor((totalAmount * discountPercent) / 100)) < 0
        ? 0
        : Math.floor(amount);

    const calculatedAmount = calculateAmount(
      amount,
      totalAmount,
      invoice.discount_percent
    );
    const calculatedVatAmount = calculateAmount(
      vatAmount,
      totalAmount,
      invoice.discount_percent
    );

    return `<?xml version="1.0" encoding="utf-8"?>
          <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
          xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
          <soap12:Body>
          <AdjustInvMTT xmlns="http://tempuri.org/">
          <Account>${restaurantPartnerInvoiceEntity.username}</Account>
          <ACpass>${restaurantPartnerInvoiceEntity.password}</ACpass>
          <xmlInvData>
              <![CDATA[
                      <DieuChinhHD>
                          <key>${fkey}</key>
                          <Type>4</Type>
                          <TTChung>
                              <NLap>${UtilsDate.convertDateFormat(
                                new Date().toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              )}</NLap>
                              <DVTTe>VND</DVTTe>
                              <TGia>1</TGia>
                              <HTTToan>TM</HTTToan>
                          </TTChung>
                          <NDHDon>
                          <NMua>
                              <Ten>${invoice.customer_name}</Ten>
                              <MST>${invoice.customer_company_tax_code}</MST>
                              <SDThoai>${invoice.customer_phone}</SDThoai>
                              <CCCDan></CCCDan>
                              <DCTDTu>${invoice.customer_company_email}</DCTDTu>
                              <MKHang></MKHang>
                          </NMua>
                      <DSHHDVu>
                      ${xmlData}
                      </DSHHDVu>
                      <TToan>
                          <THTTLTSuat>
                              <LTSuat>
                                  <TThue>${calculatedVatAmount}</TThue>
                                  <ThTien>${calculatedVatAmount}</ThTien>
                              </LTSuat>
                      </THTTLTSuat>
                      <TgTCThue>${calculatedAmount}</TgTCThue>
                      <TgTThue>${calculatedVatAmount}</TgTThue>
                      <TTCKTMai>0</TTCKTMai>
                      <TgTTTBSo>${Math.floor(
                        calculatedAmount + calculatedVatAmount
                      )}</TgTTTBSo>
                      <TgTTTBChu>${ConvertNumberToString.numberToWords(
                        Math.floor(calculatedAmount + calculatedVatAmount)
                      )}</TgTTTBChu>
                  </TToan>
                  </NDHDon>
              </DieuChinhHD>
              ]]>
              </xmlInvData>
          <username>${
            restaurantPartnerInvoiceEntity.username_access_service
          }</username>
          <pass>${restaurantPartnerInvoiceEntity.password_access_service}</pass>
          <pattern>${
            restaurantPartnerInvoiceEntity.invoice_denominator
          }</pattern>
          <serial>${restaurantPartnerInvoiceEntity.invoice_series}</serial>
          <fkey>${invoice.order_id}</fkey>
          <convert>0</convert>
          <oldpattern>1</oldpattern>
      </AdjustInvMTT>
      </soap12:Body>
      </soap12:Envelope>`;
  }

  private validateVnptResponseUpdate(
    jsonResult: any,
    exceptionType: ExceptionType
  ): void {
    ExceptionVnpt.throwExceptionVnpt(
      jsonResult["soap:Envelope"]["soap:Body"][0].AdjustInvMTTResponse[0]
        .AdjustInvMTTResult[0],
      exceptionType
    );
  }

  private extractStringResultUpdate(
    jsonResult: any,
    responseName: string
  ): string[] {
    return jsonResult["soap:Envelope"]["soap:Body"][0][`${responseName}`][0][
      `${responseName}Result`
    ][0].split(";");
  }

  private async updateInvoiceStatus(
    invoiceId: string,
    fkey: string,
    refCode: string
  ): Promise<void> {
    await this.invoiceHelper.findByIdAndUpdateInvoiceStatusAndRefcodeAndOrderIdAndExportedTime(
      invoiceId,
      {
        invoice_status: InvoiceStatusEnum.UPDATE_IN_PARTNER,
        ref_code: refCode,
        order_id: parseInt(fkey),
        exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()),
      }
    );
  }

  private async updateInvoiceDetails(
    oldOrderId: string,
    newOrderId: string
  ): Promise<void> {
    const invoiceDetailUpdate: InvoiceDetail[] =
      await this.invoiceDetailModel.find({ order_id: oldOrderId });

    for (const detail of invoiceDetailUpdate) {
      await this.invoiceDetailModel.findByIdAndUpdate(detail["_id"], {
        order_id: parseInt(newOrderId),
      });
    }
  }

  async getThirdParty(): Promise<ThirdPartyVnPt> {
    return this;
  }

  private async getInvoiceDetails(orderId: string): Promise<InvoiceDetail[]> {
    return this.invoiceDetailModel.find({ order_id: orderId });
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
      return defaultVat;
    }

    return vat;
  }
  private mapInvoiceDetails(
    invoiceDetails: InvoiceDetail[],
    restaurantInvoiceVat?: number
  ): any[] {
    return invoiceDetails.map((detail, index) => {
      const quantity = detail ? Number(detail.quantity.toFixed(2)) : 0;
      const unitPrice = detail.price ?? 0;
      // Thành tiền = Số lượng × Đơn giá (không cộng VAT vào thành tiền món ăn)
      const thanhTien = Math.ceil(quantity * unitPrice);

      return {
        HHDVu: {
          TChat: 1,
          STT: index,
          MHHDVu: "DV",
          THHDVu: detail.food_name,
          DVTinh: detail.food_unit,
          SLuong: quantity,
          DGia: unitPrice,
          TLCKhau: detail.discount_percent,
          STCKhau: detail.discount_amount,
          ThTien: thanhTien,
          TSuat: detail.vat,
          TThue: detail.vat_amount,
          TSThue: thanhTien + (detail.vat_amount ?? 0),
        },
      };
    });
  }

  private generateXmlData(DSHHDVu: any[]): string {
    return DSHHDVu.map(
      (item) => `
        <HHDVu>
          <TChat>${item.HHDVu.TChat}</TChat>
          <STT>${item.HHDVu.STT}</STT>
          <MHHDVu>${item.HHDVu.MHHDVu}</MHHDVu>
          <THHDVu>${item.HHDVu.THHDVu}</THHDVu>
          <DVTinh>${item.HHDVu.DVTinh}</DVTinh>
          <SLuong>${item.HHDVu.SLuong}</SLuong>
          <DGia>${item.HHDVu.DGia}</DGia>
          <TLCKhau>${item.HHDVu.TLCKhau}</TLCKhau>
          <STCKhau>${item.HHDVu.STCKhau}</STCKhau>
          <ThTien>${item.HHDVu.ThTien}</ThTien>
          <TSuat>${item.HHDVu.TSuat}</TSuat>
          <TThue>${item.HHDVu.TThue}</TThue>
          <TSThue>${item.HHDVu.TSThue}</TSThue>
        </HHDVu>
      `
    ).join("\n");
  }

  private async postSoapRequest(
    url: string,
    soapEnvelope: string
  ): Promise<any> {
    const response = await new UtilsHttpService(
      url,
      soapEnvelope,
      new Employee(),
      HttpServiceBase.getHttpServiceInstance()
    ).postSoap();

    // Extract the actual XML data from the response
    return response.data;
  }

  private async parseXmlToJson(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, (error, result) => {
        if (error) reject(error);
        else resolve(JSON.parse(JSON.stringify(result)));
      });
    });
  }

  private validateVnptResponse(jsonResult: any): void {
    ExceptionVnpt.throwExceptionVnpt(
      jsonResult["soap:Envelope"]["soap:Body"][0]
        .ImportAndPublishInvMTTResponse[0].ImportAndPublishInvMTTResult[0],
      ExceptionType.PUBLISHSERVCICE
    );
  }

  private extractStringResult(jsonResult: any): string[] {
    return jsonResult["soap:Envelope"][
      "soap:Body"
    ][0].ImportAndPublishInvMTTResponse[0].ImportAndPublishInvMTTResult[0].split(
      ";"
    );
  }

  private extractRefCode(stringResult: string[]): string {
    return stringResult[1].split("_")[2];
  }

  private shouldSendMail(
    exportInvoiceDTO: ExportInvoiceDTO,
    invoice: Invoice
  ): boolean {
    return exportInvoiceDTO.is_send_mail === 1 || invoice.is_send_mail === 1;
  }

  private createInvoiceResponse(
    exportInvoiceDTO: ExportInvoiceDTO,
    stringResult: string[]
  ): InvoiceResponseVnpt {
    return new InvoiceResponseVnpt(
      exportInvoiceDTO,
      stringResult[1].split("_")[2],
      parseInt(stringResult[1].split("_")[1]),
      "Đã gửi hóa đơn thành công"
    );
  }

  private async updateInvoice(
    exportInvoiceDTO: ExportInvoiceDTO,
    refCode: string,
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ): Promise<void> {
    await this.invoiceHelper.findByIdAndUpdateInvoice(
      exportInvoiceDTO.id,
      exportInvoiceDTO.customer_name,
      exportInvoiceDTO.customer_phone,
      exportInvoiceDTO.customer_company_name,
      exportInvoiceDTO.customer_company_tax_code,
      exportInvoiceDTO.customer_company_address,
      exportInvoiceDTO.customer_company_email,
      exportInvoiceDTO.customer_bank_account,
      exportInvoiceDTO.customer_company_name,
      refCode,
      UtilsDate.formatFullDateTimeInvoice(new Date()),
      InvoiceStatusEnum.EXPORT,
      restaurantPartnerInvoiceEntity.invoice_series,
      restaurantPartnerInvoiceEntity.partner_electronic_invoice_type,
      exportInvoiceDTO.is_send_mail
    );
  }

  private generateSoapEnvelope(request: any, xmlData: string): string {
    const { restaurantPartnerInvoiceEntity, exportInvoiceDTO, invoice } =
      request;
    return `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
        <ImportAndPublishInvMTT xmlns="http://tempuri.org/">
        <Account>${restaurantPartnerInvoiceEntity.username}</Account>
        <ACpass>${restaurantPartnerInvoiceEntity.password}</ACpass>
        <xmlInvData>
        <![CDATA[
          <DSHDon>
        <HDon>
            <key>${invoice.order_id}</key>
            <DLHDon>
                <TTChung>
                    <NLap/>
                    <DVTTe>VND</DVTTe>
                    <TGia/>
                    <HTTToan>TM</HTTToan>
                </TTChung>
          <NDHDon>
              <NMua>
                  <Ten>${exportInvoiceDTO.customer_company_name}</Ten>
                  <HVTNMHang>${exportInvoiceDTO.customer_name}</HVTNMHang>
                  <MST>${exportInvoiceDTO.customer_company_tax_code}</MST>
                  <SDThoai>${exportInvoiceDTO.customer_phone}</SDThoai>
                  <DChi>${exportInvoiceDTO.customer_company_address}</DChi>
                  <CCCDan/>
                  <DCTDTu/>
              </NMua>
              <DSHHDVu>
          ${xmlData}
              </DSHHDVu>
                  <TToan>
                      <THTTLTSuat>
                          <LTSuat>
                              <TSuat>${invoice.vat}</TSuat>
                              <TThue>${
                                invoice.vat_amount
                                  ? Math.round(invoice.vat_amount)
                                  : 0
                              }</TThue>
                              <ThTien>${
                                invoice.amount ? Math.round(invoice.amount) : 0
                              }</ThTien>
                          </LTSuat>
                      </THTTLTSuat>
                      <TgTCThue>${
                        invoice.amount ? Math.round(invoice.amount) : 0
                      }</TgTCThue>
                      <TgTThue>${
                        invoice.vat_amount ? Math.round(invoice.vat_amount) : 0
                      }</TgTThue>
                      <TTCKTMai>${
                        invoice.total_amount_discount_amount
                      }</TTCKTMai>
                      <TgTTTBSo>${
                        invoice.total_amount
                          ? Math.round(invoice.total_amount)
                          : 0
                      }</TgTTTBSo>
                      <TgTTTBChu>${ConvertNumberToString.numberToWords(
                        invoice.total_amount
                          ? Math.round(invoice.total_amount)
                          : 0
                      )} đồng</TgTTTBChu>
                  </TToan>
              </NDHDon>
          </DLHDon>
      </HDon>
      </DSHDon>
      ]]>
      </xmlInvData>
      <username>${
        restaurantPartnerInvoiceEntity.username_access_service
      }</username>
      <password>${
        restaurantPartnerInvoiceEntity.password_access_service
      }</password>
      <pattern>${restaurantPartnerInvoiceEntity.invoice_denominator}</pattern>
      <serial>${restaurantPartnerInvoiceEntity.invoice_series}</serial>
      <convert>0</convert>
      </ImportAndPublishInvMTT>
        </soap12:Body>
      </soap12:Envelope>`;
  }
}
