import { Global, Injectable, Module } from "@nestjs/common";
import {
  ClientProvider,
  ClientProviderOptions,
  ClientsModule,
  ClientsModuleOptions,
  ClientsModuleOptionsFactory,
  Transport,
} from "@nestjs/microservices";
import * as path from "path";
const retryOptions = {
  max_retries: 3,
  initial_backoff_ms: 1000,
  max_backoff_ms: 5000,
  backoff_multiplier: 1.5,
  retryable_status_codes: [14],
};

const grpcClientOptions = (init: {
  name: string;
  package: string;
  protoPath: string;
  url: string;
}): ClientProviderOptions => {
  const projectRoot = process.cwd();

  return {
    name: init.name,
    transport: Transport.GRPC,
    options: {
      package: init.package,
      protoPath: path.resolve(
        projectRoot,
        "src/config/grpc/client",
        init.protoPath
      ),
      url: init.url,
      loader: {
        longs: String,
        keepCase: true,
        defaults: true,
      },
      channelOptions: {
        "grpc.default_deadline_ms": 2000,
        "grpc.initial_reconnect_backoff_ms": 2000,
        "grpc.service_config": JSON.stringify({
          methodConfig: [
            {
              name: [],
              timeout: { seconds: 10, nanos: 0 },
              retryPolicy: {
                maxAttempts: 5,
                initialBackoff: "0.1s",
                maxBackoff: "30s",
                backoffMultiplier: 3,
                retryableStatusCodes: ["UNAVAILABLE"],
              },
            },
          ],
        }),
      },
      keepalive: {
        keepaliveTimeMs: 60000,
        keepaliveTimeoutMs: 20000,
        keepalivePermitWithoutCalls: 1,
        ...(retryOptions && { retry: retryOptions }),
      },
    },
  };
};

@Global()
@Module({
  imports: [
    ClientsModule.register([
      grpcClientOptions({
        name: "TECHRES-OAUTH-GRPC-SERVICE",
        package:
          "vn.techres.microservice.grpc.java.net_techres_oauth.validate.token",
        protoPath: "protos/validate-token.proto",
        url: `${process.env.CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_HOST}:${process.env.CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_PORT}`,
      }),
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
