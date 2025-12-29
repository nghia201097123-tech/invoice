import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";

@Injectable()
export class VnptInvoiceViewService {
  private readonly soapEndpoint =
    "https://it2maytinhtien-tt78admindemo.vnpt-invoice.com.vn/PortalService.asmx";

  constructor(private readonly httpService: HttpService) {}

  async getInvoiceView(
    fkey: string,
    userName: string,
    userPass: string
  ): Promise<string> {
    const soapRequest = this.buildSoapRequest(fkey, userName, userPass);

    try {
      const response: AxiosResponse<string> =
        await this.httpService.axiosRef.post(this.soapEndpoint, soapRequest, {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "http://tempuri.org/getInvViewFkey",
          },
          timeout: 30000,
        });

      return this.extractHtmlFromSoapResponse(response.data);
    } catch (error) {
      if (error.response) {
        throw new Error(
          `SOAP request failed: ${error.response.status} - ${error.response.data}`
        );
      } else if (error.request) {
        throw new Error("SOAP request failed: No response received");
      } else {
        throw new Error(`SOAP request failed: ${error.message}`);
      }
    }
  }

  private buildSoapRequest(
    fkey: string,
    userName: string,
    userPass: string
  ): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getInvViewFkey xmlns="http://tempuri.org/">
      <fkey>${this.escapeXml(fkey)}</fkey>
      <userName>${this.escapeXml(userName)}</userName>
      <userPass>${this.escapeXml(userPass)}</userPass>
    </getInvViewFkey>
  </soap:Body>
</soap:Envelope>`;
  }

  private escapeXml(unsafe: string): string {
    if (unsafe === null || unsafe === undefined) {
      return "";
    }
    return unsafe.replace(/[<>&'"\\]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        case "\\":
          return "&#92;";
        default:
          return c;
      }
    });
  }

  private extractHtmlFromSoapResponse(soapResponse: string): string {
    // Extract HTML content from SOAP response
    const htmlMatch = soapResponse.match(
      /<getInvViewFkeyResult>(.*?)<\/getInvViewFkeyResult>/s
    );
    if (!htmlMatch || !htmlMatch[1]) {
      throw new Error("HTML content not found in SOAP response");
    }

    let htmlContent = htmlMatch[1];

    // Decode HTML entities
    htmlContent = htmlContent
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    return htmlContent || ""; // Ensure we always return a string
  }
}
