import { Injectable } from "@nestjs/common";
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from "@nestjs/mongoose";

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: `mongodb://${
        process.env.CONFIG_MONGO_USERNAME_INVOICE
      }:${encodeURIComponent(process.env.CONFIG_MONGO_PASSWORD_INVOICE)}@${
        process.env.CONFIG_MONGO_HOST_INVOICE
      }:${Number(process.env.CONFIG_MONGO_PORT_INVOICE)}/${
        process.env.CONFIG_MONGO_DB_NAME_INVOICE
      }`,
      authSource: process.env.CONFIG_MONGO_DB_NAME_INVOICE,
    };
  }
}
