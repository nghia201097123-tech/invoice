import { Invoice } from "../../../common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "../../../common/dto/invoice.export.dto";
import { InvoiceConvertPartnerDetailMInvoiceDTO } from "./map_intem_detail.dto";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { MINVOICE_DEFAULTS } from "../constants/minvoice.constants";

export class InvoiceConvertPartnerMInvoiceDTO {
  // Các trường bắt buộc cơ bản
  editmode: number;
  inv_invoiceIssuedDate: string;
  inv_invoiceSeries: string;
  inv_invoiceNumber?: string;
  key_api: string;
  so_benh_an: number;
  inv_currencyCode: string; // VND/USD
  inv_exchangeRate: number; // Tỷ lệ chuyển dổi tiền việt ra tiền nước ngoài
  inv_paymentMethodName: string; // TM/CK;

  // Thông tin người mua
  inv_buyerDisplayName: string; // Tên khách hàng
  ma_dt?: string; // Mã đối tượng
  inv_buyerLegalName: string; // Tên công ty kháchh hàng
  inv_buyerTaxCode: string; // mã số thuế công ty khách hàng
  inv_buyerAddressLine: string; // ĐỊa chỉ công ty khách hàng
  inv_buyerEmail: string; // Gmail của khách hàng
  buyerIdentityCard?: string; // Số CMND/CCCD người mua
  buyerTel?: string; // Số điện thoại người mua
  sobaomat?: string; // Số bảo mật
  inv_buyerBankAccount: string; // Số tài khoản ngân hàng của khách hàng
  inv_buyerBankName: string; // Tên ngân hàng của khách hàng

  // Thông tin tiền tệ
  inv_discountAmount: number; // Tổng tiền giảm giá
  inv_TotalAmountWithoutVat: number; // Tổng tiền không có VAT
  inv_vatAmount: number; // Tổng tiền VAT
  inv_TotalAmount: number; // Tổng tiền thanh toán
  amount_to_word: string; // Tổng tiền băng chữ

  // Các trường theo NQ101 (giảm thuế GTGT)
  tlptdoanhthu20?: number; // Tỷ lệ % thuế GTGT trên doanh thu
  tgtck20?: number; // Tổng tiền thuế GTGT được giảm
  isDeductionNQ43?: boolean; // Có áp dụng giảm thuế theo NQ101 không

  // Các trường bổ sung theo ND70 (áp dụng từ 01/06/2025)
  ma_ch?: string; // Mã cửa hàng
  ten_ch?: string; // Tên cửa hàng
  dchicuahang?: string; // Địa chỉ cửa hàng
  mdvqhnsach_nmua?: string; // Mã đơn vị quan hệ ngân sách người mua
  so_hchieu?: string; // Số hộ chiếu người mua
  cccdan?: string; // Căn cước công dân người mua
  socialDeductionAmount?: number; // Phí vận chuyển
  ratioOrtherTax?: number; // Thuế tiêu thụ đặc biệt
  ortherFee?: number; // Tiền thuế tiêu thụ đặc biệt
  mdvqhnsach_nban?: string; // Mã đơn vị quan hệ ngân sách người bán
  so_qdinh?: string; // Số quyết định
  ngay_qdinh?: string; // Ngày quyết định
  cqbhanh_qdinh?: string; // Cơ quan ban hành quyết định

  details: [
    {
      data: InvoiceConvertPartnerDetailMInvoiceDTO[];
    }
  ];

  constructor(
    exportInvoiceDTO: ExportInvoiceDTO,
    invoice: Invoice,
    invoiceDetail: InvoiceDetail[],
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity
  ) {
    // Các trường bắt buộc cơ bản
    this.editmode = MINVOICE_DEFAULTS.EDIT_MODE.CREATE;
    this.inv_invoiceIssuedDate = UtilsDate.convertDateFormat(
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      })
    );
    this.inv_invoiceSeries = restaurantPartnerInvoiceEntity.invoice_series;
    this.inv_invoiceNumber = exportInvoiceDTO.invoice_denominator || "";
    this.key_api = `${invoice.order_id}_${Date.now()}`; // Key duy nhất để check trùng
    this.so_benh_an = invoice.order_id;
    this.inv_currencyCode = MINVOICE_DEFAULTS.CURRENCY_CODE;
    this.inv_exchangeRate = MINVOICE_DEFAULTS.EXCHANGE_RATE;
    this.inv_paymentMethodName = MINVOICE_DEFAULTS.PAYMENT_METHOD;

    // Thông tin người mua
    this.inv_buyerDisplayName = exportInvoiceDTO.customer_name;
    this.ma_dt = exportInvoiceDTO.customer_company_tax_code ? "1" : "2"; // 1: Tổ chức, 2: Cá nhân
    this.inv_buyerLegalName = exportInvoiceDTO.customer_company_name;
    this.inv_buyerTaxCode = exportInvoiceDTO.customer_company_tax_code;
    this.inv_buyerAddressLine = exportInvoiceDTO.customer_company_address;
    this.inv_buyerEmail = exportInvoiceDTO.customer_company_email;
    this.buyerIdentityCard = ""; // Tạm thời dùng phone
    this.buyerTel = exportInvoiceDTO.customer_phone;
    this.sobaomat = "";
    this.inv_buyerBankAccount = exportInvoiceDTO.customer_bank_account;
    this.inv_buyerBankName = exportInvoiceDTO.customer_bank_account_name;

    // Thông tin tiền tệ
    this.inv_discountAmount = invoice.discount_amount;
    this.inv_TotalAmountWithoutVat = invoice.amount;
    this.inv_vatAmount = invoice.vat_amount;
    this.inv_TotalAmount = invoice.total_amount;
    this.amount_to_word = ConvertNumberToString.numberToWords(
      invoice.total_amount
    );

    // Các trường theo NQ101 - mặc định không áp dụng
    this.tlptdoanhthu20 = 0;
    this.tgtck20 = 0;
    this.isDeductionNQ43 = false;

    // Các trường bổ sung theo ND70 - để trống hoặc giá trị mặc định
    this.ma_ch = "";
    this.ten_ch = "";
    this.dchicuahang = "";
    this.mdvqhnsach_nmua = "";
    this.so_hchieu = "";
    this.cccdan = "";
    this.socialDeductionAmount = 0;
    this.ratioOrtherTax = 0;
    this.ortherFee = 0;
    this.mdvqhnsach_nban = "";
    this.so_qdinh = "";
    this.ngay_qdinh = "";
    this.cqbhanh_qdinh = "";

    this.details = [
      {
        data: new InvoiceConvertPartnerDetailMInvoiceDTO().mapToList(
          invoiceDetail
        ),
      },
    ];
  }
}
