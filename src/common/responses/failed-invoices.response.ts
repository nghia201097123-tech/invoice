import { ApiProperty } from "@nestjs/swagger";

/**
 * Interface cho một hóa đơn lỗi
 */
export interface FailedInvoiceItem {
  _id: string;
  invoice_id: string;
  error_message: string;
  error_details?: string;
  note?: string;
  retry_count: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO cho danh sách hóa đơn lỗi
 */
export class FailedInvoicesResponseDto {
  @ApiProperty({
    description: "Danh sách hóa đơn lỗi",
    type: "array",
    items: {
      type: "object",
      properties: {
        _id: { type: "string", description: "ID của record" },
        invoice_id: { type: "string", description: "ID của hóa đơn" },
        error_message: { type: "string", description: "Thông báo lỗi" },
        error_details: {
          type: "string",
          description: "Chi tiết lỗi (stack trace)",
        },
        note: { type: "string", description: "Ghi chú bổ sung" },
        retry_count: { type: "number", description: "Số lần thử lại" },
        status: {
          type: "string",
          description: "Trạng thái",
          enum: ["FAILED", "RETRY", "RESOLVED"],
        },
        createdAt: {
          type: "string",
          format: "date-time",
          description: "Ngày tạo",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          description: "Ngày cập nhật",
        },
      },
    },
  })
  data: FailedInvoiceItem[];

  @ApiProperty({
    description: "Thông tin phân trang",
    type: "object",
    properties: {
      current_page: { type: "number", description: "Trang hiện tại" },
      per_page: { type: "number", description: "Số bản ghi trên mỗi trang" },
      total: { type: "number", description: "Tổng số bản ghi" },
      total_pages: { type: "number", description: "Tổng số trang" },
      has_next_page: {
        type: "boolean",
        description: "Có trang tiếp theo không",
      },
      has_prev_page: { type: "boolean", description: "Có trang trước không" },
    },
  })
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };

  constructor(
    data: FailedInvoiceItem[],
    currentPage: number,
    perPage: number,
    total: number
  ) {
    this.data = data;

    const totalPages = Math.ceil(total / perPage);

    this.pagination = {
      current_page: currentPage,
      per_page: perPage,
      total: total,
      total_pages: totalPages,
      has_next_page: currentPage < totalPages,
      has_prev_page: currentPage > 1,
    };
  }
}

/**
 * Response DTO cho thống kê hóa đơn lỗi
 */
export class FailedInvoicesStatsResponseDto {
  @ApiProperty({
    description: "Tổng số hóa đơn lỗi",
    example: 150,
  })
  total_failed: number;

  @ApiProperty({
    description: "Số hóa đơn đang retry",
    example: 25,
  })
  total_retry: number;

  @ApiProperty({
    description: "Số hóa đơn đã resolved",
    example: 10,
  })
  total_resolved: number;

  @ApiProperty({
    description: "Thống kê theo ngày (7 ngày gần nhất)",
    type: "array",
    items: {
      type: "object",
      properties: {
        date: { type: "string", format: "date", description: "Ngày" },
        count: { type: "number", description: "Số lượng hóa đơn lỗi" },
      },
    },
  })
  daily_stats: Array<{
    date: string;
    count: number;
  }>;

  constructor(
    totalFailed: number,
    totalRetry: number,
    totalResolved: number,
    dailyStats: Array<{ date: string; count: number }>
  ) {
    this.total_failed = totalFailed;
    this.total_retry = totalRetry;
    this.total_resolved = totalResolved;
    this.daily_stats = dailyStats;
  }
}
