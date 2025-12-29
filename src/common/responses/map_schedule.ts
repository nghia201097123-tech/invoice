import { ApiProperty } from "@nestjs/swagger";
import { Double } from "typeorm";

export class MapSchedule {
  @ApiProperty()
  sbank: string;

  @ApiProperty()
  sname: string;

  @ApiProperty()
  total: Double;

  @ApiProperty()
  saddr: string;

  @ApiProperty()
  status_recived: number;

  constructor(data?: any, is_success_status_to_string?: any) {
    this.sbank = data ? data.sbank : "";
    this.sname = data ? data.sname : "";
    this.total = data ? data.total : 0;
    this.saddr = data ? data.saddr : "";
    this.status_recived = data ? data.status_received : 0;
  }
}
