import { ApiProperty } from "@nestjs/swagger";

export class InvoiceCountTabResponse {
  @ApiProperty({ example: 10, description: "Chờ Xuất" })
  waiting_export: number;

  @ApiProperty({ example: 10, description: "Chờ Duyệt" })
  waiting_browse: number;

  @ApiProperty({ example: 10, description: "Dã Xuất" })
  exported: number;

  @ApiProperty({ example: 10, description: "Đã Hủy" })
  canceled: number;

  @ApiProperty({ example: 10, description: "Có chỉnh sửa" })
  have_update_in_partner: number;

  constructor(data?: any) {
    this.waiting_export = data.waiting_export;
    this.waiting_browse = data.waiting_browse;
    this.exported = data.exported;
    this.canceled = data.canceled;
    this.have_update_in_partner = data.have_update_in_partner;
  }
}
