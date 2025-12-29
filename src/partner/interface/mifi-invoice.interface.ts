import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ExportInvoiceDTO } from "../../common/dto/invoice.export.dto";
import { Invoice } from "../../common/schemas/invoice.schema";
import { InvoiceCancelConvertPartnerMifiDto } from "../invoice-mifi/dto/cancel.dto";
import { InvoiceUpdateConVerPartNerMiFiDto } from "../invoice-mifi/dto/update.dto";
import { GetFKeyMiFiDto } from "../invoice-mifi/dto/get_fkey.dto";
import { GetDetailInvoiceMifiDto } from "../invoice-mifi/dto/get_detail.dto";
import { InvoiceConvertPartNerMiFiDto } from "../invoice-mifi/dto/export.dto";

export interface IInvoiceMiFi {
  export(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    exportInvoiceDTO?: ExportInvoiceDTO;
    invoice?: Invoice;
    invoiceConverPartNerMiFiDto?: InvoiceConvertPartNerMiFiDto;
  });

  cancel(request: {
    invoice?: Invoice;
    invoiceCancelConvertPartnerMifiDto?: InvoiceCancelConvertPartnerMifiDto;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  });

  update(request: {
    invoice: Invoice;
    invoiceUpdateConverPartNerMiFiDto: InvoiceUpdateConVerPartNerMiFiDto;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  });

  getFkey(request: {
    getFKeyMiFiDto: GetFKeyMiFiDto;
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity;
  });

  getDetail(request: {
    getDetailInvoiceMifiDto: GetDetailInvoiceMifiDto;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  });
}
