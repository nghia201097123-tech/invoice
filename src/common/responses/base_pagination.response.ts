import { ApiProperty } from "@nestjs/swagger";

export class BasePaginationResponse {
  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_record: number;

  list: unknown[];

  constructor(data: BasePaginationResponse) {
    this.limit = data?.limit || 0;
    this.total_record = data?.total_record || 0;
    this.list = data?.list || [];
  }
}
