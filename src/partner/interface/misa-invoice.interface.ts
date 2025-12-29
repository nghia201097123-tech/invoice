import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { InvoiceDetail } from "src/common/schemas/invoice-detail.schema";
import { Invoice } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";

export interface IMisa {
  export(
    request:
      | {
          loginToPartNer: {
            token: string;
            data: any;
            partner_electronic_invoice_type: number;
          };
          invoice: Invoice;
          invoiceDetail: InvoiceDetail[];
          exportInvoiceDTO: ExportInvoiceDTO;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
        }
      | any
  ): Promise<any>;

  cancel(
    request:
      | {
          loginToPartNer: {
            token: string;
            data: any;
            partner_electronic_invoice_type: number;
          };
          invoice: Invoice;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
        }
      | any
  );

  getDetail(
    request:
      | {
          token: string;
          invoice: Invoice | Invoice[];
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
          apiPartNer?: ApiPartNer;
        }
      | any
  );

  update(
    request:
      | {
          loginToPartNer: {
            token: string;
            data: any;
            partner_electronic_invoice_type: number;
          };
          invoice: Invoice;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
        }
      | any
  );
}
