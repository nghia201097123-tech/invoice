import { ApiProperty } from "@nestjs/swagger";

export class InvoiceOutputResponse {
  @ApiProperty({ example: 10, description: "tổng record" })
  total_record: number;

  @ApiProperty({
    example: 1000000,
    description: "tổng tiền của danh sách hóa đơn",
  })
  total_amount: number;

  @ApiProperty({ example: 1000000, description: "tổng tiền VAT" })
  total_vat_amount: number;

  @ApiProperty({ example: 1000000, description: "tổng tiền giảm giá" })
  total_discount_amount: number;

  @ApiProperty({ example: 1000000, description: "tổng tiền Thanh toán" })
  total_payment_amount: number;

  @ApiProperty({ example: 1, description: "" })
  limit: number;

  @ApiProperty({ example: 1, description: "" })
  list: any;

  constructor(
    data: any,
    total_amount: number,
    total_vat_amount: number,
    total_discount_amount: number,
    total_payment_amount: number
  ) {
    this.total_record = data.total_record;
    this.total_amount = total_amount;
    this.total_vat_amount = total_vat_amount;
    this.total_discount_amount = total_discount_amount;
    this.total_payment_amount = total_payment_amount;
    this.limit = data.limit;
    this.list = data.list
      .filter((e: any) => "order_id" in e)
      .map((e: any) => {
        let dateObj = null;
        if (e.payment_date) {
          if (
            typeof e.payment_date === "string" &&
            e.payment_date.includes("ICT")
          ) {
            const dateString = e.payment_date.replace("ICT", "+0700");
            dateObj = new Date(dateString);
          } else {
            dateObj = new Date(e.payment_date);
          }
          if (dateObj && !isNaN(dateObj.getTime())) {
            // Chỉ cộng thêm 7 giờ nếu order_method nằm trong danh sách [3,4,5,6]
            const shouldAddTimezone = [3, 4, 5, 6].includes(e.order_method);
            if (shouldAddTimezone) {
              const vietnamTime = new Date(
                dateObj.getTime() + 7 * 60 * 60 * 1000
              );
              dateObj = vietnamTime;
            }
          }
        }
        const formattedDate =
          dateObj && !isNaN(dateObj.getTime())
            ? `${dateObj.getUTCFullYear()}/${String(
                dateObj.getUTCMonth() + 1
              ).padStart(2, "0")}/${String(dateObj.getUTCDate()).padStart(
                2,
                "0"
              )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
                dateObj.getUTCMinutes()
              ).padStart(2, "0")}`
            : null;

        return { ...e, payment_date: formattedDate };
      });
  }
}
