import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export class SyncInvoicesDto {
  @ApiProperty({
    description: "ID chi nhánh",
    example: 1,
  })
  @IsNotEmpty({ message: "branch_id không được để trống" })
  @IsNumber({}, { message: "branch_id phải là số" })
  @Transform(({ value }) => parseInt(value))
  branch_id: number;

  @ApiProperty({
    description: "Ngày bắt đầu (dd/mm/yyyy)",
    example: "01/01/2024",
  })
  @IsNotEmpty({ message: "fromDate không được để trống" })
  @IsString({ message: "fromDate phải là chuỗi" })
  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: "fromDate phải có định dạng dd/mm/yyyy",
  })
  fromDate: string;

  @ApiProperty({
    description: "Ngày kết thúc (dd/mm/yyyy)",
    example: "31/01/2024",
  })
  @IsNotEmpty({ message: "toDate không được để trống" })
  @IsString({ message: "toDate phải là chuỗi" })
  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: "toDate phải có định dạng dd/mm/yyyy",
  })
  toDate: string;

  @ApiProperty({
    description: "Số lượng hóa đơn tối đa cần xử lý",
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "limit phải là số" })
  @Min(1, { message: "limit phải lớn hơn 0" })
  @Transform(({ value }) => (value ? parseInt(value) : 100))
  limit?: number = 100;
}
