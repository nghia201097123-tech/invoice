import { HttpModule } from "@nestjs/axios";
import { MiddlewareConsumer, Module, NestModule, Res } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthenticationMiddleware } from "./common/middlewares/authentication.middleware";
import { APP_GUARD } from "@nestjs/core";
import { BranchModule } from "./restaurant-service/branches/branch.module";
import { OauthModule } from "./oauth/oauth.module";
import { RestaurantPartnerInvoiceModule } from "./restaurant-service/restaurant-partner-invoice/restaurant-partner-invoice.module";
import { RestaurantResourcePrivilegeMapModule } from "./restaurant-service/restaurant-resource-privilege-map/restaurant-resource-privilege-map.module";
import { EmployeeModule } from "./restaurant-service/employee/employee.module";
import { FoodModule } from "./restaurant-service/food/food/food.module";
import { RestaurantModule } from "./restaurant-service/restaurant/restaurant/restaurant.module";
import { ModuleV3 } from "./version_3/v3.module";
import { KafkaModule } from "./kafka/kafka.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { InvoiceQueueModule } from "./queue/invoice-queue.module";
import { RestaurantBrandModule } from "./restaurant-service/restaurant-brand/restaurant-brand/restaurant-brand.module";
import { ConfModule } from "./config/config.module";
import { CronJobModule } from "./job/job.module";
import { HealthCheckModule } from "./health-check/health-check.module";
import { PartnerModule } from "./partner/partner.module";
import { SagaOrchestratorModule } from "./saga-orchestrator/saga_orchestrator.module";
import { RedisCacheModule } from "./redis/module";
import { GrpcServerModule } from "./config/grpc/server/grpc-serser.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    ConfModule,
    EventEmitterModule.forRoot({
      maxListeners: 10,
    }),
    RedisCacheModule,
    SagaOrchestratorModule,
    PartnerModule,
    RestaurantBrandModule,
    InvoiceQueueModule,
    BranchModule,
    HttpModule,
    OauthModule,
    RestaurantPartnerInvoiceModule,
    RestaurantResourcePrivilegeMapModule,
    KafkaModule,
    EmployeeModule,
    FoodModule,
    HealthCheckModule,
    RestaurantModule,
    CronJobModule.forRoot(),
    ModuleV3,
    GrpcServerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationMiddleware,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude(
        "/public/health-check",
        "/v3/invoices/sync-invoices",
        "/v3/invoices/check-missing-orders",
        "/partner/vnpt/invoice-view",
        "/partner/vnpt/invoice-view/get-html"
      )
      .forRoutes("*");
  }
}
