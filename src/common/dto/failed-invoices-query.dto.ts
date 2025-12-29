import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
} from "class-validator";

/**
 * DTO cho query danh sách hóa đơn lỗi
 */
export class FailedInvoicesQueryDto {
  @ApiProperty({
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Page phải là số" })
  @Min(1, { message: "Page phải lớn hơn 0" })
  page?: number = 1;

  @ApiProperty({
    description: "Số lượng bản ghi trên mỗi trang (tối đa 100)",
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Limit phải là số" })
  @Min(1, { message: "Limit phải lớn hơn 0" })
  @Max(100, { message: "Limit không được vượt quá 100" })
  limit?: number = 20;

  @ApiProperty({
    description: "Trạng thái hóa đơn lỗi",
    example: "FAILED",
    required: false,
    enum: ["FAILED", "RETRY", "RESOLVED"],
  })
  @IsOptional()
  @IsString({ message: "Status phải là chuỗi" })
  status?: string;

  @ApiProperty({
    description: "Từ ngày tạo (ISO 8601)",
    example: "2024-01-01T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "From date phải là định dạng ngày hợp lệ" })
  from_date?: string;

  @ApiProperty({
    description: "Đến ngày tạo (ISO 8601)",
    example: "2024-12-31T23:59:59.999Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "To date phải là định dạng ngày hợp lệ" })
  to_date?: string;
}
