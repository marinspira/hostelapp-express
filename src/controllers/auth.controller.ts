import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { AuthenticatedRequest } from '../interfaces/index.ts';

const authService = new AuthService();

export class AuthController {
  sendEmailCode = async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      const result = await authService.sendEmailCode(email, role);
      res.status(200).json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  };

  verifyEmailCode = async (req: Request, res: Response) => {
    try {
      const { email, code, role } = req.body;
      const user = await authService.verifyEmailCode(email, code, role);
      res.status(200).json({
        success: true,
        message: 'Logged in',
        data: {
          name: user.name,
          isNewUser: false,
          role: user.role,
          email: user.email,
          id: user._id,
        },
      });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  };

  isAuthenticated = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user._id; 
      const { user, isNewUser } = await authService.isAuthenticated(userId);
      res.status(200).json({
        success: true,
        message: 'User authenticated',
        data: {
          name: user.name,
          isNewUser,
          role: user.role,
          email: user.email,
          id: user._id,
        },
      });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  };

  logout = async (_req: Request, res: Response) => {
    res.cookie('jwt', '', { maxAge: 0 });
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  };
}