import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { InvoiceDetailUpdatePartnerDto } from "./invoice-detail-update-partner.dto";
import { InvoiceDetailUpdateBase } from "./invoice-update-multi.dto";

export class UpdateInvoicePartnerDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "6401f326962d81e27497f3b7",
    description: " id hóa đơn bên dashboard",
  })
  id: string; //

  @ApiProperty({
    required: true,
    default: "",
    example: "ngày thanh toán",
    description: "dd/mm/yyy",
  })
  payment_date: string; // ngày thanh toán

  @ApiProperty({
    type: [InvoiceDetailUpdatePartnerDto],
  })
  @Type(() => InvoiceDetailUpdatePartnerDto)
  data: [InvoiceDetailUpdatePartnerDto];

  constructor(
    invoiceDetailUpdateBase?: InvoiceDetailUpdateBase,
    invoiceDetailUpdatePartnerDto?: InvoiceDetailUpdatePartnerDto
  ) {
    this.id = invoiceDetailUpdateBase.invoice_id;
    this.payment_date = new Date().toString();
    this.data = [invoiceDetailUpdatePartnerDto];
  }
}
