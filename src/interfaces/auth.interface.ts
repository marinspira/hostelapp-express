import { BackendResponse } from ".";
import { Types, Document } from 'mongoose';

export interface SendEmailCodeDTO {
  email: string;
  role: 'guest' | 'host';
}

export interface SendCodeResponse extends BackendResponse {
  success: true;
  message: string;
}

export interface VerifyEmailCodeDTO {
  email: string;
  code: string;
  role: 'guest' | 'host';
}

export interface VerifyCodeResponse extends BackendResponse<IUserDTO> {
  success: true;
  message: string;
  data: IUserDTO;
}

export interface IsAuthenticatedResponse extends BackendResponse<IUserDTO> {
  data: IUserDTO;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export interface IUser {
  role: string;
  name: string;
  email: string;
  isNewUser: boolean;
  isPremium?: boolean;
  premiumPlan?: 'basic' | 'premium' | 'enterprise';
  subscriptionActive?: boolean;
}

export interface IUserDTO extends IUser {
  id: string;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  sessionToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

