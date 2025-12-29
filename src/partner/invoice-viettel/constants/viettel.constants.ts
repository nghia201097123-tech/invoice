export const VIETTEL_CONSTANTS = {
  API_ENDPOINTS: {
    LOGIN: "/auth/login",
    CREATE_INVOICE: "/InvoiceAPI/InvoiceWS/createInvoice",
    CREATE_INVOICE_USB_TOKEN_GET_HASH:
      "/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash",
    CREATE_INVOICE_USB_TOKEN_INSERT_SIGNATURE:
      "/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenInsertSignature",
    CANCEL_INVOICE: "/InvoiceAPI/InvoiceWS/cancelTransactionInvoice",
    UPDATE_PAYMENT_STATUS: "/InvoiceAPI/InvoiceWS/updatePaymentStatus",
    SEARCH_INVOICE: "/InvoiceAPI/InvoiceWS/searchInvoiceByTransactionUuid",
    GET_INVOICE_DETAIL: "/InvoiceAPI/InvoiceWS/getInvoiceRepresentationFile",
    SEND_EMAIL: "/InvoiceAPI/InvoiceWS/sendInvoiceByTransactionUuid",
  },
  INVOICE_TYPES: {
    GTKT: "01GTKT", // Hóa đơn GTGT
    GTTT: "02GTTT", // Hóa đơn bán hàng
    XKNB: "03XKNB", // Hóa đơn xuất khẩu
    NORMAL: "1", // Hóa đơn thông thường
  },
  CURRENCY_CODE: "VND",
  EXCHANGE_RATE: 1,
  VAT_RATES: {
    NO_VAT: 0,
    VAT_5: 5,
    VAT_10: 10,
    VAT_8: 8,
  },
};
