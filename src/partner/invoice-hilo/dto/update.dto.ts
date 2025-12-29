import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { HiloInvoiceDetailDto } from "./export.dto";

export class HiloInvoiceUpdateDto {
  @IsNotEmpty()
  @IsString()
  pattern: string;

  @IsNotEmpty()
  @IsString()
  serial: string;

  @IsNotEmpty()
  @IsString()
  invoiceNo: string;

  @IsNotEmpty()
  @IsString()
  adjustmentType: string; // 1: Điều chỉnh tăng, 2: Điều chỉnh giảm, 3: Điều chỉnh thông tin

  @IsOptional()
  @IsString()
  originalInvoiceId?: string;

  @IsNotEmpty()
  @IsString()
  invoiceDate: string;

  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @IsNotEmpty()
  @IsNumber()
  exchangeRate: number;

  @IsNotEmpty()
  @IsString()
  buyerName: string;

  @IsOptional()
  @IsString()
  buyerTaxCode?: string;

  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @IsNotEmpty()
  @IsNumber()
  totalAmountWithoutVat: number;

  @IsNotEmpty()
  @IsNumber()
  totalVatAmount: number;

  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  totalDiscountAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  adjustmentNote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HiloInvoiceDetailDto)
  invoiceDetails: HiloInvoiceDetailDto[];
}
