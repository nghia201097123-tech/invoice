export class InvoiceDetailElasticImport {
  mongo_id: string;
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
  status: number;
  category_type: number;
  updated_at: Date;

  constructor(data?: any) {
    this.mongo_id = data._id;
    this.order_detail_id = data.order_detail_id;
    this.food_id = data.food_id;
    this.food_code = data.food_code;
    this.food_name = data.food_name;
    this.food_unit = data.food_unit;
    this.quantity = data.quantity;
    this.food_unit_price = data.food_unit_price ? data.food_unit_price : 0;
    this.discount_percent = data.discount_percent;
    this.discount_amount = data.discount_amount;
    this.total_amount_without_vat = data.total_amount_without_vat;
    this.vat = data.vat;
    this.vat_amount = data.vat_amount;
    this.total_amount = data.total_amount;
    this.is_gift = data.is_gift;
    this.order_id = data.order_id;
    this.price = data.price;
    this.status = data.status;
    this.category_type = data.category_type;
    this.updated_at = data.updatedAt;
  }

  public static mapToList(data?: any[]): InvoiceDetailElasticImport[] {
    let invoiceDetailElasticImport: InvoiceDetailElasticImport[] = [];
    data.forEach((x) => {
      return invoiceDetailElasticImport.push(new InvoiceDetailElasticImport(x));
    });

    return invoiceDetailElasticImport;
  }
}
