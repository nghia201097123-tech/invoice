import { Type } from "class-transformer";
import { InvoiceDetail } from "../schemas/invoice-detail.schema";
import { ApiProperty } from "@nestjs/swagger";
import { InvoiceDetailModelMap } from "../models/invoice-detail.model";

export class InvoiceDetailGetListResponse {
  @ApiProperty({ example: 555, description: "total_record" })
  total_record: number;

  @ApiProperty({
    type: [InvoiceDetailModelMap],
  })
  @Type(() => InvoiceDetail)
  list: InvoiceDetail[];

  constructor(total_record: number, invoiceDetail: InvoiceDetail[]) {
    this.total_record = total_record;
    this.list = invoiceDetail;
  }
}
