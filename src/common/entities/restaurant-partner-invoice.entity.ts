import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({
  name: "restaurant_partner_invoices",
})
export class RestaurantPartnerInvoiceEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  partner_electronic_invoice_type: number;

  @Column({ default: 0 })
  partner_identify_name: string;

  @Column({ default: 0 })
  restaurant_id: number;

  @Column({ default: 0 })
  restaurant_brand_id: number;

  @Column({ default: 0 })
  branch_id: number;

  @Column({ default: 0 })
  status: number;

  @Column({ default: "" })
  tax_code: string;

  @Column({ default: "" })
  username: string;

  @Column({ default: "" })
  password: string;

  @Column({ default: "" })
  invoice_denominator: string;

  @Column({ default: "" })
  invoice_series: string;

  @Column({ default: "" })
  endpoint: string;

  @Column({ default: "" })
  username_access_service: string;

  @Column({ default: "" })
  password_access_service: string;

  @Column({ default: "" })
  is_auto_export_third_party: number;

  @Column({ default: "[]" })
  apply_order_types: string;

  @Column({ default: 0 })
  apply_discount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
