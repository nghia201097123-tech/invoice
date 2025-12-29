import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { KafkaElectronicInvoiceDetail } from "src/kafka/kafka.entity/kafka-electric-invoice-detail.entity";

export type InvoiceDetailDocument = HydratedDocument<InvoiceDetail>;

@Schema({ collection: "invoice_details", autoIndex: true })
export class InvoiceDetail {
  @Prop()
  commodity_nature_type: number;

  @Prop()
  order_detail_id: number;

  @Prop()
  food_id: number;

  @Prop()
  food_code: string;

  @Prop()
  food_name: string;

  @Prop()
  food_unit: string;

  @Prop()
  quantity: number;

  @Prop()
  food_unit_price: number;

  @Prop()
  discount_percent: number;

  @Prop()
  discount_amount: number;

  @Prop()
  total_amount_without_vat: number;

  @Prop()
  vat: number;

  @Prop()
  vat_amount: number;

  @Prop()
  total_amount: number;

  @Prop()
  is_gift: number;

  @Prop()
  order_id: number;

  @Prop()
  price: number;

  @Prop()
  ref_code: string;

  @Prop()
  code: string;

  @Prop()
  status: number = 1;

  @Prop()
  category_type: number = 0;

  @Prop()
  is_extra_charge: number = 0;

  @Prop()
  is_buffet: number = 0;

  constructor(kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail) {
    this.commodity_nature_type = 1;
    this.order_id = this.getOrderId(kafkaElectronicInvoiceDetail);
    this.order_detail_id = this.getOrderDetailId(kafkaElectronicInvoiceDetail);
    this.food_code = this.getFoodCode(kafkaElectronicInvoiceDetail);
    this.food_name = this.getFoodName(kafkaElectronicInvoiceDetail);
    this.quantity = this.getQuantity(kafkaElectronicInvoiceDetail);
    this.food_unit_price = this.getFoodUnitPrice(kafkaElectronicInvoiceDetail);
    this.discount_percent = this.getDiscountPercent(
      kafkaElectronicInvoiceDetail
    );
    this.discount_amount = this.getDiscountAmount(kafkaElectronicInvoiceDetail);
    this.vat = this.getVat(kafkaElectronicInvoiceDetail);
    this.vat_amount = this.getVatAmount(kafkaElectronicInvoiceDetail);
    this.total_amount = this.getTotalAmount(kafkaElectronicInvoiceDetail);
    this.is_gift = this.getIsGift(kafkaElectronicInvoiceDetail);
    this.price = this.getPrice(kafkaElectronicInvoiceDetail);
    this.food_unit = this.getFoodUnit(kafkaElectronicInvoiceDetail);
    this.status = this.getStatus(kafkaElectronicInvoiceDetail);
    this.category_type = this.getCategoryType(kafkaElectronicInvoiceDetail);
    this.food_id = this.getFoodId(kafkaElectronicInvoiceDetail);
    this.is_extra_charge = kafkaElectronicInvoiceDetail
      ? kafkaElectronicInvoiceDetail.is_extra_charge
      : 0;
    this.is_buffet = kafkaElectronicInvoiceDetail
      ? kafkaElectronicInvoiceDetail.is_buffet
      : 0;
  }

  public getIsBuffet(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.is_buffet || 0;
  }

  public getOrderId(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.order_id || 0;
  }

  public getOrderDetailId(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.order_detail_id || 0;
  }

  public getFoodCode(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): string {
    return kafkaElectronicInvoiceDetail?.food_code || "";
  }

  public getFoodName(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): string {
    return kafkaElectronicInvoiceDetail?.food_name || "";
  }

  public getQuantity(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.quantity || 0;
  }

  public getFoodUnitPrice(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.food_unit_price || 0;
  }

  public getDiscountPercent(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.discount_percent || 0;
  }

  public getDiscountAmount(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.discount_amount || 0;
  }

  public getVat(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.vat || 0;
  }

  public getVatAmount(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.vat_amount || 0;
  }

  public getTotalAmount(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.total_amount || 0;
  }

  public getIsGift(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.is_gift || 0;
  }

  public getPrice(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.price || 0;
  }

  public getFoodUnit(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): string {
    return kafkaElectronicInvoiceDetail?.food_unit || "";
  }

  public getStatus(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.status || 0;
  }

  public getCategoryType(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.category_type || 0;
  }

  public getFoodId(
    kafkaElectronicInvoiceDetail?: KafkaElectronicInvoiceDetail
  ): number {
    return kafkaElectronicInvoiceDetail?.food_id || 0;
  }
}

export const InvoiceDetailSchema = SchemaFactory.createForClass(InvoiceDetail);

// Add indexes for performance optimization
InvoiceDetailSchema.index({ order_id: 1, status: 1 }); // Compound index for main query (fixes the hint error)
InvoiceDetailSchema.index({ order_id: 1 }); // Single field index for order_id
InvoiceDetailSchema.index({ status: 1 }); // Single field index for status
InvoiceDetailSchema.index({ food_id: 1 }); // Index for food_id queries
InvoiceDetailSchema.index({ order_detail_id: 1 }); // Index for order_detail_id queries
InvoiceDetailSchema.index({ food_code: 1 }); // Index for food_code queries
