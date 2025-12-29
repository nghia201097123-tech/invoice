import { Module } from "@nestjs/common";
import { FoodService } from "./food.service";
import { Food } from "../../../common/entities/food.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Food]),
  ],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
