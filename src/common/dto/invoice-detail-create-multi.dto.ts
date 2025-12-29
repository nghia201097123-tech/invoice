import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Min } from "class-validator";
import { FoodDto } from "src/restaurant-service/food/food/food.dto";
import { Invoice } from "../schemas/invoice.schema";

export class InvoiceDetailCreateMultiFoodDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "1",
    description: "Id món ăn",
  })
  food_id: number;

  @ApiProperty({
    required: false,
    default: "",
    example: 10,
    description: "Số lượng hàng hóa  ",
  })
  @Min(0, { message: "Số lượng không nhập số nhỏ hơn 0" })
  quantity: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "1",
    description: "Loại hàng hóa : 1 :dich vụ -  2:khuyến mãi",
  })
  type: number;

  @ApiProperty({
    required: true,
    default: "",
    example: 1,
    description: "có phải hàng tặng hay không",
  })
  is_gift: number;

  @ApiProperty({
    required: true,
    default: 1,
    example: 1,
    description: `"Tính chất hàng hoá: 
        1: Hàng hoá dịch vụ
        2: Khuyến mãi
        3: Chiết khấu thương mại 
        4: Ghi chú/diễn giải"`,
  })
  commodity_nature_type: number;
}

export class InvoiceCreateMultiDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "641047af80a67bcf9975b1af",
    description: "Id hóa đơn ",
  })
  id: string;

  @ApiProperty({
    type: [InvoiceDetailCreateMultiFoodDto],
  })
  @Type(() => InvoiceDetailCreateMultiFoodDto)
  foods: InvoiceDetailCreateMultiFoodDto[];
}

export class InvoiceDetaiLCreateMulti {
  order_id: number;
  order_detail_id: number;
  food_code: string;
  food_name: string;
  food_unit: string;
  quantity: number;
  price: number;
  discount_percent: number;
  discount_amount: number;
  total_amount_without_vat: number;
  vat: number;
  vat_amount: number;
  total_amount: number;
  is_gift: number;
  commodity_nature_type: number;
  code: string;
  food_id: number;
  status: number = 1;
  category_type: number;

  constructor(
    invoiceDetailCreateMultiFoodDto?: InvoiceDetailCreateMultiFoodDto,
    foodDto?: FoodDto,
    invoice?: Invoice
  ) {
    this.order_id = invoice ? invoice.order_id : 0;
    this.order_detail_id = 0;
    this.food_code = foodDto ? foodDto.code : "";
    this.food_name = foodDto ? foodDto.name : "";
    this.food_unit = foodDto ? foodDto.unit : "";
    this.quantity = this.getQuantity(invoiceDetailCreateMultiFoodDto);
    this.price = foodDto ? foodDto.price : 0;
    this.discount_percent = 0;
    this.discount_amount = 0;
    this.total_amount_without_vat = this.getTotalAmountWithoutVat(
      invoiceDetailCreateMultiFoodDto,
      foodDto
    );
    this.vat = foodDto ? foodDto.vat : 0;
    this.vat_amount = this.getVatAmount(
      invoiceDetailCreateMultiFoodDto,
      foodDto
    );
    this.total_amount = this.getTotalAmount(
      invoiceDetailCreateMultiFoodDto,
      foodDto
    );
    this.is_gift = invoiceDetailCreateMultiFoodDto
      ? invoiceDetailCreateMultiFoodDto.is_gift
      : 0;
    this.commodity_nature_type = invoiceDetailCreateMultiFoodDto
      ? invoiceDetailCreateMultiFoodDto.commodity_nature_type
      : 0;
    this.code = "";
    this.food_id = invoiceDetailCreateMultiFoodDto
      ? invoiceDetailCreateMultiFoodDto.food_id
      : 0;
    this.status = 1;
    this.category_type = foodDto ? foodDto.category_type : 0;
  }

  private getQuantity(
    invoiceDetailCreateMultiFoodDto?: InvoiceDetailCreateMultiFoodDto
  ): number {
    return invoiceDetailCreateMultiFoodDto
      ? invoiceDetailCreateMultiFoodDto.quantity
      : 0;
  }

  private getTotalAmountWithoutVat(
    invoiceDetailCreateMultiFoodDto?: InvoiceDetailCreateMultiFoodDto,
    foodDto?: FoodDto
  ): number {
    const quantity = this.getQuantity(invoiceDetailCreateMultiFoodDto);
    const price = foodDto ? foodDto.price : 0;
    return quantity * price;
  }

  private getVatAmount(
    invoiceDetailCreateMultiFoodDto?: InvoiceDetailCreateMultiFoodDto,
    foodDto?: FoodDto
  ): number {
    const quantity = this.getQuantity(invoiceDetailCreateMultiFoodDto);
    const price = foodDto ? foodDto.price : 0;
    const vat = foodDto ? foodDto.vat : 0;
    return (vat * quantity * price) / 100;
  }

  private getTotalAmount(
    invoiceDetailCreateMultiFoodDto?: InvoiceDetailCreateMultiFoodDto,
    foodDto?: FoodDto
  ): number {
    const quantity = this.getQuantity(invoiceDetailCreateMultiFoodDto);
    const price = foodDto ? foodDto.price : 0;
    const vat = foodDto ? foodDto.vat : 0;
    return quantity * price + (vat * quantity * price) / 100;
  }

  public mapToList(
    baseEntities: InvoiceDetailCreateMultiFoodDto[],
    foodDtos: FoodDto[],
    invoice: Invoice
  ): InvoiceDetaiLCreateMulti[] {
    let data: InvoiceDetaiLCreateMulti[] = [];
    baseEntities.forEach((e, i) => {
      const foodDto = foodDtos[i];
      data.push(new InvoiceDetaiLCreateMulti(e, foodDto, invoice));
    });
    return data;
  }
}
