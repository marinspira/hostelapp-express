import bcrypt from 'bcrypt';
import { Document, Types } from 'mongoose';
import nodemailer from 'nodemailer';
import type { Response } from 'express';

import User from '../models/user.model.ts';
import Hostel from '../models/hostel.model.ts';
import Guest from '../models/guest.model.ts';
// @ts-ignore
import { generateToken } from '../utils/generateToken.js';
import { AuthRepository } from '../repositories/auth.repository.ts';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errors.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';
import {
  IsAuthenticatedResponse,
  ISendCodeResponse,
  IVerifyCodeResponse,
} from '../interfaces/auth.interface.ts';

interface IUserDocument extends Document {
  email: string;
  role: 'guest' | 'host';
  name?: string;
  sessionToken?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class AuthService {
  constructor(private readonly _authRepository: AuthRepository) {}

  async sendEmailCode(email: string, role: 'guest' | 'host'): Promise<ISendCodeResponse> {
    if (!email) throw new BadRequestError('Missing email');

    const emailLowercase = email.toLowerCase();

    // Check existing user & role
    const existingUser = await User.findOne({ email: emailLowercase });
    if (existingUser && role && existingUser.role !== role) {
      throw new BadRequestError(
        `This email is already registered as a ${existingUser.role}. Please login as ${existingUser.role} or use a different email.`
      );
    }

    // Special test emails
    if (
      emailLowercase === 'test@hostelapp.io' ||
      /^test\+hostel\d+@hostelapp\.io$/.test(emailLowercase)
    ) {
      const code = '120567';
      const codeHash = await bcrypt.hash(code, 10);
      await this._authRepository.upsertCode(
        emailLowercase,
        codeHash,
        new Date(Date.now() + 10 * 60 * 1000)
      );
      return { message: 'Code sent', success: true };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`[sendEmailCode] Code for ${emailLowercase}: ${code} (expires at ${expiresAt})`);

    await this._authRepository.upsertCode(emailLowercase, codeHash, expiresAt);

    await this.sendEmail({
      to: emailLowercase,
      subject: 'Your login code',
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });

    return { message: 'Code sent', success: true };
  }

  async verifyEmailCode(
    email: string,
    code: string,
    role: 'guest' | 'host'
  ): Promise<IVerifyCodeResponse> {
    if (!email || !code) throw new BadRequestError('Missing email or code');

    const emailLowercase = email.toLowerCase();
    const record = await this._authRepository.findByEmail(emailLowercase);
    if (!record) throw new BadRequestError('Code not found or expired');

    const match = await bcrypt.compare(code, record.codeHash);
    if (!match) throw new UnauthorizedError('Invalid code');

    // Remove used code
    await this._authRepository.deleteByEmail(emailLowercase);

    // Find or create user
    let user = (await User.findOne({ email: emailLowercase })) as IUserDocument | null;
    const isNewUser = !user;

    if (!user) {
      user = new User({ email: emailLowercase, role }) as IUserDocument;
      await user.save();
    } else if (user.role !== role) {
      throw new ConflictError(`This email is already registered as a ${user.role}`);
    }

    const sessionToken = generateToken(user._id);
    user.sessionToken = sessionToken;
    await user.save();

    return {
      data: {
        _id: (user._id as Types.ObjectId).toString() as string,
        name: user.name as string,
        isNewUser: isNewUser,
        role: user.role,
        email: user.email,
      },
      message: isNewUser ? 'New user created' : 'User logged in',
      success: true,
    };
  }

  async isAuthenticated(userId: string): Promise<IsAuthenticatedResponse> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const guest = await Guest.findOne({ user: user._id });
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

    return {
      data: {
        _id: (user._id as Types.ObjectId).toString() as string,
        name: user.name,
        role: user.role,
        email: user.email,
        isNewUser: !(guest?.birthday || hostel),
      },
      message: 'User is authenticated',
      success: true,
    };
  }

  async logout(userId: string): Promise<{ success: true; message: string }> {
    // Update user to remove session token
    await User.findByIdAndUpdate(userId, { $unset: { sessionToken: 1 } });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  private async sendEmail({ to, subject, text, html }: SendEmailParams): Promise<BackendResponse> {
    let transporter;

    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: !!process.env.SMTP_SECURE,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    } else {
      console.log('[sendEmail] SMTP not configured in production environment');
      throw new BadRequestError('SMTP not configured');
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('[sendEmail] Error sending email:', error);
      throw new BadRequestError('Error sending email');
    }

    return { success: true, message: 'Email sent' };
  }
}
