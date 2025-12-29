import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { Invoice } from "../../common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "../../common/dto/invoice.export.dto";
import { InvoiceCancelFPT } from "../invoice-fpt/fpt-invoice/dto/cancel.dto";
import { InvoiceFormUpdateInvoicePartNerFpt } from "../invoice-fpt/fpt-invoice/dto/update.dto";

export interface IFptInvoice {
  export(
    request:
      | {
          token: string;
          invoice: Invoice;
          exportInvoiceDTO: ExportInvoiceDTO;
          restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
        }
      | any
  ): Promise<any>;

  cancel(request: {
    invoice: Invoice;
    token: string;
    invoiceCancelFPT: InvoiceCancelFPT;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  });

  update(request: { // @ts-ignore
    token: string;
    invoiceFormUpdateInvoicePartNerFpt: InvoiceFormUpdateInvoicePartNerFpt;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    invoiceId: string;
  });

  getDetail(request: {
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  });
}
