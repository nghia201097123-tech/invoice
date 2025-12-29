import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  InvoiceExportSagaRequest,
  SagaResult,
  SagaStep,
} from "src/common/interfaces/saga.interface";
import {
  SagaStep as SagaSchema,
  SagaStepDocument,
} from "src/common/schemas/saga-step.schema";
import {
  SagaStatus,
  SagaTransaction,
  SagaTransactionDocument,
} from "src/common/schemas/saga-transace.schema";
import { SagaStepsService } from "./saga_steps.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SagaOrchestratorService {
  constructor(
    @InjectModel(SagaTransaction.name)
    private readonly sagaTransactionModel: Model<SagaTransactionDocument>,

    @InjectModel(SagaSchema.name)
    private readonly sagaStepModel: Model<SagaStepDocument>,

    private readonly sagaStepsService: SagaStepsService
  ) {}

  async executeInvoiceExportSaga(
    request: InvoiceExportSagaRequest
  ): Promise<SagaResult> {
    const sagaId = this.generateSagaId();

    try {
      // Tạo saga transaction record
      await this.createSagaTransaction(sagaId, request);

      // Định nghĩa các steps
      const steps = this.defineInvoiceExportSteps(request);

      // Thực thi từng step
      steps.forEach(async (step, index) => {
        await this.executeStep(sagaId, step, index + 1);
      });

      await this.completeSaga(sagaId);

      return { success: true, sagaId };
    } catch (error) {
      await this.compensateSaga(sagaId);
      throw error;
    }
  }

  private defineInvoiceExportSteps(
    request: InvoiceExportSagaRequest
  ): SagaStep[] {
    return [
      {
        name: "VALIDATE_INVOICE",
        execute: () => this.sagaStepsService.validateInvoiceStep(request),
        compensate: () =>
          this.sagaStepsService.compensateValidationStep(request),
      },
      {
        name: "CREATE_LOG_ENTRY",
        execute: () => this.sagaStepsService.createLogEntryStep(request),
        compensate: () => this.sagaStepsService.removeLogEntryStep(request),
      },
      {
        name: "CALL_THIRD_PARTY_API",
        execute: () => this.sagaStepsService.callThirdPartyApiStep(request),
        compensate: () =>
          this.sagaStepsService.compensateThirdPartyApiStep(request),
      },
      {
        name: "UPDATE_INVOICE_STATUS",
        execute: () => this.sagaStepsService.updateInvoiceStatusStep(request),
        compensate: () =>
          this.sagaStepsService.revertInvoiceStatusStep(request),
      },
    ];
  }

  private generateSagaId(): string {
    return uuidv4();
  }

  private async createSagaTransaction(
    saga_id: string,
    request: InvoiceExportSagaRequest
  ): Promise<void> {
    await this.sagaTransactionModel.create({
      saga_id: saga_id,
      saga_type: "INVOICE_EXPORT",
      payload: request,
      status: SagaStatus.IN_PROGRESS,
      started_at: new Date(),
    });
  }

  private async executeStep(
    saga_id: string,
    step: any,
    step_order: number
  ): Promise<void> {
    // Create step record
    const stepRecord = await this.sagaStepModel.create({
      saga_id,
      step_name: step.name,
      step_order: step_order, // You might want to add proper ordering
      status: "EXECUTING",
      inputData: step.inputData,
    });
    try {
      const result = await step.execute();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update step as completed
      await this.sagaStepModel.findByIdAndUpdate(stepRecord._id, {
        status: "COMPLETED",
        output_data: result.data,
        executed_at: new Date(),
      });

      // Update saga transaction
      await this.sagaTransactionModel.findOneAndUpdate(
        { saga_id: saga_id },
        { $push: { completed_steps: step.name } }
      );
    } catch (error) {
      // Update step as failed
      await this.sagaStepModel.findByIdAndUpdate(stepRecord._id, {
        status: "FAILED",
        errorDetails: { message: error.message, stack: error.stack },
      });
      throw error;
    }
  }

  private async compensateSaga(sagaId: string): Promise<void> {
    // Update saga status to compensating
    await this.sagaTransactionModel.findOneAndUpdate(
      { saga_id: sagaId },
      { status: SagaStatus.COMPENSATING }
    );

    // Get completed steps in reverse order
    const completedSteps = await this.sagaStepModel
      .find({ sagaId, status: "COMPLETED" })
      .sort({ step_order: -1 });

    // Compensate each step
    for (const step of completedSteps) {
      try {
        await this.compensateStep(step);
      } catch (error) {
        console.error(`Failed to compensate step ${step.step_name}:`, error);
      }
    }

    // Mark saga as compensated
    await this.sagaTransactionModel.findOneAndUpdate(
      { saga_id: sagaId },
      {
        status: SagaStatus.COMPENSATED,
        compensated_at: new Date(),
      }
    );
  }

  private async compensateStep(step: SagaStepDocument): Promise<void> {
    await this.sagaStepModel.findByIdAndUpdate(step._id, {
      status: "COMPENSATING",
    });

    try {
      // Call appropriate compensation method based on step name
      switch (step.step_name) {
        case "VALIDATE_INVOICE":
          await this.sagaStepsService.compensateValidationStep(step.input_data);
          break;
        case "CREATE_LOG_ENTRY":
          await this.sagaStepsService.removeLogEntryStep(step.output_data);
          break;
        case "CALL_THIRD_PARTY_API":
          await this.sagaStepsService.compensateThirdPartyApiStep(
            step.output_data
          );
          break;
        case "UPDATE_INVOICE_STATUS":
          await this.sagaStepsService.revertInvoiceStatusStep(step.input_data);
          break;
      }

      await this.sagaStepModel.findByIdAndUpdate(step._id, {
        status: "COMPENSATED",
        compensatedAt: new Date(),
      });
    } catch (error) {
      await this.sagaStepModel.findByIdAndUpdate(step._id, {
        status: "FAILED",
        errorDetails: { message: error.message },
      });
      throw error;
    }
  }

  private async completeSaga(sagaId: string): Promise<void> {
    await this.sagaTransactionModel.findOneAndUpdate(
      { saga_id: sagaId },
      {
        status: SagaStatus.COMPLETED,
        completed_at: new Date(),
      }
    );
  }

  private async validateInvoiceStep(
    request: InvoiceExportSagaRequest
  ): Promise<any> {
    return await this.sagaStepsService.validateInvoiceStep(request);
  }

  private async compensateValidationStep(
    request: InvoiceExportSagaRequest
  ): Promise<void> {
    return await this.sagaStepsService.compensateValidationStep(request);
  }

  private async createLogEntryStep(
    request: InvoiceExportSagaRequest
  ): Promise<any> {
    return await this.sagaStepsService.createLogEntryStep(request);
  }

  private async removeLogEntryStep(
    request: InvoiceExportSagaRequest
  ): Promise<void> {
    return await this.sagaStepsService.removeLogEntryStep(request);
  }

  private async callThirdPartyApiStep(
    request: InvoiceExportSagaRequest
  ): Promise<any> {
    return await this.sagaStepsService.callThirdPartyApiStep(request);
  }

  private async compensateThirdPartyApiStep(
    request: InvoiceExportSagaRequest
  ): Promise<void> {
    return await this.sagaStepsService.compensateThirdPartyApiStep(request);
  }

  private async updateInvoiceStatusStep(
    request: InvoiceExportSagaRequest
  ): Promise<any> {
    return await this.sagaStepsService.updateInvoiceStatusStep(request);
  }

  private async revertInvoiceStatusStep(
    request: InvoiceExportSagaRequest
  ): Promise<void> {
    return await this.sagaStepsService.revertInvoiceStatusStep(request);
  }
}
