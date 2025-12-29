import { Utils } from "src/common/utils/utils.common.helper";
import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";
import {
  MINVOICE_DEFAULTS,
  VAT_RATE_MAPPING,
} from "../constants/minvoice.constants";

export class InvoiceConvertPartnerDetailMInvoiceDTO {
  tchat: number; // Tính chất hàng hóa
  stt_rec0: string; // Số thứ tự dòng hàng hóa
  inv_itemCode: string; // Mã hàng hóa, dịch vụ
  inv_itemName: string; // Tên hàng hóa, dịch vụ
  inv_unitCode: string; // Đơn vị tính
  inv_unitName?: string; // Tên đơn vị tính
  inv_quantity: number; // Số lượng
  inv_unitPrice: number; // Đơn giá
  inv_discountPercentage: number; // Tỷ lệ chiết khấu
  inv_discountAmount: number; // Số tiền chiết khấu
  inv_Amount?: number; // Cộng tiền hàng
  inv_TotalAmountWithoutVat: number; // Thành tiền trước thuế GTGT
  ma_thue: string; // Mã thuế suất
  inv_vatAmount: number; // Tiền thuế GTGT
  inv_TotalAmount: number; // Thành tiền sau thuế GTGT
  inv_promotion?: boolean; // Khuyến mại

  // Các trường theo NQ101 (giảm thuế GTGT)
  inv_vatRateDeduction?: number; // Tỷ lệ % thuế GTGT trên doanh thu
  inv_vatAmountDeduction?: number; // Tổng số tiền thuế GTGT được giảm

  // Các trường bổ sung theo ND70 (áp dụng từ 01/06/2025)
  inv_purity?: number; // Độ tinh khiết (cho vàng bạc đá quý)
  inv_weight?: number; // Trọng lượng (cho vàng bạc đá quý)
  inv_labourCode?: string; // Mã công lao động

  constructor(invoiceDetail?: InvoiceDetail, index?: number) {
    const commodityNatureType =
      invoiceDetail?.commodity_nature_type ??
      MINVOICE_DEFAULTS.COMMODITY_NATURE_TYPE.GOODS_SERVICES;
    const foodCode =
      invoiceDetail?.food_code ??
      Utils.getInitials(invoiceDetail?.food_name ?? "");
    const foodName = invoiceDetail?.food_name ?? "";
    const foodUnit = invoiceDetail?.food_unit ?? "";
    const quantity = invoiceDetail?.quantity ?? 0;
    const price = invoiceDetail?.food_unit_price ?? 0;
    const discountPercent = invoiceDetail?.discount_percent ?? 0;
    const discountAmount = invoiceDetail?.discount_amount ?? 0;
    const totalAmountWithoutVat = invoiceDetail?.total_amount_without_vat ?? 0;
    const vat = invoiceDetail?.vat ?? 0;
    const vatAmount = invoiceDetail?.vat_amount ?? 0;
    const totalAmount = invoiceDetail?.total_amount ?? 0;

    // Tính toán inv_Amount nếu không có
    const amount = quantity * price - discountAmount;

    this.tchat = this.mapCommodityNatureType(commodityNatureType);
    this.stt_rec0 = String(index + 1).padStart(4, "0"); // Format: 0001, 0002, ...
    this.inv_itemCode = foodCode;
    this.inv_itemName = foodName;
    this.inv_unitCode = foodUnit;
    this.inv_unitName = foodUnit; // Tên đơn vị tính giống mã đơn vị
    this.inv_quantity = quantity;
    this.inv_unitPrice = price;
    this.inv_discountPercentage = discountPercent;
    this.inv_discountAmount = discountAmount;
    this.inv_Amount = amount;
    this.inv_TotalAmountWithoutVat = totalAmountWithoutVat;
    this.ma_thue = this.mapVatRateToTaxCode(vat);
    this.inv_vatAmount = vatAmount;
    this.inv_TotalAmount = totalAmount;
    this.inv_promotion = false; // Mặc định không phải khuyến mại

    // Các trường theo NQ101 - mặc định không áp dụng
    this.inv_vatRateDeduction = 0;
    this.inv_vatAmountDeduction = 0;

    // Các trường bổ sung theo ND70 - để trống hoặc giá trị mặc định
    this.inv_purity = 0;
    this.inv_weight = 0;
    this.inv_labourCode = "";
  }

  /**
   * Ánh xạ tính chất hàng hóa
   * @param commodityType
   * @returns
   */
  private mapCommodityNatureType(commodityType: number): number {
    // 1: Hàng hóa dịch vụ
    // 2: Khuyến mại
    // 3: Chiết khấu thương mại
    // 4: Ghi chú/diễn giải
    // 5: Hàng hóa đặc trưng
    return commodityType >= 1 && commodityType <= 5
      ? commodityType
      : MINVOICE_DEFAULTS.COMMODITY_NATURE_TYPE.GOODS_SERVICES;
  }

  /**
   * Ánh xạ thuế suất sang mã thuế
   * @param vatRate
   * @returns
   */
  private mapVatRateToTaxCode(vatRate: number): string {
    return VAT_RATE_MAPPING[vatRate] || VAT_RATE_MAPPING[0]; // Mặc định 0%
  }

  public mapToList(
    baseEntities: InvoiceDetail[]
  ): InvoiceConvertPartnerDetailMInvoiceDTO[] {
    let data: InvoiceConvertPartnerDetailMInvoiceDTO[] = [];
    baseEntities.forEach((e, index) => {
      data.push(new InvoiceConvertPartnerDetailMInvoiceDTO(e, index));
    });
    return data;
  }
}
