import { ValidationOptions, registerDecorator } from "class-validator";
import * as moment from "moment-timezone";

export function IsTimeFormat(
  timeFormat: moment.MomentFormatSpecification,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isTimeDMY",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return moment(value, timeFormat, true).isValid();
        },
        defaultMessage() {
          return `Thời gian không đúng định dạng ${timeFormat}`;
        },
      },
    });
  };
}

export function IsTimeGreaterThan(
  minutes: number,
  timeFormat: moment.MomentFormatSpecification,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isTimeGreaterThan",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          const inputTime = moment(value, timeFormat);

          return inputTime.isAfter(
            moment().tz("Asia/Ho_Chi_Minh").add(minutes, "minutes")
          );
        },
        defaultMessage() {
          return `Thời gian truyền vào phải lớn hơn thời gian hiện tại ít nhất ${minutes} phút`;
        },
      },
    });
  };
}
