import { InvoiceDetail } from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { InvoiceConvertPartNerFptMapListItemDto } from "src/partner/invoice-fpt/fpt-invoice/dto/map_list_item.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
export class InvoiceFormExportInvoicePartNerFpt {
  lang: string;
  inv: InvoiceConvertPartNerFptDto;

  constructor(invoiceConvertPartNerFptDto?: InvoiceConvertPartNerFptDto) {
    this.lang = "vi";
    this.inv = invoiceConvertPartNerFptDto;
  }
}

export class InvoiceConvertPartNerFptDto {
  /**
   - Key để xác định hóa đơn
   - Không được phép trùng
   */
  sid: string;

  /**
   * - Ngày lập hóa đơn theo
   định dạng “yyyy-mm-dd
   hh:mm:ss”
   -   Không được < ngày hiệu
   lực thông báo phát hành
   -   Nếu không nhập idt hệ
   thống tự động lấy ngày lập
   là ngày hiện tạ
   */
  idt: string;

  /**
   *  Xác định loại hóa đơn sử
   dụng
   HĐ giá trị gia tăng có ký
   hiệu: “01GTKT”
   */
  type: string;

  /**
   * - Mẫu hóa đơn đăng ký sử
   dụng trên hệ thống
   -   Để trống eInvoice sẽ tự
   xác định theo thứ tự ưu tiên

   */
  form: string;

  /**
   * - Ký hiệu hóa đơn đăng ký
   trên thông báo phát hành
   - Để trống eInvoice sẽ tự
   xác định theo thứ tự ưu
   tiên
   */
  serial: string;

  /**
   * Số hóa đơn
   - Độ dài 8 ký tự nếu là hóa
   đơn theo TT78. Ví
   dụ: "seq":"00000001
   ",
   - Độ dài 7 ký tự nếu là hóa
   đơn theo TT32. Ví
   dụ: "seq":"0000001",
   (Nếu “aun”: 2 thì không
   điền giá trị vào)
   */
  seq: string;

  /**
   * Mã khách hàng
   */
  bcode: string;

  /**
   * Tên đơn vị mua
   */
  bname: string;

  /**
   * Tên người mua
   */
  buyer: string;

  /**
   * ng Mã số thuế người mua
   */
  btax: string;

  /**
   * Địa chỉ người mua
   */
  baddr: string;

  /**
   *  Số điện thoại người mua
   */
  btel: string;

  /**
   * Email người mua
   */
  bmail: string;
  /**
   * Có thể là 1 trong các giá
   trị sau:
   - TM: Tiền mặt
   - CK: Chuyển
   khoản
   - TM/CK: Tiền
   mặt/Chuyển
   khoản
   - DTCN: Đối trừ
   công nợ
   - KTT: Không thu tiền
   */
  paym: string;

  /**
   * Mã tiền tệ
   */
  curr: string;
  /**
   * tỉ giá
   */
  exrt: number;
  /**
   * Số tài khoản người mua
   */
  bacc: string;
  /**
   * Ngân hàng người mua
   */
  bbank: string;
  /**
   * Ghi chú
   */
  note: string;

  /**
   * Tổng tiền chưa thuế đã
   quy đổi sang VNĐ
   */
  sumv: number;

  /**
   * Tổng tiền chưa thuế
   nguyên tệ
   */
  sum: number;
  /**
   * Tổng tiền thuế đã quy đổi
   sang VNĐ
   */
  vatv: number;
  /**
   * Tổng tiền thuế nguyên tệ
   */
  vat: number;
  /**
   * Số tiền bằng chữ
   */
  word: string;
  /**
   * Tổng tiền thanh toán bao
   gồm tiền thuế, đã quy đổi
   sang VNĐ
   */
  totalv: number;
  /**
   * Tổng tiền thanh toán bao
   gồm tiền thuế, nguyên tệ
   */
  total: number;
  /**
   * Tổng tiền chiết khấu
   thương mại
   */
  tradeamount: number;
  /**
   * Chiết khấu đã bao gồm
   thuế
   */
  discount: number;
  /**
   * Sử dụng xác định phương
   thức quản lý số hóa đơn sẽ
   do hệ thống nào cấp số:
   + Trường hợp DN muốn
   tự quản lý việc cấp số trên
   hệ thống DN:
   “aun”: 1, bắt buộc phải có
   số hóa đơn tại thẻ“seq”
   + Trường hợp chọn
   eInvoice tự động cấp số
   khi nhận dữ liệu từ hệ
   thống quản lý của DN:
   “aun”: 2
   + Trường hợp dữ liệu gửi
   sang eInvoice ở trạng thái
   lưu nháp, chưa cấp số:
   “aun”:””
   */
  aun: any;
  /**
   * Sử dụng đối với hóa đơn
   Xuất hoàn trả
   Đánh dấu hóa đơn là hóa
   đơn xuất hoàn trả
   */
  //  sign: number;

  /**
   * Thẻ xác định loại hóa đơn
   đang sử dụng:
   - 1: Hóa đơn theo TT78
   - Bỏ trống: Hóa đơn theo
   TT32
   */
  type_ref: number;
  /**
   * Số bảng kê (Sử dụng đối
   với các hóa đơn bán theo
   lần phát sinh, sử dụng
   bảng kê)
   */
  listnum: string;
  /**
   * Ngày bảng kê theo định
   dạng “yyyy-mm-dd
   hh:mm:ss” (Sử dụng đối
   với các hóa đơn bán theo
   lần phát sinh, sử dụng
   bảng kê)
   */
  listdt: string;
  /**
   * Phương thức chuyển dữ
   liệu hóa đơn điện tử đến
   Cơ quan thuế:
   - 2: Chuyển bảng tổng
   hợp
   - 1 hoặc null: Chuyển
   đầy đủ nộ
   */
  sendtype: number;
  /**
   * Thẻ xác định bắt đầu bảng
   chi tiết hàng hóa
   */
  items: InvoiceConvertPartNerFptMapListItemDto[];

  /**
   * Mã số thuế người bán
   */
  stax: string;

  constructor(
    exportInvoiceDTO?: ExportInvoiceDTO,
    invoice?: Invoice,
    invoiceDetail?: InvoiceDetail[],
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity
  ) {
    this.sid = invoice ? invoice._id : "";
    this.idt = this.getCurrentDate();
    this.type = "01GTKT";
    this.form = "";
    this.serial = this.getInvoiceSeries(restaurantPartnerInvoiceEntity);
    this.seq = ConvertNumberToString.numberToSeq(invoice.order_id);
    this.bcode = "";
    this.bname = exportInvoiceDTO ? exportInvoiceDTO.customer_company_name : "";
    this.buyer = exportInvoiceDTO ? exportInvoiceDTO.customer_name : "";
    this.btax = exportInvoiceDTO
      ? exportInvoiceDTO.customer_company_tax_code
      : "";
    this.baddr = exportInvoiceDTO
      ? exportInvoiceDTO.customer_company_address
      : "";
    this.btel = exportInvoiceDTO ? exportInvoiceDTO.customer_phone : "";
    this.bmail = exportInvoiceDTO
      ? exportInvoiceDTO.customer_company_email
      : "";
    this.paym = "TM";
    this.curr = "VND";
    this.exrt = 1;
    this.bacc = exportInvoiceDTO ? exportInvoiceDTO.customer_bank_account : "";
    this.bbank = exportInvoiceDTO
      ? exportInvoiceDTO.customer_bank_account_name
      : "";
    this.note = "";
    this.sumv = this.calculateSumV(invoice);
    this.sum = this.calculateSum(invoice);
    this.vatv = this.calculateVatV(invoice);
    this.vat = this.calculateVat(invoice);
    this.word = this.convertNumberToWords(invoice);
    this.totalv = invoice ? Math.floor(invoice.total_amount) : 0;
    this.total = invoice ? Math.floor(invoice.total_amount) : 0;
    this.tradeamount = 0;
    this.discount = invoice ? Math.floor(invoice.discount_amount) : 0;
    this.aun = 1;
    this.type_ref = 1;
    this.listnum = "";
    this.listdt = "";
    this.sendtype = 1;
    this.items = new InvoiceConvertPartNerFptMapListItemDto().mapToList(
      invoiceDetail
    );
    this.stax = restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.tax_code
      : "";
  }

  private getCurrentDate(): string {
    return new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  }

  private getInvoiceSeries(
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity
  ): string {
    return restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.invoice_series
      : "";
  }

  private calculateSumV(invoice?: Invoice): number {
    return Math.floor(invoice?.amount - invoice?.discount_amount) < 0
      ? 0
      : Math.floor(invoice?.amount - invoice?.discount_amount);
  }

  private calculateSum(invoice?: Invoice): number {
    return Math.floor(invoice?.amount - invoice?.discount_amount) < 0
      ? 0
      : Math.floor(invoice?.amount - invoice?.discount_amount);
  }

  private calculateVatV(invoice?: Invoice): number {
    return Math.floor(invoice?.amount - invoice?.discount_amount) < 0
      ? 0
      : Math.floor(invoice?.vat_amount);
  }

  private calculateVat(invoice?: Invoice): number {
    return Math.floor(invoice?.amount - invoice?.discount_amount) < 0
      ? 0
      : Math.floor(invoice?.vat_amount);
  }

  private convertNumberToWords(invoice?: Invoice): string {
    return ConvertNumberToString.numberToWords(
      invoice ? Math.floor(invoice.total_amount) : 0
    );
  }
}
