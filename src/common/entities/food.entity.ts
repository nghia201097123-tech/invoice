import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
  name: "foods",
})
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column()
  price: number;

  @Column()
  vat_percent: number;

  @Column()
  category_type: number;
}
