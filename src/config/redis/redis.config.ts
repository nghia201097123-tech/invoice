import {
  RedisModuleOptions,
  RedisOptionsFactory,
} from "@liaoliaots/nestjs-redis";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RedisConfigService implements RedisOptionsFactory {
  createRedisOptions(): RedisModuleOptions {
    return {
      config: [
        {
          namespace: "redis",
          host: process.env.CONFIG_REDIS_HOST_INVOICE,
          port: Number(process.env.CONFIG_REDIS_PORT_INVOICE),
          password: process.env.CONFIG_REDIS_PASSWORD_INVOICE,
          db: +process.env.CONFIG_REDIS_DB_INDEX_INVOICE,
        },
      ],
    };
  }
}
