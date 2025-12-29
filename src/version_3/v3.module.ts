import { Module } from "@nestjs/common";
import { InvoiceDetailsModuleV3 } from "./invoice-details/invoice-details.module";
import { InvoicesModuleV3 } from "./invoices/invoices.module";

@Module({
  imports: [InvoiceDetailsModuleV3, InvoicesModuleV3],
})
export class ModuleV3 {}
