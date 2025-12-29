import { InvoiceDetail } from "../../../../common/schemas/invoice-detail.schema";

export class InvoiceConvertPartNerFptMapListItemDto {
  line: number; //Số thứ tự dòng hàng hóa

  /**
   * Hình thức hàng hóa có 4
   loại:
   ➔ MT : Ghi chú, diễn giải
   ➔ CK : Chiết khấu
   thương mại
   ➔ KM : Khuyến mãi
   ➔ Truyền rỗng : Thông
   thường
   */
  type: string;

  /**
   * Loại thuế suất : ( 0, 5, 10,
   -1, -2)
   ➔ 0: thuế suất 0%
   ➔ 5: thuế suất 5%
   ➔ 10: thuế suất 10%
   ➔ -1: Không chịu thuế
   ➔ -2: Không kê khai nộp
   thuế
   ➔ Khác 5 loại thuế suất
   trên: thuế suất Khác
   */
  vrt: string;
  /**
   * Mã hàng hóa
   */
  code: string;

  /**
   * Mô tả hàng hóa, dịch vụ
   */
  name: string;

  /**
   * Đơn vị tính hàng hóa
   */
  unit: string;
  /**
   * Đơn giá hàng hóa
   */
  price: number;

  /**
   * Số lượng
   */
  quantity: number;

  /**
   * Tỷ lệ % chiết khấu
   */
  perdiscount: number;

  /**
   * Số tiền chiết khấu
   */
  amtdiscount: number;
  /**
   * - Thành tiền từng dòng
   hàng hóa dịch vụ
   */
  amount: number;

  /**
   * Số tiền VAT từng hàng
   hóa
   */
  vat: number;

  /**
   *  Tổng tiền bao gồm VAT
   từng hàng hóa
   */
  total: number;

  constructor(invoiceDetail?: InvoiceDetail, index?: number) {
    this.line = index;
    this.type = "";
    this.vrt = invoiceDetail ? invoiceDetail.vat.toString() : "";
    this.code = invoiceDetail ? invoiceDetail.food_code : "";
    this.name = invoiceDetail ? invoiceDetail.food_name : "";
    this.unit = invoiceDetail ? invoiceDetail.food_unit : "";
    this.price = invoiceDetail ? invoiceDetail.price : 0;
    this.quantity = invoiceDetail ? invoiceDetail.quantity : 0;
    this.perdiscount = invoiceDetail ? invoiceDetail.discount_percent : 0;
    this.amtdiscount = invoiceDetail ? invoiceDetail.discount_amount : 0;
    this.amount = invoiceDetail ? invoiceDetail.total_amount_without_vat : 0;
    this.vat = invoiceDetail ? invoiceDetail.vat_amount : 0;
    this.total = invoiceDetail ? invoiceDetail.total_amount : 0;
  }

  public mapToList(
    baseEntity?: InvoiceDetail[]
  ): InvoiceConvertPartNerFptMapListItemDto[] {
    let data: InvoiceConvertPartNerFptMapListItemDto[] = [];
    baseEntity.forEach((e, i) => {
      return data.push(new InvoiceConvertPartNerFptMapListItemDto(e, i + 1));
    });
    return data;
  }
}
