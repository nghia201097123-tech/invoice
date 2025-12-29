import { Injectable, Logger } from "@nestjs/common";
import { KafkaElectricInvoice } from "src/kafka/kafka.entity/kafka-employee.entity";
import { KafkaOrderDetail } from "src/kafka/kafka.entity/kafka.order.details.entity";
import {
  VatCalculationContext,
  VatCalculationResult,
  VatDetailResult,
  DiscountDetectionResult,
  InvoiceTotals,
} from "../interfaces/vat.interface";
import { InvoiceConstants } from "../constants/invoice.constants";

/**
 * VatCalculator
 *
 * Centralized VAT calculation service that handles different VAT calculation
 * strategies for Restaurant orders and App Food orders.
 *
 * @description This class extracts VAT calculation logic from consumer.ts
 * while preserving the exact business logic.
 */
@Injectable()
export class VatCalculator {
  private readonly logger = new Logger(VatCalculator.name);

  /**
   * Main entry point for VAT calculation
   * Routes to appropriate strategy based on order type
   *
   * @param context - VAT calculation context
   * @returns VatCalculationResult
   */
  calculate(context: VatCalculationContext): VatCalculationResult {
    const { isRestaurantOrder } = context;

    if (isRestaurantOrder) {
      return this.calculateForRestaurant(context);
    }
    return this.calculateForAppFood(context);
  }

  /**
   * Calculate VAT for Restaurant Orders
   *
   * @description Business logic:
   * 1. Detect item-level discounts
   * 2. Apply reverse VAT formula from invoice.total_amount
   * 3. Adjust calculations based on discount type
   * 4. Distribute VAT proportionally across items
   */
  private calculateForRestaurant(
    context: VatCalculationContext
  ): VatCalculationResult {
    const { invoice, orderDetails, vatRate } = context;
    const originalTotalAmount = invoice.total_amount;

    const totalSum = this.calculateTotalSum(orderDetails);
    if (totalSum === 0) {
      this.logger.warn(
        `Zero total sum for restaurant order ${invoice.order_id}`
      );
      return this.createEmptyResult(orderDetails);
    }

    // Check for total bill discount
    const hasTotalDiscount = invoice.total_amount_discount_amount > 0;

    // Detect item-level discounts
    const discountDetection = this.detectItemDiscounts(orderDetails);

    // Calculate VAT amounts based on discount type
    const { totalVatAmount, totalAmountWithoutVat } =
      this.calculateRestaurantVatAmounts(
        originalTotalAmount,
        orderDetails,
        vatRate,
        discountDetection.hasItemDiscount
      );

    // Distribute VAT across items
    const details = this.distributeVatForRestaurant(
      orderDetails,
      totalVatAmount,
      totalAmountWithoutVat,
      totalSum,
      vatRate,
      hasTotalDiscount,
      discountDetection.hasItemDiscount,
      discountDetection.totalItemDiscountAmount
    );

    // Update invoice totals
    this.updateInvoiceTotals(
      invoice,
      totalVatAmount,
      totalAmountWithoutVat,
      vatRate
    );

    return {
      totalVatAmount,
      totalAmountWithoutVat,
      details,
      hasItemDiscount: discountDetection.hasItemDiscount,
      totalItemDiscountAmount: discountDetection.totalItemDiscountAmount,
      hasTotalDiscount,
    };
  }

  /**
   * Calculate VAT for App Food Orders
   *
   * @description Business logic:
   * - Use standard VAT calculation formula
   * - Distribute VAT proportionally across items
   */
  private calculateForAppFood(
    context: VatCalculationContext
  ): VatCalculationResult {
    const { invoice, orderDetails, vatRate } = context;
    const originalTotalAmount = invoice.total_amount;

    const totalSum = this.calculateTotalSum(orderDetails);
    if (totalSum === 0) {
      this.logger.warn(
        `Zero total sum for app food order ${invoice.order_id}`
      );
      return this.createEmptyResult(orderDetails);
    }

    // Standard VAT calculation
    const totalVatAmount = Math.round(
      (originalTotalAmount * vatRate) / (100 + vatRate)
    );
    const totalAmountWithoutVat = originalTotalAmount - totalVatAmount;

    // Distribute VAT across items
    const details = this.distributeVatForAppFood(
      orderDetails,
      totalVatAmount,
      totalAmountWithoutVat,
      totalSum,
      vatRate
    );

    // Update invoice totals
    this.updateInvoiceTotals(
      invoice,
      totalVatAmount,
      totalAmountWithoutVat,
      vatRate
    );

    return {
      totalVatAmount,
      totalAmountWithoutVat,
      details,
      hasItemDiscount: false,
      totalItemDiscountAmount: 0,
      hasTotalDiscount: invoice.total_amount_discount_amount > 0,
    };
  }

  /**
   * Calculate total sum of order details
   */
  private calculateTotalSum(orderDetails: KafkaOrderDetail[]): number {
    return orderDetails.reduce(
      (sum, detail) => sum + (detail.total_amount_without_vat || 0),
      0
    );
  }

  /**
   * Detect item-level discounts in order details
   */
  private detectItemDiscounts(
    orderDetails: KafkaOrderDetail[]
  ): DiscountDetectionResult {
    let hasItemDiscount = false;
    let totalItemDiscountAmount = 0;

    orderDetails.forEach((detail) => {
      const originalTotalWithoutVat = detail.total_amount_without_vat || 0;
      const actualTotal = detail.total_amount || 0;
      const calculatedDiscount = originalTotalWithoutVat - actualTotal;

      let itemDiscountAmount = detail.discount_amount || 0;
      if (calculatedDiscount > 0) {
        itemDiscountAmount = calculatedDiscount;
        detail.discount_amount = itemDiscountAmount;
      }

      if (itemDiscountAmount > 0) {
        hasItemDiscount = true;
        totalItemDiscountAmount += itemDiscountAmount;
      }
    });

    return {
      hasItemDiscount,
      totalItemDiscountAmount,
      hasTotalDiscount: false,
    };
  }

  /**
   * Calculate VAT amounts for restaurant orders
   */
  private calculateRestaurantVatAmounts(
    originalTotalAmount: number,
    orderDetails: KafkaOrderDetail[],
    vatRate: number,
    hasItemDiscount: boolean
  ): { totalVatAmount: number; totalAmountWithoutVat: number } {
    if (hasItemDiscount) {
      // Calculate VAT based on actual total_amount
      const totalActualAmount = orderDetails.reduce(
        (sum, detail) => sum + (detail.total_amount || 0),
        0
      );
      const totalVatAmount = Math.round(
        (totalActualAmount * vatRate) / (100 + vatRate)
      );
      const totalAmountWithoutVat = totalActualAmount - totalVatAmount;

      return { totalVatAmount, totalAmountWithoutVat };
    }

    // Standard reverse VAT calculation
    const totalVatAmount = Math.round(
      (originalTotalAmount * vatRate) / (100 + vatRate)
    );
    const totalAmountWithoutVat = originalTotalAmount - totalVatAmount;

    return { totalVatAmount, totalAmountWithoutVat };
  }

  /**
   * Distribute VAT for Restaurant Orders
   * Preserves exact business logic from consumer.ts
   */
  private distributeVatForRestaurant(
    orderDetails: KafkaOrderDetail[],
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    totalSum: number,
    vatRate: number,
    hasTotalDiscount: boolean,
    hasItemDiscount: boolean,
    totalItemDiscountAmount: number
  ): VatDetailResult[] {
    const detailCalculations: VatDetailResult[] = [];
    let totalCalculatedVat = 0;
    let totalCalculatedAmountWithoutVat = 0;

    // Calculate base amount for distribution
    const baseAmount = hasItemDiscount
      ? orderDetails.reduce((sum, d) => sum + (d.total_amount || 0), 0)
      : totalSum;

    const adjustedTotalAmountWithoutVat = hasItemDiscount
      ? baseAmount
      : totalAmountWithoutVat;

    // Distribute proportionally
    orderDetails.forEach((detail) => {
      const itemBase = hasItemDiscount
        ? detail.total_amount || 0
        : detail.total_amount_without_vat || 0;

      const itemRatio = itemBase / baseAmount;
      const calculatedVatAmount = Math.round(totalVatAmount * itemRatio);
      const calculatedAmountWithoutVat = Math.round(
        adjustedTotalAmountWithoutVat * itemRatio
      );

      detailCalculations.push({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        calculatedTotalAmount: calculatedVatAmount + calculatedAmountWithoutVat,
        originalTotalAmount: detail.total_amount_without_vat || 0,
        keepOriginalValues: false,
      });

      totalCalculatedVat += calculatedVatAmount;
      totalCalculatedAmountWithoutVat += calculatedAmountWithoutVat;
    });

    // Adjust rounding differences
    this.adjustRoundingDifferences(
      detailCalculations,
      totalVatAmount,
      adjustedTotalAmountWithoutVat,
      totalCalculatedVat,
      totalCalculatedAmountWithoutVat
    );

    // Process discounts for restaurant orders
    this.processRestaurantDiscounts(
      detailCalculations,
      hasTotalDiscount,
      hasItemDiscount
    );

    // Apply calculated values
    this.applyRestaurantValues(
      detailCalculations,
      vatRate,
      hasItemDiscount,
      hasTotalDiscount
    );

    return detailCalculations;
  }

  /**
   * Distribute VAT for App Food Orders
   */
  private distributeVatForAppFood(
    orderDetails: KafkaOrderDetail[],
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    totalSum: number,
    vatRate: number
  ): VatDetailResult[] {
    const detailCalculations: VatDetailResult[] = [];
    let totalCalculatedVat = 0;
    let totalCalculatedAmountWithoutVat = 0;

    // Distribute proportionally
    orderDetails.forEach((detail) => {
      const itemRatio = (detail.total_amount_without_vat || 0) / totalSum;
      const calculatedVatAmount = Math.round(totalVatAmount * itemRatio);
      const calculatedAmountWithoutVat = Math.round(
        totalAmountWithoutVat * itemRatio
      );

      detailCalculations.push({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        calculatedTotalAmount: calculatedVatAmount + calculatedAmountWithoutVat,
        originalTotalAmount: detail.total_amount_without_vat || 0,
      });

      totalCalculatedVat += calculatedVatAmount;
      totalCalculatedAmountWithoutVat += calculatedAmountWithoutVat;
    });

    // Adjust rounding differences
    this.adjustRoundingDifferences(
      detailCalculations,
      totalVatAmount,
      totalAmountWithoutVat,
      totalCalculatedVat,
      totalCalculatedAmountWithoutVat
    );

    // Apply values
    this.applyAppFoodValues(detailCalculations, vatRate);

    return detailCalculations;
  }

  /**
   * Adjust rounding differences in VAT distribution
   */
  private adjustRoundingDifferences(
    calculations: VatDetailResult[],
    targetVatAmount: number,
    targetAmountWithoutVat: number,
    actualVatAmount: number,
    actualAmountWithoutVat: number
  ): void {
    // Adjust VAT difference
    let vatDiff = targetVatAmount - actualVatAmount;
    for (let i = 0; i < calculations.length && vatDiff !== 0; i++) {
      const adjustment = vatDiff > 0 ? 1 : -1;
      calculations[i].calculatedVatAmount += adjustment;
      vatDiff -= adjustment;
    }

    // Adjust amount without VAT difference
    let amountDiff = targetAmountWithoutVat - actualAmountWithoutVat;
    for (let i = 0; i < calculations.length && amountDiff !== 0; i++) {
      const adjustment = amountDiff > 0 ? 1 : -1;
      calculations[i].calculatedAmountWithoutVat += adjustment;
      amountDiff -= adjustment;
    }

    // Update total amounts
    calculations.forEach((calc) => {
      calc.calculatedTotalAmount =
        calc.calculatedVatAmount + calc.calculatedAmountWithoutVat;
    });
  }

  /**
   * Process discounts for restaurant orders
   */
  private processRestaurantDiscounts(
    calculations: VatDetailResult[],
    hasTotalDiscount: boolean,
    hasItemDiscount: boolean
  ): void {
    calculations.forEach((calc) => {
      const { detail } = calc;

      if (hasTotalDiscount) {
        detail.discount_amount = 0;
      } else if (hasItemDiscount && detail.discount_amount > 0) {
        detail.discount_percent = Math.round(
          Math.abs(
            (detail.discount_amount * 100) / detail.total_amount_without_vat
          )
        );
        calc.keepOriginalValues = true;
      } else {
        detail.discount_amount = 0;
      }
    });
  }

  /**
   * Apply calculated values for restaurant orders
   */
  private applyRestaurantValues(
    calculations: VatDetailResult[],
    vatRate: number,
    hasItemDiscount: boolean,
    hasTotalDiscount: boolean
  ): void {
    calculations.forEach(
      ({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        keepOriginalValues,
      }) => {
        const originalFoodUnitPrice = detail.food_unit_price;
        detail.vat = vatRate;

        if (hasItemDiscount && !hasTotalDiscount && keepOriginalValues) {
          // Item discount case
          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;
          detail.price = calculatedAmountWithoutVat + calculatedVatAmount;

          if (!detail.food_unit_price || detail.food_unit_price <= 0) {
            const discountAmount = detail.discount_amount || 0;
            detail.food_unit_price =
              detail.quantity > 0
                ? Math.round(
                    (calculatedAmountWithoutVat + discountAmount) /
                      detail.quantity
                  )
                : 0;
          }
        } else if (keepOriginalValues) {
          detail.vat_amount =
            detail.total_amount_without_vat - detail.total_amount;
          detail.price = originalFoodUnitPrice || 0;
        } else {
          // Standard case
          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;
          detail.price =
            detail.quantity > 0
              ? Math.round(calculatedAmountWithoutVat / detail.quantity)
              : 0;
          detail.food_unit_price = detail.price;
        }
      }
    );
  }

  /**
   * Apply calculated values for app food orders
   */
  private applyAppFoodValues(
    calculations: VatDetailResult[],
    vatRate: number
  ): void {
    calculations.forEach(
      ({
        detail,
        calculatedVatAmount,
        calculatedAmountWithoutVat,
        keepOriginalValues,
      }) => {
        detail.food_unit_price = calculatedAmountWithoutVat;
        detail.vat = vatRate;

        if (keepOriginalValues) {
          detail.vat_amount =
            detail.total_amount_without_vat - detail.total_amount;
          detail.price =
            detail.quantity > 0
              ? Math.round(detail.total_amount_without_vat / detail.quantity)
              : 0;
        } else {
          detail.total_amount_without_vat = calculatedAmountWithoutVat;
          detail.vat_amount = calculatedVatAmount;
          detail.price =
            detail.quantity > 0
              ? Math.round(calculatedAmountWithoutVat / detail.quantity)
              : 0;
          detail.total_amount =
            calculatedAmountWithoutVat + calculatedVatAmount;
        }
      }
    );
  }

  /**
   * Update invoice totals after VAT calculation
   */
  private updateInvoiceTotals(
    invoice: KafkaElectricInvoice,
    totalVatAmount: number,
    totalAmountWithoutVat: number,
    vatRate: number
  ): void {
    invoice.total_amount_without_vat = totalAmountWithoutVat;
    invoice.vat_amount = totalVatAmount;
    invoice.amount = totalAmountWithoutVat;
    invoice.vat = vatRate;
  }

  /**
   * Create empty result when total sum is zero
   */
  private createEmptyResult(
    orderDetails: KafkaOrderDetail[]
  ): VatCalculationResult {
    return {
      totalVatAmount: 0,
      totalAmountWithoutVat: 0,
      details: orderDetails.map((detail) => ({
        detail,
        calculatedVatAmount: 0,
        calculatedAmountWithoutVat: 0,
        calculatedTotalAmount: 0,
        originalTotalAmount: 0,
      })),
      hasItemDiscount: false,
      totalItemDiscountAmount: 0,
      hasTotalDiscount: false,
    };
  }

  /**
   * Calculate invoice totals from order details
   * Utility method to calculate totals excluding gifts
   */
  calculateInvoiceTotals(orderDetails: any[]): InvoiceTotals {
    const nonGiftDetails = orderDetails.filter(
      (detail) => detail.is_gift !== 1
    );

    return {
      totalQuantity: nonGiftDetails.reduce(
        (sum, detail) => sum + (detail.quantity || 0),
        0
      ),
      totalDiscountAmount: nonGiftDetails.reduce(
        (sum, detail) => sum + (detail.discount_amount || 0),
        0
      ),
      totalAmountWithoutVat: nonGiftDetails.reduce(
        (sum, detail) => sum + (detail.total_amount_without_vat || 0),
        0
      ),
      totalVatAmount: nonGiftDetails.reduce(
        (sum, detail) => sum + (detail.vat_amount || 0),
        0
      ),
      totalAmount: nonGiftDetails.reduce((sum, detail) => {
        if (detail.food_id === InvoiceConstants.FOOD_IDS.NOTE) {
          return sum + (detail.total_amount_without_vat || 0);
        }
        return sum + (detail.total_amount || 0);
      }, 0),
      totalPrice: nonGiftDetails.reduce(
        (sum, detail) => sum + (detail.price || 0),
        0
      ),
    };
  }

  /**
   * Validate VAT rate
   */
  isValidVatRate(vat: number): boolean {
    return (
      vat >= InvoiceConstants.VAT.MIN && vat <= InvoiceConstants.VAT.MAX
    );
  }

  /**
   * Check if VAT is valid for M-Invoice partner
   */
  isValidMInvoiceVat(vat: number): boolean {
    return (
      InvoiceConstants.VAT.VALID_VALUES as readonly number[]
    ).includes(vat);
  }
}
