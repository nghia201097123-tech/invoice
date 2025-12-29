import { ApiProperty } from "@nestjs/swagger";
import { Max, Min } from "class-validator";

export class InvoiceDetailUpdateDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "6401f326962d81e27497f3b7",
    description: "id của hóa đơn",
  })
  id: string = ""; // id chi tiết của hóa đơn

  @ApiProperty({
    required: true,
    default: "",
    example: "20000",
    description: "Tiền vat",
  })
  @Min(0, { message: "Không nhập tiền vat dưới 0 đồng" })
  vat_amount: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "Thịt heo => THITHEO , THITHEO01",
    description: "Mã Món ăn",
  })
  food_code: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "Thịt heo",
    description: "tên món ăn",
  })
  food_name: string;

  @ApiProperty({
    required: true,
    default: "",
    example: 9000000,
    description: "Đơn giá ",
  })
  food_unit_price: number;

  @ApiProperty({
    required: true,
    default: "",
    example: 10,
    description: "Số lượng hàng hóa",
  })
  quantity: number;

  @ApiProperty({
    required: true,
    default: "",
    example: 6,
    description: "Giảm giá theo phần trăm",
  })
  @Min(0, { message: "không được nhập phần trăm giảm giá dưới 0%" })
  @Max(100, { message: "không được nhập phần trăm giảm giá trên 100%" })
  discount_percent: number;

  @ApiProperty({
    required: true,
    default: "",
    example: 60000,
    description: "Giảm giá theo tiền mặt",
  })
  @Min(0, { message: "không được nhập tiền giảm giá dưới 0 đồng" })
  discount_amount: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "2000000",
    description: "tổng tiền không vat",
  })
  @Min(0, { message: "không được nhập tiền dưới 0 đồng" })
  total_amount_without_vat: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "3",
    description: "đánh vat",
  })
  @Min(0, { message: "Không nhập vat dưới 0%" })
  @Max(100, { message: "Không nhập vat trên 100%" })
  vat: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "20000",
    description: "Tổng tiền vat",
  })
  @Min(0, { message: "Không nhập tổng tiền vat dưới 0 đồng" })
  total_amount: number;

  @ApiProperty({
    required: true,
    default: "",
    example: 1,
    description: "có phải hàng quà tặng , khuyến mãi hay không",
  })
  is_gift: number;
}
