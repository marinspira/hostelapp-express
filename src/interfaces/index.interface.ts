import { Request } from 'express';

export interface BackendResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message: string;
}

export interface AuthenticatedRequest extends Request {
  user: any;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
