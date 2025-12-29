import { ApiProperty } from "@nestjs/swagger";

export class GetTypeInvoiceSeriesRequestDTO {
  @ApiProperty({ description: "Khóa API" })
  key_api: string;

  @ApiProperty({ description: "Mã số thuế" })
  tax_code: string;
}

export class InvoiceSeriesDTO {
  @ApiProperty({ description: "Ký hiệu hóa đơn" })
  series: string;

  @ApiProperty({ description: "Loại hóa đơn" })
  invoice_type: string;

  @ApiProperty({ description: "Tên loại hóa đơn" })
  invoice_type_name: string;

  @ApiProperty({ description: "Trạng thái" })
  status: string;
}

export class GetTypeInvoiceSeriesResponseDTO {
  @ApiProperty({ description: "Mã trạng thái" })
  status: number;

  @ApiProperty({ description: "Thông báo" })
  message: string;

  @ApiProperty({
    type: [InvoiceSeriesDTO],
    description: "Danh sách loại hóa đơn",
  })
  data: InvoiceSeriesDTO[];
}
