import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { IViettelInvoice } from "src/partner/interface/viettel-invoice.interface";
import { ThirdParty } from "src/partner/interface/third-party.interface";
import { InvoiceConvertPartnerViettelDTO } from "../dto/export.dto";
import { ViettelInvoiceCancelDto } from "../dto/cancel.dto";
import {
  ViettelInvoiceUpdateDto,
  ViettelInvoiceSearchDto,
} from "../dto/update.dto";
import {
  ViettelInvoiceCreateResponse,
  ViettelAuthResponse,
  ViettelInvoiceCancelResponse,
  ViettelInvoiceSearchResponse,
} from "../dto/response.dto";
import { InvoiceStatusEnum } from "src/common/enums/invoice-status.enum";
import {
  InvoiceDetail,
  InvoiceDetailDocument,
} from "src/common/schemas/invoice-detail.schema";
import { Invoice, InvoiceDocument } from "src/common/schemas/invoice.schema";
import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InvoiceHelper } from "src/global/base/invoice-base.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { UtilsDate } from "src/common/utils/utils.format-time.common/utils.format-time.common";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { ViettelHelper } from "../utils/viettel.helper";
import { VIETTEL_CONSTANTS } from "../constants/viettel.constants";

/**
 * Service xử lý tích hợp với hệ thống hóa đơn điện tử Viettel
 * Triển khai các chức năng phát hành, hủy, tra cứu hóa đơn thông qua API Viettel
 * Sử dụng phương thức ký HSM (Hardware Security Module) cho bảo mật
 */
@Injectable()
export class ThirdPartyViettel implements ThirdParty, IViettelInvoice {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel?: Model<InvoiceDocument>,
    @InjectModel(InvoiceDetail.name)
    private readonly invoiceDetailModel?: Model<InvoiceDetailDocument>,
    private readonly invoiceHelper?: InvoiceHelper,
    private readonly viettelHelper?: ViettelHelper
  ) {}

  async getThirdParty(): Promise<ThirdPartyViettel> {
    return this;
  }
  /**
   * Login to Viettel API and get access token
   */
  async login(request: {
    username: string;
    password: string;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<ViettelAuthResponse> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );
      // Chuẩn bị dữ liệu đăng nhập với username và password
      const loginData = {
        username: request.username,
        password: request.password,
      };

      // Gửi request đăng nhập đến API Viettel
      const response = await new UtilsHttpServiceCustom(
        this.viettelHelper.buildApiUrl(
          apiPartner.apiViettelLogin,
          VIETTEL_CONSTANTS.API_ENDPOINTS.LOGIN
        ),
        loginData,
        null,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        "Content-Type": "application/json",
      });

      // Kiểm tra response có chứa access_token không
      if (!response || !response.access_token) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.UNAUTHORIZED,
            "Failed to authenticate with Viettel API"
          ),
          HttpStatus.UNAUTHORIZED
        );
      }

      // Trả về response chứa access_token
      return response;
    } catch (error) {
      // Xử lý lỗi và throw exception với thông tin chi tiết
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Viettel login failed: ${error.message}`
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /**
   * Export invoice to Viettel using HSM flow only
   */
  async export(request: {
    loginToPartNer: {
      token: string;
      data: any;
      partner_electronic_invoice_type: number;
    };
    invoice: Invoice;
    invoiceConvertPartnerViettelDTO: InvoiceConvertPartnerViettelDTO;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
  }): Promise<any> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      // Xuất hóa đơn qua HSM flow - chỉ một bước
      const viettelResponse: ViettelInvoiceCreateResponse =
        await this.createDraftInvoice(request, apiPartner);
      // Cập nhật thông tin hóa đơn sau khi xuất thành công
      await this.updateInvoiceAfterExport(request, viettelResponse);

      // Trả về response từ Viettel
      return viettelResponse;
    } catch (error) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Viettel export failed: ${error.message}`
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /**
   * Export invoice using HSM (single step)
   * Xuất hóa đơn sử dụng HSM (một bước duy nhất)
   */
  private async exportWithHsm(
    request: any,
    apiPartner: ApiPartNer
  ): Promise<ViettelInvoiceCreateResponse> {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    // Gửi request tạo hóa đơn với dữ liệu và token xác thực
    const data = await new UtilsHttpServiceCustom(
      apiPartNer.apiViettelCreate +
        request.restaurantPartnerInvoiceEntity.tax_code,
      request.invoiceConvertPartnerViettelDTO.viettelInvoiceExportDto,
      request.loginToPartNer.token,
      HttpServiceBase.getHttpServiceInstance()
    ).postWithHeader({
      "Content-Type": "application/json",
      Cookie: `access_token=${request.loginToPartNer.token}`,
    });
    return data;
  }

  /**
   * Create draft invoice (Chưa Phát Hành)
   * Tạo hóa đơn nháp trên hệ thống Viettel
   */
  private async createDraftInvoice(
    request: any,
    apiPartner: ApiPartNer
  ): Promise<ViettelInvoiceCreateResponse> {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    // Gửi request tạo hóa đơn nháp với dữ liệu và token xác thực
    const data = await new UtilsHttpServiceCustom(
      apiPartNer.apiViettelCreateDraft +
        request.restaurantPartnerInvoiceEntity.tax_code,
      request.invoiceConvertPartnerViettelDTO.viettelInvoiceExportDto,
      request.loginToPartNer.token,
      HttpServiceBase.getHttpServiceInstance()
    ).postWithHeader({
      "Content-Type": "application/json",
      Cookie: `access_token=${request.loginToPartNer.token}`,
    });
    return data;
  }

  /**
   * Create draft invoice preview (Xem trước hóa đơn nháp)
   * Tạo bản xem trước hóa đơn nháp trên hệ thống Viettel
   */
  private async createDraftInvoicePreview(
    request: any,
    apiPartner: ApiPartNer
  ): Promise<ViettelInvoiceCreateResponse> {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    // Gửi request xem trước hóa đơn nháp với dữ liệu và token xác thực
    const data = await new UtilsHttpServiceCustom(
      apiPartNer.apiViettelCreateDraftPreview +
        request.restaurantPartnerInvoiceEntity.tax_code,
      request.invoiceConvertPartnerViettelDTO.viettelInvoiceExportDto,
      request.loginToPartNer.token,
      HttpServiceBase.getHttpServiceInstance()
    ).postWithHeader({
      "Content-Type": "application/json",
      Cookie: `access_token=${request.loginToPartNer.token}`,
    });
    return data;
  }

  /**
   * Create draft invoice for fuel (Hóa đơn nháp cho nhiên liệu)
   * Tạo hóa đơn nháp cho nhiên liệu trên hệ thống Viettel
   */
  private async createDraftInvoiceForFuel(
    request: any,
    apiPartner: ApiPartNer
  ): Promise<ViettelInvoiceCreateResponse> {
    let apiPartNer: ApiPartNer = ApiPartNer.getInstance(
      request.restaurantPartnerInvoiceEntity
    );
    // Gửi request tạo hóa đơn nháp nhiên liệu với dữ liệu và token xác thực
    const data = await new UtilsHttpServiceCustom(
      apiPartNer.apiViettelCreateDraftForFuel +
        request.restaurantPartnerInvoiceEntity.tax_code,
      request.invoiceConvertPartnerViettelDTO.viettelInvoiceExportDto,
      request.loginToPartNer.token,
      HttpServiceBase.getHttpServiceInstance()
    ).postWithHeader({
      "Content-Type": "application/json",
      Cookie: `access_token=${request.loginToPartNer.token}`,
    });
    return data;
  }

  /**
   * Update invoice after successful export
   * Cập nhật thông tin hóa đơn sau khi xuất thành công
   */
  private async updateInvoiceAfterExport(
    request: any,
    viettelResponse: ViettelInvoiceCreateResponse
  ): Promise<void> {
    await this.invoiceModel.findByIdAndUpdate(request.invoice._id, {
      customer_name:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO.customer_name, // Tên khách hàng
      customer_phone:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO.customer_phone, // Số điện thoại khách hàng
      customer_company_name:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_company_name, // Tên công ty khách hàng
      customer_company_tax_code:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_company_tax_code, // Mã số thuế công ty
      customer_company_address:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_company_address, // Địa chỉ công ty
      customer_company_email:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_company_email, // Email công ty
      customer_bank_account:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_bank_account, // Số tài khoản ngân hàng
      customer_bank_account_name:
        request.invoiceConvertPartnerViettelDTO.exportInvoiceDTO
          .customer_company_name, // Tên chủ tài khoản
      ref_code: viettelResponse.result.transactionID, // Mã tham chiếu từ Viettel
      exported_time: UtilsDate.formatFullDateTimeInvoice(new Date()), // Thời gian xuất hóa đơn
      invoice_status: InvoiceStatusEnum.EXPORT, // Trạng thái hóa đơn: đã xuất
      voice_series: request.restaurantPartnerInvoiceEntity.invoice_series, // Ký hiệu hóa đơn
      partner_type:
        request.restaurantPartnerInvoiceEntity.partner_electronic_invoice_type, // Loại đối tác
      is_send_mail: 0, // Chưa gửi email
    });
  }

  /**
   * Cancel invoice in Viettel
   * Hủy hóa đơn trên hệ thống Viettel
   */
  async cancel(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    reason?: string;
  }): Promise<any> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );
      // Chuẩn bị dữ liệu để hủy hóa đơn
      const cancelFormData = new URLSearchParams({
        supplierTaxCode: request.restaurantPartnerInvoiceEntity.tax_code,
        templateCode: request.invoice.invoice_denominator || "",
        invoiceNo: `${request.invoice.voice_series}${request.invoice.invoice_number}`,
        strIssueDate: new Date(request.invoice.updatedAt).getTime().toString(),
        additionalReferenceDesc: request.reason || "Hủy hóa đơn",
        additionalReferenceDate: new Date().getTime().toString(),
        reasonDelete: request.reason || "Hủy hóa đơn",
      });

      // Gửi request hủy hóa đơn đến API Viettel
      const response: ViettelInvoiceCancelResponse =
        await new UtilsHttpServiceCustom(
          apiPartner.apiViettelCancel,
          cancelFormData,
          request.token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `access_token=${request.token}`,
        });

      // Cập nhật trạng thái hóa đơn trong database
      await this.invoiceModel.findByIdAndUpdate(request.invoiceId, {
        invoice_status: InvoiceStatusEnum.CANCEL, // Trạng thái: đã hủy
        cancelled_time: UtilsDate.formatFullDateTimeInvoice(new Date()), // Thời gian hủy
        cancel_reason: request.reason, // Lý do hủy
      });

      return response;
    } catch (error) {
      // Xử lý lỗi khi hủy hóa đơn thất bại
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Viettel cancel failed: ${error.message}`
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Update invoice payment status
   * Cập nhật trạng thái thanh toán hóa đơn
   */
  async update(request: {
    invoiceId: string;
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    updateData: ViettelInvoiceUpdateDto;
  }): Promise<any> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      // Gửi request cập nhật hóa đơn đến API Viettel
      const response = await new UtilsHttpServiceCustom(
        apiPartner.apiViettelUpdate,
        request.updateData,
        request.token,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        "Content-Type": "application/json",
        Cookie: `access_token=${request.token}`,
      });

      // Trả về response từ Viettel
      return response;
    } catch (error) {
      // Xử lý lỗi khi cập nhật hóa đơn thất bại
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Viettel update failed: ${error.message}`
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Get invoice detail from Viettel
   * Lấy thông tin chi tiết hóa đơn từ Viettel
   */
  async getDetail(request: {
    token: string;
    invoice: Invoice;
    restaurantPartnerInvoiceEntity: RestaurantPartnerInvoiceEntity;
    searchData: ViettelInvoiceSearchDto;
  }): Promise<any> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        request.restaurantPartnerInvoiceEntity
      );

      // Gửi request tìm kiếm hóa đơn đến API Viettel
      const response: ViettelInvoiceSearchResponse =
        await new UtilsHttpServiceCustom(
          apiPartner.apiViettelSearch,
          request.searchData,
          request.token,
          HttpServiceBase.getHttpServiceInstance()
        ).postWithHeader({
          "Content-Type": "application/json",
          Cookie: `access_token=${request.token}`,
        });
      // Trả về thông tin chi tiết hóa đơn
      return response;
    } catch (error) {
      // Xử lý lỗi khi lấy thông tin hóa đơn thất bại
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          `Viettel get detail failed: ${error.message}`
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
