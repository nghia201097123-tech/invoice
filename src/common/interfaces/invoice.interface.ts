/**
 * Invoice-related interfaces for type safety
 */

import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";

/**
 * Partner login result
 */
export interface PartnerLoginResult {
  /** Authentication token */
  token: string;
  /** Partner type */
  partner_electronic_invoice_type: PartnerElectronicInvoiceTypeEnum;
  /** Invoice data */
  data?: any;
  /** Expiration time */
  expires_at?: Date;
}

/**
 * Invoice export context
 */
export interface InvoiceExportContext {
  /** Invoice ID */
  invoiceId: string;
  /** Order ID */
  orderId: number;
  /** Restaurant ID */
  restaurantId: number;
  /** Branch ID */
  branchId: number;
  /** Partner type */
  partnerType: PartnerElectronicInvoiceTypeEnum;
}

/**
 * Invoice status enum values
 */
export enum InvoiceStatus {
  /** Pending - not exported yet */
  PENDING = 0,
  /** Exported to partner */
  EXPORTED = 1,
  /** Updated after export */
  UPDATED = 2,
  /** Cancelled */
  CANCELLED = 3,
}

/**
 * Invoice detail update item
 */
export interface InvoiceDetailUpdateItem {
  /** Detail ID */
  id: string;
  /** Food name */
  food_name?: string;
  /** Quantity */
  quantity?: number;
  /** Price */
  price?: number;
  /** VAT rate */
  vat?: number;
  /** Discount amount */
  discount_amount?: number;
  /** Discount percent */
  discount_percent?: number;
  /** Food unit */
  food_unit?: string;
  /** Food code */
  food_code?: string;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult<T> {
  /** Successful items */
  success: T[];
  /** Failed items */
  failed: Array<{
    item: T;
    error: string;
  }>;
  /** Total processed */
  total: number;
  /** Success count */
  successCount: number;
  /** Failure count */
  failureCount: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache key */
  key: string;
  /** Time to live in seconds */
  ttl: number;
  /** Whether to use memory cache */
  useMemoryCache?: boolean;
}

/**
 * Order processing result
 */
export interface OrderProcessingResult {
  /** Whether processing was successful */
  success: boolean;
  /** Order ID */
  orderId: string;
  /** Error if any */
  error?: Error;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Kafka message data
 */
export interface KafkaMessageData {
  /** Order ID */
  order_id: number;
  /** Branch ID */
  branch_id: number;
  /** Restaurant ID */
  restaurant_id: number;
  /** Restaurant brand ID */
  restaurant_brand_id: number;
  /** Order details */
  order_details: any[];
  /** Total amount */
  total_amount: number;
  /** Customer name */
  customer_name?: string;
  /** Customer phone */
  customer_phone?: string;
}

/**
 * Sync invoice result
 */
export interface SyncInvoiceResult {
  /** Number of invoices synced */
  syncedCount: number;
  /** Order IDs that were synced */
  syncedOrderIds: number[];
  /** Order IDs that were skipped */
  skippedOrderIds: number[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Failed invoice record
 */
export interface FailedInvoiceRecord {
  /** Invoice ID */
  invoice_id: string;
  /** Branch ID */
  branch_id: number;
  /** Order ID */
  order_id: number;
  /** Error message */
  error_message: string;
  /** Error details */
  error_details?: string;
  /** Retry count */
  retry_count: number;
  /** Status */
  status: "PENDING" | "RETRYING" | "FAILED" | "RESOLVED";
  /** Created at */
  created_at: Date;
  /** Updated at */
  updated_at: Date;
}

/**
 * Bulk export job result
 */
export interface BulkExportJobResult {
  /** Job ID */
  jobId: string;
  /** Total invoices to process */
  totalInvoices: number;
  /** Processed count */
  processedCount: number;
  /** Success count */
  successCount: number;
  /** Failure count */
  failureCount: number;
  /** Failed invoice details */
  failedInvoices: Array<{
    id: string;
    error: string;
  }>;
  /** Job status */
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  /** Message */
  message?: string;
}
