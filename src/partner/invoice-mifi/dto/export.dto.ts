import { ExportInvoiceDTO } from "../../../common/dto/invoice.export.dto";
import { Invoice } from "../../../common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { InvoiceDetailConvertPartNerMifi } from "./map_detail";
import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";

export class InvoiceConvertPartNerMiFiDto {
  ApiUserName: string; //username login api (string) (bắt buộc)
  ApiPassword: string; //password login api (string) (bắt buộc)
  ApiInvPattern: string; //Mẫu số của hóa đơn (string) (bắt buộc)
  ApiInvSerial: string; // Ký hiệu của hóa đơn (string) (bắt buộc)
  fkey: string; //mã số tra cứu hóa đơn (string) (nên gọi từ api số 3 GetFkey để lấy fkey)
  MaKH: string; // mã số khách hang (string)
  Buyer: string; //Tên người mua (string) (vd: Cty TNHH AAA)
  CusName: string; //Tên khách hàng (string) (vd: Nguyễn Văn A)
  CusEmail: string; //email của khách hàng (string) (Max-Lengh = 150)
  CusEmailCC: string; // email của khách hàng (string) (Max-Lengh = 150
  CusAddress: string; // địa chỉ khách hàng (string)
  CusPhone: string; //Số điện thoại khách hàng (string)
  CusTaxCode: string; // Mã số thuế khách hàng (string)
  CusBankName: string; // tên ngân hàng (string)
  PaymentMethod: string; //  Hình thức thanh toán (string) (bắt buộc)
  CusBankNo: string; // Số tài khoản (string)
  ArisingDate: string; //Ngày ký hóa đơn (String -> dd/MM/yyyy) (bắt buộc)
  Total: number; //  Tổng tiền đơn hàng chưa có thuế
  DiscountAmount: number; //: Tổng tiền chiết khấu (double)
  VATAmount: number; //Tổng tiền thuế đơn hang (double) (bắt buộc)
  Amount: number; //Tổng tiền đơn hang đã tính thuế (double) (bắt buộc)
  AmountInWords: string; //Số tiền viết bằng chữ (string) (bắt buộc)
  Note: string; //ghi chú
  SO: string; //số bill / số đơn hang (string)
  Extra1: string; // ghi chú khác (string)
  InvType: number; // Loại hóa đơn (int) (1: Hóa đơn trả hàng)
  DonViTienTe: string; // Đơn vị tiền tệ (704: Việt Nam Đồng, 124: Dollar Canadar, 840: Dollar Mỹ, 392: Yên Nhật, ….)
  TyGia: number; //Tỷ giá ngoại tệ (double)
  CMND: string; //số CMND/CCCD/Hộ chiếu (string) (áp dụng loại hóa đơn chứng từ thuế thu nhập cá nhân)
  Option: string; //option: Cấu trúc json (string) : Chứng từ thuế thu nhập cá nhân
  Products: InvoiceDetailConvertPartNerMifi[];

  constructor(
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    exportInvoiceDTO?: ExportInvoiceDTO,
    invoiceDetail?: InvoiceDetail[],
    invoice?: Invoice,
    fkey?: string
  ) {
    this.ApiUserName = restaurantPartnerInvoiceEntity.username;
    this.ApiPassword = restaurantPartnerInvoiceEntity.password;
    this.ApiInvPattern = "1";
    this.ApiInvSerial = restaurantPartnerInvoiceEntity.invoice_series;
    this.fkey = fkey;
    this.MaKH = "";
    this.Buyer = exportInvoiceDTO.customer_company_name;
    this.CusName = exportInvoiceDTO.customer_name;
    this.CusEmail = exportInvoiceDTO.customer_company_email;
    this.CusEmailCC = exportInvoiceDTO.customer_company_email;
    this.CusAddress = exportInvoiceDTO.customer_company_address;
    this.CusPhone = exportInvoiceDTO.customer_phone;
    this.CusTaxCode = exportInvoiceDTO.customer_company_tax_code;
    this.CusBankName = exportInvoiceDTO.customer_bank_account_name;
    this.PaymentMethod = "TM";
    this.CusBankNo = exportInvoiceDTO.customer_bank_account;
    this.ArisingDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    this.Total = invoice.amount;
    this.DiscountAmount = invoice.discount_amount;
    this.VATAmount = invoice.vat_amount;
    this.Amount = invoice.total_amount;
    this.AmountInWords = ConvertNumberToString.numberToWords(
      invoice ? Math.floor(invoice.total_amount) : 0
    );
    this.Note = "";
    this.SO = invoice.order_parent_id.toString();
    this.Extra1 = "";
    this.InvType = 1;
    this.DonViTienTe = "VN";
    this.TyGia = 1;
    this.CMND = "";
    this.Option = "{}";
    this.Products = InvoiceDetailConvertPartNerMifi.mapToList(invoiceDetail);
  }
}
