import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class RestaurantResourcePrivilegeMapDataModelEntity extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ default: 0 })
  branch_id: number;
}
