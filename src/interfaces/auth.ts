import { Document } from 'mongoose';
import { SentMessageInfo } from 'nodemailer';

export interface IEmailCode {
  email: string;
  codeHash: string;
  expiresAt: Date;
}

export interface IUserDocument extends Document {
  email: string;
  role: 'guest' | 'host';
  name?: string;
  sessionToken?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult extends SentMessageInfo {
  success: boolean;
}