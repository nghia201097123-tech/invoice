import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Food } from "../../../common/entities/food.entity";

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(Food)
    private foodRepository: Repository<Food>
  ) {}

  async spGFoodByIds(
    restaurantId: number,
    restaurantBrandId: number,
    foodIds: number[]
  ): Promise<Food[]> {
    const result = await this.foodRepository.query(
      "CALL sp_g_food_by_ids(?,?,?)",
      [restaurantId, restaurantBrandId, JSON.stringify(foodIds)]
    );

    const data: Food[] = result[0];

    return data;
  }
}
