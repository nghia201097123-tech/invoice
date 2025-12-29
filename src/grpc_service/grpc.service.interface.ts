import { Observable } from "rxjs/internal/Observable";
import { ValidateTokenRequest } from "./validate_token.request";
import { ValidateTokenResponse } from "./validate_tone.response";

export interface ValidateTokenService {
  isValid(request: ValidateTokenRequest): Observable<ValidateTokenResponse>;
}
