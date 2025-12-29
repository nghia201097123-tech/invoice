import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom, map } from "rxjs";
import { ExceptionResponseDetail } from "../utils.exception.common/utils.exception.common";
import { UtilsParamHttpService } from "./utils.params.http-service.common";
import { Employee } from "src/common/entities/employee.entity";

/**
 *
 */
export class UtilsHttpService {
  url: string;
  params: UtilsParamHttpService;
  employee: Employee;

  /**
   *
   * @param url
   * @param params
   * @param employee
   * @param httpService
   */
  constructor(
    url: string,
    params: any,
    employee: Employee,
    private readonly httpService: HttpService
  ) {
    this.params = params;
    this.url = url;
    this.employee = employee;
  }

  public async get() {
    const responseData = await firstValueFrom(
      this.httpService
        .get(this.url, {
          headers: {
            Authorization: `Bearer ${
              this.employee == null ? "" : this.employee.partner_token
            }`,
            "Content-Type": "application/json",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            if (
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              error.code === "ENOTFOUND"
            ) {
              throw new HttpException(
                new ExceptionResponseDetail(
                  HttpStatus.BAD_REQUEST,
                  "URL xác thực không hợp lệ"
                ),
                HttpStatus.OK
              );
            }
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error.response.data)
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );
    return responseData[0];
  }

  public async post() {
    let responseData = await firstValueFrom(
      this.httpService
        .post(this.url, this.params, {
          headers: {
            Authorization: `Bearer ${
              this.employee == null ? "" : this.employee.partner_token
            }`,
            "Content-Type": "application/json",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            if (
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              error.code === "ENOTFOUND" ||
              error.code === "ERR_BAD_REQUEST"
            ) {
              throw new HttpException(
                new ExceptionResponseDetail(
                  HttpStatus.BAD_REQUEST,
                  "URL xác thực không hợp lệ"
                ),
                HttpStatus.OK
              );
            }
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error)
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );

    return responseData[0];
  }

  public async postLogin() {
    let responseData = await firstValueFrom(
      this.httpService
        .post(this.url, this.params, {
          headers: {
            Authorization: `Bearer ${
              this.employee == null ? "" : this.employee.partner_token
            }`,
            "Content-Type": "application/json",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);

            if (
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              error.code === "ENOTFOUND" ||
              error.code === "ERR_BAD_REQUEST"
            ) {
              throw new HttpException(
                new ExceptionResponseDetail(
                  HttpStatus.BAD_REQUEST,
                  "URL xác thực không hợp lệ"
                ),
                HttpStatus.OK
              );
            }
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error.response.data)
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );
    return responseData[0];
  }

  public async postSoap() {
    let responseData = await firstValueFrom(
      this.httpService
        .post(this.url, this.params, {
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            if (
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              error.code === "ENOTFOUND" ||
              error.code === "ERR_BAD_REQUEST"
            ) {
              throw new HttpException(
                new ExceptionResponseDetail(
                  HttpStatus.BAD_REQUEST,
                  "URL xác thực không hợp lệ"
                ),
                HttpStatus.OK
              );
            }
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error.response.data)
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );
    return responseData[0];
  }

  public async get1() {
    const responseData = await firstValueFrom(
      this.httpService.get(this.url, {
        headers: {
          Authorization: `Bearer ${
            this.employee == null ? "" : this.employee.partner_token
          }`,
          "Content-Type": "application/json",
        },
      })
    );

    return responseData;
  }
}
