export class InvoiceDetailElasticResponse {
  status: number;
  _id: string;
  order_id: number;
  order_detail_id: number;
  food_code: string;
  food_name: string;
  quantity: number;
  food_unit_price: number;
  discount_percent: number;
  discount_amount: number;
  vat: number;
  total_amount_without_vat: number;
  vat_amount: number;
  total_amount: number;
  is_gift: number;
  food_unit: string;
  price: number;
  food_id: number;
  category_type: number;

  constructor(data?: any) {
    this.status = data.status ? data.status : 0;
    this._id = data.mongo_id ? data.mongo_id : "";
    this.order_id = data.order_id ? data.order_id : 0;
    this.order_detail_id = data.order_detail_id ? data.order_detail_id : 0;
    this.food_code = data.food_code ? data.food_code : "";
    this.food_name = data.food_name ? data.food_name : "";
    this.quantity = data.quantity ? Number(data.quantity.toFixed(2)) : 0;
    this.food_unit_price = data.food_unit_price ? data.food_unit_price : 0;
    this.discount_percent = data.discount_percent ? data.discount_percent : 0;
    this.discount_amount = data.discount_amount ? data.discount_amount : 0;
    this.vat = data.vat ? data.vat : 0;
    this.total_amount_without_vat = data.total_amount_without_vat
      ? data.total_amount_without_vat
      : 0;
    this.vat_amount = data.vat_amount ? data.vat_amount : 0;
    this.total_amount = data.total_amount ? data.total_amount : 0;
    this.is_gift = data.is_gift ? data.is_gift : 0;
    this.food_unit = data.food_unit ? data.food_unit : "";
    this.price = data.price ? data.price : 0;
    this.food_id = data.food_id ? data.food_id : 0;
    this.category_type = data.category_type ? data.category_type : 0;
  }

  public static mapToList(data?: any[]): InvoiceDetailElasticResponse[] {
    let invoiceDetailElasticResponse: InvoiceDetailElasticResponse[] = [];
    data.forEach((x) => {
      invoiceDetailElasticResponse.push(new InvoiceDetailElasticResponse(x));
    });
    return invoiceDetailElasticResponse;
  }
}
