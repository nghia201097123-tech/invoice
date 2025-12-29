import { Global, Module } from "@nestjs/common";
import { ConsumerService } from "src/kafka/consumer.service";
import { Consumer } from "./consumer";
import { KafkaService } from "./kafka.service";
import { InvoicesModuleV3 } from "../version_3/invoices/invoices.module";
import { InvoiceDetailsModuleV3 } from "../version_3/invoice-details/invoice-details.module";
import { RestaurantBrandModule } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { RestaurantPartnerInvoiceModule } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { Mongoose } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedSchemaFactory,
} from "src/common/schemas/invoice-send-failed.schema";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";
import { CronJobModule } from "src/job/job.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: InvoiceSendFailedSchema.name,
        schema: InvoiceSendFailedSchemaFactory,
      },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    CronJobModule.forFeature(),
    InvoicesModuleV3,
    InvoiceDetailsModuleV3,
    InvoiceHelperModule,
    RestaurantBrandModule,
    RestaurantPartnerInvoiceModule,
  ],
  providers: [KafkaService, ConsumerService, Consumer],
  exports: [KafkaService, ConsumerService, Consumer],
})
@Global()
export class KafkaModule {}
