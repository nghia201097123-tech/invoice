import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { OauthService } from "./oauth.service";
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
import { RedisModule } from "@liaoliaots/nestjs-redis";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      {
        name: InvoiceSendThirdPartyLogSchema.name,
        schema: InvoiceSendThirdPartyLogSchemaFactory,
      },
    ]),
    RedisModule,
  ],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
