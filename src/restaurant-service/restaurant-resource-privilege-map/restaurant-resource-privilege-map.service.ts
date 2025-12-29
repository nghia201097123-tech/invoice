import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RestaurantResourcePrivilegeMapDataModelEntity } from "../../common/entities/restaurant-resource-privilege-map.data.model.entity";
import { StoreProcedureResult } from "src/common/utils/utils.store-procedure-result.common/utils-store-procedure-result.common";

@Injectable()
export class RestaurantResourcePrivilegeMapService {
  constructor(
    @InjectRepository(RestaurantResourcePrivilegeMapDataModelEntity)
    private restaurantResourcePrivilegeMapDataModelEntityRepository: Repository<RestaurantResourcePrivilegeMapDataModelEntity>
  ) {}

  /**
   *
   * @param restaurantId
   * @param restaurantBrandId
   * @param branchId
   * @param employeeId
   * @returns
   */
  async spGGetRestaurantResourceListBranchForEmployee(
    restaurantId: number,
    restaurantBrandId: number,
    branchId: number,
    employeeId: number
  ): Promise<number[]> {
    let branchIds = `[${branchId}]`;
    let branchIdsResponse: number[] = [];
    let result =
      await this.restaurantResourcePrivilegeMapDataModelEntityRepository.query(
        "CALL sp_g_get_restaurant_resource_list_branch_for_employee (?, ?, ?, ?, @status,@message); SELECT @status AS status_code,@message AS message_error",
        [
          restaurantId,
          restaurantBrandId,
          branchId > 0 ? branchIds : "[]",
          employeeId,
        ]
      );

    let branchList: RestaurantResourcePrivilegeMapDataModelEntity[] =
      new StoreProcedureResult<RestaurantResourcePrivilegeMapDataModelEntity>().getResultList(
        result
      );

    branchIdsResponse = branchList.map((x) => Number(x.id));

    return branchIdsResponse;
  }
}
