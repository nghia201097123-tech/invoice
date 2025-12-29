import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bull";
import { Module, DynamicModule, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OauthModule } from "src/oauth/oauth.module";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceModule } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { CronJobService } from "./task/cron-job.service";
import { TaskEnum } from "./enums/task.enum";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { QueueManagerService } from "./services/queue-manager.service";
import { InvoiceQueueModule } from "src/queue/invoice-queue.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  InvoiceSendFailedSchema,
  InvoiceSendFailedSchemaFactory,
} from "src/common/schemas/invoice-send-failed.schema";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";

@Module({})
export class CronJobModule {
  /**
   * Phương thức forRoot() - Sử dụng cho AppModule chính
   * Bao gồm tất cả dependencies và providers đầy đủ
   */
  static forRoot(): DynamicModule {
    return {
      module: CronJobModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: InvoiceSendFailedSchema.name,
            schema: InvoiceSendFailedSchemaFactory,
          },
        ]),
        TypeOrmModule.forFeature([RestaurantPartnerInvoiceEntity]),
        HttpModule,
        OauthModule,
        RestaurantPartnerInvoiceModule,
        InvoiceHelperModule,
        forwardRef(() => InvoiceQueueModule),
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
          name: TaskEnum.INVOICE_SEND_THIRD_PARTY_QUEUE,
        }),
      ],
      providers: [QueueManagerService],
      exports: [QueueManagerService],
    };
  }

  /**
   * Phương thức forFeature() - Sử dụng cho các module nhỏ lẻ
   * Chỉ bao gồm các dependencies cần thiết, không có ScheduleModule
   * để tránh circular dependency
   */
  static forFeature(): DynamicModule {
    return {
      module: CronJobModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: InvoiceSendFailedSchema.name,
            schema: InvoiceSendFailedSchemaFactory,
          },
          { name: Invoice.name, schema: InvoiceSchema },
        ]),
        TypeOrmModule.forFeature([RestaurantPartnerInvoiceEntity]),
        HttpModule,
        OauthModule,
        RestaurantPartnerInvoiceModule,
        InvoiceHelperModule,
        forwardRef(() => InvoiceQueueModule),
        BullModule.registerQueue({
          name: TaskEnum.INVOICE_SEND_THIRD_PARTY_QUEUE,
        }),
      ],
      providers: [CronJobService, QueueManagerService],
      exports: [CronJobService, QueueManagerService],
    };
  }
}
