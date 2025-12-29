import mongoose from "mongoose";
import { Invoice } from "../../../../common/schemas/invoice.schema";
import { InvoiceConvertPartNerFptMapListItemDto } from "./map_list_item.dto";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { InvoiceDetail } from "../../../../common/schemas/invoice-detail.schema";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
export class InvoiceConvertUpdatePartNerFptDto {
  adj: InvoiceOpenTagFpt;
  sid: string;
  idt: string;
  type: string;
  form: string;
  serial: string;
  seq: string;
  bcode: string;
  bname: string;
  buyer: string;
  btax: string;
  baddr: string;
  btel: string;
  bmail: string;
  paym: string;
  curr: string;
  exrt: number;
  bacc: string;
  bbank: string;
  note: string;
  sumv: number;
  sum: number;
  vatv: number;
  vat: number;
  word: string;
  totalv: number;
  total: number;
  discount: number;
  aun: any;
  type_ref: number;
  listnum: string;
  listdt: string;
  sendtype: number;
  items: InvoiceConvertPartNerFptMapListItemDto[];
  stax: string;

  constructor(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    invoice?: Invoice,
    invoiceDetail?: InvoiceDetail[],
    amount?: number,
    totalAmount?: number,
    vatAmount?: number
  ) {
    this.adj = new InvoiceOpenTagFpt(invoice);
    this.sid = new mongoose.Types.ObjectId().toString();
    this.idt = invoice.exported_time;
    this.type = "01GTKT";
    this.form = "1";
    this.serial = invoice.voice_series;
    this.seq = ConvertNumberToString.numberToSeq(
      invoice.order_id + new Date().getMilliseconds() + invoice.branch_id + 9000
    );
    this.bcode = "";
    this.bname = this.getCustomerCompanyName(invoice);
    this.buyer = this.getCustomerName(invoice);
    this.btax = this.getCustomerCompanyTaxCode(invoice);
    this.baddr = this.getCustomerCompanyAddress(invoice);
    this.btel = this.getCustomerPhone(invoice);
    this.bmail = this.getCustomerCompanyEmail(invoice);
    this.paym = "TM";
    this.curr = "VND";
    this.exrt = 1;
    this.bacc = this.getCustomerBankAccount(invoice);
    this.bbank = this.getCustomerBankAccountName(invoice);
    this.note = "";
    this.sumv = this.calculateSumV(
      amount,
      totalAmount,
      invoice.discount_percent
    );
    this.sum = this.calculateSum(amount, totalAmount, invoice.discount_percent);
    this.vatv = this.calculateVatV(
      amount,
      vatAmount,
      totalAmount,
      invoice.discount_percent
    );
    this.vat = this.calculateVat(
      amount,
      vatAmount,
      totalAmount,
      invoice.discount_percent
    );
    this.word = ConvertNumberToString.numberToWords(
      this.calculateTotal(
        amount,
        vatAmount,
        totalAmount,
        invoice.discount_percent
      )
    );
    this.totalv = this.calculateTotalV(
      amount,
      vatAmount,
      totalAmount,
      invoice.discount_percent
    );
    this.total = this.calculateTotal(
      amount,
      vatAmount,
      totalAmount,
      invoice.discount_percent
    );
    this.discount = this.calculateDiscount(
      totalAmount,
      invoice.discount_percent
    );
    this.aun = 1;
    this.type_ref = 1;
    this.listnum = "";
    this.listdt = "";
    this.sendtype = 1;
    this.items = new InvoiceConvertPartNerFptMapListItemDto().mapToList(
      invoiceDetail
    );
    this.stax = this.getRestaurantPartnerInvoiceTaxCode(
      restaurantPartnerInvoiceEntity
    );
  }

  // Helper publics
  public getCustomerCompanyName(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_name : "";
  }

  public getCustomerName(invoice?: Invoice): string {
    return invoice ? invoice.customer_name : "";
  }

  public getCustomerCompanyTaxCode(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_tax_code : "";
  }

  public getCustomerCompanyAddress(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_address : "";
  }

  public getCustomerPhone(invoice?: Invoice): string {
    return invoice ? invoice.customer_phone : "";
  }

  public getCustomerCompanyEmail(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_email : "";
  }

  public getCustomerBankAccount(invoice?: Invoice): string {
    return invoice ? invoice.customer_bank_account : "";
  }

  public getCustomerBankAccountName(invoice?: Invoice): string {
    return invoice ? invoice.customer_bank_account_name : "";
  }

  public calculateSumV(
    amount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    const sumV = Math.floor(
      amount - Math.floor((totalAmount * discountPercent) / 100)
    );
    return sumV < 0 ? 0 : sumV;
  }

  public calculateSum(
    amount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    const sum = Math.floor(
      amount - Math.floor((totalAmount * discountPercent) / 100)
    );
    return sum < 0 ? 0 : sum;
  }

  public calculateVatV(
    amount?: number,
    vatAmount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    const vatV = Math.floor(
      amount - Math.floor((totalAmount * discountPercent) / 100)
    );
    return vatV < 0 ? 0 : Math.floor(vatAmount);
  }

  public calculateVat(
    amount?: number,
    vatAmount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    const vat = Math.floor(
      amount - Math.floor((totalAmount * discountPercent) / 100)
    );
    return vat < 0 ? 0 : Math.floor(vatAmount);
  }

  public calculateTotal(
    amount?: number,
    vatAmount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    return Math.floor(
      amount + vatAmount - (totalAmount * discountPercent) / 100
    );
  }

  public calculateTotalV(
    amount?: number,
    vatAmount?: number,
    totalAmount?: number,
    discountPercent?: number
  ): number {
    return totalAmount
      ? Math.floor(amount + vatAmount - (totalAmount * discountPercent) / 100)
      : 0;
  }

  public calculateDiscount(
    totalAmount?: number,
    discountPercent?: number
  ): number {
    return totalAmount ? Math.floor((totalAmount * discountPercent) / 100) : 0;
  }

  public getRestaurantPartnerInvoiceTaxCode(
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity
  ): string {
    return restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.tax_code
      : "";
  }
}

export class InvoiceOpenTagFpt {
  rdt: string;
  rea: string;
  ref: string;
  seq: string;

  constructor(invoice?: Invoice) {
    this.rdt = invoice ? invoice.exported_time : "";
    this.rea = "";
    this.ref = "123";
    this.seq = `1-${invoice.voice_series}-${ConvertNumberToString.numberToSeq(
      invoice.order_id
    )}`;
  }
}
