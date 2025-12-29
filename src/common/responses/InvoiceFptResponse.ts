import { ApiProperty } from "@nestjs/swagger";

export class InvoiceResponseFpt {
  @ApiProperty({
    default: "",
    example: "153dc090-f2cb-44e9-aa54-19fda8aac649",
    description: "mã id tham chiếu đến mã của đối tác",
  })
  ref_code: string;

  @ApiProperty({
    default: "",
    example: "6401f326962d81e27497f3b7",
    description: "mã id tham chiến đối cục thuế",
  })
  code: string;

  @ApiProperty({
    default: "",
    example: "đã gửi",
    description: "trạng thái của phiếu",
  })
  status: string;

  @ApiProperty({
    default: "",
    example: 0,
    description: "trạng thái xuất của hóa đơn , 0:chưa , 1 có",
  })
  invoice_status: number;

  @ApiProperty({
    default: "",
    example: "1C23TYY",
    description: "Chữ ký công ty đã đăng kí với đối tác",
  })
  invoice_series: string;

  @ApiProperty({
    default: "",
    example: 4375,
    description: "id của đơn hàng",
  })
  invoice_number: number;

  @ApiProperty({
    default: "",
    example: "2023-03-4",
    description: "Ngày lập phiếu",
  })
  created_at: string;

  @ApiProperty({
    default: "",
    example: "VND",
    description: "Mã tiền tệ VND, USD",
  })
  currency_code: string;

  @ApiProperty({
    default: "",
    example: 1,
    description: "tỉ giá",
  })
  exchange_rate: number;

  @ApiProperty({
    default: "",
    example: "Nguyễn Trung Nghĩa",
    description: "Tên khách hàng mua",
  })
  customer_buyer_name: string;

  @ApiProperty({
    default: "",
    example: "Công ty Nguyễn 123",
    description: "Tên công ty khách hàng",
  })
  customer_company_name: string = "";

  @ApiProperty({
    default: "",
    example: "303-Phạm Văn Đồng-Gò Vấp",
    description: "Địa chỉ công ty",
  })
  customer_company_address: string = "";

  @ApiProperty({
    default: "",
    example: "email của công ty",
    description: "nguyen123@gmail.com",
  })
  customer_company_email: string = "";

  @ApiProperty({
    default: "",
    example: "812368716321",
    description: "Mã số thuế của công ty đã đăng kí cục thuế phường,Quận,Huyện",
  })
  customer_company_tax_code: string = "";

  @ApiProperty({
    default: "",
    example: 12313544777555,
    description: "số tài khoản người bán",
  })
  seller_account_number: number;

  @ApiProperty({
    default: "",
    example: "187623",
    description: "Mã bảo mật",
  })
  security_code: string;

  @ApiProperty({
    default: "",
    example: "VP",
    description: "Mã đơn vị",
  })
  unit_code: string;

  @ApiProperty({
    default: "",
    example: "MV",
    description: "Tên tài khoản người tạo phiếu bên hệ thống đối tác",
  })
  user_create: string;

  @ApiProperty({
    default: "",
    example: 100000,
    description: "Tổng tiền không VAT",
  })
  total_amount_without_vat: number;

  @ApiProperty({
    default: "",
    example: 3000000,
    description: "Tổng tiền VAT",
  })
  total_amount_vat: number;

  @ApiProperty({
    default: "",
    example: 3000,
    description: "giảm giá theo tiền mặt",
  })
  discount_amount: number;

  @ApiProperty({
    default: "",
    example: 300000,
    description: "Tổng tiền ",
  })
  total_amount: number;

  @ApiProperty({
    default: "",
    example: "Ba trăm nghìn đồng",
    description: "Tổng tiền được ghi bằng chữ",
  })
  total_amount_word: string;

  @ApiProperty({
    default: "",
    example: "1321",
    description: "id của đơn hàng",
  })
  order_id: number;

  // @ApiProperty({
  //     default: "",
  //     example: "BIDV",
  //     description: "Tên ngân hàng ",
  //   })
  // customer_bank_account: string;

  @ApiProperty({
    default: "",
    example: "BIDV",
    description: "Tên ngân hàng người mua",
  })
  customer_buy_bank_account: string;

  @ApiProperty({
    default: "",
    example: "BIDV",
    description: "Tên ngân hàng người bán",
  })
  customer_sell_bank_account: string;

  @ApiProperty({
    default: "",
    example: "VP",
    description: "Mã đơn vị",
  })
  dvcs_code: string;

  @ApiProperty({
    default: "",
    example: "Được duyệt",
    description:
      "Trạng thái duyện của cục thuế với hóa đơn : null:vừa mới gửi , 0: không duyệt hoặc lỗi , 1:đã duyệt",
  })
  is_success: string;

  constructor(data?: any, is_success_status_to_string?: any) {
    this.ref_code = this.getRefCode(data);
    this.code = this.getCode(data);
    this.customer_company_tax_code = this.getCustomerCompanyTaxCode(data);
    this.status = this.getStatus(data);
    this.invoice_status = this.getInvoiceStatus(data);
    this.invoice_series = this.getInvoiceSeries(data);
    this.invoice_number = this.getInvoiceNumber(data);
    this.created_at = this.getCreatedAt(data);
    this.currency_code = this.getCurrencyCode(data);
    this.exchange_rate = this.getExchangeRate(data);
    this.customer_company_name = this.getCustomerCompanyName(data);
    this.customer_buyer_name = this.getCustomerBuyerName(data);
    this.customer_company_address = this.getCustomerCompanyAddress(data);
    this.customer_company_email = this.getCustomerCompanyEmail(data);
    this.customer_company_tax_code = this.getCustomerCompanyTaxCode(data);
    this.seller_account_number = this.getSellerAccountNumber(data);
    this.security_code = this.getSecurityCode(data);
    this.unit_code = "";
    this.user_create = this.getUserCreate(data);
    this.total_amount_without_vat = this.getTotalAmountWithoutVat(data);
    this.total_amount_vat = this.getTotalAmountVat(data);
    this.discount_amount = this.getDiscountAmount(data);
    this.total_amount = this.getTotalAmount(data);
    this.total_amount_word = this.getTotalAmountWord(data);
    this.order_id = this.getOrderId(data);
    this.customer_buy_bank_account = this.getCustomerBuyBankAccount(data);
    this.customer_sell_bank_account = this.getCustomerSellBankAccount(data);
    this.dvcs_code = "";
    this.is_success = is_success_status_to_string;
  }

  private getRefCode(data: any): string {
    return data ? data.ic : "";
  }

  private getCode(data: any): string {
    return data ? data.ot : "";
  }

  private getCustomerCompanyTaxCode(data: any): string {
    return data ? data.ot : "";
  }

  private getStatus(data: any): string {
    return data ? data.status.toString() : "";
  }

  private getInvoiceStatus(data: any): number {
    return data ? data.status : 0;
  }

  private getInvoiceSeries(data: any): string {
    return data ? data.serial : "";
  }

  private getInvoiceNumber(data: any): number {
    return data ? parseInt(data.seq) : 0;
  }

  private getCreatedAt(data: any): string {
    return data ? data.adt : "";
  }

  private getCurrencyCode(data: any): string {
    return data ? data.curr : "";
  }

  private getExchangeRate(data: any): number {
    return data ? data.exrt : 0;
  }

  private getCustomerCompanyName(data: any): string {
    return data ? data.bname : "";
  }

  private getCustomerBuyerName(data: any): string {
    return data ? data.buyer : "";
  }

  private getCustomerCompanyAddress(data: any): string {
    return data ? data.baddr : "";
  }

  private getCustomerCompanyEmail(data: any): string {
    return data ? data.bmail : "";
  }

  private getSellerAccountNumber(data: any): number {
    return data ? data.bacc : 0;
  }

  private getSecurityCode(data: any): string {
    return data ? data.sec : "";
  }

  private getUserCreate(data: any): string {
    return data ? data.sname : "";
  }

  private getTotalAmountWithoutVat(data: any): number {
    return data.sumv ? data.sumv : 0;
  }

  private getTotalAmountVat(data: any): number {
    return data.vat ? data.vat : 0;
  }

  private getDiscountAmount(data: any): number {
    return data.discount ? data.discount : 0;
  }

  private getTotalAmount(data: any): number {
    return data.total ? data.total : 0;
  }

  private getTotalAmountWord(data: any): string {
    return data.word ? data.word : "";
  }

  private getOrderId(data: any): number {
    return 0;
  }

  private getCustomerBuyBankAccount(data: any): string {
    return data.bacc ? data.bacc : "";
  }

  private getCustomerSellBankAccount(data: any): string {
    return data.bbank ? data.bbank : "";
  }
}
