import { InvoiceDetailElasticImport } from "../responses/invoice-detail-elastic-import";

export class InvoiceDetailMap {
  invoice_detail_id: string = "";
  food_name: string;
  food_unit: string = "";
  quantity: number = 0;
  price: number = 0;
  vat: number = 0;
  is_gift: number = 0;

  constructor(invoiceDetail?: InvoiceDetailElasticImport) {
    this.invoice_detail_id = invoiceDetail.mongo_id.toString();
    this.food_name = invoiceDetail.food_name;
    this.food_unit = invoiceDetail.food_unit;
    this.is_gift = invoiceDetail.is_gift;
    this.price = invoiceDetail.price;
    this.quantity = invoiceDetail.quantity;
    this.vat = invoiceDetail.vat;
  }

  public static mapToList(
    baseEntities: InvoiceDetailElasticImport[]
  ): InvoiceDetailMap[] {
    let data: InvoiceDetailMap[] = [];
    baseEntities.forEach((e) => {
      data.push(new InvoiceDetailMap(e));
    });
    return data;
  }
}
