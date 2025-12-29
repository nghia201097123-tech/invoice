export class InvoiceDetailModelMap {
  commodity_nature_type: number;

  order_detail_id: number;

  food_code: string;

  food_name: string;

  food_id: number;

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

  ref_code: string;

  price: number;

  code: string;

  category_type: number;

  is_extra_charge: number;

  constructor(data?: any) {
    this.commodity_nature_type = 1;
    this.order_id = data.order_id;
    this.order_detail_id = data.order_detail_id;
    this.food_code = data.food_code;
    this.food_name = data.food_name;
    this.quantity = data.quantity;
    this.food_unit_price = data.food_unit_price;
    this.discount_percent = data.discount_percent;
    this.discount_amount = data.discount_amount;
    this.vat = data.vat;
    this.price = data.price;
    this.vat_amount = data.vat_amount;
    this.total_amount = data.total_amount;
    this.is_gift = data.is_gift;
    this.category_type = data.category_type;
    this.food_id = data.food_id ?? 0;
    this.is_extra_charge = data ? data.is_extra_charge : 0;
  }

  public mapToList(baseEntities: any[]): any[] {
    let data: InvoiceDetailModelMap[] = [];
    baseEntities.forEach((e) => {
      data.push(new InvoiceDetailModelMap(e));
    });
    return data;
  }
}
