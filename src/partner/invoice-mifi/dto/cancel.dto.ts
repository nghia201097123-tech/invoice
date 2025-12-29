import { Invoice } from "../../../common/schemas/invoice.schema";
import { CancelInvoiceDto } from "../../../common/dto/invoice.cancel.dto";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";

export class InvoiceCancelConvertPartnerMifiDto {
  ApiUserName: string;
  ApiPassword: string;
  ApiInvPattern: string;
  ApiInvSerial: string;
  fkey: string;

  constructor(
    invoice: Invoice,
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    cancelInvoiceDto: CancelInvoiceDto
  ) {
    this.ApiUserName = restaurantPartnerInvoiceEntity.username;
    this.ApiPassword = restaurantPartnerInvoiceEntity.password;
    this.ApiInvPattern = "1";
    this.ApiInvSerial = invoice.voice_series;
    this.fkey = invoice.ref_code;
  }
}
