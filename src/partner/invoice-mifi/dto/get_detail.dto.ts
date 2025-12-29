import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { Invoice } from "../../../common/schemas/invoice.schema";

export class GetDetailInvoiceMifiDto {
  ApiUsername: string;
  ApiPassword: string;
  ApiInvPattern: string;
  ApiInvSerial: string;
  Fkey: string;

  constructor(
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity,
    invoice?: Invoice
  ) {
    this.ApiUsername = restaurantPartnerInvoiceEntity.username;
    this.ApiPassword = restaurantPartnerInvoiceEntity.password;
    this.ApiInvPattern = "1";
    this.ApiInvSerial = restaurantPartnerInvoiceEntity.invoice_series;
    this.Fkey = invoice.ref_code;
  }
}
