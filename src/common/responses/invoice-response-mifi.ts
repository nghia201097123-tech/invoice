import { ExportInvoiceDTO } from "../dto/invoice.export.dto";
import { Invoice } from "../schemas/invoice.schema";

export class InvoiceMifiResponse {
  ref_code: string;
  code: string;
  status: string;
  invoice_status: number;
  invoice_series: string;
  invoice_number: number;
  created_at: string;
  currency_code: string;
  exchange_rate: number;
  customer_buyer_name: string;
  customer_company_name: string = "";
  customer_company_address: string = "";
  customer_company_email: string = "";
  customer_company_tax_code: string = "";
  seller_account_number: number;
  security_code: string;
  unit_code: string;
  user_create: string;
  total_amount_without_vat: number;
  total_amount_vat: number;
  discount_amount: number;
  total_amount: number;
  total_amount_word: string;
  order_id: number;
  customer_bank_account: string;
  customer_buy_bank_account: string;
  customer_sell_bank_account: string;
  dvcs_code: string;
  is_success: string;

  constructor(
    data?: any,
    exportInvoiceDTO?: ExportInvoiceDTO,
    invoice?: Invoice
  ) {
    this.ref_code = data.Key;
    this.code = "";
    this.customer_company_tax_code = exportInvoiceDTO.customer_company_tax_code
      ? exportInvoiceDTO.customer_company_tax_code
      : "";
    this.status = "đã gửi";
    this.invoice_status = 1;
    this.invoice_series = data.InvSerial ? data.InvSerial : "";
    this.invoice_number = data.SO ? data.SO : 0;
    this.created_at = new Date().getDate().toString();
    this.currency_code = "VN";
    this.exchange_rate = 1;
    this.customer_company_name = exportInvoiceDTO.customer_company_name
      ? exportInvoiceDTO.customer_company_name
      : "";
    this.customer_buyer_name = exportInvoiceDTO.customer_name;
    this.customer_company_address = exportInvoiceDTO.customer_company_address
      ? exportInvoiceDTO.customer_company_address
      : "";
    this.customer_company_email = exportInvoiceDTO.customer_company_email
      ? exportInvoiceDTO.customer_company_email
      : "";
    this.customer_company_tax_code = exportInvoiceDTO.customer_company_tax_code
      ? exportInvoiceDTO.customer_company_tax_code
      : "";
    this.seller_account_number = 0;
    this.security_code = "";
    this.unit_code = "";
    this.user_create = "";
    this.total_amount_without_vat = invoice.total_amount_without_vat;
    this.total_amount_vat = invoice.vat_amount;
    this.discount_amount = invoice.discount_amount;
    this.total_amount = invoice.amount;
    this.total_amount_word = exportInvoiceDTO.amount_to_word
      ? exportInvoiceDTO.amount_to_word
      : "";
    this.order_id = data.SO ? data.SO : 0;
    this.customer_buy_bank_account = "";
    this.customer_sell_bank_account = "";
    this.dvcs_code = "";
    this.is_success = "Đã gửi hóa đơn";
  }
}
