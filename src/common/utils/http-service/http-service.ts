import { HttpService } from "@nestjs/axios";

export class HttpServiceBase {
  private static httpService: HttpService = new HttpService();

  private constructor() {}

  public static getHttpServiceInstance(): HttpService {
    return this.httpService;
  }
}
