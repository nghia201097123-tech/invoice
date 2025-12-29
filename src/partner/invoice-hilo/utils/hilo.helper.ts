import { Injectable } from "@nestjs/common";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";

@Injectable()
export class HiloHelper {
  /**
   * Validate tax code format
   */
  validateTaxCode(taxCode: string): boolean {
    if (!taxCode) return true; // Tax code is optional

    // Vietnamese tax code format: 10 or 13 digits
    const taxCodeRegex = /^\d{10}$|^\d{13}$/;
    return taxCodeRegex.test(taxCode);
  }

  /**
   * Generate unique reference ID
   */
  generateReferenceId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `HILO_${timestamp}_${random}`;
  }

  /**
   * Map invoice status from Hilo to internal status
   */
  mapHiloStatusToInternal(hiloStatus: string): string {
    const statusMap = {
      DRAFT: "DRAFT",
      SIGNED: "ISSUED",
      CANCELLED: "CANCELLED",
      REPLACED: "REPLACED",
      ADJUSTED: "ADJUSTED",
    };

    return statusMap[hiloStatus] || "UNKNOWN";
  }

  /**
   * Validate invoice pattern format
   */
  validateInvoicePattern(pattern: string): boolean {
    if (!pattern) return false;

    // Vietnamese invoice pattern format: 1-6 characters
    const patternRegex = /^[A-Z0-9]{1,6}$/;
    return patternRegex.test(pattern);
  }

  /**
   * Validate invoice serial format
   */
  validateInvoiceSerial(serial: string): boolean {
    if (!serial) return false;

    // Vietnamese invoice serial format: 2-6 characters
    const serialRegex = /^[A-Z0-9]{2,6}$/;
    return serialRegex.test(serial);
  }

  /**
   * Calculate VAT amount based on amount and VAT rate
   */
  calculateVatAmount(amount: number, vatRate: number): number {
    return Math.round(((amount * vatRate) / 100) * 100) / 100;
  }

  /**
   * Calculate amount without VAT
   */
  calculateAmountWithoutVat(totalAmount: number, vatRate: number): number {
    return Math.round((totalAmount / (1 + vatRate / 100)) * 100) / 100;
  }

  /**
   * Sanitize string for API request
   */
  sanitizeString(str: string): string {
    if (!str) return "";

    return str
      .trim()
      .replace(/[\r\n\t]/g, " ")
      .replace(/\s+/g, " ")
      .substring(0, 255); // Limit length
  }

  /**
   * Format phone number for Vietnamese format
   */
  formatPhoneNumber(phone: string): string {
    if (!phone) return "";

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // Vietnamese phone number format
    if (digits.length === 10 && digits.startsWith("0")) {
      return digits;
    } else if (digits.length === 9) {
      return "0" + digits;
    }

    return phone; // Return original if format is unclear
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    if (!email) return true; // Email is optional

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate authentication string for Hilo API
   */
  generateAuthString(username: string, password: string): string {
    const authString = `${username}:${password}`;
    return Buffer.from(authString).toString("base64");
  }

  /**
   * Parse error response from Hilo API
   */
  parseErrorResponse(error: any): { code: string; message: string } {
    if (error?.response?.data) {
      const data = error.response.data;
      return {
        code: data.errorCode || "UNKNOWN_ERROR",
        message: data.message || "Lỗi không xác định từ Hilo API",
      };
    }

    return {
      code: "NETWORK_ERROR",
      message: error.message || "Lỗi kết nối đến Hilo API",
    };
  }
}
