import { Route, Post, Body, Request, SuccessResponse, Security, Tags } from 'tsoa';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { AuthRepository } from '../repositories/auth.repository.ts';
// @ts-ignore
import generateTokenAndSetCookie from '../utils/generateToken.js';
import type { AuthenticatedRequest } from '../interfaces/index.interface.ts';
import type {
  IsAuthenticatedResponse,
  ILogoutResponse,
  ISendCodeResponse,
  ISendEmailCodeDTO,
  IVerifyCodeResponse,
  IVerifyEmailCodeDTO,
} from '../interfaces/auth.interface.ts';

interface IAuthController {
  sendEmailCode(_body: ISendEmailCodeDTO): Promise<ISendCodeResponse>;
  verifyEmailCode(_body: IVerifyEmailCodeDTO, _request: any): Promise<IVerifyCodeResponse>;
  isAuthenticated(_req: AuthenticatedRequest): Promise<IsAuthenticatedResponse>;
  logout(_req: AuthenticatedRequest, _request: any): Promise<ILogoutResponse>;
}

@Route('/api/auth')
@Tags('Authentication')
export class AuthController implements IAuthController {
  private authService: AuthService;

  constructor() {
    const authRepository = new AuthRepository();
    this.authService = new AuthService(authRepository);
  }

  @SuccessResponse(200, 'Code sent successfully')
  @Post('send-code')
  async sendEmailCode(@Body() body: ISendEmailCodeDTO): Promise<ISendCodeResponse> {
    return this.authService.sendEmailCode(body.email, body.role);
  }

  @SuccessResponse(200, 'Code verified successfully')
  @Post('verify-code')
  async verifyEmailCode(@Body() body: IVerifyEmailCodeDTO, @Request() request: any): Promise<IVerifyCodeResponse> {
    const result = await this.authService.verifyEmailCode(body.email, body.code, body.role);
    
    // Set cookie with the session token
    if (result.data && request.res) {
      generateTokenAndSetCookie(result.data._id, request.res);
    }
    
    return result;
  }

  @SuccessResponse(200, 'User is authenticated')
  @Security('jwt')
  @Post('is-authenticated')
  async isAuthenticated(@Request() req: AuthenticatedRequest): Promise<IsAuthenticatedResponse> {
    const userId = req.user._id;
    return this.authService.isAuthenticated(userId);
  }

  @SuccessResponse(200, 'Logged out successfully')
  @Post('logout')
  async logout(@Request() req: AuthenticatedRequest, @Request() request: any): Promise<ILogoutResponse> {
    const result = await this.authService.logout(req.user._id);
    
    // Clear cookie
    if (request.res) {
      request.res.cookie('jwt', '', { maxAge: 0 });
      request.res.clearCookie('jwt');
    }
    
    return result;
  }
}
