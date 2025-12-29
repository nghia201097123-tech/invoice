export class SyncInvoicesResponse {
  total_invoices_sent: number;
  message: string;

  constructor(totalInvoicesSent: number) {
    this.total_invoices_sent = totalInvoicesSent;
    this.message = `Đã gửi ${totalInvoicesSent} hóa đơn qua Kafka để đồng bộ`;
  }
}
