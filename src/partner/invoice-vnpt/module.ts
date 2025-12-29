import { Module } from "@nestjs/common";
import { ThirdPartyVnPt } from "./service/third-party-vnpt.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "src/common/schemas/invoice-detail.schema";
import {
  InvoiceSendThirdPartyLogSchema,
  InvoiceSendThirdPartyLogSchemaFactory,
} from "src/common/schemas/invoice-send-third-party-log.schema";
import { MailerModule } from "@nestjs-modules/mailer";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { BranchModule } from "src/restaurant-service/branches/branch.module";
import { RestaurantBrandModule } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { RedisCacheModule } from "src/redis/module";
import { VnptInvoiceViewModule } from "./view/vnpt-invoice-view.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      {
        name: InvoiceSendThirdPartyLogSchema.name,
        schema: InvoiceSendThirdPartyLogSchemaFactory,
      },
    ]),
    MailerModule,
    RedisModule,
    RestaurantBrandModule,
    InvoiceHelperModule,
    RedisCacheModule,
    VnptInvoiceViewModule,
  ],
  providers: [ThirdPartyVnPt],
  exports: [ThirdPartyVnPt],
})
export class VnptModule {}
