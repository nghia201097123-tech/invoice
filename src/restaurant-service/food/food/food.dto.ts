import { Food } from "../../../common/entities/food.entity";

export class FoodDto {
  code: string;

  name: string;

  unit: string;

  price: number;

  vat: number;

  category_type: number;

  constructor(food?: Food) {
    this.code = food ? food.code : "";
    this.name = food ? food.name : "";
    this.unit = food ? food.unit : "";
    this.price = food ? +food.price : 0;
    this.vat = food ? +food.vat_percent : 0;
    this.category_type = food ? food.category_type : 0;
  }

  public mapToList(baseEntities: Food[]): FoodDto[] {
    let data: FoodDto[] = [];

    baseEntities.forEach((e) => {
      data.push(new FoodDto(e));
    });
    return data;
  }
}
