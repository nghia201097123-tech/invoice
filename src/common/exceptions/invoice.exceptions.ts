import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Base class for invoice-related exceptions
 */
export abstract class InvoiceBaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      {
        statusCode,
        message,
        error: "Invoice Error",
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
}

/**
 * Exception thrown when an invoice is not found
 */
export class InvoiceNotFoundException extends InvoiceBaseException {
  constructor(invoiceId: string) {
    super(
      `Không tồn tại hóa đơn điện tử có ID: ${invoiceId}`,
      HttpStatus.NOT_FOUND
    );
  }
}

/**
 * Exception thrown when an invoice detail is not found
 */
export class InvoiceDetailNotFoundException extends InvoiceBaseException {
  constructor(detailId: string) {
    super(
      `Không tồn tại chi tiết hóa đơn có ID: ${detailId}`,
      HttpStatus.NOT_FOUND
    );
  }
}

/**
 * Exception thrown when invoice ID is invalid
 */
export class InvalidInvoiceIdException extends InvoiceBaseException {
  constructor(id?: string) {
    super(
      id ? `ID hóa đơn không hợp lệ: ${id}` : "ID hóa đơn không hợp lệ",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when invoice cannot be updated
 */
export class InvoiceCannotBeUpdatedException extends InvoiceBaseException {
  constructor(reason?: string) {
    super(
      reason || "Hóa đơn không thể cập nhật ở trạng thái hiện tại",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when invoice has already been updated
 */
export class InvoiceAlreadyUpdatedException extends InvoiceBaseException {
  constructor() {
    super("Hóa đơn đã được cập nhật trước đó", HttpStatus.CONFLICT);
  }
}

/**
 * Exception thrown when invoice has been sent to tax authorities
 */
export class InvoiceSentToTaxException extends InvoiceBaseException {
  constructor() {
    super(
      "Hóa đơn đã được gửi lên chi cục thuế, không thể chỉnh sửa",
      HttpStatus.FORBIDDEN
    );
  }
}

/**
 * Exception thrown when invoice has not been exported yet
 */
export class InvoiceNotExportedException extends InvoiceBaseException {
  constructor() {
    super(
      "Hóa đơn chưa được xuất sang đối tác",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when invoice details are empty
 */
export class InvoiceDetailsEmptyException extends InvoiceBaseException {
  constructor() {
    super(
      "Chi tiết hóa đơn không được để trống",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when invoice detail ID is missing
 */
export class InvoiceDetailIdMissingException extends InvoiceBaseException {
  constructor(index: number) {
    super(
      `Bạn cần truyền ID của chi tiết hóa đơn tại vị trí thứ ${index} để biết cập nhật cho phần chi tiết nào`,
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Partner-related exceptions
 */
export class PartnerDisabledException extends InvoiceBaseException {
  constructor(partnerId?: string) {
    super(
      partnerId
        ? `Đối tác ${partnerId} đã bị tắt`
        : "Đối tác hóa đơn điện tử đã bị tắt",
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

/**
 * Exception thrown when partner is not found for a branch
 */
export class PartnerNotFoundException extends InvoiceBaseException {
  constructor(branchId?: number) {
    super(
      branchId
        ? `Không tìm thấy đối tác cho chi nhánh ${branchId}`
        : "Chi nhánh chưa được cấu hình đối tác hóa đơn điện tử",
      HttpStatus.NOT_FOUND
    );
  }
}

/**
 * Exception thrown when partner type is not supported
 */
export class UnsupportedPartnerException extends InvoiceBaseException {
  constructor(partnerType?: number) {
    super(
      partnerType
        ? `Loại đối tác ${partnerType} không được hỗ trợ`
        : "Loại đối tác không được hỗ trợ",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when partner authentication fails
 */
export class PartnerAuthenticationException extends InvoiceBaseException {
  constructor(partnerName?: string) {
    super(
      partnerName
        ? `Xác thực với đối tác ${partnerName} thất bại`
        : "Xác thực với đối tác thất bại",
      HttpStatus.UNAUTHORIZED
    );
  }
}

/**
 * Exception thrown when partner connection fails
 */
export class PartnerConnectionException extends InvoiceBaseException {
  constructor(partnerName?: string) {
    super(
      partnerName
        ? `Không thể kết nối đến đối tác ${partnerName}. Vui lòng thử lại sau.`
        : "Không thể kết nối đến đối tác. Vui lòng thử lại sau.",
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

/**
 * VAT-related exceptions
 */
export class InvalidVatException extends InvoiceBaseException {
  constructor(vat: number, validValues?: readonly number[]) {
    const validValuesStr = validValues?.join(", ") || "0, 3, 5, 8, 10";
    super(
      `Thuế VAT ${vat}% không hợp lệ. Giá trị hợp lệ: ${validValuesStr}`,
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when VAT exceeds maximum
 */
export class VatExceedsMaximumException extends InvoiceBaseException {
  constructor(vat: number, max: number) {
    super(
      `Thuế VAT ${vat}% vượt quá giới hạn tối đa ${max}%`,
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Export-related exceptions
 */
export class ExportFailedException extends InvoiceBaseException {
  constructor(reason?: string) {
    super(
      reason || "Xuất hóa đơn thất bại",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Exception thrown when saga execution fails
 */
export class SagaExecutionException extends InvoiceBaseException {
  constructor(error?: string) {
    super(
      error || "Thực thi saga thất bại",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Data validation exceptions
 */
export class InvalidOrderDataException extends InvoiceBaseException {
  constructor(field?: string) {
    super(
      field
        ? `Dữ liệu đơn hàng không hợp lệ: ${field}`
        : "Dữ liệu đơn hàng không hợp lệ",
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Exception thrown when order is not found
 */
export class OrderNotFoundException extends InvoiceBaseException {
  constructor(orderId: number) {
    super(
      `Không tìm thấy đơn hàng với ID: ${orderId}`,
      HttpStatus.NOT_FOUND
    );
  }
}

/**
 * Exception thrown when message format is invalid
 */
export class InvalidMessageFormatException extends InvoiceBaseException {
  constructor() {
    super(
      "Định dạng message không hợp lệ",
      HttpStatus.BAD_REQUEST
    );
  }
}
