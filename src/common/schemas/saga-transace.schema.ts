import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export enum SagaStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  COMPENSATING = "COMPENSATING",
  COMPENSATED = "COMPENSATED",
  FAILED = "FAILED",
}
export type SagaTransactionDocument = HydratedDocument<SagaTransaction>;

@Schema({ timestamps: true })
export class SagaTransaction {
  @Prop({ required: true, unique: true })
  saga_id: string;

  @Prop({ required: true })
  saga_type: string;

  @Prop({ type: Object, required: true })
  payload: any;

  @Prop({ enum: SagaStatus, default: SagaStatus.PENDING })
  status: SagaStatus;

  @Prop({ type: [String], default: [] })
  completed_steps: string[];

  @Prop({ type: Object })
  error_details?: any;

  @Prop()
  started_at: Date;

  @Prop()
  completed_at?: Date;

  @Prop()
  compensated_at?: Date;
}

export const SagaTransactionSchema =
  SchemaFactory.createForClass(SagaTransaction);
