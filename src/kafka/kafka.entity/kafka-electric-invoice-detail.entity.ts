import { table } from "node:console";

export class KafkaElectronicInvoiceDetail {
  order_id: number;
  order_detail_id: number;
  food_code: string;
  food_name: string;
  quantity: number;
  food_unit_price: number;
  discount_percent: number;
  discount_amount: number;
  vat: number;
  vat_amount: number;
  total_amount: number;
  total_amount_without_vat: number;
  amount: number;
  is_gift: number;
  food_unit: string;
  price: number;
  food_id: number;
  status: number = 1;
  category_type: number;
  is_extra_charge: number;
  is_buffet: number;

  constructor(data: any) {
    this.order_id = this.assignValue(data, "order_id", 0);
    this.order_detail_id = this.assignValue(data, "order_detail_id", 0);
    this.food_code = this.assignValue(data, "food_code", "");
    this.food_name = this.assignValue(data, "food_name", "");
    this.quantity = this.assignValue(data, "quantity", 0);
    this.food_unit_price = this.assignValue(data, "food_unit_price", 0);
    this.discount_percent = this.assignValue(data, "discount_percent", 0);
    this.discount_amount = this.assignValue(data, "discount_amount", 0);
    this.vat = this.assignValue(data, "vat", 0);
    this.vat_amount = this.assignValue(data, "vat_amount", 0);
    this.total_amount = this.assignValue(data, "total_amount", 0);
    this.total_amount_without_vat = data.total_amount_without_vat || 0;
    this.is_gift = this.assignValue(data, "is_gift", 0);
    this.food_unit = this.assignValue(data, "food_unit", "");
    this.price = this.assignValue(data, "price", 0);
    this.food_id = this.assignValue(data, "food_id", 0);
    this.status = this.assignStatus(data.status);
    this.category_type = this.assignValue(data, "category_type", 0);
    this.is_extra_charge = data ? data.is_extra_charge : 0;
    this.is_buffet = data ? data.is_buffet : 0;
  }

  private assignValue(data: any, key: string, defaultValue: any): any {
    return data ? data[key] : defaultValue;
  }

  private assignStatus(status: any): number {
    return status === true ? 1 : status;
  }
}
