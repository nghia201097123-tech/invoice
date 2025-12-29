import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class HiloInvoiceCancelDto {
  @IsNotEmpty()
  @IsString()
  pattern: string;

  @IsNotEmpty()
  @IsString()
  serial: string;

  @IsNotEmpty()
  @IsString()
  invoiceNo: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  additionalReferenceDesc?: string;

  @IsOptional()
  @IsString()
  additionalReferenceDate?: string;
}
