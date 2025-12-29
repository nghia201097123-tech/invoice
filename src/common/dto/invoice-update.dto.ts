import { ApiProperty } from "@nestjs/swagger";

export class InvoiceUpdateDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "6401f326962d81e27497f3b7",
    description: "id của hóa đơn",
  })
  id: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "phương thức thanh toán",
  })
  payment_method_id: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "Chữ kí của công ty bên phía thứ 3 cung cấp cho",
    description: "1C23TYY",
  })
  invoice_series: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "Nguyễn Quốc Khánh",
    description: "Tên khách hàng",
  })
  customer_name: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "Số điện thoại của khách hàng",
  })
  customer_phone: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "1",
    description: "id của khách hàng",
  })
  customer_id: number;

  @ApiProperty({
    required: true,
    default: "",
    example: "Công ty Nguyễn 123",
    description: "Tên công ty của khách hàng",
  })
  customer_company_name: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description:
      "Mã số thuế của công ty đã đăng kí với chi cục thuế ở địa phương",
  })
  customer_company_tax_code: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "Địa chỉ của công ty khách hàng",
  })
  customer_company_address: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "Email của công ty khách hàng",
  })
  customer_company_email: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "Tài khoản ngân hàng",
  })
  customer_bank_account: string;

  @ApiProperty({
    required: true,
    default: "",
    example: "",
    description: "Tên ngân hàng",
  })
  customer_bank_account_name: string;

  @ApiProperty({
    required: true,
    default: 1,
    example: "",
    description: "Thiết lập gửi mail",
  })
  is_send_mail: number;
}
