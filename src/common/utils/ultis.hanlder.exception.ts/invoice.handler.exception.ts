export class InvoiceHandlerException {
  public static INVALID_ID: string = "Id bạn truyền vào không đúng";
  public static E_INVOICE_NOT_SEND_YET_TO_PARTNER: string =
    "Hóa đơn này chưa được xuất qua đối tác nên không thể xem được phiếu bên đối tác";
  public static BRANCH_HAS_NO_PARTNER: string =
    "Chi nhánh này hiện chưa có đối tác";
  public static E_INVOICE_HAS_SEND_TO_PARTNER: string =
    "Hóa đơn này đã được gửi sang đối tác";
  public static FOOD_VAT_NOT_GREATER_THAN_TEN_PERCENT: string =
    "Thuế xuất của nguyên liệu không thể lớn hơn 10%";
  public static FOOD_VAT_MUST_BE_IN_VALUE: string =
    "Thuế xuất của nguyên liệu phải thuộc một trong các giá trị sau (0,5,8,10)%";
  public static FOOD_VAT_MUST_BE_IN_VALUE_MISA: string =
    "Thuế xuất của nguyên liệu phải thuộc một trong các giá trị sau (0,5,8,10)%";
  public static INVALID_ID_INPUT: string =
    "Bạn chưa truyền Id hóa đơn để biết cập nhật cho hóa đơn nào";
  public static INVOICE_NOT_EXIST: string = "Không tìm thấy hóa đơn này";
  public static PARTNER_WAS_TURN_OFF: string =
    "Bạn đã tắt đối tác này.Vui lòng thiết lập đối tác này vào chi nhánh của bạn để tiếp tục thao tác!";
  public static INVALID_INPUT_ID: string =
    "Bạn cần truyền id Hóa Đơn để biết thêm chi tiết cho Hóa Đơn nào";
  public static INVOICE_DETAIL_NOT_EMPTY: string =
    "Chi tiết của hóa đơn không thể rỗng";
  public static INVOICE_CAN_NOT_UPDATE: string =
    "Phiếu chưa xuất đi nên không thể chỉnh sửa";
  public static INVOICE_HAS_SEND_TO_TAX_AUTHORITIES: string =
    "Hóa đơn đã được gửi lên cơ quan thuế , bạn không thể chỉnh sửa";

  public static TAX_AUTHORITIES_WAS_ACCEPTED_INVOICE: string =
    "Chi cục thuế đã duyệt.Sau 3h sáng sẽ được chuyển qua mục được duyệt";

  public static INVOICE_HAS_BEEN_UPDATED: string =
    "Hóa đơn này đã được chỉnh sửa";

  /**
   *
   * ==========================================================
   *
   */
  public static ID_NOT_EXIST(id: string): string {
    return `Không tồn tại hoá đơn điện tử có _id ${id}`;
  }

  public static INVOICE_NOT_EXIST_ID(id: string): string {
    return `Không tìm thấy hóa đơn có id là ${id}`;
  }
}
