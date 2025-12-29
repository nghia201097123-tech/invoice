import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdColumn } from "typeorm";

export type InvoiceSendFailedDocument = InvoiceSendFailedSchema & Document;

/**
 * Schema lưu trữ thông tin các hóa đơn gửi thất bại
 * Dùng để theo dõi và xử lý lại các hóa đơn không gửi được
 */
@Schema({
  collection: "invoice_send_faileds",
  timestamps: true,
  autoIndex: true,
})
export class InvoiceSendFailedSchema {
  @ObjectIdColumn()
  _id: string;

  /**
   * ID của hóa đơn gửi thất bại
   */
  @Prop({ required: true, index: true })
  invoice_id: string;

  @Prop({ required: true, index: true })
  branch_id: string;

  @Prop({ required: true, index: true })
  order_id: string;
  /**
   * Thông báo lỗi khi gửi hóa đơn
   */
  @Prop({ required: false })
  error_message: string;

  /**
   * Chi tiết lỗi (stack trace hoặc thông tin debug)
   */
  @Prop({ required: false })
  error_details: string;

  /**
   * Số lần đã thử gửi lại
   */
  @Prop({ required: false, default: 0 })
  retry_count: number;

  /**
   * Thời gian thử gửi lại lần cuối
   */
  @Prop({ required: false })
  last_retry_at: Date;

  /**
   * Trạng thái xử lý: PENDING, PROCESSING, RESOLVED, FAILED
   */
  @Prop({
    required: false,
    enum: ["PENDING", "PROCESSING", "RESOLVED", "FAILED"],
    default: "PENDING",
  })
  status: string;

  /**
   * Ghi chú lỗi bổ sung
   */
  @Prop({ required: false })
  note: string;

  /**
   * Thời gian tạo bản ghi
   */
  @Prop({ required: false, default: new Date() })
  createdAt: Date;

  /**
   * Thời gian cập nhật bản ghi
   */
  @Prop({ required: false, default: new Date() })
  updatedAt: Date;
}

export const InvoiceSendFailedSchemaFactory = SchemaFactory.createForClass(
  InvoiceSendFailedSchema
);

// Tạo index để tối ưu hóa truy vấn
InvoiceSendFailedSchemaFactory.index({ invoice_id: 1 }); // Index cho invoice_id
InvoiceSendFailedSchemaFactory.index({ status: 1 }); // Index cho status
InvoiceSendFailedSchemaFactory.index({ createdAt: -1 }); // Index cho thời gian tạo (sắp xếp giảm dần)
InvoiceSendFailedSchemaFactory.index({ retry_count: 1 }); // Index cho số lần retry
