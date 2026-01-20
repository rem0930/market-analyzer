/**
 * @what 認証HTTPコントローラー
 * @why 認証関連のエンドポイントを処理
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  RegisterUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  GetCurrentUserUseCase,
} from '../../usecase/index.js';
import type { ValidationMiddleware } from '../middleware/validation-middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/index.js';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  /**
   * POST /auth/register
   */
  async register(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, registerSchema);
    if (!validation.success) return;

    const { email, password } = validation.data;
    const requestId = crypto.randomUUID();

    const result = await this.registerUseCase.execute({
      email,
      password,
      causationId: requestId,
      correlationId: requestId,
    });

    if (result.isFailure()) {
      switch (result.error) {
        case 'invalid_email':
          this.sendError(res, 400, 'INVALID_EMAIL', 'Invalid email format');
          return;
        case 'weak_password':
          this.sendError(
            res,
            400,
            'WEAK_PASSWORD',
            'Password must be at least 8 characters with letters and numbers'
          );
          return;
        case 'email_already_exists':
          this.sendError(res, 409, 'EMAIL_EXISTS', 'Email already registered');
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 201, {
      id: result.value.id,
      email: result.value.email,
      createdAt: result.value.createdAt.toISOString(),
    });
  }

  /**
   * POST /auth/login
   */
  async login(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, loginSchema);
    if (!validation.success) return;

    const { email, password } = validation.data;

    const result = await this.loginUseCase.execute({ email, password });

    if (result.isFailure()) {
      switch (result.error) {
        case 'invalid_credentials':
          this.sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 200, {
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
      expiresIn: result.value.expiresIn,
      tokenType: 'Bearer',
    });
  }

  /**
   * POST /auth/logout
   */
  async logout(_req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    const result = await this.logoutUseCase.execute({ userId });

    if (result.isFailure()) {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
      return;
    }

    res.writeHead(204);
    res.end();
  }

  /**
   * POST /auth/refresh
   */
  async refresh(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, refreshSchema);
    if (!validation.success) return;

    const { refreshToken } = validation.data;

    const result = await this.refreshTokenUseCase.execute({ refreshToken });

    if (result.isFailure()) {
      switch (result.error) {
        case 'invalid_token':
        case 'token_expired':
        case 'user_not_found':
          this.sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 200, {
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
      expiresIn: result.value.expiresIn,
      tokenType: 'Bearer',
    });
  }

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, forgotPasswordSchema);
    if (!validation.success) return;

    const { email } = validation.data;

    const result = await this.forgotPasswordUseCase.execute({ email });

    if (result.isFailure()) {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
      return;
    }

    this.sendJson(res, 200, { message: result.value.message });
  }

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, resetPasswordSchema);
    if (!validation.success) return;

    const { token, newPassword } = validation.data;
    const requestId = crypto.randomUUID();

    const result = await this.resetPasswordUseCase.execute({
      token,
      password: newPassword,
      causationId: requestId,
      correlationId: requestId,
    });

    if (result.isFailure()) {
      switch (result.error) {
        case 'invalid_token':
        case 'token_expired':
          this.sendError(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
          return;
        case 'weak_password':
          this.sendError(
            res,
            400,
            'WEAK_PASSWORD',
            'Password must be at least 8 characters with letters and numbers'
          );
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 200, { message: result.value.message });
  }

  /**
   * GET /auth/me
   */
  async getCurrentUser(_req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    const result = await this.getCurrentUserUseCase.execute({ userId });

    if (result.isFailure()) {
      switch (result.error) {
        case 'user_not_found':
          this.sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 200, {
      id: result.value.id,
      email: result.value.email,
      createdAt: result.value.createdAt.toISOString(),
      updatedAt: result.value.updatedAt.toISOString(),
    });
  }

  private sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, status: number, code: string, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code, message }));
  }
}
