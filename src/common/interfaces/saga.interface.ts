export interface InvoiceExportSagaRequest {
  invoiceId: string;
  invoiceDetails: any[];
  restaurantId: string;
  partnerType: number;
  token?: string;
  logData?: any;
  sagaId?: string;
}

export interface SagaResult {
  success: boolean;
  sagaId: string;
  error?: string;
  data?: any;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SagaStep {
  name: string;
  execute: () => Promise<StepResult>;
  compensate: (compensationData?: any) => Promise<void>;
}
