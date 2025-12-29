import { CancelInvoiceDto } from "src/common/dto/invoice.cancel.dto";
import { Invoice } from "src/common/schemas/invoice.schema";
import { Branch } from "src/common/entities/branch.entity";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { InvoiceDetail } from "src/common/schemas/invoice-detail.schema";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";

export class InvoiceCancelFPT {
  wrongnotice: InvoiceConvertPartnerCancelFptInvoiceDTO;

  constructor(
    invoiceConvertPartnerCancelFptInvoiceDTO?: InvoiceConvertPartnerCancelFptInvoiceDTO
  ) {
    this.wrongnotice = invoiceConvertPartnerCancelFptInvoiceDTO;
  }
}

export class InvoiceConvertPartnerCancelFptInvoiceDTO {
  /**
   * mã số thuế người bán
   */
  stax: string;
  /**
   *   Loại thông báo
   *   1: Thông báo hủy/giải
   trình của NNT
   - 2: Thông báo hủy/giải
   trình của NNT theo thông
   báo của CQT
   - Không bắt buộc nếu hủy
   hóa đơn gom bảng tổng hợp
   */
  noti_taxtype: string;
  /**
   *  Số thông báo
   Bắt buộc khi
   noti_taxtype": "2"
   */
  noti_taxnum: string;
  /**
   * Ngày thông báo CQT
   */
  noti_taxdt: string;
  /**
   * mã đơn vị quan hệ ngân sách
   */
  budget_relationid: string;
  // địa danh
  place: string;
  items: [InvoiceConvertPartnerCancelDetailFptInvoiceDTO];

  constructor(
    cancelInvoiceDto?: CancelInvoiceDto,
    invoice?: Invoice,
    invoiceDetail?: InvoiceDetail[],
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity,
    branch?: Branch
  ) {
    this.stax = restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.tax_code
      : "";
    this.noti_taxtype = "1";
    this.noti_taxnum = "";
    this.noti_taxdt = "";
    this.budget_relationid = "";
    this.place = branch.city_name ? branch.city_name : "UNKNOW";
    this.items = [
      new InvoiceConvertPartnerCancelDetailFptInvoiceDTO(
        invoice,
        cancelInvoiceDto
      ),
    ];
  }
}

export class InvoiceConvertPartnerCancelDetailFptInvoiceDTO {
  /**
   * Kí hiệu mẫu hóa đơn
   */
  form: string;
  /**
   * Ký hiệu hóa đơn
   */
  serial: string;
  /**
   * số hóa đơn
   */
  seq: string;
  /**
   * Ngày hóa đơn
   */
  idt: string;
  /**
   * Loại áp dụng hóa đơn điện tử
   */
  type_ref: number;
  /**
   * Tính chất thông báo
   - 0: Mới
   - 1: Hủy
   - 2: Điều chỉnh
   - 3: Thay thế
   - 4: Giải trình
   - 5: Sai sót do tổng hợp
   */
  noti_type: string;
  /**
   * Lý do
   */
  rea: string;

  constructor(invoice?: Invoice, cancelInvoiceDto?: CancelInvoiceDto) {
    this.form = "1";
    this.serial = invoice ? invoice.voice_series : "";
    this.seq = invoice
      ? ConvertNumberToString.numberToSeq(invoice.order_id)
      : "";
    this.idt = invoice ? invoice.exported_time : "";
    this.type_ref = 1;
    this.noti_type = "1";
    this.rea = cancelInvoiceDto ? cancelInvoiceDto.note : "";
  }
}
