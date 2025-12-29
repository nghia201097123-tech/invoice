import { Injectable } from "@nestjs/common";
import { ViettelInvoiceExportDto } from "../dto/export.dto";
import { VIETTEL_CONSTANTS } from "../constants/viettel.constants";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";

@Injectable()
export class ViettelHelper {
  /**
   * Format invoice date for Viettel API
   */
  formatInvoiceDate(date: Date): string {
    return UtilsDate.formatFullDateTimeInvoice(date);
  }

  /**
   * Generate authentication header for Viettel API
   */
  generateAuthHeader(accessToken: string): { [key: string]: string } {
    return {
      Cookie: `access_token=${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Calculate total amounts
   */
  calculateTotals(items: any[]): {
    totalAmountWithoutVat: number;
    totalVatAmount: number;
    totalAmount: number;
  } {
    let totalAmountWithoutVat = 0;
    let totalVatAmount = 0;

    items.forEach((item) => {
      totalAmountWithoutVat += item.lineAmount - (item.vatAmount || 0);
      totalVatAmount += item.vatAmount || 0;
    });

    return {
      totalAmountWithoutVat,
      totalVatAmount,
      totalAmount: totalAmountWithoutVat + totalVatAmount,
    };
  }

  /**
   * Format error message from Viettel response
   */
  formatErrorMessage(response: any): string {
    if (response.messages) {
      return response.messages;
    }

    if (response.Message) {
      return response.Message;
    }

    if (response.error) {
      return response.error;
    }

    if (
      response.data &&
      response.data.length > 0 &&
      response.data[0].detailMessages
    ) {
      return response.data[0].detailMessages;
    }

    return "Unknown error occurred";
  }

  /**
   * Check if response is successful
   */
  isSuccessResponse(response: any): boolean {
    return response && response.success === true;
  }

  /**
   * Extract invoice reference code from response
   */
  extractReferenceCode(response: any): string | null {
    if (response.result) {
      return response.result.reservationCode || null;
    }
    return null;
  }

  /**
   * Extract invoice number from response
   */
  extractInvoiceNumber(response: any): string | null {
    if (response.result) {
      return response.result.transactionID || null;
    }
    return null;
  }

  /**
   * Build API URL with supplier tax code
   */
  buildApiUrl(
    baseUrl: string,
    endpoint: string,
    supplierTaxCode?: string
  ): string {
    if (supplierTaxCode && endpoint.includes("{supplierTaxCode}")) {
      return `${baseUrl}${endpoint.replace(
        "{supplierTaxCode}",
        supplierTaxCode
      )}`;
    }
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Generate transaction UUID
   */
  generateTransactionUuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
