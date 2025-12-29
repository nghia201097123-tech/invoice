import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDetailChangeStatusDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "641047af80a67bcf9975b1af",
    description: "Id chi tiết hóa đơn ",
  })
  invoice_detail_id: string;
}
