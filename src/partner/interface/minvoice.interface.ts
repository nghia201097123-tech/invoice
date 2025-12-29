import { InvoiceConvertPartnerMInvoiceDTO } from "src/partner/invoice-minvoice/dto/export.dto";
import { InvoiceConvertPartnerUpdateMInvoiceDTO } from "src/partner/invoice-minvoice/dto/update.dto";
import { ExportInvoiceDTO } from "src/common/dto/invoice.export.dto";
import { Invoice } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { InvoiceConvertPartnerCancelMInvoiceDTO } from "../invoice-minvoice/dto/cancle.dto";

export interface IMinVoice {
  export(
    request:
      | {
          token: string;
          invoice: Invoice;
          invoiceConvertPartnerMInvoiceDTO: InvoiceConvertPartnerMInvoiceDTO;
          exportInvoiceDTO: ExportInvoiceDTO;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
          apiPartNer?: ApiPartNer;
        }
      | any
  ): Promise<any>;

  cancel(
    request:
      | {
          invoice: Invoice;
          token: string;
          invoiceConvertPartnerCancelMInvoiceDTO: InvoiceConvertPartnerCancelMInvoiceDTO;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
          apiPartNer?: ApiPartNer;
        }
      | any
  );

  getDetail(
    request:
      | {
          token: string;
          invoice: Invoice;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
          apiPartNer?: ApiPartNer;
        }
      | any
  );

  update(
    request:
      | {
          invoiceId: string;
          token: string;
          invoiceUpdatePartNer: InvoiceConvertPartnerUpdateMInvoiceDTO;
          invoice: Invoice;
          restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
          apiPartNer?: ApiPartNer;
        }
      | any
  );
}
