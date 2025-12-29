import { ApiProperty } from "@nestjs/swagger";
import { InvoiceDetail } from "../schemas/invoice-detail.schema";

export class InvoiceDetailResponse {
  @ApiProperty({
    example: "64035aff594a42cc1fbd0878",
    description: "id của chi tiết phiếu hủy",
  })
  _id: string;

  @ApiProperty({
    example: 3547819,
    description: "id chi tiết đơn hàng",
  })
  order_detail_id: number;

  @ApiProperty({
    example: 3547819,
    description: "id đơn hàng",
  })
  order_id: number;

  @ApiProperty({
    example: "THITHEO",
    description: "mã món ăn",
  })
  food_code: string;

  @ApiProperty({
    example: "Thịt heo",
    description: "tên món ăn",
  })
  food_name: string;

  @ApiProperty({
    example: 3,
    description: "Số lượng món ăn",
  })
  quantity: number;

  @ApiProperty({
    example: 18000,
    description: "giá món ăn",
  })
  food_unit_price: number;

  @ApiProperty({
    example: 4,
    description: "giảm giá theo phần trăm",
  })
  discount_percent: number;

  @ApiProperty({
    example: 200000,
    description: "giảm giá theo tiền mặt",
  })
  discount_amount: number;

  @ApiProperty({
    example: 200000,
    description: "Tiền VAT",
  })
  vat_amount: number;

  @ApiProperty({
    example: 200000,
    description: "Tổng tiền chưa VAT",
  })
  total_amount_without_vat: number;

  @ApiProperty({
    example: 3,
    description: "đánh vat",
  })
  vat: number;

  @ApiProperty({
    example: 30000,
    description: "tổng tiền",
  })
  total_amount: number;

  @ApiProperty({
    example: 1,
    description: "Có phải món tặng hay không 0: không phải , 1 :phải",
  })
  is_gift: number;
  status: number;
  food_unit: string;
  price: number;
  food_id: number;
  category_type: number;

  constructor(data?: any) {
    this._id = data._id;

    this.order_detail_id = data.order_detail_id;

    this.order_id = data.order_id;

    this.food_code = data.food_code;

    this.food_name = data.food_name;

    this.quantity = data.quantity;

    this.food_unit_price = data.food_unit_price;

    this.discount_percent = data.discount_percent;

    this.discount_amount = data.discount_amount;

    this.vat_amount = data.vat_amount;

    this.total_amount_without_vat = data.total_amount_without_vat;

    this.vat = data.vat;

    this.total_amount = data.total_amount;

    this.is_gift = data.is_gift;

    this.status = data.status;

    this.food_unit = data.food_unit;

    this.price = data.price;

    this.food_id = data.food_id;

    this.category_type = data.category_type;
  }

  public static mapToList(
    baseEntities: InvoiceDetail[]
  ): InvoiceDetailResponse[] {
    let data: InvoiceDetailResponse[] = [];
    baseEntities.forEach((e) => {
      data.push(new InvoiceDetailResponse(e));
    });
    return data;
  }
}
