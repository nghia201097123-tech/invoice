export class KafkaOrderDetail {
  commodity_nature_type: number;

  order_detail_id: number;

  food_id: number;

  food_code: string;

  food_name: string;

  food_unit: string;

  quantity: number;

  food_unit_price: number;

  discount_percent: number;

  discount_amount: number;

  total_amount_without_vat: number;

  vat: number;

  vat_amount: number;

  total_amount: number;

  is_gift: number;

  order_id: number;

  price: number;

  ref_code: string;

  code: string;

  status: number = 1;

  category_type: number = 0;

  order_buffet_ticket: any = {};

  constructor(data: any) {
    this.commodity_nature_type = 1;
    this.order_id = this.getPropertyValue(data, "order_id");
    this.order_detail_id = this.getPropertyValue(data, "order_detail_id");
    this.food_code = this.getPropertyValue(data, "food_code");
    this.food_name = this.getPropertyValue(data, "food_name");
    this.quantity = this.getPropertyValue(data, "quantity");
    this.food_unit_price = this.getPropertyValue(data, "food_unit_price");
    this.discount_percent = this.getPropertyValue(data, "discount_percent");
    this.discount_amount = this.getPropertyValue(data, "discount_amount");
    this.vat = this.getPropertyValue(data, "vat");
    this.vat_amount = this.getPropertyValue(data, "vat_amount");
    this.total_amount = this.getPropertyValue(data, "total_amount");
    this.is_gift = this.getPropertyValue(data, "is_gift");
    this.price = this.getPropertyValue(data, "price");
    this.food_unit = this.getPropertyValue(data, "food_unit");
    this.status = this.getPropertyValue(data, "status");
    this.category_type = this.getPropertyValue(data, "category_type");
    this.food_id = this.getPropertyValue(data, "food_id");
    this.order_buffet_ticket = this.getPropertyValue(
      data,
      "order_buffet_ticket"
    );
    this.total_amount_without_vat = this.getPropertyValue(
      data,
      "total_amount_without_vat"
    );
  }

  private getPropertyValue(data: any, property: string): any {
    return data ? data[property] : 0;
  }

  public static mapToList(data: any[]): KafkaOrderDetail[] {
    let orderDetail: KafkaOrderDetail[];
    for (let element of data) {
      orderDetail.push(new KafkaOrderDetail(element));
      return orderDetail;
    }
  }
}
