export class AuthenticationInit {
  static authenticationInit: AuthenticationInit = null;

  private access_token_minvoice: string;
  private access_token_fpt: string;

  private minvoice_expires_in: number;
  private fpt_expires_in: number;

  private constructor() {}

  public static getInstance() {
    if (this.authenticationInit === null) {
      this.authenticationInit = new AuthenticationInit();
    }
    return this.authenticationInit;
  }

  public getAccessTokenMinVoice() {
    return this.access_token_minvoice;
  }

  public setAccessTokenMinVoice(access_token_minvoice: string) {
    this.access_token_minvoice = access_token_minvoice;
  }

  public getAccessTokenFpt() {
    return this.access_token_fpt;
  }

  public setAccessTokenFpt(access_token_fpt: string) {
    this.access_token_fpt = access_token_fpt;
  }

  public setMinvoiceExpiresIn(minvoiceExpiresIn: number) {
    this.minvoice_expires_in = minvoiceExpiresIn;
  }

  public getMinvoiceExpiresIn() {
    return this.minvoice_expires_in;
  }

  public setFptExpiresIn(fptExpiresIn: number) {
    this.fpt_expires_in = fptExpiresIn;
  }

  public getFptExpiresIn() {
    return this.fpt_expires_in;
  }
}
