import { Invoice } from "../../../../common/schemas/invoice.schema";
import { KafkaElectricInvoice } from "../../../../kafka/kafka.entity/kafka-employee.entity";

export class InvoiceCreateBySidFpt extends KafkaElectricInvoice {
  _id: string;
  customer_company_name: string;
  customer_company_tax_code: string;
  customer_company_address: string;
  customer_company_email: string;
  customer_bank_account: string;
  customer_bank_account_name: string;
  ref_code: string;

  constructor(invoice?: Invoice, _id?: string, order_id?: number) {
    super();
    this._id = _id;
    this.order_id = order_id;
    this.customer_id = this.getCustomerId(invoice);
    this.payment_method_id = invoice.payment_method_id;
    this.discount_amount = invoice.discount_amount;
    this.payment_date = invoice.payment_date;
    this.customer_name = this.getCustomerName(invoice);
    this.customer_phone = this.getCustomerPhone(invoice);
    this.discount_percent = invoice.discount_percent;
    this.vat = invoice.vat;
    this.vat_amount = invoice.vat_amount;
    this.total_amount = invoice.total_amount;
    this.amount = invoice.amount;
    this.restaurant_id = invoice.restaurant_id;
    this.restaurant_brand_id = invoice.restaurant_brand_id;
    this.branch_id = invoice.branch_id;
    this.invoice_status = invoice.invoice_status;
    this.invoice_denominator = this.getInvoiceDenominator(invoice);
    this.is_send_mail = this.getIsSendMail(invoice);
    this.customer_company_name = this.getCustomerCompanyName(invoice);
    this.customer_company_tax_code = this.getCustomerCompanyTaxCode(invoice);
    this.customer_company_address = this.getCustomerCompanyAddress(invoice);
    this.customer_company_email = this.getCustomerCompanyEmail(invoice);
    this.customer_bank_account = this.getCustomerBankAccount(invoice);
    this.customer_bank_account_name = this.getCustomerBankAccountName(invoice);
    this.ref_code = _id.toString();
    this.discount_type = 0;
    this.cct_duyet = 0;
    this.order_parent_id = invoice.order_parent_id;
    this.is_apply_vat = this.getIsApplyVat(invoice);
    this.total_amount_extra_charge_amount =
      this.getTotalAmountExtraChargeAmount(invoice);
    this.food_discount_amount = this.getFoodDiscountAmount(invoice);
    this.drink_discount_percent = this.getDrinkDiscountPercent(invoice);
    this.total_amount_discount_percent = this.getDrinkDiscountPercent(invoice);
    this.total_amount_discount_amount =
      this.getTotalAmountDiscountAmount(invoice);
    this.total_amount_extra_charge_percent =
      this.getTotalAmountExtraChargePercent(invoice);
    this.food_discount_percent = this.getFoodDiscountPercent(invoice);
    this.drink_discount_amount = this.getDrinkDiscountAmount(invoice);
  }

  public getCustomerId(invoice?: Invoice): number {
    return invoice ? invoice.customer_id : 0;
  }

  public getCustomerName(invoice?: Invoice): string {
    return invoice ? invoice.customer_name : "";
  }

  public getCustomerPhone(invoice?: Invoice): string {
    return invoice ? invoice.customer_phone : "";
  }

  public getInvoiceDenominator(invoice?: Invoice): string {
    return invoice ? invoice.invoice_denominator : "";
  }

  public getIsSendMail(invoice?: Invoice): number {
    return invoice ? invoice.is_send_mail : 1;
  }

  public getCustomerCompanyName(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_name : "";
  }

  public getCustomerCompanyTaxCode(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_tax_code : "";
  }

  public getCustomerCompanyAddress(invoice?: Invoice): string {
    return invoice ? invoice.customer_company_address : "";
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

  public getIsApplyVat(invoice?: Invoice): boolean {
    return invoice.is_apply_vat ? invoice.is_apply_vat : false;
  }

  public getTotalAmountExtraChargeAmount(invoice?: Invoice): number {
    return invoice.total_amount_extra_charge_amount
      ? invoice.total_amount_extra_charge_amount
      : 0;
  }

  public getFoodDiscountAmount(invoice?: Invoice): number {
    return invoice.food_discount_amount ? invoice.food_discount_amount : 0;
  }

  public getDrinkDiscountPercent(invoice?: Invoice): number {
    return invoice.drink_discount_percent ? invoice.drink_discount_percent : 0;
  }

  public getTotalAmountDiscountAmount(invoice?: Invoice): number {
    return invoice.total_amount_discount_amount
      ? invoice.total_amount_discount_amount
      : 0;
  }

  public getTotalAmountExtraChargePercent(invoice?: Invoice): number {
    return invoice.total_amount_extra_charge_percent
      ? invoice.total_amount_extra_charge_percent
      : 0;
  }

  public getFoodDiscountPercent(invoice?: Invoice): number {
    return invoice.food_discount_percent ? invoice.food_discount_percent : 0;
  }

  public getDrinkDiscountAmount(invoice?: Invoice): number {
    return invoice.drink_discount_amount ? invoice.drink_discount_amount : 0;
  }
}
