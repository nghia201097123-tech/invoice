import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { Response } from "express";
import { VersionEnum } from "src/common/enums/version.enum";
import { InvoiceDetailDto } from "../../common/dto/Invoice-detail.dto";
import { InvoiceDetailParamDto } from "../../common/dto/invoice-detail-param.dto";
import { InvoiceDetailChangeStatusDto } from "../../common/dto/invoice-detail.change-status.dto";
import { InvoiceDetailUpdateBase } from "../../common/dto/invoice-update-multi.dto";
import { InvoiceDetailGetListResponse } from "../../common/responses/invoice-detail-total_record.response";
import { InvoiceDetailResponse } from "../../common/responses/invoice-detail.reponse";
import { InvoiceDetailsService } from "./invoice-details.service";
import { SwaggerResponse } from "src/common/utils/utils.swagger.common/utils.swagger.response";
import { Role, Roles } from "src/common/enums/role.enum";
import { ResponseData } from "src/common/utils/utils.response.common/utils.response.common";
import { InvoiceCreateMultiDto } from "src/common/dto/invoice-detail-create-multi.dto";

@ApiExtraModels(InvoiceDetailResponse, InvoiceDetailGetListResponse)
@Controller({
  version: VersionEnum.V3.toString(),
  path: "invoice-details",
})
@ApiBearerAuth()
export class InvoiceDetailsController {
  constructor(private readonly invoiceDetailsService: InvoiceDetailsService) {}

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceDetailResponse),
            },
          },
        },
      ],
    },
  })
  @Post("/create")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async createInvoiceDetail(
    @Res() res: Response,
    @Body() invoiceDetailDto: InvoiceDetailDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();

    let data = await this.invoiceDetailsService.createInvoiceDetail(
      invoiceDetailDto
    );
    response.setData(new InvoiceDetailResponse(data));

    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {},
          },
        },
      ],
    },
  })
  @Post("/create-multi")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async createMultiInVoiceDetail(
    @Res() res: Response,
    @Body() invoiceCreateMultiDto: InvoiceCreateMultiDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();

    let data = await this.invoiceDetailsService.createMultiFood(
      invoiceCreateMultiDto
    );
    response.setData(data);
    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {},
          },
        },
      ],
    },
  })
  @Post("/update-multi")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async updateMultiInVoiceDetail(
    @Res() res: Response,
    @Body() invoiceDetailUpdateBase: InvoiceDetailUpdateBase
  ): Promise<any> {
    let response: ResponseData = new ResponseData();
    let data = await this.invoiceDetailsService.updateMultiFoodInInvoice(
      invoiceDetailUpdateBase
    );
    response.setData(data);
    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceDetailGetListResponse),
            },
          },
        },
      ],
    },
  })
  @Get("")
  @Roles(Role.ACCOUNTING_MANAGER, Role.VIEW_ALL, Role.ACCOUNTANT_ACCESS)
  async getList(
    @Res() res: Response,
    @Query() invoiceDetailParamDto: InvoiceDetailParamDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();

    let data = await this.invoiceDetailsService.getListInvoiceDetailByInvoiceId(
      invoiceDetailParamDto.invoice_id
    );

    response.setData(
      new InvoiceDetailGetListResponse(data.totalRecord, data.list)
    );

    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {},
          },
        },
      ],
    },
  })
  @Post("/update-multi-dashboard")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async updateMultiInDashBoard(
    @Res() res: Response,
    @Body() invoiceDetailUpdateBase: InvoiceDetailUpdateBase
  ): Promise<any> {
    let response: ResponseData = new ResponseData();
    let data =
      await this.invoiceDetailsService.updateMultiFoodInInvoiceInDashBoard(
        invoiceDetailUpdateBase
      );
    response.setData(data);
    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {},
          },
        },
      ],
    },
  })
  @Post("/change-status")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async changeStatusInvoiceDetail(
    @Res() res: Response,
    @Body() invoiceDetailChangeStatusDto: InvoiceDetailChangeStatusDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();
    await this.invoiceDetailsService.changeStatusDetailInvoice(
      invoiceDetailChangeStatusDto.invoice_detail_id
    );

    return res.status(HttpStatus.OK).send(response);
  }
}
