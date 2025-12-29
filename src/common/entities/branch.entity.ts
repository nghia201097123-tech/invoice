import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
  name: "branches",
})
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurant_brand_id: number;

  @Column({ default: "" })
  city_name: string;

  @Column({ default: "" })
  hour_to_take_report: number;
}
