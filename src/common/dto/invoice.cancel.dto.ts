import { ApiProperty } from "@nestjs/swagger";

export class CancelInvoiceDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "fa200709-f563-4100-b4ba-241e82c0fba9",
    description: "Id của phiếu phía bên đối tác",
  })
  id: string; // id của hóa đơn bên đối tác

  @ApiProperty({
    required: true,
    default: "",
    example: "fa200709-f563-4100-b4ba-241e82c0fba9",
    description: "Id của phiếu phía bên đối tác",
  })
  note: string;
}
