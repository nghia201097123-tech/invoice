export class CheckAccountPartnerRequestDto {
  type: number;
  taxcode: string;
  username: string;
  password: string;
  usernameAccessService: string;
  passwordAccessService: string;
  endpoint: string;
}
