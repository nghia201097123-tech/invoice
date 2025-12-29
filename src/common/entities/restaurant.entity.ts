import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
  name: "restaurants",
})
export class Restaurant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  service_restaurant_level_id: number;

  @Column({ default: "" })
  server_ip_address: string;

  @Column({ default: "" })
  restaurant_name: string;

  @Column({ default: "" })
  brand_name: string;

  @Column({ default: "" })
  name: string;

  @Column({ default: "" })
  email: string;

  @Column({ default: "" })
  phone: string;

  @Column({ default: "" })
  info: string;

  @Column({ default: "" })
  address: string;

  @Column({ default: 0 })
  restaurant_balance: number;

  @Column({ default: 0 })
  is_done_setup: number;

  @Column({ default: "" })
  setting: string;

  @Column({ default: 0 })
  is_public: number;

  @Column({ default: "" })
  domain: string;

  @Column({ default: "" })
  api_domain: string;

  @Column({ default: 0 })
  status: number;

  @Column({ default: "" })
  greeting_birthday: string;

  @Column({ default: "" })
  greeting_after_meal: string;

  @Column({ default: "" })
  logo: string;

  @Column({ default: "" })
  image_urls: string;

  @Column({ default: "" })
  banner: string;

  @Column({ default: "" })
  tax_number: string;

  @Column({ default: 0 })
  customer_partner_id: number;

  @Column({ default: "" })
  customer_partner_node_access_token: string;

  @Column({ default: 0 })
  techres_saler_id: number;
}
