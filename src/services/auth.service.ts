import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';

import User from '../models/user.model';
import Hostel from '../models/hostel.model';
import Guest from '../models/guest.model';
import generateTokenAndSetCookie from '../utils/generateToken';
import { AuthRepository } from '../repositories/auth.repository';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { BackendResponse } from '../interfaces/index.interface';
import {
  IsAuthenticatedResponse,
  ISendCodeResponse,
  IUserDocument,
  IUserDTO,
  IVerifyCodeResponse,
} from '../interfaces/auth.interface';

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

    // In development mode, just log the code instead of sending email
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('='.repeat(50));
      console.log('🚀 DEVELOPMENT MODE - EMAIL NOT SENT');
      console.log('='.repeat(50));
      console.log(`To: ${emailLowercase}`);
      console.log(`Code: ${code}`);
      console.log(`Expires at: ${expiresAt}`);
      console.log('='.repeat(50));
      return { message: 'Code sent (development mode - check console)', success: true };
    }

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
    role: 'guest' | 'host',
    request: any
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

    const sessionToken = generateTokenAndSetCookie(user._id, request.res);
    user.sessionToken = sessionToken;
    await user.save();

    const responseData: IUserDTO = {
      _id: (user._id as Types.ObjectId).toString() as string,
      name: user.name,
      role: user.role,
      email: user.email,
      isNewUser,
    };

    return {
      data: responseData,
      message: isNewUser ? 'New user created' : 'User logged in',
      success: true,
    };
  }

  async isAuthenticated(userId: string): Promise<IsAuthenticatedResponse> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const userDTO: IUserDTO = {
      _id: (user._id as Types.ObjectId).toString(),
      name: user.name,
      role: user.role,
      email: user.email,
      isNewUser: user.isNewUser,
    };

    return {
      data: userDTO,
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
      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html,
      };
      
      console.log('[sendEmail] Sending email with options:', { 
        from: mailOptions.from, 
        to: mailOptions.to, 
        subject: mailOptions.subject 
      });
      
      const result = await transporter.sendMail(mailOptions);
      console.log('[sendEmail] Email sent successfully:', result.messageId);
    } catch (error: any) {
      console.error('[sendEmail] Error sending email:', {
        error: error.message,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        command: error.command
      });
      
      // Provide more specific error messages
      if (error.code === 'EENVELOPE') {
        throw new BadRequestError(`SMTP Authentication Error: ${error.response || 'Sender address rejected'}`);
      } else if (error.code === 'EAUTH') {
        throw new BadRequestError('SMTP Authentication failed. Check your email credentials.');
      } else {
        throw new BadRequestError(`Email sending failed: ${error.message}`);
      }
    }

    return { success: true, message: 'Email sent' };
  }
}
