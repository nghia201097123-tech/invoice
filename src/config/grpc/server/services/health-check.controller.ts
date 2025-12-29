import { Controller } from "@nestjs/common";
import {
  HealthServiceController,
  HealthServiceControllerMethods,
  HealthCheckRequest,
  HealthCheckResponse,
  HEALTH_SERVICE_NAME,
} from "../protos/health";
import { GrpcMethod } from "@nestjs/microservices";

@Controller("health-check")
@HealthServiceControllerMethods()
export class HealthCheckController implements HealthServiceController {
  /**
   * Health check endpoint
   * Returns status 200 with message "ok" and no input parameters
   */
  @GrpcMethod(HEALTH_SERVICE_NAME, "check")
  async check(request: HealthCheckRequest): Promise<HealthCheckResponse> {
    return {
      status: 200,
      message: "ok",
    };
  }
}
