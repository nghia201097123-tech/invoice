import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SagaStep, SagaStepSchema } from "src/common/schemas/saga-step.schema";
import {
  SagaTransaction,
  SagaTransactionSchema,
} from "src/common/schemas/saga-transace.schema";
import { SagaStepsService } from "./services/saga_steps.service";
import { SagaOrchestratorService } from "./services/saga_orchestrator.service";
import { ThirdPartyServiceAdapter } from "src/partner/apdater/third-party.adapter";
import { Invoice, InvoiceSchema } from "src/common/schemas/invoice.schema";
import {
  InvoiceDetail,
  InvoiceDetailSchema,
} from "src/common/schemas/invoice-detail.schema";
import {
  InvoiceSendThirdPartyLogSchema,
  InvoiceSendThirdPartyLogSchemaFactory,
} from "src/common/schemas/invoice-send-third-party-log.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SagaTransaction.name, schema: SagaTransactionSchema },
      { name: SagaStep.name, schema: SagaStepSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceDetail.name, schema: InvoiceDetailSchema },
      {
        name: InvoiceSendThirdPartyLogSchema.name,
        schema: InvoiceSendThirdPartyLogSchemaFactory,
      },
    ]),
  ],
  providers: [
    ThirdPartyServiceAdapter,
    SagaStepsService,
    SagaOrchestratorService,
  ],
  exports: [SagaOrchestratorService],
})
export class SagaOrchestratorModule {}
