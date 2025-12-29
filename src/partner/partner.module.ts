import { Module } from "@nestjs/common";
import { FptModule } from "./invoice-fpt/fpt-invoice/module";
import { VnptModule } from "./invoice-vnpt/module";
import { MiSaModule } from "./invoice-misa/module";
import { MinvoiceModule } from "./invoice-minvoice/module";
import { MifiModule } from "./invoice-mifi/module";
import { ThirdPartyFactory } from "./factory/Third-party-factory";
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
import { HiloInvoiceModule } from "./invoice-hilo/module";
import { ViettelInvoiceModule } from "./invoice-viettel/module";
import { RestaurantBrandModule } from "src/restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";

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
    FptModule,
    VnptModule,
    MinvoiceModule,
    MiSaModule,
    MifiModule,
    HiloInvoiceModule,
    ViettelInvoiceModule,
    RestaurantBrandModule,
  ],
  exports: [
    FptModule,
    VnptModule,
    MinvoiceModule,
    MiSaModule,
    MifiModule,
    ViettelInvoiceModule,
  ],
  providers: [ThirdPartyFactory],
})
export class PartnerModule { }
