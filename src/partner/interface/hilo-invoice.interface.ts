import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { Invoice } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { InvoiceConvertPartnerHiloDTO } from "../invoice-hilo/dto/export.dto";

export interface IHiloInvoice {
  export(request: {
    loginToPartNer: {
      token: string;
      data: any;
      partner_electronic_invoice_type: number;
    };
    invoice: Invoice;
    invoiceConvertPartnerHiloDTO: InvoiceConvertPartnerHiloDTO;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  cancel(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  update(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  getDetail(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  signInvoice(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  getInvoicePdf(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;

  getInvoiceXml(request: {
    invoiceId: string;
    token: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any>;
}
