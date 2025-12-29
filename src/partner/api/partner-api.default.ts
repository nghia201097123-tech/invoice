export class PartnerApiDefault {
  public CONFIG_VNPT_INVOICE_LOGIN_PATH: string = "/BusinessService.asmx";
  public CONFIG_FPT_INVOICE_LOGIN_PATH: string = "/c_signin";
  public CONFIG_MINVOCE_INVOICE_LOGIN_PATH: string = "/api/Account/Login";
  public CONFIG_MIFI_INVOICE_LOGIN_PATH: string =
    "/api/v3/invoice/deleteInvTemp";
  public CONFIG_MISA_INVOICE_LOGIN_PATH: string =
    "/api/integration/webapp/token";
  public CONFIG_HILO_INVOICE_LOGIN_PATH: string =
    "/api/convertinv/getpdf?fkey='TESTLOGIN'&pattern=1&serial=99999";
  public CONFIG_VIETTEL_INVOICE_LOGIN_PATH: string = "/auth/login";

  public constructor() {
    if (process.env.CONFIG_VNPT_INVOICE_LOGIN_PATH) {
      this.CONFIG_VNPT_INVOICE_LOGIN_PATH =
        process.env.CONFIG_VNPT_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_FPT_INVOICE_LOGIN_PATH) {
      this.CONFIG_FPT_INVOICE_LOGIN_PATH =
        process.env.CONFIG_FPT_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_MINVOCE_INVOICE_LOGIN_PATH) {
      this.CONFIG_MINVOCE_INVOICE_LOGIN_PATH =
        process.env.CONFIG_MINVOCE_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_MIFI_INVOICE_LOGIN_PATH) {
      this.CONFIG_MIFI_INVOICE_LOGIN_PATH =
        process.env.CONFIG_MIFI_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_MISA_INVOICE_LOGIN_PATH) {
      this.CONFIG_MISA_INVOICE_LOGIN_PATH =
        process.env.CONFIG_MISA_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_HILO_INVOICE_LOGIN_PATH) {
      this.CONFIG_HILO_INVOICE_LOGIN_PATH =
        process.env.CONFIG_HILO_INVOICE_LOGIN_PATH;
    }
    if (process.env.CONFIG_VIETTEL_INVOICE_LOGIN_PATH) {
      this.CONFIG_VIETTEL_INVOICE_LOGIN_PATH =
        process.env.CONFIG_VIETTEL_INVOICE_LOGIN_PATH;
    }
  }
}
