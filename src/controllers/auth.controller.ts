import { Route, Post, Body, Request, SuccessResponse, Security, Tags } from 'tsoa';

import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../repositories/auth.repository';
import type { AuthenticatedRequest } from '../interfaces/index.interface';
import type {
  IsAuthenticatedResponse,
  ILogoutResponse,
  ISendCodeResponse,
  ISendEmailCodeDTO,
  IVerifyCodeResponse,
  IVerifyEmailCodeDTO,
} from '../interfaces/auth.interface';

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
  async verifyEmailCode(
    @Body() body: IVerifyEmailCodeDTO,
    @Request() request: any
  ): Promise<IVerifyCodeResponse> {
    return await this.authService.verifyEmailCode(body.email, body.code, body.role, request);
  }

  @SuccessResponse(200, 'User is authenticated')
  @Security('jwt')
  @Post('is-authenticated')
  async isAuthenticated(@Request() req: AuthenticatedRequest): Promise<IsAuthenticatedResponse> {
    return this.authService.isAuthenticated(req.user._id);
  }

  @SuccessResponse(200, 'Logged out successfully')
  @Post('logout')
  @Security('jwt')
  async logout(
    @Request() req: AuthenticatedRequest,
    @Request() request: any
  ): Promise<ILogoutResponse> {
    const result = await this.authService.logout(req.user._id);

    // Clear cookie
    if (request.res) {
      request.res.cookie('jwt', '', { maxAge: 0 });
      request.res.clearCookie('jwt');
    }

    return result;
  }
}
