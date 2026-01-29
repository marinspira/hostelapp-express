import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';
import User from '../models/user.model.ts';
import Hostel from '../models/hostel.model.ts';
import Guest from '../models/guest.model.ts';
// @ts-ignore
import generateTokenAndSetCookie from '../utils/generateToken.js';
import { EmailCodeRepository } from '../repositories/auth.repository.ts';
import type { IUserDocument, SendEmailParams, SendEmailResult } from '../interfaces/auth.ts';

export class AuthService {
  private readonly _emailCodeRepo = new EmailCodeRepository();

  async sendEmailCode(email: string, role?: 'guest' | 'host') {
    if (!email) throw new Error('Missing email');

    const emailLowercase = email.toLowerCase();

    // Check existing user & role
    const existingUser = await User.findOne({ email: emailLowercase });
    if (existingUser && role && existingUser.role !== role) {
      throw new Error(
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
      await this._emailCodeRepo.upsertCode(
        emailLowercase,
        codeHash,
        new Date(Date.now() + 10 * 60 * 1000)
      );
      return { message: 'Code sent' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`[sendEmailCode] Code for ${emailLowercase}: ${code} (expires at ${expiresAt})`);

    await this._emailCodeRepo.upsertCode(emailLowercase, codeHash, expiresAt);

    await this.sendEmail({
      to: emailLowercase,
      subject: 'Your login code',
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });

    return { message: 'Code sent' };
  }

  async verifyEmailCode(
    email: string,
    code: string,
    role: 'guest' | 'host'
  ): Promise<IUserDocument> {
    if (!email || !code) throw new Error('Missing email or code');

    const emailLowercase = email.toLowerCase();
    const record = await this._emailCodeRepo.findByEmail(emailLowercase);
    if (!record) throw new Error('Code not found or expired');

    const match = await bcrypt.compare(code, record.codeHash);
    if (!match) throw new Error('Invalid code');

    // Remove used code
    await this._emailCodeRepo.deleteByEmail(emailLowercase);

    // Find or create user
    let user = (await User.findOne({ email: emailLowercase })) as IUserDocument | null;
    const isNewUser = !user;

    if (!user) {
      user = new User({ email: emailLowercase, role }) as IUserDocument;
      await user.save();

      // Add to HostelApp
      try {
        const hostelAppId = process.env.HOSTELAPP_OBJECT_ID;
        const hostel = await Hostel.findById(hostelAppId);
        if (hostel && !hostel?.user_id_guests?.includes(user._id as Types.ObjectId)) {
          hostel?.user_id_guests?.push(user._id as Types.ObjectId);
          await hostel.save();
          // TODO CHAT: Add to hostel-guest chat
          //   await initiateHostelGuestChat(hostel._id, user._id);
        }
      } catch (e) {
        console.error('Error adding new user to HostelApp:', e);
      }
    } else if (user.role !== role) {
      throw new Error(`This email is already registered as a ${user.role}`);
    }

    const sessionToken = generateTokenAndSetCookie(user._id);
    user.sessionToken = sessionToken;
    await user.save();

    return user;
  }

  async isAuthenticated(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const guest = await Guest.findOne({ user: user._id });
    const hostel = await Hostel.findOne({ user_id_owners: user._id });

    return {
      user,
      isNewUser: !(guest?.birthday || hostel),
    };
  }

  private async sendEmail({ to, subject, text, html }: SendEmailParams): Promise<SendEmailResult> {
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
      return { success: false };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject,
      text,
      html,
    });

    return { ...info, success: true };
  }
}
