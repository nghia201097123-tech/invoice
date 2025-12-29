import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { ResponseData } from "src/common/utils/utils.response.common/utils.response.common";

@Controller("/public/health-check")
export class HealthCheckController {
  @Get("")
  public healthCheck(@Res() res: Response) {
    let response: ResponseData = new ResponseData();

    response.setData({
      ["build_number"]: process.env.CONFIG_BUILD_NUMBER,
      ["build_time"]: process.env.CONFIG_BUILD_TIME,
    });

    return res.status(HttpStatus.OK).send(response);
  }
}
