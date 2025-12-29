import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class ViettelInvoiceCancelDto {
  @IsNotEmpty()
  @IsString()
  pattern: string;

  @IsNotEmpty()
  @IsString()
  serial: string;

  @IsNotEmpty()
  @IsString()
  fkey: string; // Mã tra cứu hóa đơn

  @IsOptional()
  @IsString()
  reason?: string; // Lý do hủy

  @IsOptional()
  @IsNumber()
  type?: number; // Loại hủy (1: Hủy bỏ, 2: Thay thế)

  @IsOptional()
  @IsNumber()
  typeInvoice?: number; // Loại hóa đơn

  @IsOptional()
  @IsString()
  transactionUuid?: string;
}
