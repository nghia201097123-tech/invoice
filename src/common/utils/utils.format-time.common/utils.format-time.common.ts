import * as moment from "moment";

export class UtilsDate {
  static formatDateTimeVNToString(date: Date): string {
    return moment(date).format("DD/MM/YYYY h:mm");
  }

  static parseFromDateString(dateString: string) {
    const [day, month, year] = dateString.split("/");
    const parsedDate = new Date(`${year}-${month}-${day}`);
    return parsedDate;
  }

  static parseToDateString(dateString: string) {
    const [day, month, year] = dateString.split("/");
    const parsedDate = new Date(`${year}-${month}-${day}T23:59:59.000Z`);
    return parsedDate;
  }

  static splitTimeGetDate(dateString: string) {
    return dateString.split(" ")[0];
  }

  static formatDateTimeVNToStringV1(date: Date): string {
    return moment(date).format("DD-MM-YYYY hh:mm:ss");
  }

  static formatDateTimeInvoice(date: Date): string {
    return moment(date).format("YYYY-MM-DD");
  }

  static formatFullDateTimeInvoice(date: Date): string {
    const vietnamOffset = 7;
    const vietnamTime = moment.utc(date).utcOffset(vietnamOffset);
    return vietnamTime.format("YYYY-MM-DD HH:mm:ss");
  }

  static formatDateTimeVNToStringNoTime(date: Date): string {
    return moment(date).format("DD/MM/YYYY");
  }

  static formatDateTimeVN(date: Date): string {
    return moment(date).format("DD-MM-YYYY");
  }

  static formatDateVNToString(date: Date): string {
    return moment(date).format("DD/MM/YYYY");
  }

  static formatDateInsertDatabase(date: string): string {
    if (date == null || date == "") {
      return "";
    } else {
      return moment(date, "DD/MM/YYYY").format("YYYY-MM-DD");
    }
  }

  static formatStringDateToDate(date: string): Date {
    return new Date(this.formatDateInsertDatabase(date));
  }

  static convertDateFormat(inputDate: string): string {
    const dateParts = inputDate.split(/[-\/]/); // Tách chuỗi ngày tháng theo dấu "-" hoặc "/"
    const year = dateParts[2];
    const month = dateParts[1].length === 1 ? "0" + dateParts[1] : dateParts[1];
    const day = dateParts[0].length === 1 ? "0" + dateParts[0] : dateParts[0];
    return `${year}-${month}-${day}`;
  }

  static formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${remainingSeconds}`;
  }

  static convertDateFormatHaveTimeStamp(inputDate: Date): string {
    const year = inputDate.getFullYear();
    const month = (inputDate.getMonth() + 1).toString().padStart(2, "0");
    const day = inputDate.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Add hours, minutes, and seconds
    const hours = inputDate.getHours().toString().padStart(2, "0");
    const minutes = inputDate.getMinutes().toString().padStart(2, "0");
    const seconds = inputDate.getSeconds().toString().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return `${formattedDate} ${formattedTime}`;
  }

  getCurrentDate(): string {
    return moment().format("YYYY-MM-DD");
  }
}
