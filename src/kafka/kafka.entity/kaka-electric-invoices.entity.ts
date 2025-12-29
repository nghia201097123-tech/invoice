import { KafkaElectronicInvoiceDetail } from "./kafka-electric-invoice-detail.entity";

export class KafkaInvoicesEntity {
  order_id: number;
  customer_id: number;
  payment_method_id: number;
  discount_amount: number;
  customer_name: string;
  customer_phone: string;
  discount_percent: number;
  vat: number;
  vat_amount: number;
  total_amount: number;
  amount: number;
  payment_date: Date;
  order_details: [KafkaElectronicInvoiceDetail];
}
