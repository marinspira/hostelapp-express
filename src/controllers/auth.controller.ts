import { AuthService } from '../services/auth.service.ts';
import { AuthRepository } from '../repositories/auth.repository.ts';
import type { AuthenticatedRequest } from '../interfaces/index.ts';
import { Route, Post, Body, Request, SuccessResponse, Security } from 'tsoa';
import type {
  IsAuthenticatedResponse,
  LogoutResponse,
  SendCodeResponse,
  SendEmailCodeDTO,
  VerifyCodeResponse,
  VerifyEmailCodeDTO,
} from '../interfaces/auth.interface.ts';

interface IAuthController {
  sendEmailCode(body: SendEmailCodeDTO): Promise<SendCodeResponse>;
  verifyEmailCode(body: VerifyEmailCodeDTO): Promise<VerifyCodeResponse>;
  isAuthenticated(req: AuthenticatedRequest): Promise<IsAuthenticatedResponse>;
  logout(req: AuthenticatedRequest): Promise<LogoutResponse>;
}

@Route('/api/auth')
export class AuthController implements IAuthController {
  private authService: AuthService;

  constructor() {
    const authRepository = new AuthRepository();
    this.authService = new AuthService(authRepository);
  }

  @SuccessResponse(200, 'Code sent successfully')
  @Post('send-code')
  async sendEmailCode(@Body() body: SendEmailCodeDTO): Promise<SendCodeResponse> {
    return this.authService.sendEmailCode(body.email, body.role);
  }

  @SuccessResponse(200, 'Code verified successfully')
  @Post('verify-code')
  async verifyEmailCode(@Body() body: VerifyEmailCodeDTO): Promise<VerifyCodeResponse> {
    return this.authService.verifyEmailCode(body.email, body.code, body.role);
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
  async logout(@Request() req: AuthenticatedRequest): Promise<LogoutResponse> {
    return this.authService.logout(req.user._id);
  }
}
