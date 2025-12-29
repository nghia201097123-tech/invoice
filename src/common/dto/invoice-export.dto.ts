import { InvoiceConvertPartnerMInvoiceDTO } from "../../partner/invoice-minvoice/dto/export.dto";

export class ExportInvoiceDto {
  editmode: number;
  data: [InvoiceConvertPartnerMInvoiceDTO];

  constructor(
    type: number,
    invoiceConvertPartnerMInvoiceDTO: InvoiceConvertPartnerMInvoiceDTO
  ) {
    this.editmode = type;
    this.data = [invoiceConvertPartnerMInvoiceDTO];
  }
}
