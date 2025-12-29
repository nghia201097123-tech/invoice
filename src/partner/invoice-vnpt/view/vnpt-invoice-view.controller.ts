import { Controller, Get, Post, Body, Query, Req, Res } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { VnptInvoiceViewService } from "./vnpt-invoice-view.service";

export class GetInvViewFkeyDto {
  fkey: string;
  userName: string;
  userPass: string;
}

@Controller("partner/vnpt/invoice-view")
export class VnptInvoiceViewController {
  constructor(
    private readonly vnptInvoiceViewService: VnptInvoiceViewService
  ) {}

  @Get()
  async showInvoiceView(
    @Query("fkey") fkey?: string,
    @Query("userName") userName?: string,
    @Query("userPass") userPass?: string
  ) {
    // Default values for testing
    const defaultFkey = "889562";
    const defaultUserName = "it2maytinhtien_service";
    const defaultUserPass = "Einv@oi@vn#pt20";

    const data = {
      fkey: fkey || defaultFkey,
      userName: userName || defaultUserName,
      userPass: userPass || defaultUserPass,
      endpoint:
        "https://it2maytinhtien-tt78admindemo.vnpt-invoice.com.vn/PortalService.asmx",
    };

    // Return data for template rendering (NestJS will automatically handle the view)
    return data;
  }

  @Get("get-html")
  async getInvoiceHtml(@Body() body: GetInvViewFkeyDto) {
    try {
      const defaultFkey = "889562";
      const defaultUserName = "it2maytinhtien_service";
      const defaultUserPass = "Einv@oi@vn#pt20";
      const htmlContent = await this.vnptInvoiceViewService.getInvoiceView(
        defaultFkey,
        defaultUserName,
        defaultUserPass
      );

      return {
        success: true,
        html: htmlContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        html: null,
      };
    }
  }
}
