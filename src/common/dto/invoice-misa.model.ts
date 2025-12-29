export class InvoiceMisaModel {
  RefID: string = "";
  InvSeries: string = "";
  InvDate: string = "";
  IsInheritFromOldTemplate: boolean = false;
  BusinessArea: number = 0;
  OrganizationUnitID: string = "";
  InvoiceTemplateID: string = "";
  UserID: string = "";
  CompanyID: number = 0;
  AccountObjectTaxCode: string = "";
  AccountObjectName: string = "";
  AccountObjectCode: string = "";
  AccountObjectAddress: string = "";
  PaymentMethod: string = "";
  CurrencyCode: string = "";
  CurrencyID: string = "";
  ExchangeRate: number = 0;
  ExchangeRateOperation: number = 0;
  IsMoreVATRate: boolean = false;
  VATRate: number = 0;
  TotalAmountWithVATOC: number = 0;
  TotalAmountWithVAT: number = 0;
  TotalSaleAmountOC: number = 0;
  TotalSaleAmount: number = 0;
  TotalAmountWithoutVAT: number = 0;
  TotalDiscountAmountOC: number = 0;
  TotalDiscountAmount: number = 0;
  TotalVATAmountOC: number = 0;
  TotalVATAmount: number = 0;
  TotalAmountOC: number = 0;
  TotalAmount: number = 0;
  InvoiceDetails: InvoiceMisaModelDetails[];

  public constructor(data: InvoiceMisaModel) {
    this.RefID = data.RefID || "";
    this.InvSeries = data.InvSeries || "";
    this.InvDate = data.InvDate || "";
    this.IsInheritFromOldTemplate = data.IsInheritFromOldTemplate || false;
    this.BusinessArea = data.BusinessArea || 0;
    this.OrganizationUnitID = data.OrganizationUnitID || "";
    this.InvoiceTemplateID = data.InvoiceTemplateID || "";
    this.UserID = data.UserID || "";
    this.CompanyID = data.CompanyID || 0;
    this.AccountObjectTaxCode = data.AccountObjectTaxCode || "";
    this.AccountObjectName = data.AccountObjectName || "";
    this.AccountObjectCode = data.AccountObjectCode || "";
    this.AccountObjectAddress = data.AccountObjectAddress || "";
    this.PaymentMethod = data.PaymentMethod || "";
    this.CurrencyCode = data.CurrencyCode || "";
    this.CurrencyID = data.CurrencyID || "";
    this.ExchangeRate = data.ExchangeRate || 0;
    this.ExchangeRateOperation = data.ExchangeRateOperation || 0;
    this.IsMoreVATRate = data.IsMoreVATRate || false;
    this.VATRate = data.VATRate || 0;
    this.TotalAmountWithVATOC = data.TotalAmountWithVATOC || 0;
    this.TotalAmountWithVAT = data.TotalAmountWithVAT || 0;
    this.TotalSaleAmountOC = data.TotalSaleAmountOC || 0;
    this.TotalSaleAmount = data.TotalSaleAmount || 0;
    this.TotalAmountWithoutVAT = data.TotalAmountWithoutVAT || 0;
    this.TotalDiscountAmountOC = data.TotalDiscountAmountOC || 0;
    this.TotalDiscountAmount = data.TotalDiscountAmount || 0;
    this.TotalVATAmountOC = data.TotalVATAmountOC || 0;
    this.TotalVATAmount = data.TotalVATAmount || 0;
    this.TotalAmountOC = data.TotalAmountOC || 0;
    this.TotalAmount = data.TotalAmount || 0;
    this.InvoiceDetails = new InvoiceMisaModelDetails().maptoList(
      data.InvoiceDetails
    );
  }
}

export class InvoiceMisaModelDetails {
  InventoryItemCode: string = "";
  Description: string = "";
  UnitName: string = "";
  Quantity: number = 0;
  UnitPrice: number = 0;
  DiscountRate: number = 0;
  VATRate: number = 0;
  VATAmountOC: number = 0;
  VATAmount: number = 0;
  DiscountAmountOC: number = 0;
  DiscountAmount: number = 0;
  UnitAfterTax: number = 0;
  AmountAfterTax: number = 0;
  AmountOC: number = 0;
  Amount: number = 0;
  SortOrder: number = 0;
  SortOrderView: number = 0;
  InventoryItemType: number = 0;

  public constructor(data?: any) {
    this.InventoryItemCode = data.InventoryItemCode || "";
    this.Description = data.Description || "";
    this.UnitName = data.UnitName || "";
    this.Quantity = data.Quantity || 0;
    this.UnitPrice = data.UnitPrice || 0;
    this.DiscountRate = data.DiscountRate || 0;
    this.VATRate = data.VATRate || 0;
    this.VATAmountOC = data.VATAmountOC || 0;
    this.VATAmount = data.VATAmount || 0;
    this.DiscountAmountOC = data.DiscountAmountOC || 0;
    this.DiscountAmount = data.DiscountAmount || 0;
    this.UnitAfterTax = data.UnitAfterTax || 0;
    this.AmountAfterTax = data.AmountAfterTax || 0;
    this.AmountOC = data.AmountOC || 0;
    this.Amount = data.Amount || 0;
    this.SortOrder = data.SortOrder || 0;
    this.SortOrderView = data.SortOrderView || 0;
    this.InventoryItemType = data.InventoryItemType || 0;
  }

  public maptoList(data: any[]) {
    return data.map((x) => new InvoiceMisaModelDetails(x));
  }
}
