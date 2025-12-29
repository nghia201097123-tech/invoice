import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class BaseResponse {
  @ApiProperty({
    type: Number,
    example: HttpStatus.OK,
  })
  status?: HttpStatus;

  @ApiProperty({
    type: String,
    example: "OK",
  })
  message?: string;

  data?: unknown;

  constructor(init?: BaseResponse) {
    this.status = init?.status || HttpStatus.OK;
    this.message = init?.message || "OK";
    this.data = init?.data || null;
  }
}

export class BaseResponseDataNull extends BaseResponse {
  @ApiProperty({
    type: Number,
    example: null,
  })
  data?: unknown;
}
