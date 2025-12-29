import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, Min, Max } from "class-validator";

/**
 * DTO cho bulk export tất cả hóa đơn chưa xuất
 * Tự động lấy tất cả hóa đơn có invoice_status = 0
 */
export class BulkExportInvoiceDTO {
  @ApiProperty({
    description: "Danh sách ID hóa đơn cần xuất",
    example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    type: [String],
  })
  @IsArray({
    message: "invoice_ids phải là một mảng",
  })
  @IsNotEmpty({
    message: "invoice_ids không được để trống",
  })
  @ArrayMinSize(1, {
    message: "Phải có ít nhất 1 hóa đơn để xuất",
  })
  @ArrayMaxSize(100, {
    message: "Không thể xuất quá 100 hóa đơn cùng lúc",
  })
  @IsString({ each: true, message: "Mỗi ID hóa đơn phải là chuỗi" })
  @Transform(({ value }) => {
    return Array.isArray(value) ? [...new Set(value)] : value;
  })
  invoice_ids: string[];

  @ApiProperty({
    description: "Số lượng hóa đơn tối đa để xuất (tối đa 500)",
    example: 100,
    required: false,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "limit phải là số" })
  @Min(1, { message: "limit phải lớn hơn 0" })
  @Max(500, { message: "limit không được vượt quá 500" })
  limit?: number = 100;

  @ApiProperty({
    description: "Chờ xử lý xong và trả kết quả chi tiết ngay (đồng bộ)",
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  await_result?: boolean = true;
}

/**
 * Response DTO cho bulk export
 */
export class BulkExportResponseDTO {
  @ApiProperty({
    description: "ID job queue để theo dõi tiến trình",
    example: "bulk-export-12345",
    required: false,
  })
  job_id: string;

  // Alias để phù hợp với sample camelCase nếu cần
  jobId?: string;

  @ApiProperty({
    description:
      "Số lượng hóa đơn được đưa vào queue (hoặc đã xử lý trong synchronous mode)",
    example: 50,
  })
  total_invoices: number;

  @ApiProperty({
    description: "Thông báo",
    example:
      "Đã đưa 50 hóa đơn vào queue xử lý. Sử dụng job_id để theo dõi tiến trình.",
  })
  message: string;

  @ApiProperty({
    description: "Thời gian tạo job",
    example: "2024-01-15T10:30:00.000Z",
  })
  created_at: Date;

  // Các trường mở rộng để trả về chi tiết ngay trong API
  @ApiProperty({
    description: "Tổng số invoice_id được yêu cầu",
    example: 120,
    required: false,
  })
  total_requested?: number;

  @ApiProperty({
    description: "Tổng số hóa đơn tìm thấy và chưa xuất (invoice_status = 0)",
    example: 100,
    required: false,
  })
  total_found_unexported?: number;

  @ApiProperty({
    description: "Danh sách invoice_id đã được chấp nhận đưa vào queue",
    type: [String],
    required: false,
  })
  accepted_invoice_ids?: string[];

  @ApiProperty({
    description: "Danh sách invoice_id đã được queue trước đó (bị bỏ qua)",
    type: [String],
    required: false,
  })
  already_queued_invoice_ids?: string[];

  @ApiProperty({
    description: "Danh sách invoice_id bị loại (không tồn tại hoặc đã xuất)",
    type: [String],
    required: false,
  })
  excluded_invoice_ids?: string[];

  @ApiProperty({
    description:
      "Danh sách invoice_id đã có bản ghi lỗi trước đó (invoice_send_failed)",
    type: [String],
    required: false,
  })
  failed_invoice_ids?: string[];

  @ApiProperty({
    description: "Danh sách hóa đơn lỗi theo job xử lý hiện tại (id + error)",
    required: false,
    type: "array",
  })
  failed_invoices?: { id: string; error: string }[];
}
