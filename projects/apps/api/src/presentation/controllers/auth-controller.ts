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
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson, sendNoContent } from '../middleware/error-handler.js';

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
  async register(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, registerSchema);
      if (!validation.success) return;

      const { email, password } = validation.data;

      const result = await this.registerUseCase.execute({
        email,
        password,
        causationId: requestId,
        correlationId: requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_email':
            throw AppError.validation([{ field: 'email', code: 'INVALID_FORMAT' }], {
              reason: 'INVALID_EMAIL',
            });
          case 'weak_password':
            throw AppError.validation([{ field: 'password', code: 'WEAK_PASSWORD' }], {
              reason: 'WEAK_PASSWORD',
            });
          case 'email_already_exists':
            throw AppError.conflict('EMAIL_EXISTS');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(
        res,
        201,
        {
          id: result.value.id,
          email: result.value.email,
          createdAt: result.value.createdAt.toISOString(),
        },
        requestId
      );
    });
  }

  /**
   * POST /auth/login
   */
  async login(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, loginSchema);
      if (!validation.success) return;

      const { email, password } = validation.data;

      const result = await this.loginUseCase.execute({ email, password });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_credentials':
            throw AppError.unauthorized('INVALID_CREDENTIALS');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(
        res,
        200,
        {
          accessToken: result.value.accessToken,
          refreshToken: result.value.refreshToken,
          expiresIn: result.value.expiresIn,
          tokenType: 'Bearer',
        },
        requestId
      );
    });
  }

  /**
   * POST /auth/logout
   */
  async logout(
    _req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.logoutUseCase.execute({ userId });

      if (result.isFailure()) {
        throw AppError.fromUnknown(new Error(result.error));
      }

      sendNoContent(res, requestId);
    });
  }

  /**
   * POST /auth/refresh
   */
  async refresh(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, refreshSchema);
      if (!validation.success) return;

      const { refreshToken } = validation.data;

      const result = await this.refreshTokenUseCase.execute({ refreshToken });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_token':
            throw AppError.unauthorized('INVALID_TOKEN');
          case 'token_expired':
            throw AppError.unauthorized('TOKEN_EXPIRED');
          case 'user_not_found':
            throw AppError.unauthorized('INVALID_TOKEN');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(
        res,
        200,
        {
          accessToken: result.value.accessToken,
          refreshToken: result.value.refreshToken,
          expiresIn: result.value.expiresIn,
          tokenType: 'Bearer',
        },
        requestId
      );
    });
  }

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, forgotPasswordSchema);
      if (!validation.success) return;

      const { email } = validation.data;

      const result = await this.forgotPasswordUseCase.execute({ email });

      if (result.isFailure()) {
        throw AppError.fromUnknown(new Error(result.error));
      }

      sendJson(res, 200, { message: result.value.message }, requestId);
    });
  }

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, resetPasswordSchema);
      if (!validation.success) return;

      const { token, newPassword } = validation.data;

      const result = await this.resetPasswordUseCase.execute({
        token,
        password: newPassword,
        causationId: requestId,
        correlationId: requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_token':
            throw AppError.validation([{ field: 'token', code: 'INVALID_FORMAT' }], {
              reason: 'INVALID_TOKEN',
            });
          case 'token_expired':
            throw AppError.validation([{ field: 'token', code: 'INVALID_FORMAT' }], {
              reason: 'TOKEN_EXPIRED',
            });
          case 'weak_password':
            throw AppError.validation([{ field: 'password', code: 'WEAK_PASSWORD' }], {
              reason: 'WEAK_PASSWORD',
            });
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, { message: result.value.message }, requestId);
    });
  }

  /**
   * GET /auth/me
   */
  async getCurrentUser(
    _req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getCurrentUserUseCase.execute({ userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'user_not_found':
            throw AppError.notFound('USER_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(
        res,
        200,
        {
          id: result.value.id,
          email: result.value.email,
          createdAt: result.value.createdAt.toISOString(),
          updatedAt: result.value.updatedAt.toISOString(),
        },
        requestId
      );
    });
  }
}
