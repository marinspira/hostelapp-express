import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
// @ts-ignore
import { sendEmailCode, verifyEmailCode } from './auth.controllers.js';
// @ts-ignore
import User from '../models/user.model.ts';
// @ts-ignore
import EmailCode from '../models/emailCode.model.ts';
// mocks
jest.mock('../services/auth/sendEmail.js', () => jest.fn());
jest.mock('../utils/generateToken.js', () => jest.fn(() => 'fake-session-token'));
jest.mock('../services/chat/privateChatManager.js', () => ({
  initiateHostelGuestChat: jest.fn(),
}));
// @ts-ignore
import sendEmail from '../services/auth/sendEmail.js';
// @ts-ignore
import generateTokenAndSetCookie from '../utils/generateToken.js';

let mongoServer: MongoMemoryServer;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
  await EmailCode.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('sendEmailCode', () => {
  it('returns 400 if email is missing', async () => {
    const req: any = { body: {} };
    const res = mockRes();

    await sendEmailCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing email',
    });
  });

  it('creates fixed code for test email', async () => {
    const req: any = {
      body: { email: 'test@hostelapp.io' },
    };
    const res = mockRes();

    await sendEmailCode(req, res);

    const record = await EmailCode.findOne({ email: 'test@hostelapp.io' });

    expect(record).toBeTruthy();
    expect(await bcrypt.compare('120567', record!.codeHash)).toBe(true);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('generates code and sends email for normal email', async () => {
    const req: any = {
      body: { email: 'user@test.com' },
    };
    const res = mockRes();

    await sendEmailCode(req, res);

    const record = await EmailCode.findOne({ email: 'user@test.com' });

    expect(record).toBeTruthy();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('fails if existing user role does not match', async () => {
    await User.create({
      email: 'role@test.com',
      role: 'guest',
    });

    const req: any = {
      body: { email: 'role@test.com', role: 'host' },
    };
    const res = mockRes();

    await sendEmailCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });
});

describe('verifyEmailCode', () => {
  it('returns 400 if code record does not exist', async () => {
    const req: any = {
      body: { email: 'missing@test.com', code: '123456' },
    };
    const res = mockRes();

    await verifyEmailCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 if code is invalid', async () => {
    const hash = await bcrypt.hash('123456', 10);

    await EmailCode.create({
      email: 'code@test.com',
      codeHash: hash,
      expiresAt: new Date(Date.now() + 60000),
    });

    const req: any = {
      body: { email: 'code@test.com', code: '000000' },
    };
    const res = mockRes();

    await verifyEmailCode(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('creates new user and logs in', async () => {
    const hash = await bcrypt.hash('654321', 10);

    await EmailCode.create({
      email: 'new@test.com',
      codeHash: hash,
      expiresAt: new Date(Date.now() + 60000),
    });

    const req: any = {
      body: {
        email: 'new@test.com',
        code: '654321',
        role: 'guest',
      },
    };
    const res = mockRes();

    await verifyEmailCode(req, res);

    const user = await User.findOne({ email: 'new@test.com' });

    expect(user).toBeTruthy();
    expect(generateTokenAndSetCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks login if role does not match existing user', async () => {
    const user = await User.create({
      email: 'existing@test.com',
      role: 'guest',
    });

    const hash = await bcrypt.hash('999999', 10);

    await EmailCode.create({
      email: user.email,
      codeHash: hash,
      expiresAt: new Date(Date.now() + 60000),
    });

    const req: any = {
      body: {
        email: user.email,
        code: '999999',
        role: 'host',
      },
    };
    const res = mockRes();

    await verifyEmailCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
