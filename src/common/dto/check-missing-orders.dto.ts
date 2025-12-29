import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class CheckMissingOrdersDto {
  @ApiProperty({
    description: "Redis key để kiểm tra missing orders",
    example: "sync_invoices_123_1704067200000",
  })
  @IsNotEmpty()
  @IsString()
  redis_key: string;

  @ApiProperty({
    description: "Có gửi lại order_id qua Kafka hay không (1: có, 0: không)",
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "is_sync_again phải là số" })
  @Min(0, { message: "is_sync_again phải là 0 hoặc 1" })
  @Max(1, { message: "is_sync_again phải là 0 hoặc 1" })
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  is_sync_again?: number = 0;
}
