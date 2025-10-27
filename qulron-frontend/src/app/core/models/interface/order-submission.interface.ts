// Create interfaces for type safety
export interface OrderSubmissionRequest {
  orderNumber: string;
  // brokerName: string;
  state: string;
  driverName: string;
  phoneNumber: string;
}

export interface OrderSubmissionResponse {
  statusCode: number;
  message: string;
  ymsOrder?: any;
  error?: string;
}
