import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export enum StepStatus {
  PENDING = "PENDING",
  EXECUTING = "EXECUTING",
  COMPLETED = "COMPLETED",
  COMPENSATING = "COMPENSATING",
  COMPENSATED = "COMPENSATED",
  FAILED = "FAILED",
}
export type SagaStepDocument = HydratedDocument<SagaStep>;

@Schema({ timestamps: true })
export class SagaStep {
  @Prop({ required: true })
  saga_id: string;

  @Prop({ required: true })
  step_name: string;

  @Prop({ required: true })
  step_order: number;

  @Prop({ enum: StepStatus, default: StepStatus.PENDING })
  status: StepStatus;

  @Prop({ type: Object })
  input_data?: any;

  @Prop({ type: Object })
  output_data?: any;

  @Prop({ type: Object })
  error_details?: any;

  @Prop()
  executed_at?: Date;

  @Prop()
  compensated_at?: Date;
}

export const SagaStepSchema = SchemaFactory.createForClass(SagaStep);
