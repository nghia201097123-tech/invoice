import { ApiProperty } from "@nestjs/swagger";

export class SyncSpecificOrdersResponse {
  @ApiProperty({
    description: "Tổng số order_id đã gửi",
    example: 3,
  })
  total_orders_sent: number;

  @ApiProperty({
    description: "Danh sách order_id đã gửi thành công",
    example: [12345, 67890, 11111],
  })
  synced_order_ids: number[];

  @ApiProperty({
    description: "Danh sách order_id không tìm thấy hoặc đã xuất",
    example: [99999],
  })
  skipped_order_ids: number[];

  @ApiProperty({
    description: "Thông báo kết quả",
    example: "Đã gửi 3 order_id qua Kafka để đồng bộ",
  })
  message: string;

  constructor(
    totalOrdersSent: number,
    syncedOrderIds: number[],
    skippedOrderIds: number[]
  ) {
    this.total_orders_sent = totalOrdersSent;
    this.synced_order_ids = syncedOrderIds;
    this.skipped_order_ids = skippedOrderIds;
    this.message = `Đã gửi ${totalOrdersSent} order_id qua Kafka để đồng bộ`;
  }
}
