export const HILO_CONSTANTS = {
  // Invoice Types
  INVOICE_TYPES: {
    VAT_INVOICE: "01", // Hóa đơn GTGT
    SALES_INVOICE: "02", // Hóa đơn bán hàng
    RECEIPT: "03", // Phiếu thu
    OTHER: "04", // Khác
  },

  // Template Codes
  TEMPLATE_CODES: {
    DEFAULT: "TT78_01",
    VAT: "TT78_01",
    SALES: "TT78_02",
  },

  // Currency Codes
  CURRENCY_CODES: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: "TM", // Tiền mặt
    TRANSFER: "CK", // Chuyển khoản
    CARD: "TT", // Thẻ
    OTHER: "KH", // Khác
  },

  // VAT Rates
  VAT_RATES: {
    ZERO: 0,
    FIVE: 5,
    TEN: 10,
    EXEMPT: -1, // Không chịu thuế
    NOT_SUBJECT: -2, // Không thuộc đối tượng
  },

  // Invoice Status
  INVOICE_STATUS: {
    DRAFT: "DRAFT",
    SIGNED: "SIGNED",
    CANCELLED: "CANCELLED",
    REPLACED: "REPLACED",
    ADJUSTED: "ADJUSTED",
  },

  // Adjustment Types
  ADJUSTMENT_TYPES: {
    INCREASE: "1", // Điều chỉnh tăng
    DECREASE: "2", // Điều chỉnh giảm
    INFO_CHANGE: "3", // Điều chỉnh thông tin
  },

  // API Endpoints (relative paths)
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REFRESH: "/api/auth/refresh",
      LOGOUT: "/api/auth/logout",
    },
    INVOICES: {
      CREATE_DRAFT: "/api/invoices/draft",
      SIGN: "/api/invoices/sign",
      CANCEL: "/api/invoices/cancel",
      ADJUST: "/api/invoices/adjust",
      REPLACE: "/api/invoices/replace",
      GET_DETAIL: "/api/invoices",
      GET_LIST: "/api/invoices/list",
      GET_PDF: "/api/invoices/pdf",
      GET_XML: "/api/invoices/xml",
      CONVERT_TO_PDF: "/api/invoices/convert/pdf",
      CONVERT_TO_XML: "/api/invoices/convert/xml",
    },
    TEMPLATES: {
      GET_LIST: "/api/templates",
      GET_DETAIL: "/api/templates",
    },
    SERIES: {
      GET_LIST: "/api/series",
      GET_REMAINING: "/api/series/remaining",
    },
  },

  // Error Codes
  ERROR_CODES: {
    AUTHENTICATION_FAILED: "AUTH_001",
    INVALID_TOKEN: "AUTH_002",
    TOKEN_EXPIRED: "AUTH_003",
    INVALID_INVOICE_DATA: "INV_001",
    INVOICE_NOT_FOUND: "INV_002",
    INVOICE_ALREADY_SIGNED: "INV_003",
    INVOICE_ALREADY_CANCELLED: "INV_004",
    INVALID_TAX_CODE: "TAX_001",
    INVALID_PATTERN: "PAT_001",
    INVALID_SERIAL: "SER_001",
    NETWORK_ERROR: "NET_001",
    UNKNOWN_ERROR: "UNK_001",
  },

  // Request Timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    SIGN: 60000, // 60 seconds for signing
    UPLOAD: 120000, // 120 seconds for file upload
  },

  // Validation Rules
  VALIDATION: {
    TAX_CODE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 13,
      PATTERN: /^\d{10}$|^\d{13}$/,
    },
    PATTERN: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 6,
      PATTERN: /^[A-Z0-9]{1,6}$/,
    },
    SERIAL: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 6,
      PATTERN: /^[A-Z0-9]{2,6}$/,
    },
    PHONE: {
      PATTERN: /^(0|\+84)[0-9]{9,10}$/,
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },

  // Default Values
  DEFAULTS: {
    CURRENCY_CODE: "VND",
    EXCHANGE_RATE: 1,
    UNIT_NAME: "Cái",
    VAT_RATE: 10,
    PAYMENT_METHOD: "TM",
    INVOICE_TYPE: "01",
    TEMPLATE_CODE: "TT78_01",
  },

  // Date Formats
  DATE_FORMATS: {
    API: "yyyy-MM-dd HH:mm:ss",
    DISPLAY: "dd/MM/yyyy",
    FILE_NAME: "yyyyMMdd_HHmmss",
  },
};

export default HILO_CONSTANTS;
