import { Invoice } from "../../../common/schemas/invoice.schema";
import { InvoiceDetailUpdatePartNer } from "../../../common/dto/map_detail_partner.dto";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";

export class InvoiceConvertPartnerUpdateMInvoiceDTO {
  inv_InvoiceAuth_id: string;
  inv_invoiceIssuedDate: string;
  data: InvoiceDetailUpdatePartNer[];

  constructor(
    invoice: Invoice,
    invoiceDetailUpdatePartNer: InvoiceDetailUpdatePartNer[]
  ) {
    this.inv_InvoiceAuth_id = invoice.ref_code.trim();
    this.inv_invoiceIssuedDate = UtilsDate.splitTimeGetDate(
      invoice.exported_time
    );
    this.data = invoiceDetailUpdatePartNer;
  }
}
