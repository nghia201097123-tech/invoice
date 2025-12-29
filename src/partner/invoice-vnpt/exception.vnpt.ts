import { HttpException, HttpStatus } from "@nestjs/common";
import { ExceptionType } from "../../common/enums/exception-type.enum";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";

export class ExceptionVnpt {
  public static throwExceptionVnpt(error: string, type: number) {
    if (type === ExceptionType.PUBLISHSERVCICE) {
      switch (error) {
        case "ERR:1":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Tài khoản đăng nhập sai hoặc không có quyền thêm mới hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:2":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern hoặc serial truyền vào rỗng"
            ),
            HttpStatus.OK
          );

        case "ERR:3":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Dữ liệu xml đầu vào không đúng quy định"
            ),
            HttpStatus.OK
          );

        case "ERR:4":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không lấy được thông tin công ty (currentCompany null)"
            ),
            HttpStatus.OK
          );

        case "ERR:5":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không phát hành được hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:6":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không đủ số lượng hóa đơn cho lô thêm mới"
            ),
            HttpStatus.OK
          );

        case "ERR:7":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "User name không phù hợp, không tìm thấy user."
            ),
            HttpStatus.OK
          );

        case "ERR:10":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Lô có số hóa đơn vượt quá max cho phép"
            ),
            HttpStatus.OK
          );

        case "ERR:11":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern hoặc serial không đúng định dạng"
            ),
            HttpStatus.OK
          );

        case "ERR:13":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Danh sách hóa đơn tồn tại hóa đơn trùng Fkey"
            ),
            HttpStatus.OK
          );
        case "ERR:15":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Ngày lập truyền vào lớn hơn ngày hiện tại hoặc XML không đúng định "
            ),
            HttpStatus.OK
          );
        case "ERR:20":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern và serial không phù hợp, hoặc không tồn tại hóa đơn đã đăng ký có sử dụng Pattern và Serial truyền vào"
            ),
            HttpStatus.OK
          );

        case "ERR:21":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Trùng số hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:22":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Thông tin người bán vượt maxlength"
            ),
            HttpStatus.OK
          );

        case "ERR:23":
          throw new HttpException(
            new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, "Mã CQT rỗng"),
            HttpStatus.OK
          );

        case "ERR:30":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Danh sách hóa đơn tồn tại ngày hóa đơn nhỏ hơn ngày hóa đơn đã phát hành"
            ),
            HttpStatus.OK
          );
        default:
          break;
      }
    } else if (type === ExceptionType.BUSINESSSERVICE) {
      switch (error) {
        case "ERR:1":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Tài khoản đăng nhập sai hoặc không có quyền ServiceRole"
            ),
            HttpStatus.OK
          );

        case "ERR:2":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern hoặc serial truyền vào rỗng"
            ),
            HttpStatus.OK
          );

        case "ERR:3":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Dữ liệu xml đầu vào không đúng quy định"
            ),
            HttpStatus.OK
          );

        case "ERR:4":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không tìm thấy công ty hoặc tài khoản không tồn tại"
            ),
            HttpStatus.OK
          );

        case "ERR:5":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không phát hành được hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:6":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Hết số hóa đơn trong dải"
            ),
            HttpStatus.OK
          );

        case "ERR:7":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "User name không phù hợp, không tìm thấy user."
            ),
            HttpStatus.OK
          );

        case "ERR:10":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Lô có số hóa đơn vượt quá max cho phép"
            ),
            HttpStatus.OK
          );

        case "ERR:11":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern hoặc serial không đúng định dạng"
            ),
            HttpStatus.OK
          );

        case "ERR:13":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Danh sách hóa đơn tồn tại hóa đơn trùng Fkey"
            ),
            HttpStatus.OK
          );

        case "ERR:14":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Lỗi trong quá trình thực hiện cấp số hóa đơn"
            ),
            HttpStatus.OK
          );
        case "ERR:15":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Lỗi khi thực hiện Deserialize chuỗi hóa đơn đầu vào (ngày hóa đơn > ngày hiện tại, hóa đơn ngoại tệ không truyền tỷ giá)"
            ),
            HttpStatus.OK
          );
        case "ERR:16":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Không tồn tại hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:17":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Ngày hóa đơn điều chỉnh < ngày hóa đơn bị điều chỉnh"
            ),
            HttpStatus.OK
          );

        case "ERR:19":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Pattern truyền vào không giống với pattern của hóa đơn cần điều chỉnh"
            ),
            HttpStatus.OK
          );

        case "ERR:20":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Dải hóa đơn hết, User/Account không có quyền với Serial/Pattern và serial không phù hợp"
            ),
            HttpStatus.OK
          );

        case "ERR:21":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Trùng số hóa đơn"
            ),
            HttpStatus.OK
          );

        case "ERR:22":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Thông tin người bán vượt maxlength"
            ),
            HttpStatus.OK
          );

        case "ERR:23":
          throw new HttpException(
            new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, "Mã CQT rỗng"),
            HttpStatus.OK
          );

        case "ERR:30":
          throw new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Danh sách hóa đơn tồn tại ngày hóa đơn nhỏ hơn ngày hóa đơn đã phát hành"
            ),
            HttpStatus.OK
          );
        default:
          break;
      }
    }
  }
}
