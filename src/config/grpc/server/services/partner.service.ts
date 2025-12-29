import { Controller, HttpStatus, Injectable } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { InvoicesService } from "../../../../version_3/invoices/invoices.service";
import { CheckAccountPartnerRequestDto } from "../dto/check-account-partner.request.dto";
import { CheckAccountPartnerResponseDto } from "../dto/check-account-partner.response.dto";
import { PARTNER_SERVICE_NAME } from "../protos/partner";

@Controller("partner-grpc-server")
export class PartnerGrpcService {
  constructor(private readonly invoicesService: InvoicesService) {}

  @GrpcMethod(PARTNER_SERVICE_NAME, "CheckAccountPartner")
  async checkAccountPartner(
    data: CheckAccountPartnerRequestDto
  ): Promise<CheckAccountPartnerResponseDto> {
    try {
      const result = await this.invoicesService.checkAccountPartner(
        data.type,
        data.username,
        data.password,
        data.endpoint,
        data.usernameAccessService,
        data.passwordAccessService,
        data.taxcode
      );
      return {
        status: HttpStatus.OK,
        message: result.message,
        data: [result.data],
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: null,
      };
    }
  }
}
