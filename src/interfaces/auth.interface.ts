import { Types, Document } from 'mongoose';

import { BackendResponse } from './index.interface';

export interface ISendEmailCodeDTO {
  email: string;
  role: 'guest' | 'host';
}

export interface ISendCodeResponse extends BackendResponse {
  success: true;
  message: string;
}

export interface IVerifyEmailCodeDTO {
  email: string;
  code: string;
  role: 'guest' | 'host';
}

export interface IVerifyCodeResponse extends BackendResponse<IUserDocument> {
  success: true;
  message: string;
  data: IUserDocument;
}

export interface IsAuthenticatedResponse extends BackendResponse<IUserDTO> {
  data?: IUserDTO;
}

export interface ILogoutResponse {
  success: true;
  message: string;
}

export interface IErrorResponse {
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
  _id: string;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  sessionToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}
