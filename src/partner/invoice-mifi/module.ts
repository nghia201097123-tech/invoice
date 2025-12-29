import { Module } from "@nestjs/common";
import { ThirdPartyMiFi } from "./servcie/third-party-mifi.service";
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
  ],
  providers: [ThirdPartyMiFi],
  exports: [ThirdPartyMiFi],
})
export class MifiModule {}
