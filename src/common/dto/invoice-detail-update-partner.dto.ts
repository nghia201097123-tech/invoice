import { ApiProperty } from "@nestjs/swagger";
import { Max, Min } from "class-validator";

export class InvoiceDetailUpdatePartnerDto {
  @ApiProperty({
    required: true,
    default: 1,
    example: 1,
    description: "Id món ăn",
  })
  food_id: number;

  @ApiProperty({
    required: true,
    default: 1,
    example: 1,
    description: "số lượng hàng hóa",
  })
  quantity: number;

  @ApiProperty({
    required: true,
    default: 6,
    example: 6,
    description: "Giảm giá theo phần trăm",
  })
  @Min(0, { message: "không được nhập phần trăm giảm giá dưới 0%" })
  @Max(100, { message: "không được nhập phần trăm giảm giá trên 100%" })
  discount_percent: number;

  @ApiProperty({
    required: true,
    default: 60000,
    example: 60000,
    description: "Giảm giá theo tiền mặt",
  })
  @Min(0, { message: "không được nhập tiền giảm giá dưới 0 đồng" })
  discount_amount: number;

  @ApiProperty({
    required: true,
    default: 100000,
    example: 100000,
    description: "tổng tiền lúc chưa VAT",
  })
  @Min(0, { message: "không được nhập tiền dưới 0 đồng" })
  total_amount_without_vat: number;

  @ApiProperty({
    required: true,
    default: "038671123867",
    example: "038671123867",
    description: "Mã Thuế của doanh nghiệp",
  })
  tax_code: string;

  @ApiProperty({
    required: true,
    default: 100000,
    example: 100000,
    description: "tiền VAT",
  })
  @Min(0, { message: "không được nhập tiền dưới 0 đồng" })
  vat_amount: number;

  @ApiProperty({
    required: true,
    default: 100000,
    example: 100000,
    description: "tổng tiền",
  })
  @Min(0, { message: "không được nhập tiền dưới 0 đồng" })
  total_amount: number;

  @ApiProperty({
    required: true,
    default: 1,
    example: 1,
    description: "có phải hàng quà tặng , khuyến mãi hay không",
  })
  is_gift: number;
}
