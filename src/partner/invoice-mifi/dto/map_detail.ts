import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";

export class InvoiceDetailConvertPartNerMifi {
  code: string; // mã sản phẩm (string)
  ProdName: string; //tên sản phẩm (string)
  ProdUnit: string; // Đơn vị tính (string)
  ProdQuantity: number; //Số lượng (double)
  Discount: number; //Tiền chiết khấu trên đơn giá – Discount Amount upon price (double)
  DiscountAmount: number; //: Phần trăm chiết khấu – Discount rate upon price (double)
  ProdPrice: number; //: Đơn giá sản phẩm (double)
  VATRate: number; //Phần tram thuế (vd: 5, 10) (double)
  VATAmount: number; //tiền thuế (double)
  Total: number; // Tiền chưa thuế (double)
  Amount: number; //: Tiền đã có thuế (double)
  Remark: string; // ghi chú (string)
  ProdAttr: number; //Tính chất (int) (1: Hàng hóa dịch vụ, 2: Khuyến mãi, 3: Chiết khấu, 4: Ghi chú)

  constructor(invoiceDetail?: InvoiceDetail) {
    this.code = invoiceDetail ? invoiceDetail.food_code : "";
    this.ProdName = invoiceDetail ? invoiceDetail.food_name : "";
    this.ProdUnit = "";
    this.ProdQuantity = invoiceDetail.quantity ? invoiceDetail.quantity : 0;
    this.DiscountAmount = invoiceDetail.discount_amount
      ? invoiceDetail.discount_amount
      : 0;
    this.ProdPrice = invoiceDetail.price ? invoiceDetail.price : 0;
    this.VATRate = invoiceDetail.vat ? invoiceDetail.vat : 0;
    this.VATAmount = invoiceDetail.vat_amount ? invoiceDetail.vat_amount : 0;
    this.Total = invoiceDetail.total_amount_without_vat
      ? invoiceDetail.total_amount_without_vat
      : 0;
    this.Amount = invoiceDetail.total_amount ? invoiceDetail.total_amount : 0;
    this.Remark = "";
    this.ProdAttr = invoiceDetail.commodity_nature_type
      ? invoiceDetail.commodity_nature_type
      : 0;
  }

  public static mapToList(
    baseEntities: InvoiceDetail[]
  ): InvoiceDetailConvertPartNerMifi[] {
    let data: InvoiceDetailConvertPartNerMifi[] = [];
    baseEntities.forEach((e) => {
      data.push(new InvoiceDetailConvertPartNerMifi(e));
    });
    return data;
  }
}
