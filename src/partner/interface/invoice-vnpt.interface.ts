import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ExportInvoiceDTO } from "../../common/dto/invoice.export.dto";
import { InvoiceDetail } from "../../common/schemas/invoice-detail.schema";
import { Invoice } from "../../common/schemas/invoice.schema";

export interface IInvoiceVNPt {
  export(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    exportInvoiceDTO?: ExportInvoiceDTO;
    invoice?: Invoice;
  });

  update(request: {
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    invoiceDetail: InvoiceDetail[];
    invoice?: Invoice;
    amount?: number;
    totalAmount?: number;
    vatAmount?: number;
  });

  getDetail();

  cancel();
}
