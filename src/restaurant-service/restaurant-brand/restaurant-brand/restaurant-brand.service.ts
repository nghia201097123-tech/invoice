import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RestaurantBrandEntity } from "../../../common/entities/restaurant-brand.entity";
import { Repository } from "typeorm";
import { CacheService } from "../../../redis/services/cache.service";
import { log } from "console";

@Injectable()
export class RestaurantBrandService {
  constructor(
    @InjectRepository(RestaurantBrandEntity)
    private readonly restaurantBrandRepository: Repository<RestaurantBrandEntity>,
    private readonly cacheService: CacheService
  ) {}

  public async findById(id: number) {
    return await this.cacheService.getRestaurantBrandById(id, async () => {
      return await this.restaurantBrandRepository.findOneBy({ id: id });
    });
  }
}
