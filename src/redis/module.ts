import { RedisModule } from "@liaoliaots/nestjs-redis";
import { Global, Module } from "@nestjs/common";
import { CacheService } from "./services/cache.service";

@Global()
@Module({
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}
