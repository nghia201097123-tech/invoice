import { Utils } from "./utils.common.helper";
import { KafkaElectricInvoice } from "src/kafka/kafka.entity/kafka-employee.entity";
import { KafkaOrderDetail } from "src/kafka/kafka.entity/kafka.order.details.entity";
import { KafkaElectronicInvoiceDetail } from "src/kafka/kafka.entity/kafka-electric-invoice-detail.entity";
import { InvoiceDetailModelMap } from "../models/invoice-detail.model";
import { Invoice } from "../schemas/invoice.schema";
import { InvoiceDetail } from "../schemas/invoice-detail.schema";
import { DiscountType } from "../enums/discount-type";
import { CategoryType } from "../enums/category_type.enum";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { HttpException, HttpStatus } from "@nestjs/common";

// Type definitions for better type safety
type InvoiceDetailType =
  | InvoiceDetailModelMap
  | InvoiceDetail
  | KafkaOrderDetail
  | KafkaElectronicInvoiceDetail;
type InvoiceType = Invoice | KafkaElectricInvoice;

interface CalculationResult {
  vat_amount: number;
  amount: number;
  total_amount: number;
  discount_amount: number;
  food_discount_amount: number;
  drink_discount_amount: number;
  total_amount_discount_amount: number;
  total_amount_extra_charge_amount: number;
}

interface CategoryAmounts {
  vat_amount: number;
  amount: number;
  total: number;
  discount_amount: number;
}

interface InvoiceDetailSnapshot {
  id: string;
  quantity: number;
  price: number;
  discount_percent: number;
  category_type: number;
  food_id: number;
  is_extra_charge: number;
  vat: number;
}

export class Calculate {
  // Properties with better naming and organization
  private readonly defaultVatService: number = 8;

  // APP_FOOD order methods that require precise VAT calculation
  private static readonly APP_FOOD = [3, 4, 5, 6];

  // Cache for invoice detail snapshots to detect changes
  private invoiceDetailSnapshots: Map<string, InvoiceDetailSnapshot[]> =
    new Map();

  // Calculation state - reset for each calculation
  private calculationState = {
    vatAmountHaveDiscount: 0,
    amountHaveDiscount: 0,
    totalHaveDiscount: 0,
    vatAmountNormal: 0,
    amountNormal: 0,
    totalAmountNormal: 0,
    vatAmountNotHaveDiscount: 0,
    amountNotHaveDiscount: 0,
    totalNotHaveDiscount: 0,
    discountAmount: 0,
    discountAmountFood: 0,
    discountAmountDrink: 0,
    totalAmountExtraChargeAmount: 0,
    vatAmountExtraChargeAmount: 0,
    vatAmountServiceChargeAmount: 0,
  };

  constructor(private readonly invoiceHelper?: InvoiceHelper) {}

  /**
   * Main calculation method with database update
   */
  public async calculateAndUpdate(
    invoiceDetail: InvoiceDetailModelMap[] | InvoiceDetail[],
    invoice: Invoice
  ): Promise<void> {
    this.validateInputs(invoiceDetail, invoice);

    const invoiceId = invoice._id?.toString() || invoice._id?.toString();
    if (!this.hasInvoiceDetailChanged(invoiceId, invoiceDetail)) {
      return;
    }

    this.resetCalculationState();

    const discountType = Utils.getDisCountType(invoice);
    const result = await this.performCalculation(
      invoiceDetail,
      invoice,
      discountType,
      true
    );

    // Update snapshot after successful calculation
    this.updateInvoiceDetailSnapshot(invoiceId, invoiceDetail);

    if (this.invoiceHelper) {
      await this.invoiceHelper.findByIdAndUpdateDiscount(invoice._id, result);
    }
  }

  /**
   * Calculation method without database update
   */
  public async calculate(
    invoiceDetail: InvoiceDetailType[],
    invoice: Invoice
  ): Promise<void> {
    this.validateInputs(invoiceDetail, invoice);

    // Check if invoice details have changed
    const invoiceId = invoice._id.toString();
    if (!this.hasInvoiceDetailChanged(invoiceId, invoiceDetail)) {
      console.log(
        `No changes detected for invoice ${invoiceId}, skipping calculation`
      );
      return;
    }

    this.resetCalculationState();

    const discountType = Utils.getDisCountType(invoice);
    await this.performCalculation(invoiceDetail, invoice, discountType, false);

    // Update snapshot after successful calculation
    this.updateInvoiceDetailSnapshot(invoiceId, invoiceDetail);
  }

  /**
   * Get current calculation results
   */
  public getCalculationResults(): CalculationResult {
    return {
      vat_amount:
        this.calculationState.vatAmountNormal +
        this.calculationState.vatAmountHaveDiscount +
        this.calculationState.vatAmountNotHaveDiscount,
      amount:
        this.calculationState.amountNormal +
        this.calculationState.amountHaveDiscount +
        this.calculationState.amountNotHaveDiscount,
      total_amount:
        this.calculationState.totalAmountNormal +
        this.calculationState.totalHaveDiscount +
        this.calculationState.totalNotHaveDiscount,
      discount_amount: this.calculationState.discountAmount,
      food_discount_amount: this.calculationState.discountAmountFood,
      drink_discount_amount: this.calculationState.discountAmountDrink,
      total_amount_discount_amount: 0,
      total_amount_extra_charge_amount:
        this.calculationState.totalAmountExtraChargeAmount,
    };
  }

  /**
   * Reset calculation state for new calculation
   */
  private resetCalculationState(): void {
    Object.keys(this.calculationState).forEach((key) => {
      this.calculationState[key] = 0;
    });
  }

  /**
   * Check if invoice details have changed since last calculation
   */
  private hasInvoiceDetailChanged(
    invoiceId: string,
    currentDetails: any[]
  ): boolean {
    if (!invoiceId) {
      return true; // Always calculate if no invoice ID
    }

    const previousSnapshot = this.invoiceDetailSnapshots.get(invoiceId);
    if (!previousSnapshot) {
      return true; // First time calculation
    }

    const currentSnapshot = this.createInvoiceDetailSnapshot(currentDetails);

    // Compare snapshots
    if (previousSnapshot.length !== currentSnapshot.length) {
      return true;
    }

    for (let i = 0; i < previousSnapshot.length; i++) {
      const prev = previousSnapshot[i];
      const curr = currentSnapshot[i];

      if (
        prev.id !== curr.id ||
        prev.quantity !== curr.quantity ||
        prev.price !== curr.price ||
        prev.discount_percent !== curr.discount_percent ||
        prev.category_type !== curr.category_type ||
        prev.food_id !== curr.food_id ||
        prev.is_extra_charge !== curr.is_extra_charge ||
        prev.vat !== curr.vat
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create snapshot of invoice details for change detection
   */
  private createInvoiceDetailSnapshot(details: any[]): InvoiceDetailSnapshot[] {
    return details.map((detail) => ({
      id: detail._id?.toString() || detail.id?.toString() || "",
      quantity: detail.quantity || 0,
      price: detail.price || 0,
      discount_percent: detail.discount_percent || 0,
      category_type: detail.category_type || 0,
      food_id: detail.food_id || 0,
      is_extra_charge: detail.is_extra_charge || 0,
      vat: detail.vat || this.defaultVatService,
    }));
  }

  /**
   * Update invoice detail snapshot after calculation
   */
  private updateInvoiceDetailSnapshot(invoiceId: string, details: any[]): void {
    if (!invoiceId) return;

    const snapshot = this.createInvoiceDetailSnapshot(details);
    this.invoiceDetailSnapshots.set(invoiceId, snapshot);
  }

  /**
   * Clear snapshot for specific invoice (useful when invoice is deleted)
   */
  public clearInvoiceSnapshot(invoiceId: string): void {
    this.invoiceDetailSnapshots.delete(invoiceId);
  }

  /**
   * Clear all snapshots (useful for memory management)
   */
  public clearAllSnapshots(): void {
    this.invoiceDetailSnapshots.clear();
  }

  /**
   * Force recalculation by clearing snapshot
   */
  public forceRecalculation(invoiceId: string): void {
    this.clearInvoiceSnapshot(invoiceId);
  }

  /**
   * Validate inputs before calculation
   */
  private validateInputs(invoiceDetail: any[], invoice: any): void {
    if (!Array.isArray(invoiceDetail)) {
      throw new HttpException(
        "Invoice detail must be an array",
        HttpStatus.BAD_REQUEST
      );
    }
    if (!invoice) {
      throw new HttpException("Invoice is required", HttpStatus.BAD_REQUEST);
    }
    if (invoiceDetail.length === 0) {
      console.warn("Invoice detail array is empty");
    }
  }
  /**
   * Main calculation logic dispatcher
   */
  private async performCalculation(
    invoiceDetail: any[],
    invoice: Invoice,
    discountType: number,
    shouldUpdate: boolean
  ): Promise<CalculationResult> {
    // Check if this is an APP_FOOD order that requires precise VAT calculation
    if (Calculate.APP_FOOD.includes(invoice.order_method)) {
      this.calculateVatAmountsForAppFood(
        invoice,
        invoiceDetail,
        invoice.vat || this.defaultVatService
      );
    }

    switch (discountType) {
      case DiscountType.ALL:
        return this.calculateAllDiscount(invoiceDetail, invoice, shouldUpdate);
      case DiscountType.FOOD:
        return this.calculateFoodDiscount(invoiceDetail, invoice, shouldUpdate);
      case DiscountType.DRINK:
        return this.calculateDrinkDiscount(
          invoiceDetail,
          invoice,
          shouldUpdate
        );
      case DiscountType.FOODANDDRINK:
        return this.calculateFoodAndDrinkDiscount(
          invoiceDetail,
          invoice,
          shouldUpdate
        );
      default:
        return this.calculateNoDiscount(invoiceDetail, invoice, shouldUpdate);
    }
  }
  /**
   * Process special food items (food_id === -1 or -2)
   */
  private processSpecialFoodItems(food: any): void {
    if (food.food_id === -1 || food.food_id === -2) {
      food.total_amount_without_vat = 0;
      food.total_amount = 0;
      food.vat_amount = 0;
      food.discount_amount = 0;

      if (food.is_extra_charge > 0) {
        this.calculationState.totalAmountNormal += food.total_amount;
      }
    }
  }

  /**
   * Calculate extra charges
   */
  private calculateExtraCharges(invoice: any): void {
    this.calculationState.totalAmountExtraChargeAmount =
      (this.calculationState.amountNormal *
        invoice.total_amount_extra_charge_percent) /
      100;

    this.calculationState.vatAmountExtraChargeAmount =
      ((this.calculationState.totalAmountExtraChargeAmount -
        (this.calculationState.totalAmountExtraChargeAmount *
          invoice.total_amount_discount_percent) /
          100) *
        this.defaultVatService) /
      100;

    this.calculationState.vatAmountServiceChargeAmount =
      ((invoice.extra_charge_amount -
        (invoice.extra_charge_amount * invoice.total_amount_discount_percent) /
          100) *
        this.defaultVatService) /
      100;
  }

  /**
   * Calculate for ALL discount type
   */
  private calculateAllDiscount(
    invoiceDetail: any[],
    invoice: any,
    shouldUpdate: boolean
  ): CalculationResult {
    // Process each item - using total_amount as base and calculate backwards
    invoiceDetail.forEach((food) => {
      this.processSpecialFoodItems(food);

      // Use total_amount as the standard and calculate amount and vat from it
      const totalAmount = food.total_amount || 0;
      this.calculationState.totalAmountNormal += totalAmount;

      // Calculate amount from total_amount (reverse calculation)
      // total_amount = amount + vat_amount
      // amount = total_amount / (1 + vat_rate/100)
      const vatRate = food.vat || this.defaultVatService;

      // If VAT = 0, no need to calculate VAT amount
      if (vatRate === 0) {
        const calculatedAmount = totalAmount;
        const calculatedVat = 0;

        this.calculationState.amountNormal += calculatedAmount;
        this.calculationState.vatAmountNormal += calculatedVat;
      } else {
        const calculatedAmount = totalAmount / (1 + vatRate / 100);
        const calculatedVat = (calculatedAmount * vatRate) / 100;

        this.calculationState.amountNormal += calculatedAmount;
        this.calculationState.vatAmountNormal += calculatedVat;
      }
    });

    // Calculate discounts and extra charges
    this.calculationState.discountAmount =
      (this.calculationState.amountNormal *
        invoice.total_amount_discount_percent) /
      100;

    this.calculateExtraCharges(invoice);

    return {
      vat_amount:
        this.calculationState.vatAmountNormal +
        this.calculationState.vatAmountExtraChargeAmount +
        this.calculationState.vatAmountServiceChargeAmount,
      total_amount:
        this.calculationState.totalAmountNormal -
        this.calculationState.discountAmount +
        invoice.extra_charge_amount +
        invoice.total_amount_extra_charge_amount,
      amount: this.calculationState.amountNormal,
      discount_amount: this.calculationState.discountAmount,
      food_discount_amount: 0,
      drink_discount_amount: 0,
      total_amount_discount_amount: this.calculationState.discountAmount,
      total_amount_extra_charge_amount:
        this.calculationState.totalAmountExtraChargeAmount,
    };
  }

  /**
   * Calculate for FOOD discount type
   */
  private calculateFoodDiscount(
    invoiceDetail: any[],
    invoice: any,
    shouldUpdate: boolean
  ): CalculationResult {
    invoiceDetail.forEach((food) => {
      this.processSpecialFoodItems(food);

      // Use total_amount as base and calculate backwards
      const totalAmount = food.total_amount || 0;
      const vatRate = food.vat || this.defaultVatService;

      let calculatedAmount: number;
      let calculatedVat: number;

      // If VAT = 0, no need to calculate VAT amount
      if (vatRate === 0) {
        calculatedAmount = totalAmount;
        calculatedVat = 0;
      } else {
        calculatedAmount = totalAmount / (1 + vatRate / 100);
        calculatedVat = (calculatedAmount * vatRate) / 100;
      }

      if (food.category_type === CategoryType.FOOD) {
        this.calculationState.vatAmountHaveDiscount += calculatedVat;
        this.calculationState.amountHaveDiscount += calculatedAmount;
        this.calculationState.totalHaveDiscount += totalAmount;
        this.calculationState.discountAmountFood += food.discount_amount || 0;
      } else {
        this.calculationState.vatAmountNotHaveDiscount += calculatedVat;
        this.calculationState.amountNotHaveDiscount += calculatedAmount;
        this.calculationState.totalNotHaveDiscount += totalAmount;
      }
    });

    return {
      vat_amount:
        this.calculationState.vatAmountHaveDiscount +
        this.calculationState.vatAmountNotHaveDiscount,
      total_amount:
        this.calculationState.totalNotHaveDiscount +
        this.calculationState.totalHaveDiscount -
        this.calculationState.discountAmountFood +
        invoice.total_amount_extra_charge_amount +
        invoice.extra_charge_amount,
      amount:
        this.calculationState.amountHaveDiscount +
        this.calculationState.amountNotHaveDiscount,
      discount_amount: this.calculationState.discountAmountFood,
      food_discount_amount: this.calculationState.discountAmountFood,
      drink_discount_amount: 0,
      total_amount_discount_amount: 0,
      total_amount_extra_charge_amount:
        (this.calculationState.totalAmountNormal *
          invoice.total_amount_extra_charge_percent) /
        100,
    };
  }

  /**
   * Calculate for DRINK discount type
   */
  private calculateDrinkDiscount(
    invoiceDetail: any[],
    invoice: any,
    shouldUpdate: boolean
  ): CalculationResult {
    invoiceDetail.forEach((food) => {
      this.processSpecialFoodItems(food);

      // Use total_amount as base and calculate backwards
      const totalAmount = food.total_amount || 0;
      const vatRate = food.vat || this.defaultVatService;

      let calculatedAmount: number;
      let calculatedVat: number;

      // If VAT = 0, no need to calculate VAT amount
      if (vatRate === 0) {
        calculatedAmount = totalAmount;
        calculatedVat = 0;
      } else {
        calculatedAmount = totalAmount / (1 + vatRate / 100);
        calculatedVat = (calculatedAmount * vatRate) / 100;
      }

      if (
        food.category_type === CategoryType.DRINK ||
        food.category_type === CategoryType.ORTHERFODD
      ) {
        this.calculationState.vatAmountHaveDiscount += calculatedVat;
        this.calculationState.amountHaveDiscount += calculatedAmount;
        this.calculationState.totalHaveDiscount += totalAmount;
        this.calculationState.discountAmountDrink += food.discount_amount || 0;
      } else {
        this.calculationState.vatAmountNotHaveDiscount += calculatedVat;
        this.calculationState.amountNotHaveDiscount += calculatedAmount;
        this.calculationState.totalNotHaveDiscount += totalAmount;
      }
    });

    return {
      vat_amount:
        this.calculationState.vatAmountHaveDiscount +
        this.calculationState.vatAmountNotHaveDiscount,
      total_amount:
        this.calculationState.totalNotHaveDiscount +
        this.calculationState.totalHaveDiscount -
        this.calculationState.discountAmountDrink +
        invoice.total_amount_extra_charge_amount +
        invoice.extra_charge_amount,
      amount:
        this.calculationState.amountHaveDiscount +
        this.calculationState.amountNotHaveDiscount,
      discount_amount: this.calculationState.discountAmountDrink,
      food_discount_amount: 0,
      drink_discount_amount: this.calculationState.discountAmountDrink,
      total_amount_discount_amount: 0,
      total_amount_extra_charge_amount:
        (this.calculationState.totalAmountNormal *
          invoice.total_amount_extra_charge_percent) /
        100,
    };
  }

  /**
   * Calculate for FOOD AND DRINK discount type
   */
  private calculateFoodAndDrinkDiscount(
    invoiceDetail: any[],
    invoice: any,
    shouldUpdate: boolean
  ): CalculationResult {
    const drinkAmounts: CategoryAmounts = {
      vat_amount: 0,
      amount: 0,
      total: 0,
      discount_amount: 0,
    };
    const foodAmounts: CategoryAmounts = {
      vat_amount: 0,
      amount: 0,
      total: 0,
      discount_amount: 0,
    };

    invoiceDetail.forEach((food) => {
      this.processSpecialFoodItems(food);

      // Use total_amount as base and calculate backwards
      const totalAmount = food.total_amount || 0;
      const vatRate = food.vat || this.defaultVatService;

      let calculatedAmount: number;
      let calculatedVat: number;

      // If VAT = 0, no need to calculate VAT amount
      if (vatRate === 0) {
        calculatedAmount = totalAmount;
        calculatedVat = 0;
      } else {
        calculatedAmount = totalAmount / (1 + vatRate / 100);
        calculatedVat = (calculatedAmount * vatRate) / 100;
      }

      if (
        food.category_type === CategoryType.DRINK ||
        food.category_type === CategoryType.ORTHERFODD
      ) {
        drinkAmounts.vat_amount += calculatedVat;
        drinkAmounts.amount += calculatedAmount;
        drinkAmounts.total += totalAmount;
        drinkAmounts.discount_amount += food.discount_amount || 0;
      } else if (food.category_type === CategoryType.FOOD) {
        foodAmounts.vat_amount += calculatedVat;
        foodAmounts.amount += calculatedAmount;
        foodAmounts.total += totalAmount;
        foodAmounts.discount_amount += food.discount_amount || 0;
      } else {
        this.calculationState.vatAmountNotHaveDiscount += calculatedVat;
        this.calculationState.amountNotHaveDiscount += calculatedAmount;
        this.calculationState.totalNotHaveDiscount += totalAmount;
      }
    });

    return {
      vat_amount:
        drinkAmounts.vat_amount +
        foodAmounts.vat_amount +
        this.calculationState.vatAmountNotHaveDiscount,
      total_amount:
        this.calculationState.totalNotHaveDiscount +
        (drinkAmounts.total + foodAmounts.total) -
        (drinkAmounts.discount_amount + foodAmounts.discount_amount) +
        invoice.total_amount_extra_charge_amount +
        invoice.extra_charge_amount,
      amount:
        drinkAmounts.amount +
        foodAmounts.amount +
        this.calculationState.amountNotHaveDiscount,
      discount_amount:
        drinkAmounts.discount_amount + foodAmounts.discount_amount,
      food_discount_amount: foodAmounts.discount_amount,
      drink_discount_amount: drinkAmounts.discount_amount,
      total_amount_discount_amount: 0,
      total_amount_extra_charge_amount:
        (this.calculationState.totalAmountNormal *
          invoice.total_amount_extra_charge_percent) /
        100,
    };
  }

  /**
   * Calculate VAT amounts for APP_FOOD orders
   * Simply calculate and sum up amounts without reverse calculation from VAT
   */
  public calculateVatAmountsForAppFood(
    invoice: Invoice,
    invoiceDetails: InvoiceDetail[],
    vat: number
  ): void {
    // Check if this invoice requires precise VAT calculation
    if (!Calculate.APP_FOOD.includes(invoice.order_method)) {
      return;
    }

    if (invoiceDetails.length === 0) {
      console.warn(`No invoice details for order ${invoice.order_id}`);
      return;
    }

    let totalAmountWithoutVat = 0;
    let totalVatAmount = 0;
    let totalAmount = 0;

    // Calculate amounts for each detail based on current data
    invoiceDetails.forEach((detail: InvoiceDetail) => {
      if (detail.quantity && detail.price) {
        // Calculate base amount from quantity and price
        const baseAmount = detail.quantity * detail.price;

        // Apply discount if exists
        let amountAfterDiscount = baseAmount;
        if (detail.discount_percent && detail.discount_percent > 0) {
          const discountAmount = (baseAmount * detail.discount_percent) / 100;
          amountAfterDiscount = baseAmount - discountAmount;
          detail.discount_amount = discountAmount;
        } else {
          detail.discount_amount = 0;
        }

        // Calculate VAT amount - if VAT = 0, no VAT calculation needed
        const vatAmount = vat === 0 ? 0 : (amountAfterDiscount * vat) / 100;
        const totalDetailAmount = amountAfterDiscount + vatAmount;

        // Update detail amounts
        detail.total_amount_without_vat = amountAfterDiscount;
        detail.vat_amount = vatAmount;
        detail.total_amount = totalDetailAmount;
        detail.vat = vat;

        // Add to totals
        totalAmountWithoutVat += amountAfterDiscount;
        totalVatAmount += vatAmount;
        totalAmount += totalDetailAmount;
      }
    });

    const currentTotal = invoice.total_amount;

    if (Math.abs(currentTotal - totalAmount) > 0.01) {
      invoice.total_amount_without_vat = totalAmountWithoutVat;
      invoice.vat_amount = totalVatAmount;
      invoice.amount = totalAmountWithoutVat;
      invoice.vat = vat;
      invoice.total_amount = totalAmount;
    } else {
      invoice.total_amount_without_vat = totalAmountWithoutVat;
      invoice.vat_amount = totalVatAmount;
      invoice.amount = totalAmountWithoutVat;
      invoice.vat = vat;
    }
  }

  /**
   * Calculate for no discount (default case)
   */
  private calculateNoDiscount(
    invoiceDetail: any[],
    invoice: any,
    shouldUpdate: boolean
  ): CalculationResult {
    invoiceDetail.forEach((food) => {
      this.processSpecialFoodItems(food);

      // Use total_amount as base and calculate backwards
      const totalAmount = food.total_amount || 0;
      this.calculationState.totalAmountNormal += totalAmount;

      if (shouldUpdate) {
        // Calculate amount and vat from total_amount
        const vatRate = food.vat || this.defaultVatService;

        // If VAT = 0, no need to calculate VAT amount
        if (vatRate === 0) {
          const calculatedAmount = totalAmount;
          const calculatedVat = 0;

          this.calculationState.amountNormal += calculatedAmount;
          this.calculationState.vatAmountNormal += calculatedVat;
        } else {
          const calculatedAmount = totalAmount / (1 + vatRate / 100);
          const calculatedVat = (calculatedAmount * vatRate) / 100;

          this.calculationState.amountNormal += calculatedAmount;
          this.calculationState.vatAmountNormal += calculatedVat;
        }
      } else {
        // Use existing values when not updating
        this.calculationState.vatAmountNormal += food.vat_amount || 0;
        this.calculationState.amountNormal +=
          food.total_amount_without_vat || 0;
        this.calculationState.discountAmount += food.discount_amount || 0;
      }
    });

    this.calculationState.totalAmountExtraChargeAmount =
      (this.calculationState.totalAmountNormal *
        invoice.total_amount_extra_charge_percent) /
      100;

    return {
      vat_amount: this.calculationState.vatAmountNormal,
      total_amount:
        this.calculationState.totalAmountNormal +
        invoice.total_amount_extra_charge_amount +
        invoice.extra_charge_amount,
      amount: this.calculationState.amountNormal,
      discount_amount: shouldUpdate ? 0 : this.calculationState.discountAmount,
      food_discount_amount: 0,
      drink_discount_amount: 0,
      total_amount_discount_amount: 0,
      total_amount_extra_charge_amount:
        this.calculationState.totalAmountExtraChargeAmount,
    };
  }
  /**
   * Recalculate invoice and invoice details by removing discount and recalculating VAT
   * This function reverses the discount calculation and recalculates VAT on the original amount
   *
   * @param invoiceDetail - Array of invoice detail items
   * @param invoice - Invoice object containing discount information
   * @returns Recalculated invoice and invoice details without discount
   */
  public recalculateWithoutDiscount(
    invoiceDetail: InvoiceDetail[],
    invoice: Invoice
  ): {
    recalculatedInvoice: Partial<InvoiceType>;
    recalculatedInvoiceDetails: Partial<InvoiceDetail>[];
  } {
    this.validateInputs(invoiceDetail, invoice);

    const recalculatedInvoiceDetails: Partial<InvoiceDetailType>[] = [];
    let totalAmountWithoutDiscount = 0;
    let totalVatAmountWithoutDiscount = 0;
    let totalAmountWithoutVatAndDiscount = 0;

    invoiceDetail.forEach((detail, index) => {
      const originalDetail = { ...detail };

      if (
        (originalDetail.food_id === -1 &&
          originalDetail.food_code === "GGTB") ||
        originalDetail.food_id === -2
      ) {
        recalculatedInvoiceDetails.push(originalDetail);
        return;
      }

      const vatRate = originalDetail.vat || this.defaultVatService;
      const foodUnitPrice = originalDetail.total_amount_without_vat || 0;

      // Calculate amount without discount from food_unit_price * quantity
      const amountWithoutDiscount = foodUnitPrice;

      // Calculate VAT amount based on the amount without discount - if VAT = 0, no VAT calculation needed
      const vatAmountWithoutDiscount =
        vatRate === 0 ? 0 : (amountWithoutDiscount * vatRate) / 100;

      // Total amount = amount without discount + VAT
      let detailTotalAmountWithoutDiscount = amountWithoutDiscount;

      originalDetail.total_amount_without_vat = amountWithoutDiscount;
      originalDetail.vat_amount = vatAmountWithoutDiscount;
      originalDetail.total_amount = detailTotalAmountWithoutDiscount;
      originalDetail.discount_amount = 0; // Remove discount
      originalDetail.discount_percent = 0; // Remove discount percent

      const recalculatedDetail: Partial<InvoiceDetailType> = {
        ...originalDetail,
      };

      recalculatedInvoiceDetails.push(recalculatedDetail);

      // Accumulate totals
      totalAmountWithoutVatAndDiscount += amountWithoutDiscount;
      totalVatAmountWithoutDiscount += vatAmountWithoutDiscount;
      totalAmountWithoutDiscount += detailTotalAmountWithoutDiscount;
    });

    const recalculatedInvoice: Partial<InvoiceType> = {
      ...invoice,
      amount: totalAmountWithoutVatAndDiscount,
      vat_amount: totalVatAmountWithoutDiscount,
      total_amount:
        totalAmountWithoutVatAndDiscount + totalVatAmountWithoutDiscount,
      discount_amount: 0,
      food_discount_amount: 0,
      drink_discount_amount: 0,
      total_amount_discount_amount: 0,
      discount_percent: 0,
      food_discount_percent: 0,
      drink_discount_percent: 0,
    };

    return {
      recalculatedInvoice,
      recalculatedInvoiceDetails,
    };
  }
  /**
   * Recalculate invoice and invoice details by removing discount and recalculating VAT with database update
   * This is a wrapper around recalculateWithoutDiscount that also updates the database
   *
   * @param invoiceDetail - Array of invoice detail items
   * @param invoice - Invoice object containing discount information
   * @returns Promise that resolves when calculation and update are complete
   */
  public async recalculateWithoutDiscountAndUpdate(
    invoiceDetail: InvoiceDetail[],
    invoice: Invoice
  ): Promise<any> {
    const hasInvoiceDiscount =
      invoice.discount_amount > 0 ||
      invoice.food_discount_amount > 0 ||
      invoice.drink_discount_amount > 0 ||
      invoice.total_amount_discount_amount > 0 ||
      invoice.discount_percent > 0 ||
      invoice.food_discount_percent > 0 ||
      invoice.drink_discount_percent > 0;

    const hasInvoiceDetailDiscount = invoiceDetail.some(
      (detail) => detail.discount_amount > 0 || detail.discount_percent > 0
    );

    // If no discounts exist, return original data without any changes
    if (!hasInvoiceDiscount && !hasInvoiceDetailDiscount) {
      const invoiceAmount = invoiceDetail.reduce((total, detail) => {
        if (detail.food_code !== "GGTB")
          return total + (detail.total_amount_without_vat || 0);
      }, 0);
      invoice.amount = invoiceAmount;
      return {
        invoiceDetails: invoiceDetail,
        invoiceTwoTime: invoice,
      };
    }

    const result = this.recalculateWithoutDiscount(invoiceDetail, invoice);

    invoice.vat_amount = result.recalculatedInvoice.vat_amount;
    invoice.amount = result.recalculatedInvoice.amount;
    invoice.total_amount = result.recalculatedInvoice.total_amount;
    invoice.discount_amount = 0;
    invoice.food_discount_amount = 0;
    invoice.drink_discount_amount = 0;
    invoice.total_amount_discount_amount = 0;
    invoice.discount_percent = 0;
    invoice.food_discount_percent = 0;
    invoice.drink_discount_percent = 0;

    result.recalculatedInvoiceDetails
      .filter((x) => x.food_code !== "GGTB")
      .forEach((recalculatedDetail, index) => {
        if (invoiceDetail[index]) {
          invoiceDetail[index].vat_amount = recalculatedDetail.vat_amount;
          invoiceDetail[index].total_amount_without_vat =
            recalculatedDetail.total_amount_without_vat;
          invoiceDetail[index].total_amount = recalculatedDetail.total_amount;
          invoiceDetail[index].discount_amount = 0;
          invoiceDetail[index].discount_percent = 0;
          // Note: price property is kept as original price (not modified)
        }
      });

    if (this.invoiceHelper && invoice._id) {
      const updateData = {
        vat_amount: result.recalculatedInvoice.vat_amount,
        amount: result.recalculatedInvoice.amount,
        total_amount: result.recalculatedInvoice.total_amount,
        discount_amount: 0,
        food_discount_amount: 0,
        drink_discount_amount: 0,
        total_amount_discount_amount: 0,
        total_amount_extra_charge_amount:
          result.recalculatedInvoice.total_amount_extra_charge_amount || 0,
        discount_percent: 0,
        food_discount_percent: 0,
        drink_discount_percent: 0,
      };

      await this.invoiceHelper.findByIdAndUpdateDiscount(
        invoice._id,
        updateData
      );
    }

    return {
      invoiceDetails: result.recalculatedInvoiceDetails,
      invoiceTwoTime: result.recalculatedInvoice,
    };
  }
}
