import { Injectable } from "@nestjs/common";
import { ThirdPartyFactory } from "../factory/Third-party-factory";
import { ThirdPartyMiFi } from "../invoice-mifi/servcie/third-party-mifi.service";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { InvoiceExportSagaRequest } from "src/common/interfaces/saga.interface";

@Injectable()
export class ThirdPartyServiceAdapter {
  static ThirdPartyServiceAdapter(
    arg0: {
      token: string;
      invoice: import("../../common/schemas/invoice.schema").Invoice;
      restaurantPartnerInvoiceEntity: import("../../common/entities/restaurant-partner-invoice.entity").RestaurantPartnerInvoiceEntity;
    },
    arg1: string,
    M_INVOICE: PartnerElectronicInvoiceTypeEnum
  ) {
    throw new Error("Method not implemented.");
  }

  constructor() {}

  public static async export(
    request?: any,
    token?: string,
    type?: number
  ): Promise<any> {
    return (await ThirdPartyFactory.ThirdParty(type)).export(request);
  }

  public static async update(
    request?: any,
    token?: string,
    type?: number
  ): Promise<any> {
    return (await ThirdPartyFactory.ThirdParty(type)).update(request);
  }

  public static async cancel(
    request?: any,
    token?: string,
    type?: number
  ): Promise<any> {
    return (await ThirdPartyFactory.ThirdParty(type)).cancel(request);
  }

  public static async getDetail(
    request?: any,
    token?: string,
    type?: number
  ): Promise<any> {
    return (await ThirdPartyFactory.ThirdParty(type)).getDetail(request);
  }

  public static async getFkey(request?: any): Promise<any> {
    return new ThirdPartyMiFi().getFkey(request);
  }

  public async executeThirdPartyCall(
    request: InvoiceExportSagaRequest
  ): Promise<any> {
    try {
      const { token, partnerType } = request;
      const result = await ThirdPartyServiceAdapter.export(
        request.logData,
        token,
        partnerType
      );
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Third party API call failed",
      };
    }
  }

  public async compensateThirdPartyCall(compensationData: any): Promise<void> {
    try {
      if (compensationData?.thirdPartyTransactionId) {
        const { token, type, ...cancelRequest } = compensationData;
        await ThirdPartyServiceAdapter.cancel(
          {
            ...cancelRequest,
            transactionId: compensationData.thirdPartyTransactionId,
          },
          token,
          type
        );
      }
      console.log(
        "Third party call compensated successfully",
        compensationData
      );
    } catch (error) {
      console.error("Failed to compensate third party call:", error);
    }
  }
}
