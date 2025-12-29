import { Injectable, OnModuleInit } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";

@Injectable()
export class TypeOrmConfigService
  implements TypeOrmOptionsFactory, OnModuleInit
{
  onModuleInit() {}
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: "mariadb",
      host: process.env.CONFIG_MYSQL_HOST_INVOICE,
      port: parseInt(process.env.CONFIG_MYSQL_PORT_INVOICE),
      username: process.env.CONFIG_MYSQL_USERNAME_INVOICE,
      password: process.env.CONFIG_MYSQL_PASSWORD_INVOICE,
      database: process.env.CONFIG_MYSQL_DB_NAME_INVOICE,
      entities: [__dirname + "/../../common/entities/*.entity{.ts,.js}"],
      multipleStatements: true,
      dateStrings: true,
      synchronize: false,
      timezone: "+07:00",
      extra: {
        connectionLimit: 2,
      },
    };
  }
}
