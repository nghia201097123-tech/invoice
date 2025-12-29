import {
  BullModuleOptions,
  BullOptionsFactory,
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from "@nestjs/bull";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration():
    | Promise<BullRootModuleOptions>
    | BullRootModuleOptions {
    return {
      redis: {
        host: process.env.CONFIG_REDIS_HOST_INVOICE,
        port: Number(process.env.CONFIG_REDIS_PORT_INVOICE),
        password: process.env.CONFIG_REDIS_PASSWORD_INVOICE,
        db: +process.env.CONFIG_REDIS_DB_INDEX_INVOICE,
      },
    };
  }
}
