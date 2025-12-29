import { ExportInvoiceDTO } from "../../../../common/dto/invoice.export.dto";

export class InvoiceSendMail {
  partner_name: string;
  name_company: string;
  server: string;
  error_message: string;
  start_time: string;
  duration_api: string;

  constructor(
    exportInvoiceDTO?: ExportInvoiceDTO,
    server?: string,
    errorMessage?: string,
    startTime?: string,
    durationApi?: string,
    partnerName?: string
  ) {
    this.name_company = exportInvoiceDTO
      ? exportInvoiceDTO.customer_company_name
      : " ";
    this.server = server || "";
    this.error_message = errorMessage || "";
    this.start_time = startTime || "";
    this.duration_api = durationApi || "";
    this.partner_name = partnerName || "";
  }
}
