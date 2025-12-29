import { InvoiceDetailUpdate } from "./invoice-detail-update";
import { Invoice } from "../schemas/invoice.schema";

export class InvoiceDetailUpdatePartNer {
  stt: number;
  tchat: number;
  ma: string;
  inv_itemName: string;
  inv_unitCode: string;
  inv_unitName: string;
  inv_quantity: number;
  inv_unitPrice: number;
  inv_discountPercentage: number;
  inv_discountAmount: number;
  inv_TotalAmountWithoutVat: number;
  ma_thue: string;
  inv_vatAmount: number;
  inv_TotalAmount: number;
  inv_promotion: boolean;

  constructor(
    invoiceDetailUpdate?: InvoiceDetailUpdate,
    invoice?: Invoice,
    stt?: number
  ) {
    this.stt = stt;
    this.tchat = 1;
    this.ma = invoiceDetailUpdate
      ? invoiceDetailUpdate.food_name
          .trim()
          .toUpperCase()
          .concat(JSON.stringify(stt))
      : "";
    this.inv_itemName = invoiceDetailUpdate
      ? invoiceDetailUpdate.food_name
      : "";
    this.inv_unitCode = invoiceDetailUpdate
      ? invoiceDetailUpdate.food_name.trim().toUpperCase()
      : "";
    this.inv_unitName = invoiceDetailUpdate
      ? invoiceDetailUpdate.food_unit
      : "";
    this.inv_quantity = invoiceDetailUpdate ? invoiceDetailUpdate.quantity : 0;
    this.inv_unitPrice = invoiceDetailUpdate ? invoiceDetailUpdate.price : 0;
    this.inv_discountPercentage = 0;
    this.inv_discountAmount = 0;
    this.inv_TotalAmountWithoutVat = invoiceDetailUpdate
      ? invoiceDetailUpdate.quantity * invoiceDetailUpdate.price
      : 0;
    this.ma_thue = invoiceDetailUpdate.vat
      ? invoiceDetailUpdate.vat.toString()
      : "0";
    this.inv_vatAmount = invoiceDetailUpdate
      ? (invoiceDetailUpdate.vat *
          (invoiceDetailUpdate.quantity * invoiceDetailUpdate.price)) /
        100
      : 0;
    this.inv_TotalAmount = invoiceDetailUpdate
      ? invoiceDetailUpdate.quantity * invoiceDetailUpdate.price +
        (invoiceDetailUpdate.vat *
          (invoiceDetailUpdate.quantity * invoiceDetailUpdate.price)) /
          100
      : 0;
    this.inv_promotion = false;
  }

  public static mapToList(
    baseEntities: InvoiceDetailUpdate[],
    invoice: Invoice
  ): InvoiceDetailUpdatePartNer[] {
    let data: InvoiceDetailUpdatePartNer[] = [];
    baseEntities.forEach((e, i) => {
      data.push(new InvoiceDetailUpdatePartNer(e, invoice, i));
    });

    return data;
  }
}
