import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDtoParam {
  @ApiProperty({
    required: true,
    default: "",
    example: "1",
    description: " trạng thái hóa đơn 0: chưa gửi , 1 :gửi",
  })
  readonly invoice_status: number; // trạng thái hóa đơn 0: chưa gửi , 1 :gửi
}
