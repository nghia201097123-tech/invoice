import { ApiProperty } from "@nestjs/swagger";
import { Invoice } from "../schemas/invoice.schema";

export class InvoiceResponseMap {
  _id: string;

  @ApiProperty({ example: 1, description: "id nhà hàng" })
  restaurant_id: number;

  @ApiProperty({ example: 1, description: "Id thương hiệu" })
  restaurant_brand_id: number;

  @ApiProperty({ example: 1, description: "id chi nhánh" })
  branch_id: number;

  @ApiProperty({ example: "string", description: "Thời gian hoàn tất hoá đơn" })
  payment_date: string;

  @ApiProperty({
    example: "string",
    description: "Ký hiệu hoá đơn theo từng năm",
  })
  voice_series: string;

  @ApiProperty({ example: 1, description: "id hoá đơn" })
  order_id: number;

  @ApiProperty({ example: "string", description: "mã tiền tệ" })
  currency_code: string;

  @ApiProperty({ example: 1, description: "Phương thức thanh toán" })
  payment_method_id: number;

  @ApiProperty({ example: "string", description: "Tên khách hàng" })
  customer_name: string;

  @ApiProperty({ example: "string", description: "Số điện thoại khách hàng" })
  customer_phone: string = "";

  @ApiProperty({ example: 1, description: "id khách hàng" })
  customer_id: number = 0;

  @ApiProperty({ example: "string", description: "Tên công ty khách hàng" })
  customer_company_name: string = "";

  @ApiProperty({
    example: "string",
    description: "Mã số thuế công ty khách hàng",
  })
  customer_company_tax_code: string = "";

  @ApiProperty({ example: "string", description: "Địa chỉ công ty khách hàng" })
  customer_company_address: string = "";

  @ApiProperty({ example: "string", description: "Email công ty khách hàng" })
  customer_company_email: string = "";

  @ApiProperty({
    example: "string",
    description: "Tài khoản ngân hàng khách hàng",
  })
  customer_bank_account: string = "";

  @ApiProperty({ example: "string", description: "Tên ngân hàng khách hàng" })
  customer_bank_account_name: string = "";

  @ApiProperty({ example: 1, description: "Tổng tiền không VAT" })
  total_amount_without_vat: number;

  @ApiProperty({ example: 1, description: "Phần trăm giảm giá" })
  discount_percent: number;

  @ApiProperty({ example: 1, description: "Tổng tiền giảm giá" })
  discount_amount: number;

  @ApiProperty({ example: 1, description: "Phần trăm VAT" })
  vat: number;

  @ApiProperty({ example: 1, description: "Tổng tiền VAT" })
  vat_amount: number;

  @ApiProperty({
    example: 1,
    description: "Tổng tiền thanh toán của khách hàng",
  })
  total_amount: number;

  @ApiProperty({ example: 1, description: "Tổng tiền ước tính" })
  amount: number;

  @ApiProperty({ example: 1, description: "Tên đối tác" })
  type: number = 1;

  @ApiProperty({
    example: "string",
    description: "id hoá đơn điện tử của đối tác",
  })
  ref_code: string = "";

  @ApiProperty({
    example: "string",
    description: "Mã id tham chiếu của cục thuế",
  })
  code: string = "";

  @ApiProperty({
    example: 0,
    description:
      "Trạng thái xác định hóa đơn đã xuất và chưa được xuất qua đối tác , 0:chưa , 1 có",
  })
  invoice_status: number;

  @ApiProperty({
    example: 1,
    description: "Chi cục thuế duyệt 0:chưa , 1 có",
  })
  cct_duyet: number;

  @ApiProperty({
    example: 1,
    description: "mẫu số hóa đơn",
  })
  invoice_denominator: string;

  @ApiProperty({
    example: 1,
    description: "có gửi mail hay không",
  })
  is_send_mail: number;

  @ApiProperty({
    example: "2022-04-01 17:00:00",
    description: "thời gian xuất hóa đơn",
  })
  exported_time: string;

  @ApiProperty({
    example: "",
    description: "loại giảm giá",
  })
  discount_type: number;

  @ApiProperty({
    example: "",
    description: "id đơn hàng gốc",
  })
  order_parent_id: number;

  @ApiProperty({
    example: "",
    description: "loai partner",
  })
  partner_type: number;

  /**
   * Số tiền giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  @ApiProperty({
    example: "",
    description: "Số tiền giảm giá áp dụng riêng cho các món ăn trong đơn hàng",
  })
  food_discount_amount: number;

  /**
   * phần trăm giảm giá áp dụng riêng cho các món ăn trong đơn hàng
   */
  @ApiProperty({
    example: "",
    description:
      "phần trăm giảm giá áp dụng riêng cho các món ăn trong đơn hàng",
  })
  food_discount_percent: number;

  /**
   * Phần trăm giảm giá áp dụng cho các món đồ uống trong đơn hàng.
   */
  @ApiProperty({
    example: "",
    description:
      "Phần trăm giảm giá áp dụng cho các món đồ uống trong đơn hàng.",
  })
  drink_discount_percent: number;

  /**
   * Số tiền giảm giá áp dụng riêng cho các món đồ uống trong đơn hàng
   */
  @ApiProperty({
    example: "",
    description:
      "Số tiền giảm giá áp dụng riêng cho các món đồ uống trong đơn hàng",
  })
  drink_discount_amount: number;

  /**
   * Phần trăm chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  @ApiProperty({
    example: "",
    description:
      "Phần trăm chiết khấu được áp dụng cho tổng số tiền của đơn hàng.",
  })
  total_amount_discount_percent: number;

  /**
   * Số tiền  chiết khấu được áp dụng cho tổng số tiền của đơn hàng.
   */
  @ApiProperty({
    example: "",
    description:
      "Số tiền  chiết khấu được áp dụng cho tổng số tiền của đơn hàng.",
  })
  total_amount_discount_amount: number;

  /**
   *  Các khoản phí bổ sung được áp dụng cho tổng số tiền của đơn hàng.
   */
  @ApiProperty({
    example: "",
    description:
      "Các khoản phí bổ sung được áp dụng cho tổng số tiền của đơn hàng",
  })
  total_amount_extra_charge_amount: number;

  /**
   *  Tỷ lệ phần trăm phí bổ sung được áp dụng trên tổng số tiền của đơn hàng.
   */
  @ApiProperty({
    example: "",
    description:
      "Tỷ lệ phần trăm phí bổ sung được áp dụng trên tổng số tiền của đơn hàng.",
  })
  total_amount_extra_charge_percent: number;

  @ApiProperty({
    example: "",
    description: "tiền phục vu.",
  })
  extra_charge_amount: number;

  @ApiProperty({
    example: "",
    description: "Tỷ lệ phần trăm phí phục vu.",
  })
  service_charge_percent: number;

  constructor(baseEntity?: Invoice) {
    this._id = this.getBaseEntityValue(baseEntity, "_id", "");
    this.restaurant_id = this.getBaseEntityValue(
      baseEntity,
      "restaurant_id",
      0
    );
    this.restaurant_brand_id = this.getBaseEntityValue(
      baseEntity,
      "restaurant_brand_id",
      0
    );
    this.branch_id = this.getBaseEntityValue(baseEntity, "branch_id", 0);
    this.payment_date = this.getBaseEntityValue(baseEntity, "payment_date", "");
    this.voice_series = this.getBaseEntityValue(baseEntity, "voice_series", "");
    this.order_id = this.getBaseEntityValue(baseEntity, "order_id", 0);
    this.currency_code = this.getBaseEntityValue(
      baseEntity,
      "currency_code",
      ""
    );
    this.payment_method_id = this.getBaseEntityValue(
      baseEntity,
      "payment_method_id",
      0
    );
    this.customer_name = this.getBaseEntityValue(
      baseEntity,
      "customer_name",
      ""
    );
    this.customer_phone = this.getBaseEntityValue(
      baseEntity,
      "customer_phone",
      ""
    );
    this.customer_id = this.getBaseEntityValue(baseEntity, "customer_id", 0);
    this.customer_company_name = this.getBaseEntityValue(
      baseEntity,
      "customer_company_name",
      ""
    );
    this.customer_company_tax_code = this.getBaseEntityValue(
      baseEntity,
      "customer_company_tax_code",
      ""
    );
    this.customer_company_address = this.getBaseEntityValue(
      baseEntity,
      "customer_company_address",
      ""
    );
    this.customer_company_email = this.getBaseEntityValue(
      baseEntity,
      "customer_company_email",
      ""
    );
    this.customer_bank_account = this.getBaseEntityValue(
      baseEntity,
      "customer_bank_account",
      ""
    );
    this.customer_bank_account_name = this.getBaseEntityValue(
      baseEntity,
      "customer_bank_account_name",
      ""
    );
    this.total_amount_without_vat = this.getBaseEntityValue(
      baseEntity,
      "total_amount_without_vat",
      0
    );
    this.discount_percent = this.getBaseEntityValue(
      baseEntity,
      "discount_percent",
      0
    );
    this.discount_amount = this.getBaseEntityValue(
      baseEntity,
      "discount_amount",
      0
    );
    this.vat = this.getBaseEntityValue(baseEntity, "vat", 0);
    this.vat_amount = this.getBaseEntityValue(baseEntity, "vat_amount", 0);
    this.total_amount = this.getBaseEntityValue(baseEntity, "total_amount", 0);
    this.amount = this.getBaseEntityValue(baseEntity, "amount", 0);
    this.type = this.getBaseEntityValue(baseEntity, "type", 0);
    this.ref_code = this.getBaseEntityValue(baseEntity, "ref_code", "");
    this.code = this.getBaseEntityValue(baseEntity, "code", "");
    this.invoice_status = this.getBaseEntityValue(
      baseEntity,
      "invoice_status",
      0
    );
    this.cct_duyet = this.getBaseEntityValue(baseEntity, "cct_duyet", 0);
    this.invoice_denominator = this.getBaseEntityValue(
      baseEntity,
      "invoice_denominator",
      ""
    );
    this.is_send_mail = this.getBaseEntityValue(baseEntity, "is_send_mail", 0);
    this.exported_time = this.getBaseEntityValue(
      baseEntity,
      "exported_time",
      ""
    );
    this.discount_type = this.getBaseEntityValue(
      baseEntity,
      "discount_type",
      0
    );
    this.order_parent_id = this.getBaseEntityValue(
      baseEntity,
      "order_parent_id",
      0
    );
    this.partner_type = this.getBaseEntityValue(baseEntity, "partner_type", 0);
    this.total_amount_extra_charge_amount = this.getBaseEntityValue(
      baseEntity,
      "total_amount_extra_charge_amount",
      0
    );
    this.food_discount_amount = this.getBaseEntityValue(
      baseEntity,
      "food_discount_amount",
      0
    );
    this.drink_discount_percent = this.getBaseEntityValue(
      baseEntity,
      "drink_discount_percent",
      0
    );
    this.total_amount_discount_percent = this.getBaseEntityValue(
      baseEntity,
      "total_amount_discount_percent",
      0
    );
    this.total_amount_discount_amount = this.getBaseEntityValue(
      baseEntity,
      "total_amount_discount_amount",
      0
    );
    this.total_amount_extra_charge_percent = this.getBaseEntityValue(
      baseEntity,
      "total_amount_extra_charge_percent",
      0
    );
    this.food_discount_percent = this.getBaseEntityValue(
      baseEntity,
      "food_discount_percent",
      0
    );
    this.drink_discount_amount = this.getBaseEntityValue(
      baseEntity,
      "drink_discount_amount",
      0
    );
    this.extra_charge_amount = this.getBaseEntityValue(
      baseEntity,
      "extra_charge_amount",
      0
    );
    this.service_charge_percent = this.getBaseEntityValue(
      baseEntity,
      "service_charge_percent",
      0
    );
  }

  private getBaseEntityValue(
    baseEntity: Invoice | undefined,
    property: keyof Invoice,
    defaultValue: any
  ): any {
    return baseEntity ? baseEntity[property] : defaultValue;
  }

  public mapToList(baseEntities: Invoice[]): InvoiceResponseMap[] {
    let data: InvoiceResponseMap[] = [];
    baseEntities.forEach((e) => {
      data.push(new InvoiceResponseMap(e));
    });
    return data;
  }
}
