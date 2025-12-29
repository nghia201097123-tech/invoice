import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Branch } from "../../common/entities/branch.entity";
import { BranchService } from "./branch.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.SECRET_TOKEN,
    }),
    BranchModule,
  ],

  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
