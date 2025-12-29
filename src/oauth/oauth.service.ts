import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { LoginOauthDTO } from "../common/dto/login.oauth.dto";
import { ApiPartNer } from "src/partner/api/api.partner.constant";
import { PartnerElectronicInvoiceTypeEnum } from "src/restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum";
import { AuthenticationInit } from "./account.init";
import { UtilsParamHttpService } from "src/common/utils/http-service/utils.params.http-service.common";
import { UtilsHttpService } from "src/common/utils/http-service/utils.http-service.common";
import { HttpServiceBase } from "src/common/utils/http-service/http-service";
import { ExceptionResponseDetail } from "src/common/utils/utils.exception.common/utils.exception.common";
import { UtilsHttpServiceCustom } from "src/common/utils/utils.middleware.common/utils.param.http.common/utils.param.http";
import { CacheService } from "../redis/services/cache.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class OauthService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Main login method with caching support
   * @param loginOauthDTO - Login credentials and partner information
   * @returns Authentication token and partner type
   */
  async login(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const { partnerElectronicInvoiceType } = loginOauthDTO;

    switch (partnerElectronicInvoiceType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        return this.handleMInvoiceLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.FPT:
        return this.handleFPTLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.MISA:
        return this.handleMISALogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.HILO:
        return this.handleHiloLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.VIETTEL:
        return this.handleViettelLogin(loginOauthDTO);
      default:
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.BAD_REQUEST,
            "Unsupported partner electronic invoice type"
          ),
          HttpStatus.BAD_REQUEST
        );
    }
  }
  async handleHiloLogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/hilo/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);
    if (cachedAuth) {
      try {
        return this.createAuthResponse(cachedAuth.token, 6);
      } catch (error) {
        await this.cacheService.deleteCache(cacheKey);
      }
    }

    const loginResponse = await this.performHiloLogin(loginOauthDTO);

    await this.cacheService.setCache(
      cacheKey,
      { token: loginResponse },
      "EX",
      86400
    );

    return {
      token: loginResponse,
      data: null,
      partner_electronic_invoice_type: 6,
    };
  }

  async handleViettelLogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/viettel/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);
    if (cachedAuth) {
      try {
        return this.createAuthResponse(cachedAuth.token, 7);
      } catch (error) {
        await this.cacheService.deleteCache(cacheKey);
      }
    }

    const loginResponse = await this.performViettelLogin(loginOauthDTO);

    await this.cacheService.setCache(
      cacheKey,
      { token: loginResponse.access_token },
      "EX",
      loginResponse.expires_in
    );

    return {
      token: loginResponse.access_token,
      data: null,
      partner_electronic_invoice_type: 7,
    };
  }

  /**
   * Login method for scheduled tasks with in-memory caching
   * @param loginOauthDTO - Login credentials and partner information
   * @returns Authentication token and partner type
   */
  async loginHandleForSchedule(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const { partnerElectronicInvoiceType } = loginOauthDTO;

    switch (partnerElectronicInvoiceType) {
      case PartnerElectronicInvoiceTypeEnum.M_INVOICE:
        return this.handleMInvoiceScheduleLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.FPT:
        return this.handleFPTScheduleLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.MISA:
        return this.handleMISAScheduleLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.HILO:
        return this.handleHiloLogin(loginOauthDTO);

      case PartnerElectronicInvoiceTypeEnum.VIETTEL:
        return this.handleViettelLogin(loginOauthDTO);

      default:
        break;
    }
  }

  /**
   * Handle M-Invoice login with Redis caching
   */
  private async handleMInvoiceLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/minvoice/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);

    if (cachedAuth && this.isTokenValid(cachedAuth)) {
      try {
        return this.createAuthResponse(cachedAuth.token, 1);
      } catch (error) {
        console.log("Cached token invalid, refreshing M-Invoice token");
        await this.cacheService.deleteCache(cacheKey);
      }
    }

    const loginResponse = await this.performMInvoiceLogin(loginOauthDTO);
    await this.cacheAuthData(cacheKey, loginResponse);

    return this.createAuthResponse(loginResponse.token, 1);
  }

  /**
   * Handle FPT login with Redis caching
   */
  private async handleFPTLogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/fpt/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);

    if (cachedAuth && this.isTokenValid(cachedAuth)) {
      try {
        return this.createAuthResponse(cachedAuth.token, 2);
      } catch (error) {
        console.log("Cached token invalid, refreshing FPT token");
        await this.cacheService.deleteCache(cacheKey);
      }
    }
    const loginResponse = await this.performFPTLogin(loginOauthDTO);
    const authData = {
      token: loginResponse,
      created_at: Date.now(),
      expires_in: Date.now(),
    };

    await this.cacheAuthData(cacheKey, authData);
    return this.createAuthResponse(authData.token, 2);
  }

  /**
   * Handle MISA login with Redis caching
   */
  private async handleMISALogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/misa/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);

    if (cachedAuth) {
      try {
        return this.createAuthResponse(cachedAuth.token, 5);
      } catch (error) {
        console.log("Cached token invalid, refreshing MISA token");
        await this.cacheService.deleteCache(cacheKey);
      }
    }

    const loginResponse = await this.performMISALogin(loginOauthDTO);

    if (loginResponse.error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: loginResponse.error,
        data: null,
      };
    }

    const data = JSON.parse(loginResponse.data);
    const authData = { token: data };

    await this.cacheService.setCache(
      cacheKey,
      authData,
      "EX",
      +data.expires_in
    );

    return {
      token: authData.token,
      data,
      partner_electronic_invoice_type: 5,
    };
  }

  /**
   * Handle M-Invoice login for scheduled tasks
   */
  private async handleMInvoiceScheduleLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const authInit = AuthenticationInit.getInstance();
    const cachedToken = authInit.getAccessTokenMinVoice();

    if (cachedToken && cachedToken !== "") {
      return this.createAuthResponse(cachedToken, 1);
    }

    try {
      const loginResponse = await this.performMInvoiceLogin(loginOauthDTO);
      authInit.setAccessTokenMinVoice(loginResponse.token);
      return this.createAuthResponse(loginResponse.token, 1);
    } catch (error) {
      console.error("M-Invoice schedule login error:", error);
      throw error;
    }
  }

  /**
   * Handle FPT login for scheduled tasks
   */
  private async handleFPTScheduleLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const authInit = AuthenticationInit.getInstance();
    const cachedToken = authInit.getAccessTokenFpt();

    if (cachedToken && cachedToken !== "") {
      return this.createAuthResponse(cachedToken, 2);
    }

    try {
      const loginResponse = await this.performFPTLogin(loginOauthDTO);
      authInit.setAccessTokenFpt(loginResponse);
      return this.createAuthResponse(loginResponse, 2);
    } catch (error) {
      console.error("FPT schedule login error:", error);
      throw error;
    }
  }

  /**
   * Handle MISA login for scheduled tasks
   */
  private async handleMISAScheduleLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const cacheKey = `techres/${loginOauthDTO.restaurantPartnerInvoiceEntity.restaurant_id}/invoice/misa/third_party/auth`;
    const cachedAuth = await this.getCachedAuth(cacheKey);

    if (cachedAuth) {
      try {
        return this.createAuthResponse(cachedAuth.token, 5);
      } catch (error) {
        console.log("Cached token invalid, refreshing MISA token");
        await this.cacheService.deleteCache(cacheKey);
      }
    }
    const loginResponse = await this.performMISALoginWithHeader(loginOauthDTO);

    if (loginResponse.error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: loginResponse.error,
        data: null,
      };
    }

    const data = JSON.parse(loginResponse.data);
    const authData = { token: data };

    await this.cacheService.setCache(
      cacheKey,
      authData,
      "EX",
      +data.expires_in
    );

    return {
      token: authData.token,
      data,
      partner_electronic_invoice_type: 5,
    };
  }
  /**
   * Get cached authentication data
   */
  private async getCachedAuth(cacheKey: string): Promise<any> {
    return await this.cacheService.getCachedData(cacheKey);
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(cachedAuth: any): boolean {
    if (!cachedAuth.created_at || !cachedAuth.expires_in) {
      return false;
    }
    return Date.now() - cachedAuth.created_at < cachedAuth.expires_in;
  }

  /**
   * Cache authentication data
   */
  private async cacheAuthData(cacheKey: string, authData: any): Promise<void> {
    try {
      const dataToCache = {
        ...authData,
        created_at: authData.created_at || Date.now(),
        expires_in: authData.expires_in || Date.now(),
      };
      await this.cacheService.setCache(cacheKey, dataToCache);
    } catch (error) {
      console.error("Cache storage error:", error);
    }
  }

  /**
   * Create standardized authentication response
   */
  private createAuthResponse(token: any, partnerType: number): any {
    return {
      token,
      partner_electronic_invoice_type: partnerType,
    };
  }

  /**
   * Perform M-Invoice login API call
   */
  private async performMInvoiceLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const params = new UtilsParamHttpService(loginOauthDTO).getData();
    const apiPartner = ApiPartNer.getInstance(
      loginOauthDTO.restaurantPartnerInvoiceEntity
    );

    const response = await new UtilsHttpService(
      apiPartner.apiMinVoiceSignIn,
      params,
      null,
      HttpServiceBase.getHttpServiceInstance()
    ).post();

    if ("error" in response) {
      throw new HttpException(
        new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, "Login failed"),
        HttpStatus.BAD_REQUEST
      );
    }

    return response.data;
  }

  /**
   * Perform FPT login API call
   */
  private async performFPTLogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const params = new UtilsParamHttpService(loginOauthDTO).getData();
    const apiPartner = ApiPartNer.getInstance(
      loginOauthDTO.restaurantPartnerInvoiceEntity
    );

    try {
      return await new UtilsHttpService(
        apiPartner.apiFptSignIn,
        params,
        null,
        HttpServiceBase.getHttpServiceInstance()
      ).post();
    } catch (error) {
      throw new HttpException(
        new ExceptionResponseDetail(
          HttpStatus.BAD_REQUEST,
          error.message || "FPT login failed"
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Perform MISA login API call
   */
  private async performMISALogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const apiPartner = ApiPartNer.getInstance(
      loginOauthDTO.restaurantPartnerInvoiceEntity
    );

    return await new UtilsHttpServiceCustom(
      apiPartner.apiMisaSignIn,
      {
        taxcode: loginOauthDTO.taxcode,
        username: loginOauthDTO.username,
        password: loginOauthDTO.password,
      },
      null,
      HttpServiceBase.getHttpServiceInstance()
    ).post();
  }

  private async performHiloLogin(loginOauthDTO: LoginOauthDTO): Promise<any> {
    const apiPartner = ApiPartNer.getInstance(
      loginOauthDTO.restaurantPartnerInvoiceEntity
    );
    const authentString = `${loginOauthDTO.username}:${
      loginOauthDTO.password
    }:${uuidv4()}`;
    const encoded = Buffer.from(authentString).toString("base64");

    const loginResponse = await new UtilsHttpServiceCustom(
      apiPartner.apiHiloCheckConnect,
      {
        taxcode: loginOauthDTO.taxcode,
        username: loginOauthDTO.username,
        password: loginOauthDTO.password,
      },
      null,
      HttpServiceBase.getHttpServiceInstance()
    ).getWithHeader({
      "Content-Type": "application/json",
      taxcode: loginOauthDTO.taxcode,
      Authentication: encoded,
    });

    if ("Code" in loginResponse) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: loginResponse.messages,
        data: null,
      };
    }

    return encoded;
  }

  private async performViettelLogin(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    try {
      // Lấy instance API partner từ thông tin nhà hàng
      const apiPartner: ApiPartNer = ApiPartNer.getInstance(
        loginOauthDTO.restaurantPartnerInvoiceEntity
      );
      // Chuẩn bị dữ liệu đăng nhập với username và password
      const loginData = {
        username: loginOauthDTO.username,
        password: loginOauthDTO.password,
      };

      // Gửi request đăng nhập đến API Viettel
      const response = await new UtilsHttpServiceCustom(
        apiPartner.apiViettelLogin,
        loginData,
        null,
        HttpServiceBase.getHttpServiceInstance()
      ).postWithHeader({
        "Content-Type": "application/json",
      });

      // Kiểm tra response có chứa access_token không
      if (
        response.status === HttpStatus.UNAUTHORIZED ||
        !response.access_token
      ) {
        throw new HttpException(
          new ExceptionResponseDetail(
            HttpStatus.UNAUTHORIZED,
            "Failed to authenticate with Viettel API"
          ),
          HttpStatus.BAD_REQUEST
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
   * Perform MISA login API call with custom headers
   */
  private async performMISALoginWithHeader(
    loginOauthDTO: LoginOauthDTO
  ): Promise<any> {
    const apiPartner = ApiPartNer.getInstance(
      loginOauthDTO.restaurantPartnerInvoiceEntity
    );

    return await new UtilsHttpServiceCustom(
      apiPartner.apiMisaSignIn,
      {
        taxcode: loginOauthDTO.taxcode,
        username: loginOauthDTO.username,
        password: loginOauthDTO.password,
      },
      null,
      HttpServiceBase.getHttpServiceInstance()
    ).postWithHeader({
      "Content-Type": "application/json",
      taxcode: loginOauthDTO.taxcode,
    });
  }
}
