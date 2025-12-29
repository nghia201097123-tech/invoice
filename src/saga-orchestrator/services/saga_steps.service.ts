import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { StepResult } from "src/common/interfaces/saga.interface";
import { InvoiceSendThirdPartyLogSchema } from "src/common/schemas/invoice-send-third-party-log.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { ThirdPartyServiceAdapter } from "src/partner/apdater/third-party.adapter";

@Injectable()
export class SagaStepsService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<any>,

    @InjectModel(InvoiceSendThirdPartyLogSchema.name)
    private readonly logModel: Model<any>,

    private readonly thirdPartyAdapter: ThirdPartyServiceAdapter
  ) {}

  // Step 1: Validate Invoice
  async validateInvoiceStep(request: any): Promise<StepResult> {
    try {
      // Validation logic
      for (const detail of request.invoiceDetails) {
        if (![0, 5, 8, 10].includes(+detail.vat)) {
          throw new Error("Invalid VAT value");
        }
      }

      return { success: true, data: { validated: true } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compensateValidationStep(request: any): Promise<void> {
    // Validation không cần compensation
  }

  // Step 2: Create Log Entry
  async createLogEntryStep(request: any): Promise<StepResult> {
    try {
      const logEntry = await this.logModel.create({
        ...request.logData,
        status: "PENDING",
        sagaId: request.sagaId,
      });

      return { success: true, data: { logId: logEntry._id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeLogEntryStep(compensationData: any): Promise<void> {
    try {
      await this.logModel.findByIdAndDelete(compensationData.logId);
    } catch (error) {
      console.error("Failed to remove log entry:", error);
    }
  }

  // Step 3: Call Third Party API
  async callThirdPartyApiStep(request: any): Promise<StepResult> {
    const result = await this.thirdPartyAdapter.executeThirdPartyCall(request);
    return result;
  }

  async compensateThirdPartyApiStep(compensationData: any): Promise<void> {
    await this.thirdPartyAdapter.compensateThirdPartyCall(compensationData);
  }

  async updateInvoiceStatusStep(request: any): Promise<StepResult> {
    try {
      await this.invoiceModel.findByIdAndUpdate(request.invoiceId, {
        invoice_status: 1,
        exported_time: new Date(),
        ref_code: request.refCode,
      });

      return { success: true, data: { updated: true } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async revertInvoiceStatusStep(compensationData: any): Promise<void> {
    try {
      await this.invoiceModel.findByIdAndUpdate(compensationData.invoiceId, {
        invoice_status: "PENDING",
        exported_time: null,
        ref_code: null,
      });
    } catch (error) {
      console.error("Failed to revert invoice status:", error);
    }
  }
}
