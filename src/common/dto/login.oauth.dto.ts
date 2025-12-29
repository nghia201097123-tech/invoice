import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";

export class LoginOauthDTO {
  public username: string;
  public password: string;
  public usernameAccessService: string;
  public passwordAccessService: string;
  public partnerIdentifyName: string;
  public partnerElectronicInvoiceType: number;
  public restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  public taxcode?: string;

  constructor(restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity) {
    this.username = restaurantPartnerInvoiceEntity.username
      ? restaurantPartnerInvoiceEntity.username
      : "";
    this.password = restaurantPartnerInvoiceEntity.password
      ? restaurantPartnerInvoiceEntity.password
      : "";
    this.partnerElectronicInvoiceType =
      restaurantPartnerInvoiceEntity.partner_electronic_invoice_type
        ? restaurantPartnerInvoiceEntity.partner_electronic_invoice_type
        : 0;
    this.partnerIdentifyName =
      restaurantPartnerInvoiceEntity.partner_identify_name
        ? restaurantPartnerInvoiceEntity.partner_identify_name
        : "";
    this.usernameAccessService = restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.username_access_service
      : "";
    this.passwordAccessService = restaurantPartnerInvoiceEntity
      ? restaurantPartnerInvoiceEntity.password_access_service
      : "";
    this.restaurantPartnerInvoiceEntity = restaurantPartnerInvoiceEntity;
    this.taxcode = restaurantPartnerInvoiceEntity.tax_code;
  }
}
