import { Module } from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { Employee } from "../../common/entities/employee.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.SECRET_TOKEN,
    }),
  ],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
