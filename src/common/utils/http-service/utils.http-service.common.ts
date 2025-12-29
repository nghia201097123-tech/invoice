import { UtilsParamHttpService } from "./utils.params.http-service.common";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { catchError, firstValueFrom, map } from "rxjs";
import { ExceptionResponseDetail } from "../utils.exception.common/utils.exception.common";
import { HttpException, HttpStatus } from "@nestjs/common";
import fetch from "node-fetch";

export class UtilsHttpService {
  url: string;
  params: UtilsParamHttpService;
  token: any;

  /**
   *
   * @param url
   * @param params
   * @param token
   * @param httpService
   */
  constructor(
    url: string,
    params: any,
    token: any,
    private readonly httpService: HttpService
  ) {
    this.params = params;
    this.url = url;
    this.token = token;
  }

  public async get() {
    const responseData = await firstValueFrom(
      this.httpService
        .get(this.url, {
          headers: {
            Authorization: `Bearer ${this.token == null ? "" : this.token}`,
            "Content-Type": "application/json",
            Method: "0",
            ProjectId: "8001",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              new ExceptionResponseDetail(
                HttpStatus.BAD_REQUEST,
                JSON.stringify(error)
              ),
              HttpStatus.OK
            );
          })
        )
    );

    return responseData;
  }

  public async post() {
    let responseData = await firstValueFrom(
      this.httpService
        .post(this.url, this.params, {
          headers: {
            Authorization: `Bearer ${this.token == null ? "" : this.token}`,
            "Content-Type": "application/json",
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
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
    );

    return responseData;
  }

  public async postLogin() {
    let responseData = await firstValueFrom(
      this.httpService.post(this.url, this.params, {
        headers: {
          Authorization: `Bearer ${
            this.token == null ? "" : this.token.partner_token
          }`,
          "Content-Type": "application/json",
        },
      })
    );
    return responseData[0];
  }

  public async postSoap() {
    let responseData = await firstValueFrom(
      this.httpService.post(this.url, this.params, {
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
      })
    );
    return responseData;
  }

  public async fetch(method: string) {
    const responseData = fetch(this.url, {
      method: method,
      body: JSON.stringify(this.params),
      headers: {
        Authorization: `Bearer ${this.token == null ? "" : this.token}`,
        "Content-Type": "application/json",
      },
    });

    return responseData;
  }
}
