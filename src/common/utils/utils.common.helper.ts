import { v4 as uuidv4 } from "uuid";
import { Invoice } from "../schemas/invoice.schema";
import { DiscountType } from "../enums/discount-type";
import { InvoiceDetail } from "../schemas/invoice-detail.schema";
import { CategoryType } from "../enums/category_type.enum";

export class Utils {
  public static getInitials(inputString: string): string {
    const words = inputString.split(" ");
    let initials = "";
    words.forEach((word) => {
      if (word.length > 0) {
        initials += word[0].toUpperCase();
      }
    });
    return initials;
  }

  public static getDisCountType(invoice: Invoice | any): number {
    let disCountType: number = 0;

    if (
      invoice.total_amount_discount_amount > 0 &&
      invoice.drink_discount_amount == 0 &&
      invoice.food_discount_amount == 0
    ) {
      disCountType = DiscountType.ALL;
    } else if (
      invoice.drink_discount_amount > 0 &&
      invoice.total_amount_discount_amount == 0 &&
      invoice.food_discount_amount == 0
    ) {
      disCountType = DiscountType.DRINK;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.total_amount_discount_amount == 0 &&
      invoice.drink_discount_amount == 0
    ) {
      disCountType = DiscountType.FOOD;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.drink_discount_amount > 0
    ) {
      disCountType = DiscountType.FOODANDDRINK;
    }
    return disCountType;
  }

  public static getDiscountAmountFood(
    invoice: Invoice | any,
    invoiceDetail: InvoiceDetail | any
  ): number {
    let disCountAmountFood: number = 0;
    let disCountAmountDrink: number = 0;
    let disCountAmountAll: number = 0;

    if (
      invoice.total_amount_discount_amount > 0 &&
      invoice.drink_discount_amount == 0 &&
      invoice.food_discount_amount == 0
    ) {
      disCountAmountAll =
        invoiceDetail.quantity * invoiceDetail.price -
        (invoiceDetail.quantity *
          invoiceDetail.price *
          invoice.total_amount_discount_percent) /
          100;

      return disCountAmountAll;
    } else if (
      invoice.drink_discount_amount > 0 &&
      invoice.total_amount_discount_amount == 0 &&
      invoice.food_discount_amount == 0
    ) {
      disCountAmountDrink =
        invoiceDetail.quantity * invoiceDetail.price -
        (invoiceDetail.quantity *
          invoiceDetail.price *
          invoice.drink_discount_percent) /
          100;

      return disCountAmountDrink;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.total_amount_discount_amount == 0 &&
      invoice.drink_discount_amount == 0
    ) {
      disCountAmountFood =
        invoiceDetail.quantity * invoiceDetail.price -
        (invoiceDetail.quantity *
          invoiceDetail.price *
          invoice.food_discount_percent) /
          100;

      return disCountAmountFood;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.drink_discount_amount > 0
    ) {
      if (invoiceDetail.category_type === CategoryType.FOOD) {
        return (
          invoiceDetail.quantity * invoiceDetail.price -
          (invoiceDetail.quantity *
            invoiceDetail.price *
            invoice.food_discount_percent) /
            100
        );
      } else if (invoiceDetail.category_type === CategoryType.DRINK) {
        return (
          invoiceDetail.quantity * invoiceDetail.price -
          (invoiceDetail.quantity *
            invoiceDetail.price *
            invoice.drink_discount_percent) /
            100
        );
      }
    }
  }

  public static getDiscountPercentFood(
    invoice: Invoice | any,
    invoiceDetail: InvoiceDetail | any
  ): number {
    if (
      invoice.total_amount_discount_amount > 0 &&
      invoice.drink_discount_amount === 0 &&
      invoice.food_discount_amount === 0
    ) {
      return invoice.total_amount_discount_percent;
    } else if (
      invoice.drink_discount_amount > 0 &&
      invoice.total_amount_discount_amount == 0 &&
      invoice.food_discount_amount === 0
    ) {
      return invoice.drink_discount_percent;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.total_amount_discount_amount === 0 &&
      invoice.drink_discount_amount === 0
    ) {
      return invoice.food_discount_percent;
    } else if (
      invoice.food_discount_amount > 0 &&
      invoice.drink_discount_amount > 0
    ) {
      if (invoiceDetail.category_type === CategoryType.FOOD) {
        return invoice.food_discount_percent;
      } else if (
        invoiceDetail.category_type === CategoryType.DRINK ||
        invoiceDetail.category_type === CategoryType.ORTHERFODD
      ) {
        return invoice.drink_discount_percent;
      }
    }
    return 0;
  }

  public static getUUID(): string {
    return uuidv4();
  }

  /**
   * Validate if a string is a valid UUID (v4)
   * @param uuid - The string to validate
   * @returns boolean - true if valid UUID, false otherwise
   */
  public static isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== "string") {
      return false;
    }

    // UUID v4 regex pattern
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate if a string is a valid UUID (any version)
   * @param uuid - The string to validate
   * @returns boolean - true if valid UUID, false otherwise
   */
  public static isValidUUIDAnyVersion(uuid: string): boolean {
    if (!uuid || typeof uuid !== "string") {
      return false;
    }

    // UUID any version regex pattern
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate ref_code as UUID and check if it's not empty
   * @param refCode - The ref_code to validate
   * @returns boolean - true if valid and not empty, false otherwise
   */
  public static isValidRefCode(refCode: string): boolean {
    return refCode && refCode.trim() !== "" && this.isValidUUID(refCode);
  }
}
