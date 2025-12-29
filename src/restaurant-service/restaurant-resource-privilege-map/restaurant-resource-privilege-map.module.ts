import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { RestaurantResourcePrivilegeMapController } from "./restaurant-resource-privilege-map.controller";
import { RestaurantResourcePrivilegeMapService } from "./restaurant-resource-privilege-map.service";
import { RestaurantResourcePrivilegeMapDataModelEntity } from "../../common/entities/restaurant-resource-privilege-map.data.model.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantResourcePrivilegeMapDataModelEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.SECRET_TOKEN,
    }),
    RestaurantResourcePrivilegeMapModule,
  ],
  controllers: [RestaurantResourcePrivilegeMapController],
  providers: [RestaurantResourcePrivilegeMapService],
  exports: [RestaurantResourcePrivilegeMapService],
})
export class RestaurantResourcePrivilegeMapModule {}
