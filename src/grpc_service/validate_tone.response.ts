import { ValidateDataResponse } from "./validate_data.response";

export interface ValidateTokenResponse {
  status: number;

  message: string;

  data: ValidateDataResponse;
}
