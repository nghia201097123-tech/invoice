import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Invoice } from "../../../common/schemas/invoice.schema";
import { ExportInvoiceDTO } from "../../../common/dto/invoice.export.dto";
import { InvoiceDetail } from "../../../common/schemas/invoice-detail.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { ConvertNumberToString } from "src/common/utils/utils.convert-number.tostring.common/utils.convert-number-to-string.common";

export class HiloInvoiceDetailDto {
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @IsNotEmpty()
  @IsString()
  unitName: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  discountRate?: number;

  @IsNotEmpty()
  @IsNumber()
  lineAmount: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  vatAmount?: number;
}

export class HiloInvoiceExportDto {
  @IsNotEmpty()
  @IsString()
  pattern: string;

  @IsNotEmpty()
  @IsString()
  serial: string;

  @IsNotEmpty()
  @IsString()
  invoiceType: string;

  @IsNotEmpty()
  @IsString()
  templateCode: string;

  @IsNotEmpty()
  @IsString()
  invoiceDate: string;

  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @IsNotEmpty()
  @IsNumber()
  exchangeRate: number;

  @IsNotEmpty()
  @IsString()
  buyerName: string;

  @IsOptional()
  @IsString()
  buyerTaxCode?: string;

  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @IsNotEmpty()
  @IsNumber()
  totalAmountWithoutVat: number;

  @IsNotEmpty()
  @IsNumber()
  totalVatAmount: number;

  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  totalDiscountAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HiloInvoiceDetailDto)
  invoiceDetails: HiloInvoiceDetailDto[];
}

export class HiloAuthDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  taxCode?: string;
}

export class InvoiceConvertPartnerHiloDTO {
  xmlData: string;
  pattern: string;
  serial: string;
  convert: boolean;
  userCreate?: string; // Tên tài khoản của người lập hóa đơn (tùy chọn theo API Hilo)
  exportInvoiceDTO: ExportInvoiceDTO;
  constructor(
    exportInvoiceDTO: ExportInvoiceDTO,
    invoice: Invoice,
    invoiceDetail: InvoiceDetail[],
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity,
    userCreate?: string
  ) {
    this.pattern = restaurantPartnerInvoiceEntity.invoice_denominator || "1";
    this.serial = restaurantPartnerInvoiceEntity.invoice_series || "";
    this.convert = false;
    this.userCreate = userCreate; // Tên tài khoản người lập hóa đơn

    // Tạo XML data từ invoice và invoice details
    this.xmlData = this.generateXmlData(
      exportInvoiceDTO,
      invoice,
      invoiceDetail
    );
    this.exportInvoiceDTO = exportInvoiceDTO;
  }

  private generateXmlData(
    exportInvoiceDTO: ExportInvoiceDTO,
    invoice: Invoice,
    invoiceDetail: InvoiceDetail[]
  ): string {
    const currentDate = new UtilsDate().getCurrentDate();
    const formattedDate = currentDate.split("-").reverse().join("/");

    let totalVatAmount = 0;
    // Tạo products XML với đầy đủ thông tin theo tài liệu API Hilo
    const productsXml = invoiceDetail
      .map((detail, index) => {
        totalVatAmount += detail.vat_amount;
        return `
        <Product>
          <OrderBy>${index + 1}</OrderBy>
          <Code>${detail.food_code || ""}</Code>
          <ProdName>${detail.food_name || ""}</ProdName>
          <ProdUnit>${detail.food_unit || "Cái"}</ProdUnit>
          <ProdQuantity>${detail.quantity || 1}</ProdQuantity>
          <ProdPrice>${detail.food_unit_price || detail.price || 0}</ProdPrice>
          <Total>${Math.round(detail.total_amount_without_vat || 0)}</Total>
          <VATRate>${detail.vat || 0}</VATRate>
          <VATAmount>${Math.round(detail.vat_amount || 0)}</VATAmount>
          <Amount>${Math.round(detail.total_amount || 0)}</Amount>
          <Discount>${detail.discount_percent || 0}</Discount>
          <DiscountAmount>${Math.round(
            detail.discount_amount || 0
          )}</DiscountAmount>
          <IsSum>${detail.discount_amount > 0 ? "true" : "false"}</IsSum>
          <Characteristic>${detail.commodity_nature_type || 1}</Characteristic>
          <Extra01></Extra01>
          <Extra02></Extra02>
        </Product>`;
      })
      .join("");
    // Tạo XML với đầy đủ thông tin theo tài liệu API Hilo
    return `<Invoices>
  <Inv>
    <key>${invoice._id || "default-key"}</key>
    <Invoice>
      <InvPattern>${this.pattern}</InvPattern>
      <InvSerial>${this.serial}</InvSerial>
      <Fkey>${invoice.ref_code || invoice._id || "default-fkey"}</Fkey>
      <ComTaxCode>${invoice.customer_company_tax_code || ""}</ComTaxCode>
      <ComName>${invoice.customer_company_name || ""}</ComName>
      <ComAddress>${invoice.customer_address || ""}</ComAddress>
      <ComFax>${""}</ComFax>
      <CusCode>${invoice.customer_id || ""}</CusCode>
      <CusTaxCode>${
        exportInvoiceDTO.customer_company_tax_code ||
        invoice.customer_company_tax_code ||
        ""
      }</CusTaxCode>
      <CusName>${
        exportInvoiceDTO.customer_company_name ||
        invoice.customer_company_name ||
        ""
      }</CusName>
      <Buyer>${
        exportInvoiceDTO.customer_name || invoice.customer_name || ""
      }</Buyer>
      <CusAddress>${
        exportInvoiceDTO.customer_company_address ||
        invoice.customer_company_address ||
        invoice.customer_address ||
        ""
      }</CusAddress>
      <CusPhone>${
        exportInvoiceDTO.customer_phone || invoice.customer_phone || ""
      }</CusPhone>
      <CusEmail>${
        exportInvoiceDTO.customer_company_email ||
        invoice.customer_company_email ||
        ""
      }</CusEmail>
      <CusBankName>${
        exportInvoiceDTO.customer_bank_account_name ||
        invoice.customer_bank_account_name ||
        ""
      }</CusBankName>
      <CusBankNo>${
        exportInvoiceDTO.customer_bank_account ||
        invoice.customer_bank_account ||
        ""
      }</CusBankNo>
      <PaymentMethod>TM/CK</PaymentMethod>
      <Products>${productsXml}
      </Products>
      <Fees></Fees>
      <Discount>${Math.round(invoice.discount_percent || 0)}</Discount>
      <DiscountAmount>${Math.round(
        invoice.discount_amount || 0
      )}</DiscountAmount>
      <Total>${Math.round(invoice.amount || 0)}</Total>
      <VATRate>${this.calculateVATRate(invoice, totalVatAmount)}</VATRate>
      <VATAmount>${Math.round(invoice.vat_amount || totalVatAmount)}</VATAmount>
      <Amount>${Math.round(invoice.total_amount || 0)}</Amount>
      <AmountInWords>${ConvertNumberToString.numberToWords(
        Math.round(invoice.total_amount || 0)
      )} đồng</AmountInWords>
      <ArisingDate>${formattedDate}</ArisingDate>
      <Currency>${invoice.currency_code || "VND"}</Currency>
      <Note>${"Hóa đơn bán hàng"}</Note>
      <GrossValue>${Math.round(invoice.total_amount || 0)}</GrossValue>
      <GrossValue0>${
        invoice.vat === 0 ? Math.round(invoice.total_amount || 0) : 0
      }</GrossValue0>
      <VatAmount0>${
        invoice.vat === 0 ? Math.round(invoice.vat_amount || 0) : 0
      }</VatAmount0>
      <GrossValue5>${
        invoice.vat === 5 ? Math.round(invoice.total_amount || 0) : 0
      }</GrossValue5>
      <VatAmount5>${
        invoice.vat === 5 ? Math.round(invoice.vat_amount || 0) : 0
      }</VatAmount5>
      <GrossValue8>${
        invoice.vat === 8 ? Math.round(invoice.total_amount || 0) : 0
      }</GrossValue8>
      <VatAmount8>${
        invoice.vat === 8 ? Math.round(invoice.vat_amount || 0) : 0
      }</VatAmount8>
      <GrossValue10>${
        invoice.vat === 10 ? Math.round(invoice.total_amount || 0) : 0
      }</GrossValue10>
      <VatAmount10>${
        invoice.vat === 10 ? Math.round(invoice.vat_amount || 0) : 0
      }</VatAmount10>
    </Invoice>
  </Inv>
</Invoices>`;
  }

  private calculateVATRate(invoice: Invoice, totalVatAmount: number): number {
    return invoice.vat || 8;
  }

  private getPaymentMethodName(paymentMethodId: number): string {
    // Map payment method ID to name theo yêu cầu API Hilo
    // PaymentMethod phải là 1 trong: TM, CK, TM/CK, TTD, Nội bộ, Bù trừ
    switch (paymentMethodId) {
      case 1:
        return "TM"; // Tiền mặt
      case 2:
        return "CK"; // Chuyển khoản
      case 3:
        return "TM/CK"; // Thẻ tín dụng (có thể kết hợp)
      case 4:
        return "TTD"; // Thanh toán điện tử
      case 5:
        return "Nội bộ"; // Thanh toán nội bộ
      case 6:
        return "Bù trừ"; // Thanh toán bù trừ
      default:
        return "TM"; // Mặc định là tiền mặt
    }
  }
}
