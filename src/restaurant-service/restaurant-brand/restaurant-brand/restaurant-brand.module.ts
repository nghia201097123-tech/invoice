import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantBrandEntity } from "../../../common/entities/restaurant-brand.entity";
import { RestaurantBrandService } from "./restaurant-brand.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantBrandEntity])],
  providers: [RestaurantBrandService],
  exports: [RestaurantBrandService],
})
export class RestaurantBrandModule {}
