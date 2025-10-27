export interface DriverAuthRequest {
  phoneNumber: string;
  verificationCode?: string;
}

export interface DriverAuthResponse {
  statusCode: number;
  error?: string;
  message: string;
  token: string;
  hasTrailer: string;
  phoneNumber?: string;
  verificationCode?: string;
  driverName?: string;
}
