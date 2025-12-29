import { Module } from "@nestjs/common";
import { ClientOptions, Transport } from "@nestjs/microservices";
import { PartnerGrpcService } from "./services/partner.service";
import { InvoicesModuleV3 } from "../../../version_3/invoices/invoices.module";
import * as path from "path";
import { HealthCheckController } from "./services/health-check.controller";
import { VN_TECHRES_MICROSERVICE_GRPC_NODEJS_NESTJS_SYSTEM_INVOICE_LOGIN_PARTNER_INVOICE_PACKAGE_NAME } from "./protos/partner";
import { VN_TECHRES_MICROSERVICE_GRPC_NODEJS_NESTJS_SYSTEM_INVOICE_HEALTH_PACKAGE_NAME } from "./protos/health";

require("dotenv").config();
export const grpcServerOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: `0.0.0.0:${process.env.GRPC_SERVICE_PORT}`,
    package: [
      VN_TECHRES_MICROSERVICE_GRPC_NODEJS_NESTJS_SYSTEM_INVOICE_LOGIN_PARTNER_INVOICE_PACKAGE_NAME,
      VN_TECHRES_MICROSERVICE_GRPC_NODEJS_NESTJS_SYSTEM_INVOICE_HEALTH_PACKAGE_NAME,
    ],
    protoPath: [
      path.resolve(
        process.cwd(),
        "src/config/grpc/server",
        "protos/health.proto"
      ),
      path.resolve(
        process.cwd(),
        "src/config/grpc/server",
        "protos/partner.proto"
      ),
    ],
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
    keepalive: {
      keepaliveTimeMs: 10000,
      keepaliveTimeoutMs: 5000,
      keepalivePermitWithoutCalls: 1,
    },
  },
};
@Module({
  imports: [InvoicesModuleV3],
  controllers: [PartnerGrpcService, HealthCheckController],
})
export class GrpcServerModule {}
