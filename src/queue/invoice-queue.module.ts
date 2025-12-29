import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { InvoicesModuleV3 } from "../version_3/invoices/invoices.module";
import { InvoiceDetailsModuleV3 } from "../version_3/invoice-details/invoice-details.module";
import { RestaurantPartnerInvoiceModule } from "src/restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { InvoiceQueueSendConsumer } from "./invoice-queue.processor";
import { BulkExportQueueProcessor } from "./bulk-export-queue.processor";
import { InvoiceHelperModule } from "src/global/base/invoice-helper/invoice_helper.module";
import { TaskEnum } from "src/job/enums/task.enum";

@Module({
  imports: [
    RestaurantPartnerInvoiceModule,
    InvoicesModuleV3,
    InvoiceDetailsModuleV3,
    InvoiceHelperModule,
    BullModule.registerQueue({
      name: TaskEnum.INVOICE_QUEUE_SEND,
    }),
    BullModule.registerQueue({
      name: TaskEnum.INVOICE_BULK_EXPORT_QUEUE,
    }),
  ],
  providers: [InvoiceQueueSendConsumer, BulkExportQueueProcessor],
  exports: [InvoiceQueueSendConsumer, BulkExportQueueProcessor],
})
export class InvoiceQueueModule {}
