/**
 * VAT Calculation Interfaces
 * Defines types and interfaces for VAT calculation operations
 */

import { KafkaElectricInvoice } from "src/kafka/kafka.entity/kafka-employee.entity";
import { KafkaOrderDetail } from "src/kafka/kafka.entity/kafka.order.details.entity";

/**
 * Context for VAT calculation
 */
export interface VatCalculationContext {
  /** Invoice data */
  invoice: KafkaElectricInvoice;
  /** Order details */
  orderDetails: KafkaOrderDetail[];
  /** VAT rate (percentage) */
  vatRate: number;
  /** Whether this is a restaurant order (vs App Food order) */
  isRestaurantOrder: boolean;
}

/**
 * Result of VAT calculation for a single detail item
 */
export interface VatDetailResult {
  /** Reference to the original detail */
  detail: KafkaOrderDetail;
  /** Calculated VAT amount */
  calculatedVatAmount: number;
  /** Calculated amount without VAT */
  calculatedAmountWithoutVat: number;
  /** Calculated total amount (with VAT) */
  calculatedTotalAmount: number;
  /** Original total amount before calculation */
  originalTotalAmount: number;
  /** Flag to keep original values (for special cases like discount) */
  keepOriginalValues?: boolean;
}

/**
 * Result of VAT calculation for entire invoice
 */
export interface VatCalculationResult {
  /** Total VAT amount for the invoice */
  totalVatAmount: number;
  /** Total amount without VAT */
  totalAmountWithoutVat: number;
  /** Calculation results for each detail item */
  details: VatDetailResult[];
  /** Whether item discount was detected */
  hasItemDiscount: boolean;
  /** Total item discount amount */
  totalItemDiscountAmount: number;
  /** Whether total bill discount exists */
  hasTotalDiscount: boolean;
}

/**
 * Discount detection result
 */
export interface DiscountDetectionResult {
  /** Whether any item has discount */
  hasItemDiscount: boolean;
  /** Total discount amount from all items */
  totalItemDiscountAmount: number;
  /** Whether total bill discount exists */
  hasTotalDiscount: boolean;
}

/**
 * VAT distribution result for a single item
 */
export interface VatDistributionItem {
  /** The order detail */
  detail: KafkaOrderDetail;
  /** Item's ratio of the total */
  ratio: number;
  /** Allocated VAT amount */
  vatAmount: number;
  /** Allocated amount without VAT */
  amountWithoutVat: number;
}

/**
 * Options for VAT calculation
 */
export interface VatCalculationOptions {
  /** Whether to apply reverse VAT calculation */
  applyReverseVat?: boolean;
  /** Whether to round amounts */
  roundAmounts?: boolean;
  /** Precision for calculations */
  precision?: number;
}

/**
 * Invoice totals after VAT calculation
 */
export interface InvoiceTotals {
  /** Total quantity of items */
  totalQuantity: number;
  /** Total discount amount */
  totalDiscountAmount: number;
  /** Total amount without VAT */
  totalAmountWithoutVat: number;
  /** Total VAT amount */
  totalVatAmount: number;
  /** Total amount (with VAT) */
  totalAmount: number;
  /** Total price */
  totalPrice: number;
}

/**
 * Partner validation result
 */
export interface PartnerValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  errorMessage?: string;
  /** Partner-specific data */
  partnerData?: any;
}

/**
 * Export parameters for partner
 */
export interface ExportParams {
  /** Authentication token */
  authToken: any;
  /** Invoice data */
  invoice: any;
  /** Invoice data (second fetch) */
  invoiceData: {
    invoiceDetails: any[];
    invoiceTwoTime: any;
  };
  /** Export DTO */
  exportInvoiceDTO: any;
  /** Partner configuration */
  partnerConfig: any;
}

/**
 * Export result from partner
 */
export interface ExportResult {
  /** Whether export was successful */
  success: boolean;
  /** Reference code from partner */
  refCode?: string;
  /** Invoice number */
  invoiceNumber?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Raw response from partner */
  rawResponse?: any;
}
