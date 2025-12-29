import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("restaurant_brands")
export class RestaurantBrandEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  restaurant_id: number;

  @Column({ type: "int", default: 0 })
  service_restaurant_level_id: number;

  @Column({ type: "tinyint", default: 1 })
  service_restaurant_level_type: number;

  @Column({ type: "decimal", precision: 20, scale: 0, default: 0 })
  service_charge_each_bill_price: number;

  @Column({ type: "varchar", length: 255, default: "" })
  name: string;

  @Column({ type: "varchar", length: 50, default: "" })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  logo_url: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  banner: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (value: RestaurantBrandSetting) => JSON.stringify(value),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  setting: RestaurantBrandSetting;

  @Column({ type: "tinyint", default: 0 })
  is_office: number;

  @Column({ type: "tinyint", default: 1 })
  status: number;

  @Column({ type: "text", default: "" })
  facebook_page: string;

  @Column({ type: "text", default: "" })
  website: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updated_at: Date;

  @Column({ type: "tinyint", default: 0 })
  service_charge_type: number;

  @Column({ type: "decimal", precision: 20, scale: 0, default: 0 })
  service_charge_each_month_price: number;
}

export interface RestaurantBrandSetting {
  branch_type: number;
  branch_type_option: number;
  late_minute_allow_in_month: number;
  total_monthly_off_day: number;
  total_yearly_off_day: number;
  bonus_working_day: number;
  punish_working_day_in_minute: number;
  punish_not_checkout: number;
  maximum_advance_salary_percent: number;
  is_require_update_customer_slot_in_order: boolean;
  hour_to_take_report: number;
  is_allow_print_temporary_bill: boolean;
  is_hide_total_amount_before_complete_bill: boolean;
  is_print_bill_logo: boolean;
  is_print_bill_on_mobile_app: boolean;
  is_paid_user: boolean;
  is_print_kichen_bill_on_mobile_app: boolean;
  is_use_bar_code: boolean;
  is_hide_category_type_food: boolean;
  is_hide_category_type_drink: boolean;
  is_hide_category_type_other: boolean;
  is_hide_category_type_sea_food: boolean;
  is_enable_membership_card: boolean;
  is_have_take_away: boolean;
  is_enable_booking: boolean;
  convert_food_point_for_chef: number;
  template_bill_printer_type: number;
  minimum_order_amount_to_claim_bonus_from_booking: number;
  amount_bonus_booking_order_for_employee: number;
  amount_bonus_booking_order_for_employee_second_phase: number;
  maximum_bonus_count_booking_for_employee_second_phase: number;
  amount_bonus_booking_order_for_employee_third_phase: number;
  service_charge_amount_on_order: number;
  is_open_table_and_create_order_without_add_food: boolean;
  monthly_inventory_report_date: number;
  maximum_percent_order_amount_to_accumulate_point_allow_use_in_each_bill: number;
  maximum_accumulate_point_allow_use_in_each_bill: number;
  maximum_percent_order_amount_to_promotion_point_allow_use_in_each_bill: number;
  maximum_promotion_point_allow_use_in_each_bill: number;
  maximum_percent_order_amount_to_alo_point_allow_use_in_each_bill: number;
  maximum_alo_point_allow_use_in_each_bill: number;
  maximum_percent_order_amount_to_value_point_allow_use_in_each_bill: number;
  maximum_money_by_value_point_allow_use_in_each_bill: number;
  one_food_review_to_point_in_bill_exchange: number;
  zalo_oaid: string;
  esms_api_key: string;
  esms_secret_key: string;
  template_id: string;
  is_enable_sub_monitor: boolean;
  sub_monitor_acknowledgements: string;
  is_customer_order: boolean;
  service_charge_percent: number;
  service_charge_amount: number;
  service_charge_use_type: number;
  is_allow_collaborator: boolean;
  is_enable_bypass_payment: boolean;
  is_online_order: boolean;
  payment_type: number;
  is_hidden_payment_detail_in_bill: boolean;
  is_show_vat_on_items_in_bill: boolean;
  is_enable_buffet: boolean;
  shipping_fee_amount: number;
  delivery_type: number;
  addition_percent_overtime: number;
  is_allow_overtime: boolean;
  minimum_minute_allow_overtime: number;
  is_hide_total_amount_before_print_temporary_bill: boolean;
  zns_notification_delay_in_minutes: number;
  is_enable_zns_notify_order: boolean;
  is_enable_zns_notify_order_online: boolean;
  is_enable_zns_notify_booking: boolean;
  maximum_bef_account: number;
  maximum_shf_account: number;
  maximum_grf_account: number;
  invoice_vat: number;
  restaurant_invoice_vat: number;
}
