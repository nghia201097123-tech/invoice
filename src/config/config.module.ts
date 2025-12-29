import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MongooseConfigService } from "./mongoose/mongoose_config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./type_orm/type_orm.config";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { RedisConfigService } from "./redis/redis.config";
import { GrpcClientModule } from "./grpc/client/grpc-client.module";
import { BullConfigService } from "./redis/bull.config";
import { BullModule } from "@nestjs/bull";
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    RedisModule.forRootAsync({
      useClass: RedisConfigService,
    }),
    BullModule.forRootAsync({
      useClass: BullConfigService,
    }),
    GrpcClientModule,
  ],
  exports: [RedisModule],
})
export class ConfModule {}
