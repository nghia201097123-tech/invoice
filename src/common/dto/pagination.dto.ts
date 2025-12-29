import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber } from "class-validator";

export class PaginationDto {
  @ApiProperty({
    required: false,
    default: -1,
    example: "2",
    description: "giới hạn phần tử , -1 lấy tất cả",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  limit: number = 100000;

  @ApiProperty({
    required: false,
    default: -1,
    example: "3",
    description: "lấy từ trang thứ ? , -1 lấy tất cả",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  page: number = 1;

  @ApiProperty({
    required: false,
    default: "",
    example: "",
    description: "key_search",
  })
  @IsOptional()
  @IsString()
  key_search: string;

  @ApiProperty({
    required: false,
    default: "-1",
    example: "",
    description:
      "apply_order_type ,phân loại hóa đơn đến từ nền tảng nào [APP_ORDER = 1, APP_FOOD = 2 , -1 lấy ALL]",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  apply_order_type: number = -1;

  @ApiProperty({
    required: false,
    default: "1",
    example: "1",
    description:
      "Lọc theo phiếu đã được chi cục thuế duyệt hay chưa , -1 lấy tất cả , 0: chưa duyệt , 1:đã duyệt",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  cct_duyet: number;

  @ApiProperty({
    required: false,
    default: 0,
    example: 0,
    description: "",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  invoice_status: number;

  @ApiProperty({
    required: false,
    default: 1,
    example: 1,
    description: "",
  })
  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  branch_id: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "",
  })
  @IsString()
  from: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "",
  })
  @IsString()
  to: string;
}
