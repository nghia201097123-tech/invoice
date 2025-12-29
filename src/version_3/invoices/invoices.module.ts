import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { KafkaService } from "src/kafka/kafka.service";
import { OauthModule } from "src/oauth/oauth.module";
import { Invoice, InvoiceSchema } from "../../common/schemas/invoice.schema";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceModule } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { FoodModule } from "src/restaurant-service/food/food/food.module";
import { BranchModule } from "src/restaurant-service/branches/branch.module";
import { InvoiceDetailsModuleV3 } from "../invoice-details/invoice-details.module";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "src/common/schemas/invoice-detail.schema";
import {
  InvoiceSendThirdPartyLogSchema,
  InvoiceSendThirdPartyLogSchemaFactory,
} from "src/common/schemas/invoice-send-third-party-log.schema";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { SagaOrchestratorModule } from "src/saga-orchestrator/saga_orchestrator.module";
import { RestaurantModule } from "src/restaurant-service/restaurant/restaurant/restaurant.module";
import { RedisCacheModule } from "src/redis/module";
import { BullModule } from "@nestjs/bull";
import { TaskEnum } from "../../job/enums/task.enum";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedSchemaFactory,
} from "src/common/schemas/invoice-send-failed.schema";
import { RestaurantBrandModule } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      {
        name: InvoiceSendThirdPartyLogSchema.name,
        schema: InvoiceSendThirdPartyLogSchemaFactory,
      },
      {
        name: InvoiceSendFailedSchema.name,
        schema: InvoiceSendFailedSchemaFactory,
      },
    ]),
    TypeOrmModule.forFeature([RestaurantPartnerInvoiceEntity]),
    SagaOrchestratorModule,
    HttpModule,
    OauthModule,
    FoodModule,
    BranchModule,
    InvoiceHelperModule,
    RestaurantModule,
    RestaurantPartnerInvoiceModule,
    RestaurantBrandModule,
    RedisCacheModule,
    BullModule.registerQueue({
      name: TaskEnum.INVOICE_BULK_EXPORT_QUEUE,
    }),
    forwardRef(() => InvoiceDetailsModuleV3),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, KafkaService],
  exports: [InvoicesService, KafkaService, MongooseModule],
})
export class InvoicesModuleV3 {}
