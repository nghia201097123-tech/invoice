export class ConvertNumberToString {
  static numberToWords(number: number): string {
    const ones: string[] = [
      "",
      "Một",
      "Hai",
      "Ba",
      "Bốn",
      "Năm",
      "Sáu",
      "Bảy",
      "Tám",
      "Chín",
    ];

    if (number === 0) {
      return "Không";
    }

    // Xử lý số âm
    if (number < 0) {
      return "Âm " + this.numberToWords(-number).toLowerCase();
    }

    // Làm tròn số thập phân
    number = Math.floor(number);

    let result = "";
    let billions = Math.floor(number / 1000000000);
    let millions = Math.floor((number % 1000000000) / 1000000);
    let thousands = Math.floor((number % 1000000) / 1000);
    let units = number % 1000;

    if (billions > 0) {
      result += this.convertThreeDigits(billions) + " tỷ";
      if (millions > 0 || thousands > 0 || units > 0) {
        result += " ";
      }
    }

    if (millions > 0) {
      result += this.convertThreeDigits(millions) + " triệu";
      if (thousands > 0 || units > 0) {
        result += " ";
      }
    }

    if (thousands > 0) {
      result += this.convertThreeDigits(thousands) + " nghìn";
      if (units > 0) {
        result += " ";
      }
    }

    if (units > 0) {
      result += this.convertThreeDigits(units);
    }

    // Viết hoa chữ cái đầu tiên, các chữ còn lại viết thường
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }

  private static convertThreeDigits(num: number): string {
    const ones: string[] = [
      "",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];

    let result = "";
    let hundreds = Math.floor(num / 100);
    let tens = Math.floor((num % 100) / 10);
    let units = num % 10;

    // Xử lý hàng trăm
    if (hundreds > 0) {
      result += ones[hundreds] + " trăm";
      if (tens > 0 || units > 0) {
        result += " ";
      }
    }

    // Xử lý hàng chục và đơn vị
    if (tens > 1) {
      // Từ 20 trở lên
      result += ones[tens] + " mươi";
      if (units > 0) {
        if (units === 1) {
          result += " một"; // 21, 31, 41... -> hai mươi một
        } else if (units === 5 && tens > 1) {
          result += " lăm"; // 25, 35, 45... -> hai mươi lăm
        } else {
          result += " " + ones[units];
        }
      }
    } else if (tens === 1) {
      // Từ 10-19
      if (units === 0) {
        result += "mười";
      } else if (units === 5) {
        result += "mười lăm";
      } else {
        result += "mười " + ones[units];
      }
    } else if (tens === 0 && units > 0) {
      // Chỉ có đơn vị (1-9)
      if (hundreds > 0) {
        result += "lẻ " + ones[units]; // 101, 201... -> một trăm lẻ một
      } else {
        result += ones[units]; // 1, 2, 3...
      }
    }

    return result;
  }

  static numberToSeq(aun: number) {
    return aun.toString().padStart(8, "0");
  }
}
