export class ValidateTokenRequest {
  token: string;

  constructor(token: string) {
    this.token = token ? "" : token;
  }
}
