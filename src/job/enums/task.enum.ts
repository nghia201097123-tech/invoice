export enum TaskEnum {
  INVOICE_SEND_THIRD_PARTY_QUEUE = "invoice_send_third_party_queue",
  INVOICE_QUEUE_SEND = "invoice-queue-send",
  INVOICE_BULK_EXPORT_QUEUE = "invoice-bulk-export-queue",
  // Dynamic queue patterns for restaurant-specific queues
  RESTAURANT_QUEUE_PREFIX = "invoice_send_third_party_queue_restaurant_",
  RESTAURANT_TASK_PREFIX = "invoice-queue-send-restaurant_",
}
