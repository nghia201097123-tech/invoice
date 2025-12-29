import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { Employee } from "src/common/entities/employee.entity";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { RestaurantPartnerInvoiceService } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.service";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { Invoice } from "../../common/schemas/invoice.schema";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { CacheService } from "src/redis/services/cache.service";

@Injectable()
export class CronSendInvCQTVnpt {
  private readonly logger = new Logger(CronSendInvCQTVnpt.name);

  constructor(
    private invoiceHelper: InvoiceHelper,
    private restaurantPartnerInvoiceService: RestaurantPartnerInvoiceService,
    private readonly cacheService: CacheService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkInvoice() {
    const startTime = Date.now();
    this.logger.log("[CRON-VNPT] Starting VNPT invoice check process");

    try {
      const restaurantUseInvoiceServiceKey: string =
        "techres/restaurant_invoice/info";
      let restaurantPartnerInvoicesCache =
        await this.cacheService.getCachedData(restaurantUseInvoiceServiceKey);
      let restaurantPartnerInvoices: any[];

      if (!restaurantPartnerInvoicesCache) {
        this.logger.debug("[CRON-VNPT] Cache miss, fetching from database");
        restaurantPartnerInvoices =
          await this.restaurantPartnerInvoiceService.findByPartNerType(
            PartnerElectronicInvoiceTypeEnum.VNPT
          );
      } else {
        this.logger.debug("[CRON-VNPT] Using cached restaurant partner data");
        restaurantPartnerInvoices = restaurantPartnerInvoicesCache.filter(
          (x) =>
            x.partner_electronic_invoice_type ===
            PartnerElectronicInvoiceTypeEnum.VNPT
        );
      }

      if (!restaurantPartnerInvoices?.length) {
        this.logger.log("[CRON-VNPT] No VNPT restaurants found, skipping");
        return;
      }

      this.logger.log(
        `[CRON-VNPT] Found ${restaurantPartnerInvoices.length} VNPT restaurants to process`
      );

      let totalProcessed = 0;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < restaurantPartnerInvoices.length; i++) {
        const restaurantPartner = restaurantPartnerInvoices[i];
        const apiPartner = ApiPartNer.getInstance(restaurantPartner);

        try {
          const processed = await this.processRestaurantPartner(
            restaurantPartner,
            apiPartner
          );
          totalProcessed += processed;
          successCount++;

          this.logger.debug(
            `[CRON-VNPT] Processed restaurant ${restaurantPartner.restaurant_id}`,
            {
              restaurantId: restaurantPartner.restaurant_id,
              processedInvoices: processed,
            }
          );
        } catch (error) {
          errorCount++;
          this.logger.error(
            `[CRON-VNPT] Error processing restaurant ${restaurantPartner.restaurant_id}`,
            {
              restaurantId: restaurantPartner.restaurant_id,
              error: error.message,
            }
          );
        }

        if (i < restaurantPartnerInvoices.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`[CRON-VNPT] Completed processing in ${duration}ms`, {
        totalRestaurants: restaurantPartnerInvoices.length,
        successCount,
        errorCount,
        totalProcessed,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[CRON-VNPT] Failed after ${duration}ms`, {
        error: error.message,
        stack: error.stack,
        duration,
      });
    }
  }

  private async processRestaurantPartner(
    restaurantPartner: any,
    apiPartner: ApiPartNer
  ): Promise<number> {
    this.logger.debug(
      `[VNPT-PROCESS] Starting processing for restaurant ${restaurantPartner.restaurant_id}`
    );

    const invoices = await this.getEligibleInvoices(restaurantPartner);

    if (!invoices?.length) {
      this.logger.debug(
        `[VNPT-PROCESS] No eligible invoices found for restaurant ${restaurantPartner.restaurant_id}`
      );
      return 0;
    }

    this.logger.debug(
      `[VNPT-PROCESS] Found ${invoices.length} eligible invoices for restaurant ${restaurantPartner.restaurant_id}`
    );

    const fKey = invoices.map((invoice) => invoice.order_id).join("_");

    if (!fKey) {
      this.logger.warn(
        `[VNPT-PROCESS] No valid order IDs found for restaurant ${restaurantPartner.restaurant_id}`,
        {
          restaurantId: restaurantPartner.restaurant_id,
          invoiceCount: invoices.length,
        }
      );
      return 0;
    }

    try {
      const soapBody = this.buildSoapBody(restaurantPartner, fKey);

      const data = await new UtilsHttpService(
        apiPartner.apiVnptBusiness,
        soapBody,
        new Employee(),
        HttpServiceBase.getHttpServiceInstance()
      ).postSoap();

      if (data.status !== HttpStatus.OK) {
        this.logger.error(
          `[VNPT-PROCESS] SOAP request failed for restaurant ${restaurantPartner.restaurant_id}`,
          {
            restaurantId: restaurantPartner.restaurant_id,
            status: data.status,
            response: data,
          }
        );
        throw new Error("SOAP request failed");
      }

      this.logger.debug(
        `[VNPT-PROCESS] SOAP request successful, updating invoices for restaurant ${restaurantPartner.restaurant_id}`
      );

      const updateResults = await Promise.allSettled(
        invoices.map(async (invoice) => {
          try {
            await this.invoiceHelper.findByIdAndUpdateCct(invoice._id);
            return { success: true, invoiceId: invoice._id };
          } catch (error) {
            this.logger.error(
              `[VNPT-PROCESS] Error updating invoice ${invoice._id}`,
              {
                invoiceId: invoice._id,
                restaurantId: restaurantPartner.restaurant_id,
                error: error.message,
              }
            );
            return {
              success: false,
              invoiceId: invoice._id,
              error: error.message,
            };
          }
        })
      );

      const successfulUpdates = updateResults.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;
      const failedUpdates = updateResults.length - successfulUpdates;

      this.logger.log(
        `[VNPT-PROCESS] Successfully processed ${invoices.length} invoices for restaurant ${restaurantPartner.restaurant_id}`,
        {
          restaurantId: restaurantPartner.restaurant_id,
          totalInvoices: invoices.length,
          successfulUpdates,
          failedUpdates,
        }
      );

      return invoices.length;
    } catch (error) {
      this.logger.error(
        `[VNPT-PROCESS] Error sending SOAP request for restaurant ${restaurantPartner.restaurant_id}`,
        {
          restaurantId: restaurantPartner.restaurant_id,
          error: error.message,
          stack: error.stack,
        }
      );
      throw error;
    }
  }

  private async getEligibleInvoices(
    restaurantPartner: any
  ): Promise<Invoice[]> {
    try {
      const allInvoices =
        await this.invoiceHelper.findByRestaurantIdAndRestaurantBrandAndBranchId(
          restaurantPartner.restaurant_id,
          restaurantPartner.restaurant_brand_id,
          restaurantPartner.branch_id
        );

      return allInvoices.filter(
        (invoice) =>
          invoice.invoice_status !== 0 &&
          invoice.invoice_status !== 3 &&
          invoice.cct_duyet !== 1
      );
    } catch (error) {
      this.logger.error(
        `Error fetching invoices for restaurant ${restaurantPartner.restaurant_id}:`,
        error.message
      );
      return [];
    }
  }

  private buildSoapBody(restaurantPartner: any, fKey: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <SendInvMTTFkey xmlns="http://tempuri.org/">
      <Account>${restaurantPartner.username}</Account>
      <ACpass>${restaurantPartner.password}</ACpass>
      <lstFkey>${fKey}</lstFkey>
      <username>${restaurantPartner.username_access_service}</username>
      <password>${restaurantPartner.password_access_service}</password>
      <pattern>${restaurantPartner.invoice_denominator}</pattern>
      <serial>${restaurantPartner.invoice_series}</serial>
      <serialCert>540101014D8A1505AC9C7DC132A98455</serialCert>
    </SendInvMTTFkey>
  </soap12:Body>
</soap12:Envelope>`;
  }
}
