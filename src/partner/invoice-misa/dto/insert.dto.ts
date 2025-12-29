import { InvoiceDetail } from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceTemplateDto } from "src/common/dto/invoice-template.dto";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { Utils } from "src/common/utils/utils.common.helper";
import { InvoiceAppFood } from "src/common/enums/invoice.app-food.enum";

export class InvoiceMisaInsertDto {
  RefID: string;
  InvSeries: string;
  InvDate: string;
  IsInheritFromOldTemplate: boolean;
  BusinessArea: number;
  OrganizationUnitID: string;
  InvoiceTemplateID: string;
  UserID: string;
  CompanyID: number;
  AccountObjectTaxCode: string;
  AccountObjectName: string;
  AccountObjectCode: string;
  AccountObjectAddress: string;
  PaymentMethod: string;
  CurrencyCode: string;
  CurrencyID: string;
  ExchangeRate: number;
  ExchangeRateOperation: number;
  IsMoreVATRate: boolean;
  VATRate: number;
  TotalAmountWithVATOC: number;
  TotalAmountWithVAT: number;
  TotalSaleAmountOC: number;
  TotalSaleAmount: number;
  TotalAmountWithoutVAT: number;
  TotalDiscountAmountOC: number;
  TotalDiscountAmount: number;
  TotalVATAmountOC: number;
  TotalVATAmount: number;
  TotalAmountOC: number;
  TotalAmount: number;
  ReceiverMobile: string;
  ReceiverName: String;
  IsTaxReduction43: boolean;
  InvoiceDetails: InvoiceMisaDetails[];
  ContactName: string;

  public constructor(
    uuid: string,
    invoice: Invoice,
    exportInvoiceDTO: ExportInvoiceDTO,
    invoiceDetail: InvoiceDetail[],
    invoiceTemplpate: InvoiceTemplateDto,
    data: any
  ) {
    this.RefID = uuid;
    this.InvSeries = invoiceTemplpate.invSeries;
    this.InvDate = UtilsDate.convertDateFormat(
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      })
    );
    this.IsInheritFromOldTemplate = false;
    (this.BusinessArea = invoiceTemplpate.businessAreas),
      (this.OrganizationUnitID = data.token.OrganizationUnitID),
      (this.InvoiceTemplateID = invoiceTemplpate.ipTemplateId),
      (this.UserID = data.token.UserID);
    this.CompanyID = data.token.CompanyID;
    this.AccountObjectTaxCode = exportInvoiceDTO.customer_company_tax_code;
    this.AccountObjectName = exportInvoiceDTO.customer_company_name || "";
    this.ContactName = exportInvoiceDTO.customer_name;
    this.AccountObjectCode = Utils.getInitials(
      exportInvoiceDTO.customer_name ?? ""
    );
    this.AccountObjectAddress = invoice.customer_address;
    this.PaymentMethod = "TM/CK";
    this.CurrencyCode = "VND";
    this.CurrencyID = "VND";
    this.ExchangeRate = 1;
    this.ExchangeRateOperation = 0;
    this.IsMoreVATRate = false;
    this.VATRate = invoice.vat;
    this.TotalAmountWithVATOC = invoice.total_amount;
    this.TotalAmountWithVAT = invoice.total_amount;
    // if (InvoiceAppFood.APP_FOOD.includes(invoice.order_method)) {
    //   this.TotalSaleAmountOC = invoice.amount + invoice.extra_charge_amount;
    //   this.TotalSaleAmount = invoice.amount + invoice.extra_charge_amount;
    //   this.TotalAmountWithoutVAT = invoice.amount + invoice.extra_charge_amount;
    // } else {
    //   this.TotalSaleAmountOC =
    //     invoice.amount + invoice.extra_charge_amount - invoice.vat_amount;
    //   this.TotalSaleAmount =
    //     invoice.amount + invoice.extra_charge_amount - invoice.vat_amount;
    //   this.TotalAmountWithoutVAT =
    //     invoice.amount + invoice.extra_charge_amount - invoice.vat_amount;
    // }
    this.TotalSaleAmountOC = invoice.amount + invoice.extra_charge_amount;
    this.TotalSaleAmount = invoice.amount + invoice.extra_charge_amount;
    this.TotalAmountWithoutVAT = invoice.amount + invoice.extra_charge_amount;
    this.TotalDiscountAmountOC = invoice.discount_amount;
    this.TotalDiscountAmount = invoice.discount_amount;
    this.TotalVATAmountOC = invoice.vat_amount;
    this.TotalVATAmount = invoice.vat_amount;
    this.TotalAmountOC = invoice.total_amount;
    this.TotalAmount = invoice.total_amount;
    this.InvoiceDetails = InvoiceMisaDetails.mapToList(invoiceDetail);
    this.ReceiverMobile = exportInvoiceDTO.customer_phone;
    this.ReceiverName = exportInvoiceDTO.customer_name;
    this.IsTaxReduction43 = true;
  }
}

export class InvoiceMisaInsertByNewInvoiceDto {
  RefID: string;
  InvSeries: string;
  InvDate: string;
  IsInheritFromOldTemplate: boolean;
  BusinessArea: number;
  OrganizationUnitID: string;
  InvoiceTemplateID: string;
  UserID: string;
  CompanyID: number;
  AccountObjectTaxCode: string;
  AccountObjectName: string;
  AccountObjectCode: string;
  AccountObjectAddress: string;
  PaymentMethod: string;
  CurrencyCode: string;
  CurrencyID: string;
  ExchangeRate: number;
  ExchangeRateOperation: number;
  IsMoreVATRate: boolean;
  VATRate: number;
  TotalAmountWithVATOC: number;
  TotalAmountWithVAT: number;
  TotalSaleAmountOC: number;
  TotalSaleAmount: number;
  TotalAmountWithoutVAT: number;
  TotalDiscountAmountOC: number;
  TotalDiscountAmount: number;
  TotalVATAmountOC: number;
  TotalVATAmount: number;
  TotalAmountOC: number;
  TotalAmount: number;
  InvoiceDetails: InvoiceMisaDetails[];

  public constructor(
    uuid: string,
    invoice: Invoice,
    invoiceDetail: InvoiceDetail[],
    invoiceTemplpate: InvoiceTemplateDto,
    data: any
  ) {
    this.RefID = uuid;
    this.InvSeries = invoiceTemplpate.invSeries;
    this.InvDate = UtilsDate.convertDateFormat(
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      })
    );
    this.IsInheritFromOldTemplate = false;
    (this.BusinessArea = invoiceTemplpate.businessAreas),
      (this.OrganizationUnitID = data.token.OrganizationUnitID),
      (this.InvoiceTemplateID = invoiceTemplpate.ipTemplateId),
      (this.UserID = data.token.UserID);
    this.CompanyID = data.token.CompanyID;
    this.AccountObjectTaxCode = invoice.customer_company_tax_code;
    this.AccountObjectName = invoice.customer_name;
    this.AccountObjectCode = Utils.getInitials(invoice.customer_name ?? "");
    this.AccountObjectAddress = invoice.customer_company_address;
    this.PaymentMethod = "TM/CK";
    this.CurrencyCode = "VND";
    this.CurrencyID = "VND";
    this.ExchangeRate = 0;
    this.ExchangeRateOperation = 0;
    this.IsMoreVATRate = false;
    this.VATRate = 5;
    this.TotalAmountWithVATOC = invoice.total_amount;
    this.TotalAmountWithVAT = invoice.total_amount;
    this.TotalSaleAmountOC = invoice.amount ?? 0;
    this.TotalSaleAmount = invoice.amount;
    this.TotalAmountWithoutVAT = invoice.amount;
    this.TotalDiscountAmountOC = invoice.discount_amount;
    this.TotalDiscountAmount = invoice.discount_amount;
    this.TotalVATAmountOC = invoice.vat_amount;
    this.TotalVATAmount = invoice.vat_amount;
    this.TotalAmountOC = invoice.total_amount;
    this.TotalAmount = invoice.total_amount;
    this.InvoiceDetails = InvoiceMisaDetails.mapToList(invoiceDetail);
  }
}

export class InvoiceMisaDetails {
  InventoryItemCode: string;
  Description: string;
  UnitName: string;
  Quantity: number;
  UnitPrice: number;
  DiscountRate: number;
  VATRate: number;
  VATAmountOC: number;
  VATAmount: number;
  DiscountAmountOC: number;
  DiscountAmount: number;
  ServiceAmountOC: number;
  UnitAfterTax: number;
  AmountAfterTax: number;
  AmountOC: number;
  Amount: number;
  SortOrder: number;
  SortOrderView: number;
  InventoryItemType: number;

  public constructor(invoiceDetail?: InvoiceDetail, index?: number) {
    const ExchangeRate = 1;
    const ServiceFeeRate = 0;
    const ExciseTaxAmountOC = 0;

    this.InventoryItemCode = invoiceDetail.code ?? "";
    this.Description = invoiceDetail.food_name ?? "";
    this.UnitName = invoiceDetail.food_unit ?? "";
    this.Quantity = invoiceDetail.quantity ?? 0;
    this.UnitPrice = invoiceDetail.price ?? 0;
    this.DiscountRate = invoiceDetail.discount_percent ?? 0;
    this.VATRate = invoiceDetail.vat ?? 0;
    this.DiscountAmountOC = invoiceDetail.discount_amount || 0;
    this.DiscountAmount = this.DiscountAmountOC * ExchangeRate;
    this.AmountOC =
      Math.ceil(this.Quantity * this.UnitPrice) - this.DiscountAmount;
    this.Amount = this.AmountOC;
    this.ServiceAmountOC = Math.ceil(
      ((this.AmountOC - this.DiscountAmountOC) * ServiceFeeRate) / 100
    );
    this.VATAmountOC = Math.ceil(
      ((this.AmountOC -
        this.DiscountAmountOC +
        this.ServiceAmountOC +
        ExciseTaxAmountOC) *
        this.VATRate) /
      100
    );
    this.VATAmount = Math.ceil(this.VATAmountOC * ExchangeRate);
    this.AmountAfterTax = Math.ceil(
      this.AmountOC -
      this.DiscountAmountOC +
      this.ServiceAmountOC +
      ExciseTaxAmountOC +
      this.VATAmountOC
    );
    this.UnitAfterTax = Math.ceil(
      this.UnitPrice - this.DiscountAmount + this.VATAmountOC / this.Quantity
    );
    this.SortOrder = index ?? 0;
    this.SortOrderView = index ?? 0;
    this.InventoryItemType = 0;
  }

  public static mapToList(
    invoiceDetail?: InvoiceDetail[]
  ): InvoiceMisaDetails[] {
    return (
      invoiceDetail?.map(
        (item, index) => new InvoiceMisaDetails(item, index + 1)
      ) ?? []
    );
  }
}
