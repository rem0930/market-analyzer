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

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase
  ) {}

  /**
   * POST /auth/register
   */
  async register(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseJsonBody(req);

      const email = body.email;
      const password = body.password;

      if (typeof email !== 'string' || typeof password !== 'string') {
        this.sendError(res, 400, 'VALIDATION_ERROR', 'Missing required fields: email, password');
        return;
      }

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
            this.sendError(res, 400, 'WEAK_PASSWORD', 'Password must be at least 8 characters with letters and numbers');
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
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * POST /auth/login
   */
  async login(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseJsonBody(req);

      const email = body.email;
      const password = body.password;

      if (typeof email !== 'string' || typeof password !== 'string') {
        this.sendError(res, 400, 'VALIDATION_ERROR', 'Missing required fields: email, password');
        return;
      }

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
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * POST /auth/logout
   */
  async logout(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string
  ): Promise<void> {
    try {
      const result = await this.logoutUseCase.execute({ userId });

      if (result.isFailure()) {
        this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
        return;
      }

      res.writeHead(204);
      res.end();
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * POST /auth/refresh
   */
  async refresh(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseJsonBody(req);

      const refreshToken = body.refreshToken;

      if (typeof refreshToken !== 'string') {
        this.sendError(res, 400, 'VALIDATION_ERROR', 'Missing required field: refreshToken');
        return;
      }

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
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseJsonBody(req);

      const email = body.email;

      if (typeof email !== 'string') {
        this.sendError(res, 400, 'VALIDATION_ERROR', 'Missing required field: email');
        return;
      }

      const result = await this.forgotPasswordUseCase.execute({ email });

      if (result.isFailure()) {
        this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
        return;
      }

      this.sendJson(res, 200, { message: result.value.message });
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseJsonBody(req);

      const token = body.token;
      const password = body.password;

      if (typeof token !== 'string' || typeof password !== 'string') {
        this.sendError(res, 400, 'VALIDATION_ERROR', 'Missing required fields: token, password');
        return;
      }

      const requestId = crypto.randomUUID();

      const result = await this.resetPasswordUseCase.execute({
        token,
        password,
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
            this.sendError(res, 400, 'WEAK_PASSWORD', 'Password must be at least 8 characters with letters and numbers');
            return;
          default:
            this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
            return;
        }
      }

      this.sendJson(res, 200, { message: result.value.message });
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  /**
   * GET /auth/me
   */
  async getCurrentUser(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string
  ): Promise<void> {
    try {
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
    } catch {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  private async parseJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk.toString()));
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  private sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(
    res: ServerResponse,
    status: number,
    code: string,
    message: string
  ): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code, message }));
  }
}
