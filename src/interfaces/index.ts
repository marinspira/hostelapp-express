import { Request } from 'express';

export interface BackendResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message: string;
}

export interface AuthenticatedRequest extends Request {
  user: any;
}
