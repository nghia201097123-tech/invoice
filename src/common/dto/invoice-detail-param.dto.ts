import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDetailParamDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "641047af80a67bcf9975b1af",
    description: "Id hóa đơn ",
  })
  invoice_id: string;
}
