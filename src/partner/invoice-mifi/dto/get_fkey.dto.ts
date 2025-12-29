import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";

export class GetFKeyMiFiDto {
  ApiUsername: string;
  ApiPassword: string;
  ApiInvPattern: string;
  ApiInvSerial: string;

  constructor(restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity) {
    this.ApiUsername = restaurantPartnerInvoiceEntity.username;
    this.ApiPassword = restaurantPartnerInvoiceEntity.password;
    this.ApiInvPattern = "1";
    this.ApiInvSerial = restaurantPartnerInvoiceEntity.invoice_series;
  }
}
