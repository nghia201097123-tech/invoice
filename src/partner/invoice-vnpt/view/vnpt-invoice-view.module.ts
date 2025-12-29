import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { VnptInvoiceViewController } from "./vnpt-invoice-view.controller";
import { VnptInvoiceViewService } from "./vnpt-invoice-view.service";

@Module({
  imports: [HttpModule],
  controllers: [VnptInvoiceViewController],
  providers: [VnptInvoiceViewService],
  exports: [VnptInvoiceViewService],
})
export class VnptInvoiceViewModule {}
