import { ApiProperty } from "@nestjs/swagger";
import { InvoiceDetailUpdate } from "./invoice-detail-update";
import { Type } from "class-transformer";

export class InvoiceDetailUpdateBase {
  @ApiProperty({
    required: true,
    default: "",
    example: "641047af80a67bcf9975b1af",
    description: "Id hóa đơn ",
  })
  invoice_id: string;

  @ApiProperty({
    type: [InvoiceDetailUpdate],
  })
  @Type(() => InvoiceDetailUpdate)
  foods: InvoiceDetailUpdate[];
}
