import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ThirdPartyViettel } from "./service/third-party-viettel.service";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "src/common/schemas/invoice-detail.schema";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { ViettelHelper } from "./utils/viettel.helper";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
    ]),
  ],
  providers: [ThirdPartyViettel, InvoiceHelper, ViettelHelper],
  exports: [ThirdPartyViettel, ViettelHelper],
})
export class ViettelInvoiceModule {}
