import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDetailUpdate {
  @ApiProperty({
    required: true,
    default: "",
    example: "6411904f584f545f30e9aead",
    description: "Id hóa đơn ",
  })
  invoice_detail_id: string = "";

  @ApiProperty({
    required: true,
    default: "",
    example: "Heo",
    description: "",
  })
  food_name: string;

  @ApiProperty({
    required: true,
    default: "KG",
    example: "KG",
    description: "",
  })
  food_unit: string = "";

  @ApiProperty({
    required: true,
    default: 10,
    example: 10,
    description: "Số lượng",
  })
  quantity: number = 0;

  @ApiProperty({
    required: true,
    default: 100000,
    example: 100000,
    description: "Đơn giá món ăn",
  })
  price: number = 0;

  @ApiProperty({
    required: true,
    default: 5,
    example: 5,
    description: "% vat",
  })
  vat: number = 0;

  @ApiProperty({
    required: true,
    default: 1,
    example: 1,
    description: "có phải quà tặng không",
  })
  is_gift: number = 0;
}
