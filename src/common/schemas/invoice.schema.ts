import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { KafkaElectricInvoice } from "src/kafka/kafka.entity/kafka-employee.entity";
import { ObjectIdColumn } from "typeorm";
import { UtilsDate } from "../utils/utils.format-time.common/utils.format-time.common";

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ collection: "invoices", timestamps: true, autoIndex: true })
export class Invoice {
  @ObjectIdColumn()
  _id: string;

  @Prop()
  restaurant_id: number;

  @Prop()
  restaurant_brand_id: number;

  @Prop()
  branch_id: number;

  @Prop()
  payment_date: string;

  @Prop()
  voice_series: string = "";

  @Prop()
  order_id: number;

  @Prop()
  order_parent_id: number;

  @Prop()
  currency_code: string = "";

  @Prop()
  payment_method_id: number;

  @Prop()
  customer_name: string = "";

  @Prop()
  customer_phone: string = "";

  @Prop()
  customer_id: number = 0;

  @Prop()
  customer_company_name: string = "";

  @Prop()
  customer_company_tax_code: string = "";

  @Prop()
  customer_company_address: string = "";

  @Prop()
  customer_company_email: string = "";

  @Prop()
  customer_bank_account: string = "";

  @Prop()
  customer_bank_account_name: string = "";

  @Prop()
  total_amount_without_vat: number;

  @Prop()
  discount_percent: number;

  @Prop()
  discount_amount: number;

  @Prop()
  vat: number;

  @Prop()
  vat_amount: number;

  @Prop()
  total_amount: number;

  @Prop()
  amount: number;

  @Prop()
  type: number = 1;

  @Prop()
  ref_code: string = "";

  @Prop()
  code: string = "";

  @Prop()
  invoice_status: number;

  @Prop()
  cct_duyet: number;

  @Prop()
  invoice_denominator: string;

  @Prop()
  is_send_mail: number;

  @Prop()
  exported_time: string;

  @Prop()
  discount_type: number;

  @Prop()
  partner_type: number;

  @Prop()
  updatedAt: Date;

  @Prop()
  is_apply_vat: boolean;

  /**
   * Số tiền giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  @Prop()
  food_discount_amount: number;

  /**
   * phần trăm giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  @Prop()
  food_discount_percent: number;

  /**
   * Phần trăm giảm giá áp dụng cho các món đồ uống trong đơn hàng.
   */
  @Prop()
  drink_discount_percent: number;

  /**
   * Số tiền giảm giá áp dụng riêng cho các món đồ uống trong đơn hàng
   */
  @Prop()
  drink_discount_amount: number;

  /**
   * Phần trăm chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  @Prop()
  total_amount_discount_percent: number;

  /**
   * Số tiền  chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  @Prop()
  total_amount_discount_amount: number;

  /**
   *  Các khoản phí bổ sung được áp dụng cho tổng số tiền của đơn hàng.
   */
  @Prop()
  total_amount_extra_charge_amount: number;

  /**
   *  Tỷ lệ phần trăm phí bổ sung được áp dụng trên tổng số tiền của đơn hàng.
   */
  @Prop()
  total_amount_extra_charge_percent: number;

  @Prop()
  extra_charge_amount: number = 0;

  @Prop()
  service_charge_percent: number = 0;

  @Prop()
  order_method: number = 0;

  @Prop()
  customer_address: string = "";

  @Prop()
  invoice_number: string = "";

  constructor(kafkaInvoicesEntity: KafkaElectricInvoice) {
    this.order_id = this.getOrderId(kafkaInvoicesEntity);
    this.payment_date = this.getPaymentDate(kafkaInvoicesEntity);
    this.customer_id = this.getCustomerId(kafkaInvoicesEntity);
    this.discount_percent = this.getDiscountPercent(kafkaInvoicesEntity);
    this.discount_amount = this.getDiscountAmount(kafkaInvoicesEntity);
    this.vat = this.getVat(kafkaInvoicesEntity);
    this.vat_amount = this.getVatAmount(kafkaInvoicesEntity);
    this.total_amount = this.getTotalAmount(kafkaInvoicesEntity);
    this.amount = this.getAmount(kafkaInvoicesEntity);
    this.type = 1;
    this.restaurant_id = this.getRestaurantId(kafkaInvoicesEntity);
    this.restaurant_brand_id = this.getRestaurantBrandId(kafkaInvoicesEntity);
    this.branch_id = this.getBranchId(kafkaInvoicesEntity);
    this.invoice_status = 0;
    this.cct_duyet = 0;
    this.invoice_denominator = "";
    this.is_send_mail = this.getIsSendMail(kafkaInvoicesEntity);
    this.exported_time = UtilsDate.convertDateFormatHaveTimeStamp(new Date());
    this.discount_type = this.getDiscountType(kafkaInvoicesEntity);
    this.order_parent_id = this.getOrderParentId(kafkaInvoicesEntity);
    this.partner_type = 0;
    this.is_apply_vat = this.getIsApplyVat(kafkaInvoicesEntity);
    this.total_amount_extra_charge_amount =
      this.getTotalAmountExtraChargeAmount(kafkaInvoicesEntity);
    this.food_discount_amount = this.getFoodDiscountAmount(kafkaInvoicesEntity);
    this.drink_discount_percent =
      this.getDrinkDiscountPercent(kafkaInvoicesEntity);
    this.total_amount_discount_percent =
      this.getTotalAmountDiscountPercent(kafkaInvoicesEntity);
    this.total_amount_discount_amount =
      this.getTotalAmountDiscountAmount(kafkaInvoicesEntity);
    this.total_amount_extra_charge_percent =
      this.getTotalAmountExtraChargePercent(kafkaInvoicesEntity);
    this.food_discount_percent =
      this.getFoodDiscountPercent(kafkaInvoicesEntity);
    this.drink_discount_amount =
      this.getDrinkDiscountAmount(kafkaInvoicesEntity);
    this.extra_charge_amount = this.getExtraChargeAmount(kafkaInvoicesEntity);
    this.service_charge_percent =
      this.getServiceChargePercent(kafkaInvoicesEntity);
    this.customer_name = kafkaInvoicesEntity.customer_name;
    this.customer_phone = kafkaInvoicesEntity.customer_phone;
    this.order_method = kafkaInvoicesEntity.order_method ?? 0;
    this.customer_address = kafkaInvoicesEntity.customer_address ?? "";
    this.customer_company_address = kafkaInvoicesEntity.customer_address ?? "";
  }

  public getOrderId(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.order_id : 0;
  }

  public getPaymentDate(kafkaInvoicesEntity: KafkaElectricInvoice): string {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.payment_date : "";
  }

  public getCustomerId(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.customer_id : 0;
  }

  public getDiscountPercent(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.discount_percent : 0;
  }

  public getDiscountAmount(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.discount_amount : 0;
  }

  public getVat(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.vat : 0;
  }

  public getVatAmount(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.vat_amount : 0;
  }

  public getTotalAmount(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.total_amount : 0;
  }

  public getAmount(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.amount : 0;
  }

  public getRestaurantId(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.restaurant_id : 0;
  }

  public getRestaurantBrandId(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.restaurant_brand_id : 0;
  }

  public getBranchId(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.branch_id : 0;
  }

  public getIsSendMail(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.is_send_mail : 0;
  }

  public getDiscountType(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.discount_type : 0;
  }

  public getOrderParentId(kafkaInvoicesEntity: KafkaElectricInvoice): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.order_parent_id : 0;
  }

  public getIsApplyVat(kafkaInvoicesEntity: KafkaElectricInvoice): boolean {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.is_apply_vat : false;
  }

  public getTotalAmountExtraChargeAmount(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity
      ? kafkaInvoicesEntity.total_amount_extra_charge_amount
      : 0;
  }

  public getFoodDiscountAmount(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.food_discount_amount : 0;
  }

  public getDrinkDiscountPercent(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.drink_discount_percent : 0;
  }

  public getTotalAmountDiscountPercent(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity
      ? kafkaInvoicesEntity.total_amount_discount_percent
      : 0;
  }

  public getTotalAmountDiscountAmount(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity
      ? kafkaInvoicesEntity.total_amount_discount_amount
      : 0;
  }

  public getTotalAmountExtraChargePercent(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity
      ? kafkaInvoicesEntity.total_amount_extra_charge_percent
      : 0;
  }

  public getFoodDiscountPercent(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.food_discount_percent : 0;
  }

  public getDrinkDiscountAmount(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.drink_discount_amount : 0;
  }

  public getExtraChargeAmount(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.extra_charge_amount : 0;
  }

  public getServiceChargePercent(
    kafkaInvoicesEntity: KafkaElectricInvoice
  ): number {
    return kafkaInvoicesEntity ? kafkaInvoicesEntity.service_charge_percent : 0;
  }
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Add indexes for performance optimization
InvoiceSchema.index({ order_id: 1, invoice_status: 1 }); // Compound index for order queries with status
InvoiceSchema.index({ order_id: 1 }); // Single index for order_id queries
InvoiceSchema.index({ restaurant_id: 1, branch_id: 1 }); // Compound index for restaurant and branch queries
InvoiceSchema.index({ restaurant_id: 1 }); // Single index for restaurant_id queries
InvoiceSchema.index({ branch_id: 1 }); // Single index for branch_id queries
InvoiceSchema.index({ invoice_status: 1 }); // Single index for status queries
InvoiceSchema.index({ payment_date: 1 }); // Single index for payment date queries
InvoiceSchema.index({ customer_id: 1 }); // Single index for customer queries
InvoiceSchema.index({ code: 1 }); // Single index for invoice code queries
InvoiceSchema.index({ ref_code: 1 }); // Single index for reference code queries
InvoiceSchema.index({ createdAt: 1 }); // Single index for creation date queries
InvoiceSchema.index({ updatedAt: 1 }); // Single index for update date queries
