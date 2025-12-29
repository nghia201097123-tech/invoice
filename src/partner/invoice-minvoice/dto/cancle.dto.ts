import { ApiProperty } from "@nestjs/swagger";
import { Invoice } from "src/common/schemas/invoice.schema";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";

export class InvoiceConvertPartnerCancelMInvoiceDTO {
  inv_InvoiceAuth_id: string;
  ngayvb: string;
  ghi_chu: string;

  constructor(cancelInvoiceDto: CancelInvoiceDto, invoice: Invoice) {
    this.inv_InvoiceAuth_id = invoice.ref_code;
    this.ngayvb = UtilsDate.formatDateTimeInvoice(new Date());
    this.ghi_chu = cancelInvoiceDto.note;
  }
}

export class CancelInvoiceDto {
  @ApiProperty({
    required: true,
    default: "",
    example: "fa200709-f563-4100-b4ba-241e82c0fba9",
    description: "Id của phiếu phía bên đối tác",
  })
  id: string; // id của hóa đơn bên đối tác

  @ApiProperty({
    required: true,
    default: "",
    example: "fa200709-f563-4100-b4ba-241e82c0fba9",
    description: "Id của phiếu phía bên đối tác",
  })
  note: string;
}
