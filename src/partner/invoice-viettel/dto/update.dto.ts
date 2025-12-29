import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class ViettelInvoiceUpdateDto {
  @IsNotEmpty()
  @IsString()
  fkey: string; // Mã tra cứu hóa đơn

  @IsOptional()
  @IsNumber()
  paymentStatus?: number; // Trạng thái thanh toán (0: Chưa thanh toán, 1: Đã thanh toán)

  @IsOptional()
  @IsString()
  paymentDate?: string; // Ngày thanh toán

  @IsOptional()
  @IsString()
  paymentMethod?: string; // Phương thức thanh toán

  @IsOptional()
  @IsString()
  note?: string; // Ghi chú

  @IsOptional()
  @IsString()
  transactionUuid?: string;
}

export class ViettelInvoiceSearchDto {
  @IsOptional()
  @IsString()
  transactionUuid?: string;

  @IsOptional()
  @IsString()
  fkey?: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
}
