import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { Invoice } from "../../../common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "../../../common/dto/invoice.export.dto";
import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";
import { Restaurant } from "src/common/entities/restaurant.entity";

export class ViettelGeneralInvoiceInfoDto {
  @IsNotEmpty()
  @IsString()
  invoiceType: string;

  @IsNotEmpty()
  @IsString()
  templateCode: string;

  @IsNotEmpty()
  @IsString()
  invoiceSeries: string;

  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @IsNotEmpty()
  @IsString()
  adjustmentType: string;

  @IsNotEmpty()
  @IsBoolean()
  paymentStatus: boolean;

  @IsNotEmpty()
  @IsBoolean()
  cusGetInvoiceRight: boolean;
}

export class ViettelSellerInfoDto {
  @IsNotEmpty()
  @IsString()
  sellerLegalName: string;

  @IsNotEmpty()
  @IsString()
  sellerTaxCode: string;

  @IsNotEmpty()
  @IsString()
  sellerAddressLine: string;

  @IsNotEmpty()
  @IsString()
  sellerPhoneNumber: string;

  @IsNotEmpty()
  @IsString()
  sellerEmail: string;
}

export class ViettelBuyerInfoDto {
  @IsNotEmpty()
  @IsString()
  buyerName: string;

  @IsOptional()
  @IsString()
  buyerLegalName?: string;

  @IsOptional()
  @IsString()
  buyerTaxCode?: string;

  @IsOptional()
  @IsString()
  buyerAddressLine?: string;

  @IsOptional()
  @IsString()
  buyerPhoneNumber?: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;
}

export class ViettelPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentMethodName: string;
}

export class ViettelItemInfoDto {
  @IsNotEmpty()
  @IsNumber()
  lineNumber: number;

  @IsNotEmpty()
  @IsString()
  itemName: string;

  @IsNotEmpty()
  @IsString()
  unitName: string;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  itemTotalAmountWithoutTax: number;

  @IsNotEmpty()
  @IsNumber()
  taxPercentage: number;

  @IsNotEmpty()
  @IsNumber()
  taxAmount: number;

  @IsNotEmpty()
  @IsNumber()
  itemTotalAmountWithTax: number;
}

export class ViettelInvoiceExportDto {
  @IsNotEmpty()
  @IsString()
  supplierTaxCode: string;

  @IsNotEmpty()
  @IsString()
  originalInvoiceType: string;

  @IsOptional()
  @IsString()
  originalTemplateCode?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ViettelGeneralInvoiceInfoDto)
  generalInvoiceInfo: ViettelGeneralInvoiceInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ViettelSellerInfoDto)
  sellerInfo: ViettelSellerInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ViettelBuyerInfoDto)
  buyerInfo: ViettelBuyerInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViettelPaymentDto)
  payments: ViettelPaymentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViettelItemInfoDto)
  itemInfo: ViettelItemInfoDto[];

  taxBreakdowns: any;
}

export class ViettelAuthDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class InvoiceConvertPartnerViettelDTO {
  exportInvoiceDTO: ExportInvoiceDTO;
  viettelInvoiceExportDto: ViettelInvoiceExportDto;

  private calculateTaxBreakdowns(itemInfo: ViettelItemInfoDto[]): any[] {
    // Nhóm các item theo taxPercentage
    const taxGroups = new Map<
      number,
      { taxableAmount: number; taxAmount: number }
    >();

    itemInfo.forEach((item) => {
      const taxPercentage = item.taxPercentage;

      if (taxGroups.has(taxPercentage)) {
        const existing = taxGroups.get(taxPercentage)!;
        existing.taxableAmount += item.itemTotalAmountWithoutTax;
        existing.taxAmount += item.taxAmount;
      } else {
        taxGroups.set(taxPercentage, {
          taxableAmount: item.itemTotalAmountWithoutTax,
          taxAmount: item.taxAmount,
        });
      }
    });

    // Chuyển đổi thành array
    return Array.from(taxGroups.entries()).map(([taxPercentage, amounts]) => ({
      taxPercentage: taxPercentage,
      taxableAmount: amounts.taxableAmount,
      taxAmount: amounts.taxAmount,
    }));
  }

  constructor(
    invoice: Invoice,
    invoiceDetails: InvoiceDetail[],
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    exportInvoiceDTO: ExportInvoiceDTO,
    restaurants: Restaurant
  ) {
    const restaurant = restaurants[0];

    this.exportInvoiceDTO = exportInvoiceDTO;

    // Map invoice details
    const itemInfo: ViettelItemInfoDto[] = invoiceDetails.map(
      (detail, index) => {
        const actualUnitPrice =
          detail.quantity > 0
            ? Math.round(detail.total_amount_without_vat / detail.quantity)
            : Math.round(detail.price);

        const itemTotalAmountWithoutTax = Math.round(
          detail.total_amount_without_vat
        );
        const itemTotalAmountWithTax = Math.round(detail.total_amount);

        // Tính taxAmount từ hiệu số để đảm bảo tính nhất quán
        const taxAmount = itemTotalAmountWithTax - itemTotalAmountWithoutTax;

        return {
          lineNumber: index + 1,
          itemName: detail.food_name,
          unitName: detail.food_unit || "Cái",
          unitPrice: actualUnitPrice,
          quantity: detail.quantity,
          itemTotalAmountWithoutTax: itemTotalAmountWithoutTax,
          taxPercentage: detail.vat || 0,
          taxAmount: taxAmount,
          itemTotalAmountWithTax: itemTotalAmountWithTax,
        };
      }
    );

    // Map payments
    const payments: ViettelPaymentDto[] = [
      {
        paymentMethodName: "Tiền mặt",
      },
    ];

    this.viettelInvoiceExportDto = {
      supplierTaxCode: restaurantPartnerInvoiceEntity.tax_code,
      originalInvoiceType: "0",
      originalTemplateCode: "",
      generalInvoiceInfo: {
        invoiceType: "1",
        templateCode: restaurantPartnerInvoiceEntity.invoice_denominator,
        invoiceSeries: restaurantPartnerInvoiceEntity.invoice_series,
        currencyCode: "VND",
        adjustmentType: "1",
        paymentStatus: true,
        cusGetInvoiceRight: true,
      },
      sellerInfo: {
        sellerLegalName: restaurant.name || "Người bán hàng",
        sellerTaxCode: restaurantPartnerInvoiceEntity.tax_code,
        sellerAddressLine: restaurant.address || "",
        sellerPhoneNumber: restaurant.phone || "",
        sellerEmail: restaurant.email || "",
      },
      buyerInfo: {
        buyerName:
          exportInvoiceDTO.customer_name || "KHÁCH LẺ KHÔNG LẤY HÓA ĐƠN",
        buyerLegalName: exportInvoiceDTO.customer_company_name,
        buyerTaxCode: exportInvoiceDTO.customer_company_tax_code,
        buyerAddressLine: exportInvoiceDTO.customer_company_address,
        buyerPhoneNumber: exportInvoiceDTO.customer_phone,
        buyerEmail: exportInvoiceDTO.customer_company_email,
      },
      payments: payments,
      itemInfo: itemInfo,
      taxBreakdowns: this.calculateTaxBreakdowns(itemInfo),
    };
  }
}
