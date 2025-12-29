export interface ViettelInvoiceCreateResponse {
  errorCode: string | null;
  description: string | null;
  result: {
    supplierTaxCode: string;
    invoiceNo: string;
    transactionID: string;
    reservationCode: string;
    codeOfTax: string;
  } | null;
}

export interface ViettelInvoiceUsbTokenHashResponse {
  success: boolean;
  error: string | null;
  messages: string | null;
  Message: string | null;
  Code: number;
  data: {
    hashString: string;
    xmlData: string;
    transactionUuid: string;
  };
}

export interface ViettelInvoiceUsbTokenSignResponse {
  success: boolean;
  error: string | null;
  messages: string | null;
  Message: string | null;
  Code: number;
  data: {
    pattern: string;
    serial: string;
    fkey: string;
    key: string;
    no: string;
    TaxOfCode?: string;
    detailError?: string;
    detailMessages?: string;
  }[];
}

export interface ViettelAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface ViettelInvoiceCancelResponse {
  success: boolean;
  error: string | null;
  messages: string | null;
  Message: string | null;
  Code: number;
  data: {
    Pattern: string;
    Serial: string;
    ReferenceKey: string;
  };
}

export interface ViettelInvoiceSearchResponse {
  success: boolean;
  error: string | null;
  messages: string | null;
  data: {
    fkey: string;
    no: string;
    arisingdate: string;
    createdate: string;
    pattern: string;
    serial: string;
    total: number;
    amount: number;
    vatamount: number;
    typeInv: string;
    status: string;
    taxofcode: string;
    type: string;
    buyer: string;
    cusName: string;
    cusTaxCode: string;
    createby: string;
  }[];
}

export interface ViettelErrorResponse {
  Code: number;
  success: boolean;
  error: string;
  messages: string;
  Message: string;
  Data?: any[];
}
