import { InvoiceConvertUpdatePartNerFptDto } from "./update_inv_invoice.dto";

export class InvoiceFormUpdateInvoicePartNerFpt {
  inv: InvoiceConvertUpdatePartNerFptDto;

  constructor(
    invoiceConvertUpdatePartNerFptDto?: InvoiceConvertUpdatePartNerFptDto
  ) {
    this.inv = invoiceConvertUpdatePartNerFptDto;
  }
}
