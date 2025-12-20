export interface BackendResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message: string;
}
