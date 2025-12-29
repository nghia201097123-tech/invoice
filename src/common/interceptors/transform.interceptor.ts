import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Response } from "express";
import { Observable, map } from "rxjs";
import { BaseResponse } from "../responses/base.response";

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, BaseResponse>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<BaseResponse> {
    const response = context.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.OK);
    return next.handle().pipe(map((data) => new BaseResponse({ data })));
  }
}
