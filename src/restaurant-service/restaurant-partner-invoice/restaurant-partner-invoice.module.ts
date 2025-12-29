import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantPartnerInvoiceController } from "./restaurant-partner-invoice.controller";
import { RestaurantPartnerInvoiceEntity } from "../../common/entities/restaurant-partner-invoice.entity";
import { RestaurantPartnerInvoiceService } from "./restaurant-partner-invoice.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantPartnerInvoiceEntity]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.secret_token,
    }),
    RestaurantPartnerInvoiceModule,
  ],
  controllers: [RestaurantPartnerInvoiceController],
  providers: [RestaurantPartnerInvoiceService],
  exports: [RestaurantPartnerInvoiceService],
})
export class RestaurantPartnerInvoiceModule {}
