import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ThirdPartyHilo } from "./service/third-party-hilo.service";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "src/common/schemas/invoice-detail.schema";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { HiloHelper } from "./utils/hilo.helper";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
    ]),
  ],
  providers: [ThirdPartyHilo, InvoiceHelper, HiloHelper],
  exports: [ThirdPartyHilo, HiloHelper],
})
export class HiloInvoiceModule {}
