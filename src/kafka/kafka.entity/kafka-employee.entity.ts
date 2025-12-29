import { Utils } from "src/common/utils/utils.common.helper";

export class KafkaElectricInvoice {
  order_id: number;
  customer_id: number = 0;
  payment_method_id: number;
  discount_amount: number;
  payment_date: string;
  customer_name: string = "";
  customer_phone: string = "";
  discount_percent: number;
  vat: number;
  vat_amount: number;
  total_amount: number;
  amount: number;
  restaurant_id: number;
  restaurant_brand_id: number;
  branch_id: number;
  invoice_status: number;
  invoice_denominator: string;
  is_send_mail: number;
  discount_type: number;
  cct_duyet: number = 0;
  order_parent_id: number;
  is_apply_vat: boolean;
  type: number;
  total_amount_without_vat: number;
  /**
   * Số tiền giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  food_discount_amount: number;

  /**
   * phần trăm giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  food_discount_percent: number;

  /**
   * Phần trăm giảm giá áp dụng cho các món đồ uống trong đơn hàng.
   */
  drink_discount_percent: number;

  /**
   * Số tiền giảm giá áp dụng riêng cho các món đồ uống trong đơn hàng
   */
  drink_discount_amount: number;

  /**
   * Phần trăm chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  total_amount_discount_percent: number;

  /**
   * Số tiền  chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  total_amount_discount_amount: number;

  /**
   *  Các khoản phí bổ sung được áp dụng cho tổng số tiền của đơn hàng.
   */
  total_amount_extra_charge_amount: number;

  /**
   *  Tỷ lệ phần trăm phí bổ sung được áp dụng trên tổng số tiền của đơn hàng.
   */
  total_amount_extra_charge_percent: number;

  /**
   * phụ thu
   */
  extra_charge_amount: number;
  /**
   * phí phục vụ
   */
  service_charge_percent: number;

  is_extra_charge: number;

  order_buffet_ticket: any;

  is_bufet: number;

  order_method: number;

  customer_address: string;

  constructor(data?: any) {
    this.order_id = data.order_id;
    this.customer_id = this.getCustomerId(data);
    this.payment_method_id = data.payment_method_id;
    this.discount_amount = data.discount_amount;
    this.payment_date = data.payment_date;
    this.customer_name = this.getCustomerName(data);
    this.customer_phone = this.getCustomerPhone(data);
    this.discount_percent = data.discount_percent;
    this.vat = data.vat;
    this.order_parent_id = data.order_id;
    this.vat_amount = data.vat_amount;
    this.total_amount = data.total_amount;
    this.amount = this.getAmount(data);
    this.restaurant_id = data.restaurant_id;
    this.restaurant_brand_id = data.restaurant_brand_id;
    this.branch_id = data.branch_id;
    this.invoice_status = this.getInvoiceStatus(data);
    this.invoice_denominator = "";
    this.is_send_mail = 0;
    this.discount_type = this.getDiscountType(data);
    this.is_apply_vat = this.getIsApplyVat(data);
    this.total_amount_extra_charge_amount =
      this.getTotalAmountExtraChargeAmount(data);
    this.food_discount_amount = this.getFoodDiscountAmount(data);
    this.drink_discount_percent = this.getDrinkDiscountPercent(data);
    this.total_amount_discount_percent =
      this.getTotalAmountDiscountPercent(data);
    this.total_amount_discount_amount = this.getTotalAmountDiscountAmount(data);
    this.total_amount_extra_charge_percent =
      this.getTotalAmountExtraChargePercent(data);
    this.food_discount_percent = this.getFoodDiscountPercent(data);
    this.drink_discount_amount = this.getDrinkDiscountAmount(data);
    this.extra_charge_amount = this.getExtraChargeAmount(data);
    this.service_charge_percent = this.getServiceChargePercent(data);
    this.is_extra_charge = this.getIsExtraCharge(data);
    this.order_buffet_ticket = this.getOrderBuffetTicket(data);
    this.order_method = data.order_method ?? 0;
    this.customer_address = data.customer_address ?? "";
    this.total_amount_without_vat = data.total_amount_without_vat;
  }

  public getOrderBuffetTicket(data: any): number {
    return data ? data.order_buffet_ticket : null;
  }

  public getIsExtraCharge(data: any): number {
    return data ? (data.extra_charge_amount ? 1 : 0) : 0;
  }

  public getCustomerId(data: any): number {
    return data ? data.customer_id : 0;
  }

  public getCustomerName(data: any): string {
    return data ? data.customer_name : "";
  }

  public getCustomerPhone(data: any): string {
    return data ? data.customer_phone : "";
  }

  public getAmount(data: any): number {
    return data ? data.amount : 0;
  }

  public getInvoiceStatus(data: any): number {
    return data.invoice_status == 0 ? 0 : data.invoice_status;
  }

  public getDiscountType(data: any): number {
    return data ? Utils.getDisCountType(data) : 0;
  }

  public getIsApplyVat(data: any): boolean {
    return data.is_apply_vat ? data.is_apply_vat : false;
  }

  public getTotalAmountExtraChargeAmount(data: any): number {
    return data.total_amount_extra_charge_amount
      ? data.total_amount_extra_charge_amount
      : 0;
  }

  public getFoodDiscountAmount(data: any): number {
    return data.food_discount_amount ? data.food_discount_amount : 0;
  }

  public getDrinkDiscountPercent(data: any): number {
    return data.drink_discount_percent ? data.drink_discount_percent : 0;
  }

  public getTotalAmountDiscountPercent(data: any): number {
    return data.total_amount_discount_percent
      ? data.total_amount_discount_percent
      : 0;
  }

  public getTotalAmountDiscountAmount(data: any): number {
    return data.total_amount_discount_amount
      ? data.total_amount_discount_amount
      : 0;
  }

  public getTotalAmountExtraChargePercent(data: any): number {
    return data.total_amount_extra_charge_percent
      ? data.total_amount_extra_charge_percent
      : 0;
  }

  public getFoodDiscountPercent(data: any): number {
    return data.food_discount_percent ? data.food_discount_percent : 0;
  }

  public getDrinkDiscountAmount(data: any): number {
    return data.drink_discount_amount ? data.drink_discount_amount : 0;
  }

  public getExtraChargeAmount(data: any): number {
    return data.extra_charge_amount ? data.extra_charge_amount : 0;
  }

  public getServiceChargePercent(data: any): number {
    return data.service_charge_percent ? data.service_charge_percent : 0;
  }
}
