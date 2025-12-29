import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus } from "@nestjs/common";
import { AxiosError, AxiosHeaders, RawAxiosRequestHeaders } from "axios";
import { catchError, firstValueFrom, map } from "rxjs";
import { UtilsParamHttpService } from "../../http-service/utils.params.http-service.common";
import { ExceptionResponseDetail } from "../../utils.exception.common/utils.exception.common";

/**
 *
 */
export class UtilsHttpServiceCustom {
  url: string;
  params: UtilsParamHttpService;
  tokenPartner: string;

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
    tokenPartner: string,
    private readonly httpService: HttpService
  ) {
    this.params = params;
    this.url = url;
    this.tokenPartner = tokenPartner;
  }

  public async get() {
    const responseData = await firstValueFrom(
      this.httpService
        .get(this.url, {
          headers: {
            Authorization: `Bearer ${this.tokenPartner} `,
            "Content-Type": "application/json",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error.response.data)
              ),
              HttpStatus.OK
            );
          })
        )
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
            console.log(error);

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
            Authorization: `Bearer ${this.tokenPartner}`,
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

  public async postWithHeader(headers: RawAxiosRequestHeaders | AxiosHeaders) {
    let responseData = await firstValueFrom(
      this.httpService
        .post(this.url, this.params, {
          headers: headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);

            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                error.response.data["error"] ||
                  error.response.data["data"] ||
                  error.response.data["message"]
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );

    return responseData[0];
  }

  public async getWithHeader(headers: RawAxiosRequestHeaders | AxiosHeaders) {
    let responseData = await firstValueFrom(
      this.httpService
        .get(this.url, {
          headers: headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                error.response.data["error"]
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );

    return responseData[0];
  }

  public async getWithHeader1(headers: RawAxiosRequestHeaders | AxiosHeaders) {
    let responseData = await firstValueFrom(
      this.httpService
        .get(this.url, {
          headers: headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                error.response.data["error"]
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => response))
    );

    return responseData;
  }

  public async delete(headers: RawAxiosRequestHeaders | AxiosHeaders) {
    let responseData = await firstValueFrom(
      this.httpService
        .delete(this.url, {
          headers: headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                error.response.data["error"]
              ),
              HttpStatus.OK
            );
          })
        )
        .pipe(map((response) => [response.data]))
    );
    return responseData[0];
  }
}
