import { ApiProperty } from "@nestjs/swagger";

export class CheckMissingOrdersResponse {
  @ApiProperty({
    description: "Danh sách order_id bị thiếu",
    example: [12345, 67890, 11111],
  })
  missing_order_ids: number[];

  @ApiProperty({
    description: "Tổng số order_id bị thiếu",
    example: 3,
  })
  total_missing: number;

  @ApiProperty({
    description: "Thông báo",
    example: "Tìm thấy 3 order_id bị thiếu trong quá trình sync",
  })
  message: string;

  constructor(missingOrderIds: number[]) {
    this.missing_order_ids = missingOrderIds;
    this.total_missing = missingOrderIds.length;
    this.message =
      missingOrderIds.length > 0
        ? `Tìm thấy ${missingOrderIds.length} order_id bị thiếu trong quá trình sync`
        : "Không có order_id nào bị thiếu";
  }
}
