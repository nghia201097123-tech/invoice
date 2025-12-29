/**
 * Invoice Constants
 * Centralized configuration values for the invoice system
 */

export const InvoiceConstants = {
  /**
   * VAT Configuration
   */
  VAT: {
    /** Default VAT rate for App Food orders (8%) */
    DEFAULT: 8,
    /** Default VAT rate for Restaurant orders (0%) */
    RESTAURANT_DEFAULT: 0,
    /** Minimum VAT rate */
    MIN: 0,
    /** Maximum VAT rate */
    MAX: 100,
    /** Valid VAT values accepted by M-Invoice partner */
    VALID_VALUES: [0, 3, 5, 8, 10] as const,
    /** Maximum VAT for M-Invoice partner */
    M_INVOICE_MAX: 10,
  },

  /**
   * Cache Configuration (in seconds)
   */
  CACHE: {
    /** Order expiry time - 24 hours */
    ORDER_EXPIRY_SECONDS: 60 * 60 * 24,
    /** Restaurant info cache TTL - 1 hour */
    RESTAURANT_INFO_TTL: 3600,
    /** Invoice details cache TTL - 3 minutes */
    INVOICE_DETAILS_TTL: 180,
    /** Memory cache TTL - 5 minutes */
    MEMORY_CACHE_TTL: 5 * 60 * 1000,
    /** Memory cache cleanup interval - 10 minutes */
    MEMORY_CLEANUP_INTERVAL: 10 * 60 * 1000,
    /** Lock TTL - 5 minutes */
    LOCK_TTL: 300,
    /** Processed invoices TTL - 1 hour */
    PROCESSED_INVOICES_TTL: 3600,
  },

  /**
   * Batch Processing Configuration
   */
  BATCH: {
    /** Default batch size */
    SIZE: 20,
    /** Maximum concurrent operations */
    MAX_CONCURRENCY: 15,
    /** Number of retry attempts */
    RETRY_ATTEMPTS: 3,
    /** Delay between retries in milliseconds */
    RETRY_DELAY_MS: 500,
    /** Delay between batches in milliseconds */
    BATCH_DELAY_MS: 50,
    /** Small delay for DB consistency */
    DB_CONSISTENCY_DELAY_MS: 10,
  },

  /**
   * Third-party Integration Configuration
   */
  THIRD_PARTY: {
    /** Queue name for third-party exports */
    QUEUE_NAME: "invoice-third-party-export",
    /** Maximum retry attempts */
    MAX_RETRY: 3,
    /** Timeout in milliseconds */
    TIMEOUT: 10000,
    /** Circuit breaker threshold */
    CIRCUIT_BREAKER_THRESHOLD: 50,
  },

  /**
   * Special Food Codes
   */
  FOOD_CODES: {
    /** Extra charge total bill */
    EXTRA_CHARGE: "PTTB",
    /** Service fee */
    SERVICE_FEE: "PPV",
    /** Discount total bill */
    DISCOUNT: "GGTB",
    /** Buffet ticket */
    BUFFET: "BF",
    /** Buffet ticket code */
    BUFFET_CODE: "VBF",
  },

  /**
   * Food Units
   */
  FOOD_UNITS: {
    /** Per time unit */
    PER_TIME: "Lần",
    /** Per portion unit */
    PER_PORTION: "Phần",
    /** Per ticket unit */
    PER_TICKET: "Vé",
  },

  /**
   * Special Food IDs
   */
  FOOD_IDS: {
    /** Extra charge/service fee food ID */
    EXTRA_CHARGE: -1,
    /** Buffet ticket food ID */
    BUFFET: -2,
    /** Note/combo food ID */
    NOTE: 0,
  },

  /**
   * Invoice Status
   */
  STATUS: {
    /** Pending - waiting for export */
    PENDING: 0,
    /** Exported to partner */
    EXPORTED: 1,
    /** Updated after export */
    UPDATED: 2,
    /** Cancelled */
    CANCELLED: 3,
  },

  /**
   * Commodity Nature Types
   */
  COMMODITY_NATURE: {
    /** Normal product */
    NORMAL: 1,
    /** Service */
    SERVICE: 2,
    /** Discount */
    DISCOUNT: 3,
  },

  /**
   * Default Customer Name
   */
  DEFAULT_CUSTOMER: {
    NAME: "KHÁCH LẺ KHÔNG LẤY HÓA ĐƠN",
  },
} as const;

/**
 * Cache Keys
 */
export const CacheKeys = {
  /** Processed order IDs set key */
  PROCESSED_ORDERS: "processed_order_ids",
  /** Restaurant invoice info key */
  RESTAURANT_INVOICE_INFO: "techres/restaurant_invoice/info",
  /** Invoice details by order ID pattern */
  INVOICE_DETAILS_BY_ORDER: (orderId: number) =>
    `invoice_details:order_${orderId}`,
  /** Processed invoices by restaurant pattern */
  PROCESSED_INVOICES: (restaurantId: number) =>
    `processed_invoices_${restaurantId}`,
  /** Invoice processing lock pattern */
  INVOICE_LOCK: (invoiceId: string) => `invoice_processing_lock_${invoiceId}`,
  /** Cache lock pattern */
  CACHE_LOCK: (key: string) => `${key}:lock`,
} as const;

/**
 * Type for valid VAT values
 */
export type ValidVatValue = (typeof InvoiceConstants.VAT.VALID_VALUES)[number];
