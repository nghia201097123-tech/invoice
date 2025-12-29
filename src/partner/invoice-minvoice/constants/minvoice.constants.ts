/**
 * Constants for M-Invoice integration
 */

export enum EditMode {
  CREATE = 1, // Tạo mới
  ADJUST = 2, // Điều chỉnh
  REPLACE = 3, // Thay thế
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  CANCELLED = "CANCELLED",
  ADJUSTED = "ADJUSTED",
}

export enum TaxCode {
  ZERO_PERCENT = "0",
  FIVE_PERCENT = "5",
  EIGHT_PERCENT = "8",
  TEN_PERCENT = "10",
  NO_TAX = "-1", // Không chịu thuế
  NOT_IN_SCOPE = "-2", // Không kê khai không nộp thuế
}

export enum CurrencyCode {
  VND = "VND",
  USD = "USD",
  EUR = "EUR",
  JPY = "JPY",
  CNY = "CNY",
}

export enum CommodityNatureType {
  GOODS_SERVICES = 1, // Hàng hóa dịch vụ
  PROMOTION = 2, // Khuyến mại
  DISCOUNT = 3, // Chiết khấu
  NOTE = 4, // Ghi chú
  SPECIAL_GOODS = 5, // Hàng hóa đặc trưng
}

export const MINVOICE_API_ENDPOINTS = {
  LOGIN: "/Account/Login",
  SAVE: "/InvoiceApi78/Save",
  SAVE_SIGN: "/InvoiceApi78/SaveSign",
  GET_DETAIL: "/InvoiceApi78/GetDetail",
  GET_TYPE_INVOICE_SERIES: "/InvoiceApi78/GetTypeInvoiceSeries",
  CANCEL: "/InvoiceApi78/Cancel",
  UPDATE: "/InvoiceApi78/Update",
} as const;

export const MINVOICE_ERROR_CODES = {
  SUCCESS: 200,
  INVALID_API_KEY: 401,
  INVOICE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500,
} as const;

export const MINVOICE_VALIDATION_RULES = {
  MAX_ITEM_NAME_LENGTH: 500,
  MAX_BUYER_NAME_LENGTH: 400,
  MAX_ADDRESS_LENGTH: 400,
  MAX_NOTE_LENGTH: 500,
  MIN_QUANTITY: 0.001,
  MAX_QUANTITY: 999999999,
  MIN_UNIT_PRICE: 0,
  MAX_UNIT_PRICE: 999999999999,
} as const;

/**
 * Regex patterns for validation
 */
export const VALIDATION_PATTERNS = {
  VIETNAM_TAX_CODE: /^\d{10}(-\d{3})?$/,
  VIETNAM_PHONE: /^(\+84|0)[3-9]\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  INVOICE_SERIES: /^[A-Z]{1,3}\d{2}[A-Z]$/,
} as const;

/**
 * Default values
 */
export const MINVOICE_DEFAULTS = {
  CURRENCY_CODE: CurrencyCode.VND,
  EXCHANGE_RATE: 1,
  PAYMENT_METHOD: "TM", // Tiền mặt
  EDIT_MODE: {
    CREATE: 1,
    ADJUST: 2,
    REPLACE: 3,
  },
  TAX_CODE: TaxCode.TEN_PERCENT,
  COMMODITY_NATURE_TYPE: {
    GOODS_SERVICES: 1,
    PROMOTION: 2,
    DISCOUNT: 3,
    NOTE: 4,
    SPECIAL_GOODS: 5,
  },
  CUSTOMER_TYPE: {
    ORGANIZATION: "1",
    INDIVIDUAL: "2",
  },
} as const;

/**
 * Ánh xạ thuế suất sang mã thuế theo tài liệu M-Invoice
 */
export const VAT_RATE_MAPPING: { [key: number]: string } = {
  10: "10", // Thuế suất 10%
  8: "8", // Thuế suất 8%
  5: "5", // Thuế suất 5%
  0: "0", // Thuế suất 0%
  [-1]: "-1", // Không chịu thuế
  [-2]: "-2", // Không kê khai nộp thuế
};

/**
 * Tỷ lệ % thuế GTGT trên doanh thu theo NQ101
 */
export const VAT_DEDUCTION_RATES = {
  DISTRIBUTION_SUPPLY: 1, // Phân phối, cung cấp hàng hóa dịch vụ
  OTHER_BUSINESS: 2, // Hoạt động kinh doanh khác
  PRODUCTION_TRANSPORT: 3, // Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu nguyên vật liệu
  CONSTRUCTION_NO_MATERIAL: 5, // Dịch vụ xây dựng không bao thầu nguyên vật liệu
};

/**
 * Độ dài tối đa của các trường theo tài liệu
 */
export const FIELD_MAX_LENGTHS = {
  ITEM_CODE: 50,
  ITEM_NAME: 500,
  UNIT_CODE: 50,
  BUYER_NAME: 400,
  BUYER_ADDRESS: 400,
  BUYER_EMAIL: 254,
  BUYER_TAX_CODE: 14,
  BUYER_PHONE: 50,
  BUYER_IDENTITY_CARD: 20,
  STORE_CODE: 250,
  STORE_NAME: 250,
  STORE_ADDRESS: 250,
  BUDGET_UNIT_CODE: 7,
  PASSPORT_NUMBER: 20,
  CITIZEN_ID: 20,
  DECISION_NUMBER: 50,
  ISSUING_AGENCY: 200,
  KEY_API: 100,
};

/**
 * Thông báo lỗi validation
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: "Trường này là bắt buộc",
  INVALID_TAX_CODE: "Mã số thuế không hợp lệ (10-14 chữ số)",
  INVALID_PHONE: "Số điện thoại không hợp lệ",
  INVALID_EMAIL: "Email không hợp lệ",
  INVALID_CURRENCY: "Mã tiền tệ không hợp lệ (3 ký tự)",
  INVALID_VAT_RATE: "Thuế suất không hợp lệ",
  FIELD_TOO_LONG: "Trường vượt quá độ dài cho phép",
  INVALID_AMOUNT: "Số tiền không hợp lệ",
  INVALID_QUANTITY: "Số lượng không hợp lệ",
};
