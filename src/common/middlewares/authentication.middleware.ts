import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NestMiddleware,
  OnModuleInit,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { NextFunction, Request, Response } from "express";
import { Account } from "../enums/account.enum";
import { ClientGrpc } from "@nestjs/microservices";
import { EmployeeService } from "src/restaurant-service/employee/employee.service";
import { Employee } from "src/common/entities/employee.entity";
import { ExceptionResponseDetail } from "../utils/utils.exception.common/utils.exception.common";
import { Role, ROLES_KEY } from "../enums/role.enum";
import {
  authenticateTokenWithGlobalService,
  AuthResult,
  UserData,
} from "@techres/authenticate-lib";

interface ValidateTokenService {
  isValid(data: { token: string });
}

@Injectable()
export class AuthenticationMiddleware
  implements NestMiddleware, CanActivate, OnModuleInit
{
  validateTokenService: any;

  constructor(
    private employeeService: EmployeeService,
    private reflector: Reflector,
    @Inject("TECHRES-OAUTH-GRPC-SERVICE") private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.validateTokenService = this.client.getService<ValidateTokenService>(
      "ValidateTokenService"
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    const { user }: { user: UserData } = context.switchToHttp().getRequest();
    const codes: string[] = JSON.parse(user.privilege_tags as any).map(
      (item: any) => item.code
    );
    if (codes.includes("OWNER")) {
      return true;
    } else if (!requiredRoles.some((role) => codes.includes(role))) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.FORBIDDEN,
          "Bạn không có quyền truy cập vào chức năng này!"
        ),
        HttpStatus.OK
      );
    }

    return true;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    let bearerToken: string = req.headers.authorization;
    if (!bearerToken || bearerToken === "") {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          "Kiểm tra lại xem bạn đã truyền token vào chưa!"
        ),
        HttpStatus.OK
      );
    }

    // let decodeBearerTokenInterFace: DecodeBearerTokenInterFace;

    // decodeBearerTokenInterFace = await new DecodeToken().verifyBearerToken(
    //   bearerToken,
    //   process.env.SECRET_TOKEN
    // );

    // const validateTokenResponse: ValidateTokenResponse = await lastValueFrom(
    //   await this.validateTokenService.isValid({
    //     token: decodeBearerTokenInterFace.jwt_token
    //   })
    // );

    const validateTokenResponse: AuthResult =
      await authenticateTokenWithGlobalService(bearerToken, true);

    if (validateTokenResponse.success === false) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.UNAUTHORIZED,
          "Không có quyền truy cập"
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    let employee: Employee;
    let platform = validateTokenResponse.data.platform;

    switch (+platform) {
      case Account.RESTAURANT:
        employee = await this.employeeService.findOne(
          validateTokenResponse.data.user_id
        );

        break;
      default:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Token bạn truyền vào không hợp lệ!"
          ),
          HttpStatus.OK
        );
    }

    employee["platform_type"] = validateTokenResponse.data.platform;
    req["user"] = employee;

    next();
  }
}
