import { ApiProperty } from "@nestjs/swagger";

export class InvoiceDetailRestaurantParamDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "6405b262b11e44eed6cc819d",
    description: "Id của phiếu bên dashboard",
  })
  readonly id: string = "";
}
