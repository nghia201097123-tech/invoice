import { CreateDataInvoiceDto } from "./invoice.create.data.dto";

export class CreateInvoicesDto {
  inv_invoiceIssuedDate: string;
  inv_invoiceSeries: string;
  so_benh_an: number;
  inv_currencyCode: string;
  inv_exchangeRate: number;
  inv_paymentMethodName: string;
  inv_buyerDisplayName: string;
  inv_buyerLegalName: string;
  inv_buyerTaxCode: string;
  inv_buyerAddressLine: string;
  inv_buyerEmail: string;
  inv_buyerBankAccount: string;
  inv_buyerBankName: string;
  inv_discountAmount: number;
  inv_TotalAmountWithoutVat: number;
  inv_vatAmount: number;
  inv_TotalAmount: number;
  amount_to_word: string;
  details: [CreateDataInvoiceDto];
}
