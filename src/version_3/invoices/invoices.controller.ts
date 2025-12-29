import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { FastifyReply as Response } from "fastify";
import mongoose from "mongoose";
import { InvoiceUpdateDto } from "../../common/dto/invoice-update.dto";
import { CancelInvoiceDto } from "../../common/dto/invoice.cancel.dto";
import { InvoiceDetailParamDTO } from "../../common/dto/invoice.detail.dto";
import { InvoiceDetailRestaurantParamDto } from "../../common/dto/invoice.detail.restaurant.dto";
import { ExportInvoiceDTO } from "../../common/dto/invoice.export.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { InvoiceResponseMap } from "../../common/responses/invoice.response";
import { InvoiceResponse } from "../../common/responses/invoice.response.Minvoice";
import { InvoiceCountTabResponse } from "../../common/responses/invoice_count_tab_reponse";
import { InvoiceResponseFpt } from "../../common/responses/InvoiceFptResponse";
import { Invoice } from "../../common/schemas/invoice.schema";
import { InvoicesService } from "./invoices.service";

import { Employee } from "src/common/entities/employee.entity";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { Role, Roles } from "src/common/enums/role.enum";
import { VersionEnum } from "src/common/enums/version.enum";
import { InvoiceHandlerException } from "src/common/utils/ultis.hanlder.exception.ts/invoice.handler.exception";
import { GetUser } from "src/common/utils/utils.decorator.common/utils.decorator.common";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { ResponseData } from "src/common/utils/utils.response.common/utils.response.common";
import { SwaggerResponse } from "src/common/utils/utils.swagger.common/utils.swagger.response";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import {
  BulkExportInvoiceDTO,
  BulkExportResponseDTO,
} from "../../common/dto/bulk-export-invoice.dto";
import { CheckMissingOrdersDto } from "../../common/dto/check-missing-orders.dto";
import { FailedInvoicesQueryDto } from "../../common/dto/failed-invoices-query.dto";
import { InvoiceCheckAccountPartner } from "../../common/dto/invoice_check_account.dto";
import { SyncInvoicesDto } from "../../common/dto/sync-invoices.dto";
import { SyncSpecificOrdersDto } from "../../common/dto/sync-specific-orders.dto";
import { CheckMissingOrdersResponse } from "../../common/responses/check-missing-orders.response";
import {
  FailedInvoicesResponseDto,
  FailedInvoicesStatsResponseDto,
} from "../../common/responses/failed-invoices.response";
import { InvoiceOutputResponse } from "../../common/responses/invoice-list-output-response";
import { SyncInvoicesResponse } from "../../common/responses/sync-invoices.response";
import { SyncSpecificOrdersResponse } from "../../common/responses/sync-specific-orders.response";

@ApiExtraModels(
  InvoiceResponse,
  InvoiceResponseMap,
  Invoice,
  InvoiceOutputResponse,
  InvoiceCountTabResponse,
  SyncInvoicesResponse,
  CheckMissingOrdersResponse,
  SyncSpecificOrdersResponse,
  FailedInvoicesResponseDto,
  FailedInvoicesStatsResponseDto
)
@Controller({
  version: VersionEnum.V3.toString(),
  path: "invoices",
})
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private invoiceHelper: InvoiceHelper
  ) {}
  /**
   * Lấy chi tiết phiếu bên phía hệ thống đối tác
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceResponse),
            },
          },
        },
      ],
    },
  })
  @Get(":id/partner")
  @Roles(Role.ACCOUNTING_MANAGER, Role.VIEW_ALL, Role.ACCOUNTANT_ACCESS)
  async detailInPartNer(
    @Res() res: Response,
    @Param(new ValidationPipe()) invoiceDetailParamDTO: InvoiceDetailParamDTO
  ): Promise<any> {
    let response: ResponseData = new ResponseData();

    let dataResult: any = await this.invoicesService.partnerDetail(
      invoiceDetailParamDTO
    );
    let invoice: Invoice = await this.invoiceHelper.findById(
      invoiceDetailParamDTO.id
    );

    let restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity =
      await this.restaurantPartnerInvoiceService.findOneByBranchId(
        invoice.branch_id
      );
    let is_success_status_to_string: string;

    switch (restaurantPartnerInvoiceEntity.partner_electronic_invoice_type) {
      case 1:
        if (dataResult.is_success === null) {
          is_success_status_to_string = "Đã gửi lên chi cục thuế";
        } else if (dataResult.is_success == 0) {
          is_success_status_to_string = "Chi cục thuế chưa duyệt";
        } else {
          is_success_status_to_string = "Chi cục thuế đã duyệt";
        }
        response.setData(
          new InvoiceResponse(dataResult, is_success_status_to_string)
        );
        return res.status(HttpStatus.OK).send(response);

      case 2:
        is_success_status_to_string = "Đã gửi lên chi cục thuế";

        response.setData(
          new InvoiceResponseFpt(dataResult, is_success_status_to_string)
        );
        return res.status(HttpStatus.OK).send(response);
      default:
        return res.status(HttpStatus.OK).send(response);
    }
  }

  /**
   * Hủy hóa đơn bên đối tác
   *
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ResponseData),
            },
          },
        },
      ],
    },
  })
  @Post("/cancel/partner")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async cancelInvoicesPartner(
    @Res() res: Response,
    @Body() cancelInvoiceDto: CancelInvoiceDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();
    response.setData(
      await this.invoicesService.cancelInvoicePartner(cancelInvoiceDto)
    );
    return res.status(HttpStatus.OK).send(response);
  }

  // xuất phiếu kèm chữ ký sang đối tác
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceResponse),
            },
          },
        },
      ],
    },
  })
  @Post("/export/partner")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async exportInvoices(
    @Res() res: Response,
    @Body() exportInvoiceDTO: ExportInvoiceDTO,
    @GetUser() employee: Employee
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(exportInvoiceDTO.id)) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_ID
        ),
        HttpStatus.OK
      );
    }
    let response: ResponseData = new ResponseData();

    response.setData(
      await this.invoicesService.exportInvoice(exportInvoiceDTO, employee)
    );
    return res.status(HttpStatus.OK).send(response);
  }

  /**
   * Xuất nhiều hóa đơn cùng lúc sử dụng Redis Queue
   * @param res
   * @param bulkExportDto
   * @param employee
   * @returns
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(BulkExportResponseDTO),
            },
          },
        },
      ],
    },
  })
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  @Post("/export/partner/bulk")
  async bulkExportInvoices(
    @Res() res: Response,
    @Body() bulkExportDto: BulkExportInvoiceDTO,
    @GetUser() employee: Employee
  ): Promise<any> {
    let response: ResponseData = new ResponseData();

    response.setData(
      await this.invoicesService.bulkExportInvoices(bulkExportDto, employee)
    );
    return res.status(HttpStatus.OK).send(response);
  }

  /**
   * chỉnh sửa phiếu phía bên dashboard
   * @param res
   * @param invoiceUpdateDto
   * @returns
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(Invoice),
            },
          },
        },
      ],
    },
  })
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  @Post("/update")
  async updateInvoices(
    @Res() res: Response,
    @Body() invoiceUpdateDto: InvoiceUpdateDto
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(invoiceUpdateDto.id)) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_ID
        ),
        HttpStatus.OK
      );
    }
    let response: ResponseData = new ResponseData();
    response.setData(this.invoicesService.updateInvoices(invoiceUpdateDto));
    return res.status(HttpStatus.OK).send(response);
  }

  /**
   * xem phiếu bên nhà hàng(phiếu chưa được xuất đi)
   * @param res
   * @param invoiceDetailRestaurantParamDto
   * @returns
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceResponseMap),
            },
          },
        },
      ],
    },
  })
  @Get("/detail/:id")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS, Role.VIEW_ALL)
  async getDetaiInvoiceInlDashBoard(
    @Res() res: Response,
    @Param(new ValidationPipe())
    invoiceDetailRestaurantParamDto: InvoiceDetailRestaurantParamDto
  ): Promise<any> {
    let response: ResponseData = new ResponseData();
    if (!mongoose.Types.ObjectId.isValid(invoiceDetailRestaurantParamDto.id)) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          InvoiceHandlerException.INVALID_ID
        ),
        HttpStatus.OK
      );
    }
    let data = await this.invoiceHelper.findById(
      invoiceDetailRestaurantParamDto.id
    );
    if (data == null) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Không tồn tại hoá đơn điện tử có _id ${invoiceDetailRestaurantParamDto.id}`
        ),
        HttpStatus.OK
      );
    }
    response.setData(new InvoiceResponseMap(data));

    return res.status(HttpStatus.OK).send(response);
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceOutputResponse),
            },
          },
        },
      ],
    },
  })
  @Get("")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS, Role.VIEW_ALL)
  async getList(
    @Res() res: Response,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: Employee
  ): Promise<any> {
    const {
      apply_order_type,
      page,
      limit,
      branch_id,
      key_search: searchKeyword,
      ...filterParams
    } = paginationDto;

    const cleanedParams = this.processFilterParams(filterParams);

    const dateRange = this.setDefaultDateRange(cleanedParams);
    // Get paginated list and total amounts in parallel
    const [dataResult, totals] = await Promise.all([
      this.invoicesService.getList(
        [dateRange],
        limit,
        page,
        searchKeyword,
        branch_id,
        dateRange.from,
        dateRange.to,
        apply_order_type
      ),
      this.invoicesService.getTotalAmounts(
        [dateRange],
        searchKeyword,
        branch_id,
        apply_order_type,
        paginationDto.from,
        paginationDto.to,
      ),
    ]);

    const response = new ResponseData();

    if (!dataResult.list.length) {
      response.setData(
        new InvoiceOutputResponse(
          { limit: 0, total_record: 0, list: [] },
          totals.totalAmount,
          totals.totalVatAmount,
          totals.totalDiscountAmount,
          totals.totalPaymentAmount
        )
      );
      return res.status(HttpStatus.OK).send(response);
    }

    response.setData(
      new InvoiceOutputResponse(
        dataResult,
        totals.totalAmount,
        totals.totalVatAmount,
        totals.totalDiscountAmount,
        totals.totalPaymentAmount
      )
    );

    return res.status(HttpStatus.OK).send(response);
  }

  private processFilterParams(params: any): any {
    const cleanedParams = { ...params };

    // Remove empty or invalid values
    Object.keys(cleanedParams).forEach((key) => {
      const value = cleanedParams[key];

      if (value <= -1 || (typeof value === "string" && value.length === 0)) {
        delete cleanedParams[key];
      }
    });

    // Convert string numbers to integers
    const numericFields = ["cct_duyet", "branch_id", "invoice_status"];
    numericFields.forEach((field) => {
      if (
        typeof cleanedParams[field] === "string" &&
        !isNaN(Number(cleanedParams[field]))
      ) {
        cleanedParams[field] = parseInt(cleanedParams[field]);
      }
    });

    return cleanedParams;
  }

  private setDefaultDateRange(params: any): any {
    const today = new Date().toDateString();
    return {
      ...params,
      from: params.from ?? today,
      to: params.to ?? today,
    };
  }

  private calculateInvoiceTotals(invoiceList: any[]): {
    totalAmount: number;
    totalVatAmount: number;
    totalDiscountAmount: number;
    totalPaymentAmount: number;
  } {
    const totals = invoiceList.reduce(
      (acc, invoice) => {
        acc.totalAmount += invoice.amount || 0;
        acc.totalVatAmount += invoice.vat_amount || 0;
        acc.totalDiscountAmount +=
          invoice.discount_amount || invoice.total_amount_discount_amount || 0;
        acc.extraChargeAmount += invoice.extra_charge_amount || 0;
        acc.totalAmountExtraChargeAmount +=
          invoice.total_amount_extra_charge_amount || 0;
        return acc;
      },
      {
        totalAmount: 0,
        totalVatAmount: 0,
        totalDiscountAmount: 0,
        extraChargeAmount: 0,
        totalAmountExtraChargeAmount: 0,
      }
    );

    const totalPaymentAmount =
      totals.totalAmount +
      totals.totalVatAmount -
      totals.totalDiscountAmount +
      totals.extraChargeAmount +
      totals.totalAmountExtraChargeAmount;

    return {
      totalAmount: totals.totalAmount,
      totalVatAmount: totals.totalVatAmount,
      totalDiscountAmount: totals.totalDiscountAmount,
      totalPaymentAmount,
    };
  }

  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InvoiceCountTabResponse),
            },
          },
        },
      ],
    },
  })
  @Get("/count-tab")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS, Role.VIEW_ALL)
  async count(
    @Res() res: Response,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: Employee
  ): Promise<any> {
    try {
      // Clean and prepare query parameters
      const cleanedDto = this.cleanPaginationDto(paginationDto);
      const searchKeyword = paginationDto.key_search;

      // Get count data from service
      const dataResult = await this.invoicesService.countTab(
        [cleanedDto],
        searchKeyword,
        user.restaurant_id,
        paginationDto.from,
        paginationDto.to,
        paginationDto.apply_order_type
      );

      // Prepare response
      const response = new ResponseData();
      const countTabData = this.prepareCountTabResponse(dataResult);

      response.setData(countTabData);
      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean and prepare pagination DTO by removing invalid values and converting types
   */
  private cleanPaginationDto(paginationDto: PaginationDto): PaginationDto {
    const cleanedDto = { ...paginationDto };

    // Remove invalid properties
    Object.keys(cleanedDto).forEach((property) => {
      const value = cleanedDto[property];

      // Remove negative values
      if (typeof value === "number" && value <= -1) {
        delete cleanedDto[property];
      }

      // Remove empty strings
      if (typeof value === "string" && value.length === 0) {
        delete cleanedDto[property];
      }
    });

    // Convert string numbers to integers
    this.convertStringToNumber(cleanedDto, "branch_id");
    this.convertStringToNumber(cleanedDto, "cct_duyet");

    return cleanedDto;
  }

  /**
   * Convert string property to number if valid
   */
  private convertStringToNumber(dto: any, property: string): void {
    if (typeof dto[property] === "string" && !isNaN(+dto[property])) {
      dto[property] = parseInt(dto[property]);
    }
  }

  /**
   * Prepare count tab response with default values if empty
   */
  private prepareCountTabResponse(dataResult: any): InvoiceCountTabResponse {
    const defaultCountData = {
      waiting_export: 0,
      waiting_browse: 0,
      exported: 0,
      canceled: 0,
      have_update_in_partner: 0,
    };

    // Return default values if no data or empty result
    if (!dataResult || Object.keys(dataResult).length === 0) {
      return new InvoiceCountTabResponse(defaultCountData);
    }

    return new InvoiceCountTabResponse(dataResult);
  }

  @Post("/check-account-partner")
  @Roles(Role.ACCOUNTING_MANAGER, Role.SETTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async checkAccoountPartner(
    @Body() invoiceCheckAccountPartner: InvoiceCheckAccountPartner,
    @Res() res: Response
  ): Promise<any> {
    let dataResult = await this.invoicesService.checkAccountPartner(
      invoiceCheckAccountPartner.type,
      invoiceCheckAccountPartner.username,
      invoiceCheckAccountPartner.password,
      invoiceCheckAccountPartner.endpoint,
      invoiceCheckAccountPartner.usernameAccessService,
      invoiceCheckAccountPartner.passwordAccessService,
      invoiceCheckAccountPartner.taxcode
    );

    return res.status(HttpStatus.OK).send(dataResult);
  }

  /**
   * Đồng bộ hóa đơn chưa xuất qua Kafka
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(SyncInvoicesResponse),
            },
          },
        },
      ],
    },
  })
  @Post("/sync-invoices")
  // @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async syncInvoices(
    @Body(new ValidationPipe()) syncInvoicesDto: SyncInvoicesDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const totalInvoicesSent = await this.invoicesService.syncInvoices(
        syncInvoicesDto
      );

      const response = new ResponseData();
      response.setData(new SyncInvoicesResponse(totalInvoicesSent));

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kiểm tra những order_id bị thiếu trong quá trình sync
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CheckMissingOrdersResponse),
            },
          },
        },
      ],
    },
  })
  @Post("/check-missing-orders")
  async checkMissingOrders(
    @Body(new ValidationPipe()) checkMissingOrdersDto: CheckMissingOrdersDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const missingOrderIds = await this.invoicesService.checkMissingOrders(
        checkMissingOrdersDto
      );

      const response = new ResponseData();
      response.setData(new CheckMissingOrdersResponse(missingOrderIds));

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đồng bộ những order_id cụ thể qua Kafka
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(SyncSpecificOrdersResponse),
            },
          },
        },
      ],
    },
  })
  @Post("/sync-specific-orders")
  // @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS)
  async syncSpecificOrders(
    @Body(new ValidationPipe()) syncSpecificOrdersDto: SyncSpecificOrdersDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const result = await this.invoicesService.syncSpecificOrders(
        syncSpecificOrdersDto
      );

      const response = new ResponseData();
      response.setData(result);

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * API lấy danh sách hóa đơn lỗi
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(FailedInvoicesResponseDto),
            },
          },
        },
      ],
    },
  })
  @Get("/failed-invoices")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS, Role.VIEW_ALL)
  async getFailedInvoices(
    @Query(new ValidationPipe()) queryDto: FailedInvoicesQueryDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const result = await this.invoicesService.getFailedInvoices(queryDto);

      const response = new ResponseData();
      response.setData(result);

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * API lấy thống kê hóa đơn lỗi
   */
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(SwaggerResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(FailedInvoicesStatsResponseDto),
            },
          },
        },
      ],
    },
  })
  @Get("/failed-invoices/stats")
  @Roles(Role.ACCOUNTING_MANAGER, Role.ACCOUNTANT_ACCESS, Role.VIEW_ALL)
  async getFailedInvoicesStats(@Res() res: Response): Promise<any> {
    try {
      const result = await this.invoicesService.getFailedInvoicesStats();

      const response = new ResponseData();
      response.setData(result);

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw error;
    }
  }
}
