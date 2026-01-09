import bcrypt from 'bcrypt';

import User from '../models/user.model.ts';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import Hostel from '../models/hostel.model.ts';
import Guest from '../models/guest.model.ts';
import EmailCode from '../models/emailCode.model.ts';
import sendEmail from '../services/auth/sendEmail.js';
import { initiateHostelGuestChat } from '../services/chat/privateChatManager.js';

export const sendEmailCode = async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ message: 'Missing email', success: false });

  const emailLowercase = email.toLowerCase();

  // Check if user exists and validate role
  const existingUser = await User.findOne({ email: emailLowercase });
  if (existingUser && role && existingUser.role !== role) {
    const currentRoleName = existingUser.role === 'guest' ? 'guest' : 'host';
    const attemptedRoleName = role === 'guest' ? 'guest' : 'host';

    return res.status(400).json({
      success: false,
      message: `This email is already registered as a ${currentRoleName}. Please login as a ${currentRoleName} or use a different email to create a ${attemptedRoleName} account.`,
    });
  }

  // Special case for testing emails (test@hostelapp.io and test+hostel{timestamp}@hostelapp.io)
  if (
    emailLowercase === 'test@hostelapp.io' ||
    /^test\+hostel\d+@hostelapp\.io$/.test(emailLowercase)
  ) {
    const code = '120567';
    const codeHash = await bcrypt.hash(code, 10);

    await EmailCode.findOneAndUpdate(
      { email: emailLowercase },
      { codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Code sent' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  console.log(
    `[sendEmailCode] Code for ${emailLowercase}: ${code} (expires at ${expiresAt.toLocaleString()})`
  );

  // upsert code
  await EmailCode.findOneAndUpdate(
    { email: emailLowercase },
    { codeHash, expiresAt },
    { upsert: true, new: true }
  );

  // send email
  try {
    await sendEmail({
      to: emailLowercase,
      subject: 'Your login code',
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });
  } catch (e) {
    console.error('Failed to send verification email', e);
  }

  return res.status(200).json({ success: true, message: 'Code sent' });
};

export const verifyEmailCode = async (req, res) => {
  const { email, code, role } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: 'Missing email or code', success: false });

  const emailLowercase = email.toLowerCase();

  const record = await EmailCode.findOne({ email: emailLowercase });
  if (!record)
    return res.status(400).json({ message: 'Code not found or expired', success: false });

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) return res.status(401).json({ message: 'Invalid code', success: false });

  // remove used code
  try {
    await EmailCode.deleteOne({ email: emailLowercase });
  } catch (e) {
    console.error('Failed to delete used email code', e);
  }

  // find or create user
  let user = await User.findOne({ email: emailLowercase });

  if (!user) {
    user = new User({ email: emailLowercase, role });
    await user.save();

    // Add to HostelApp
    try {
      const hostelAppId = process.env.HOSTELAPP_OBJECT_ID;
      const hostel = await Hostel.findById(hostelAppId);

      // Add to HostelApp as guets
      if (!hostel.user_id_guests.includes(user._id)) {
        hostel.user_id_guests.push(user._id);
        await hostel.save();

        // Add to HostelApp group chat
        await initiateHostelGuestChat(hostel._id, user._id);
      }
    } catch (error) {
      console.error('Error adding new user to HostelApp:', error);
    }
  } else {
    // Validate role for existing user
    if (user.role !== role) {
      const currentRoleName = user.role === 'guest' ? 'guest' : 'host';
      const attemptedRoleName = role === 'guest' ? 'guest' : 'host';

      return res.status(400).json({
        success: false,
        message: `This email is already registered as a ${currentRoleName}. Please login as a ${currentRoleName} or use a different email to create a ${attemptedRoleName} account.`,
      });
    }
  }

  const sessionToken = generateTokenAndSetCookie(user._id, res);
  user.sessionToken = sessionToken;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { name: user.name, isNewUser: true, role: user.role, sessionToken },
  });
};

export const isAuthenticated = async (req, res) => {
  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });
  const hostel = await Hostel.findOne({ user_id_owners: user.id });

  if ((guest && guest.birthday) || hostel) {
    return res.status(200).json({
      data: {
        name: user.name,
        isNewUser: false,
        role: user.role,
      },
      success: true,
      message: 'User authenticated successfully',
    });
  } else {
    return res.status(200).json({
      data: {
        name: user.name,
        isNewUser: true,
        role: user.role,
      },
      success: true,
      message: 'New user authenticated successfully',
    });
  }
};

export const logout = async (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 });

  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'strict',
  });

  res.status(200).json({
    message: 'Logged out successfully',
    success: true,
  });
};
