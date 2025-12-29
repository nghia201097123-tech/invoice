import { InvoiceDetailDto } from "src/common/dto/Invoice-detail.dto";
import { Invoice } from "../schemas/invoice.schema";

export class InvoiceDetailCreateByDto {
  order_id: number;
  order_detail_id: number;
  food_code: string;
  food_name: string;
  quantity: number;
  food_unit_price: number;
  discount_percent: number;
  discount_amount: number;
  total_amount_without_vat: number;
  vat: number;
  vat_amount: number;
  total_amount: number;
  is_gift: number;
  commodity_nature_type: number;
  code: string;

  constructor(
    invoiceDetailDto: InvoiceDetailDto,
    invoice: Invoice,
    order_detail_id: number
  ) {
    this.order_id = invoice.order_id;
    this.order_detail_id = +order_detail_id;
    this.vat_amount = invoiceDetailDto.vat_amount;
    this.food_code = invoiceDetailDto.food_code;
    this.food_name = invoiceDetailDto.food_name;
    this.food_unit_price = invoiceDetailDto.food_unit_price;
    this.quantity = invoiceDetailDto.quantity;
    this.discount_percent = invoiceDetailDto.discount_percent;
    this.discount_amount = invoiceDetailDto.discount_amount;
    this.total_amount_without_vat = invoiceDetailDto.total_amount_without_vat;
    this.vat = invoiceDetailDto.vat;
    this.total_amount = invoiceDetailDto.total_amount;
    this.is_gift = invoiceDetailDto.is_gift;
    this.commodity_nature_type = invoiceDetailDto.commodity_nature_type;
    this.code = invoiceDetailDto.code;
  }
}
