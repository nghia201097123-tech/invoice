import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "../../common/schemas/invoice-detail.schema";
import { InvoiceDetailsController } from "./invoice-details.controller";
import { InvoiceDetailsService } from "./invoice-details.service";
import { OauthModule } from "src/oauth/oauth.module";
import { FoodModule } from "src/restaurant-service/food/food/food.module";
import { RestaurantPartnerInvoiceModule } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { InvoicesModuleV3 } from "../invoices/invoices.module";
import {
  InvoiceSendThirdPartyLogSchema,
  InvoiceSendThirdPartyLogSchemaFactory,
} from "src/common/schemas/invoice-send-third-party-log.schema";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { RestaurantBrandModule } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      {
        name: InvoiceSendThirdPartyLogSchema.name,
        schema: InvoiceSendThirdPartyLogSchemaFactory,
      },
    ]),
    HttpModule,
    forwardRef(() => InvoicesModuleV3),
    FoodModule,
    OauthModule,
    RestaurantPartnerInvoiceModule,
    InvoiceHelperModule,
    RestaurantBrandModule,
  ],
  controllers: [InvoiceDetailsController],
  providers: [InvoiceDetailsService],
  exports: [InvoiceDetailsService],
})
export class InvoiceDetailsModuleV3 {}
