import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDetailParamDTO {
  @ApiProperty({
    required: true,
    default: "",
    example: "fa200709-f563-4100-b4ba-241e82c0fba9",
    description: "id hóa đơn dashboard",
  })
  readonly id: string = "";
}
