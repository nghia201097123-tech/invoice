import { RestaurantPartnerInvoiceEntity } from "src/common/entities/restaurant-partner-invoice.entity";

export class ApiPartNer {
  private static instance: ApiPartNer = null;

  public apiFptCreate: string;
  public apiFptCancel: string;
  public apiFptSignIn: string;
  public apiFptGetInfo: string;
  public apiFptUpdate: string;
  public apiFptSigning: string;

  public apiMinVoiceCreate: string;
  public apiMinVoiceCancel: string;
  public apiMinVoiceSignIn: string;
  public apiMinVoiceGetInfo: string;
  public apiMinVoiceUpdate: string;
  public apiMinVoiceSign: string;

  public apiMifiCreate: string;
  public apiMifiCancel: string;
  public apiMifiUpdate: string;
  public apiMifiGetInfo: string;
  public apiMifiFkey: string;
  public apiMifiDeleteInvTemp: string;

  public apiCheckTaxCode: string =
    "http://mst.minvoice.com.vn/api/System/SearchTaxCode";

  public apiVnptPublish: string;
  public apiVnptBusiness: string;

  public apiMisaCreate: string;
  public apiMisaCancel: string;
  public apiMisaSignIn: string;
  public apiMisaGetInfo: string;
  public apiMisaUpdate: string;
  public apiMisaSigning: string;
  public apiMisaGetTemplate: string;
  public apiMisaGetInfoByRefIds: string;

  public apiHiloCreate: string;
  public apiHiloCancel: string;
  public apiHiloGetInfo: string;
  public apiHiloUpdate: string;
  public apiHiloSign: string;
  public apiHiloGetPdf: string;
  public apiHiloGetXml: string;
  public apiHiloAdjust: string;
  public apiHiloReplace: string;
  public apiHiloDelete: string;
  public apiHiloPublishWithAttachment: string;
  public apiHiloCheckConnect: string;

  public apiViettelLogin: string;
  public apiViettelCreate: string;
  public apiViettelCreateWithUSB: string;
  public apiViettelCancel: string;
  public apiViettelUpdate: string;
  public apiViettelSearch: string;
  public apiViettelGetInfo: string;
  public apiViettelSendEmail: string;
  public apiViettelCreateDraft: string;
  public apiViettelCreateDraftPreview: string;
  public apiViettelCreateDraftForFuel: string;

  public endpoint: string;
  /**
   * xài chung 1 link api hủy và gửi cct
   *  */
  private constructor(
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity
  ) {
    let endpoint = restaurantPartnerInvoiceEntity.endpoint;

    this.endpoint = endpoint;
    this.apiMinVoiceCreate = `${endpoint}/api/InvoiceApi78/SaveSign`;
    this.apiMinVoiceCancel = `${endpoint}/api/InvoiceApi78/HuyHoaDon`;
    this.apiMinVoiceSignIn = `${endpoint}/api/Account/Login`;
    this.apiMinVoiceGetInfo = `${endpoint}/api/InvoiceApi78/GetInfoInvoice`;
    this.apiMinVoiceUpdate = `${endpoint}/api/InvoiceApi78/DieuChinh`;
    this.apiMinVoiceSign = `${endpoint}/api/InvoiceApi78/Sign`;
    //================
    this.apiFptCreate = `${endpoint}/create-appr-inv`;
    this.apiFptCancel = `${endpoint}/cancel-invoice`;
    this.apiFptSignIn = `${endpoint}/c_signin`;
    this.apiFptGetInfo = `${endpoint}/search-invoice`;
    this.apiFptUpdate = `${endpoint}/adjust-invoice`;
    this.apiFptSigning = `${endpoint}/apprs`;
    //================
    this.apiMifiCreate = `${endpoint}/api/v2/invoice/importAndPublishInv`;
    this.apiMifiCancel = `${endpoint}/api/v2/invoice/CancelInvoice`;
    this.apiMifiUpdate = `${endpoint}/api/v2/invoice/ChangeInvoice`;
    this.apiMifiGetInfo = `${endpoint}/api/v2/invoice/GetInvoiceNoByFkey`;
    this.apiMifiFkey = `${endpoint}/api/v2/invoice/GetFkey`;
    this.apiMifiDeleteInvTemp = `${endpoint}/api/v3/invoice/deleteInvTemp`;
    //=================
    this.apiVnptPublish = `${endpoint}/PublishService.asmx`;
    this.apiVnptBusiness = `${endpoint}/BusinessService.asmx`;
    //=================d
    this.apiMisaCreate = `${endpoint}/api/integration/webapp/insert`;
    this.apiMisaCancel = `${endpoint}/api/integration/webapp/delete`;
    this.apiMisaSignIn = `${endpoint}/api/integration/webapp/token`;
    this.apiMisaGetTemplate = `${endpoint}/api/integration/webapp/templates`;
    this.apiMisaGetInfo = `${endpoint}/api/integration/webapp/paging`; //phải phát hành hóa đơn thì mới dùng api này lấy được danh sách để xem
    this.apiMisaGetInfoByRefIds = `${endpoint}/api/integration/webapp/getlist`; // lấy danh sách hóa đơn thường ( không phải ds hóa đơn từ máy tính tiền);
    // this.apiMisaUpdate = `${endpoint}/PublishService.asmx`;
    // this.apiMisaSigning = `${endpoint}/PublishService.asmx`;
    //=================
    this.apiHiloCreate = `${endpoint}/api/hoadon/xuathoadon`;
    this.apiHiloCancel = `${endpoint}/api/hoadon/huyhoadon`;
    this.apiHiloGetInfo = `${endpoint}/api/business/getInvInfo?`;
    this.apiHiloUpdate = `${endpoint}/api/hoadon/capnhathoadon`;
    this.apiHiloSign = `${endpoint}/api/hoadon/phathanhoadon`;
    this.apiHiloGetPdf = `${endpoint}/api/invoices/pdf`;
    this.apiHiloGetXml = `${endpoint}/api/invoices/xml`;
    this.apiHiloAdjust = `${endpoint}/api/hoadon/dieuchinh`;
    this.apiHiloReplace = `${endpoint}/api/hoadon/thaythehoadon`;
    this.apiHiloDelete = `${endpoint}/api/hoadon/xoahoadon`;
    this.apiHiloPublishWithAttachment = `${endpoint}/api/hoadon/phathanhoadonbangke`;
    this.apiHiloCheckConnect = `${endpoint}/api/convertinv/getpdf/?fkey='TESTLOGIN'&pattern=1&serial=99999`;
    //=================
    this.apiViettelLogin = `${endpoint}/auth/login`;
    this.apiViettelCreate = `${endpoint}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoice/`;
    this.apiViettelCreateWithUSB = `${endpoint}/createInvoiceWithUSBToken`;
    this.apiViettelCancel = `${endpoint}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/cancelTransactionInvoice`;
    this.apiViettelUpdate = `${endpoint}/updatePaymentStatus`;
    this.apiViettelSearch = `${endpoint}/searchInvoice`;
    this.apiViettelGetInfo = `${endpoint}/getInvoiceDetail`;
    this.apiViettelSendEmail = `${endpoint}/sendEmail`;
    this.apiViettelCreateDraft = `${endpoint}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createOrUpdateInvoiceDraft/`;
    this.apiViettelCreateDraftPreview = `${endpoint}/services/einvoiceapplication/api/InvoiceAPI/InvoiceUtilsWS/createInvoiceDraftPreview/`;
    this.apiViettelCreateDraftForFuel = `${endpoint}/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createOrUpdateInvoiceDraftForFuel/`;
  }

  public static getInstance(
    restaurantPartnerInvoiceEntity?: RestaurantPartnerInvoiceEntity
  ): ApiPartNer {
    this.instance = new ApiPartNer(restaurantPartnerInvoiceEntity);

    return this.instance;
  }
}
