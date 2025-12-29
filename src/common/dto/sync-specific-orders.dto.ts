import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsArray,
  IsNumber,
  ArrayMinSize,
  ArrayMaxSize,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class SyncSpecificOrdersDto {
  @ApiProperty({
    description: "ID chi nhánh",
    example: 1,
  })
  @IsNotEmpty({ message: "branch_id không được để trống" })
  @IsNumber({}, { message: "branch_id phải là số" })
  @Transform(({ value }) => parseInt(value))
  branch_id: number;

  @ApiProperty({
    description: "Danh sách order_id cần sync",
    example: [12345, 67890, 11111],
    type: [Number],
  })
  @IsNotEmpty({ message: "order_ids không được để trống" })
  @IsArray({ message: "order_ids phải là mảng" })
  @ArrayMinSize(1, { message: "order_ids phải có ít nhất 1 phần tử" })
  @ArrayMaxSize(100, { message: "order_ids không được vượt quá 100 phần tử" })
  @Type(() => Number)
  @IsNumber({}, { each: true, message: "Mỗi order_id phải là số" })
  order_ids: number[];
}
