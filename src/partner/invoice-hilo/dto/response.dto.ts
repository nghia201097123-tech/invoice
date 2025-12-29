export interface HiloBaseResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: any;
}

export interface HiloInvoiceCreateResponse extends HiloBaseResponse {
  data?: {
    invoiceId: string;
    invoiceNo: string;
    pattern: string;
    serial: string;
    status: string;
    createdDate: string;
  };
}

export interface HiloInvoiceSignResponse extends HiloBaseResponse {
  data?: {
    invoiceId: string;
    invoiceNo: string;
    signedDate: string;
    status: string;
    digitalSignature: string;
  };
}

export interface HiloInvoiceCancelResponse extends HiloBaseResponse {
  data?: {
    invoiceId: string;
    invoiceNo: string;
    cancelledDate: string;
    status: string;
  };
}

export interface HiloInvoiceDetailResponse extends HiloBaseResponse {
  data?: {
    invoiceId: string;
    invoiceNo: string;
    pattern: string;
    serial: string;
    status: string;
    buyerName: string;
    buyerTaxCode?: string;
    totalAmount: number;
    createdDate: string;
    signedDate?: string;
    pdfUrl?: string;
    xmlUrl?: string;
  };
}

export interface HiloAuthResponse extends HiloBaseResponse {
  data?: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken?: string;
  };
}

export interface HiloInvoiceListResponse extends HiloBaseResponse {
  data?: {
    invoices: Array<{
      invoiceId: string;
      invoiceNo: string;
      pattern: string;
      serial: string;
      status: string;
      buyerName: string;
      totalAmount: number;
      createdDate: string;
    }>;
    totalCount: number;
    pageIndex: number;
    pageSize: number;
  };
}
