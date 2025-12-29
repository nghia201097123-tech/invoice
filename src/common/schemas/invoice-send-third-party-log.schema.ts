import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdColumn } from "typeorm";

export type InvoiceSendThirdPartyLogDocument = InvoiceSendThirdPartyLogSchema &
  Document;

@Schema({ collection: "invoice_send_logs", autoIndex: false })
export class InvoiceSendThirdPartyLogSchema {
  @ObjectIdColumn()
  _id: string;

  @Prop({ required: false })
  RefID: string;

  @Prop({ required: false })
  InvSeries: string;

  @Prop({ required: false })
  InvDate: string;

  @Prop({ required: false })
  BusinessArea: number;

  @Prop({ required: false })
  OrganizationUnitID: string;

  @Prop({ required: false })
  InvoiceTemplateID: string;

  @Prop({ required: false })
  UserID: string;

  @Prop({ required: false })
  CompanyID: number;

  @Prop()
  AccountObjectTaxCode: string;

  @Prop()
  AccountObjectName: string;

  @Prop()
  AccountObjectCode: string;

  @Prop()
  AccountObjectAddress: string;

  @Prop({ required: false })
  PaymentMethod: string;

  @Prop({ required: false })
  CurrencyCode: string;

  @Prop({ required: false })
  CurrencyID: string;

  @Prop({ required: false })
  ExchangeRate: number;

  @Prop({ required: false })
  ExchangeRateOperation: number;

  @Prop({ required: false })
  IsMoreVATRate: boolean;

  @Prop({ required: false })
  VATRate: number;

  @Prop({ required: false })
  TotalAmountWithVATOC: number;

  @Prop({ required: false })
  TotalAmountWithVAT: number;

  @Prop({ required: false })
  TotalSaleAmountOC: number;

  @Prop({ required: false })
  TotalSaleAmount: number;

  @Prop({ required: false })
  TotalAmountWithoutVAT: number;

  @Prop({ required: false })
  TotalDiscountAmountOC: number;

  @Prop({ required: false })
  TotalDiscountAmount: number;

  @Prop({ required: false })
  TotalVATAmountOC: number;

  @Prop({ required: false })
  TotalVATAmount: number;

  @Prop({ required: false })
  TotalAmountOC: number;

  @Prop({ required: false })
  TotalAmount: number;

  @Prop()
  ReceiverMobile: string;

  @Prop()
  ReceiverName: string;

  @Prop({ required: false })
  IsTaxReduction43: boolean;

  @Prop({ type: Object })
  InvoiceDetails: any[];

  @Prop({ required: false, default: new Date() })
  createdAt: Date;

  @Prop({ required: false, enum: ["PENDING", "SUCCESS", "FAILED"] })
  status: string;

  @Prop()
  errorMessage: string;

  @Prop()
  responseData: string;
}

export const InvoiceSendThirdPartyLogSchemaFactory =
  SchemaFactory.createForClass(InvoiceSendThirdPartyLogSchema);
