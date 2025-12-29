import { Global, Module } from "@nestjs/common";
import { InvoiceHelper } from "../invoice-base.common";
import { MongooseModule } from "@nestjs/mongoose";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
  providers: [InvoiceHelper],
  exports: [InvoiceHelper],
})
export class InvoiceHelperModule {}
