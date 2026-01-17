/**
 * @what プロフィールHTTPコントローラー
 * @why プロフィール編集関連のエンドポイントを処理
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ChangeNameUseCase, ChangePasswordUseCase } from '../../usecase/index.js';
import type { ValidationMiddleware } from '../middleware/validation-middleware.js';
import { updateNameSchema, updatePasswordSchema } from '../schemas/index.js';

export class ProfileController {
  constructor(
    private readonly changeNameUseCase: ChangeNameUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  /**
   * PATCH /users/me/name
   */
  async updateName(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, updateNameSchema);
    if (!validation.success) return;

    const { name } = validation.data;

    const result = await this.changeNameUseCase.execute({
      userId,
      name,
    });

    if (result.isFailure()) {
      switch (result.error) {
        case 'user_not_found':
          this.sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
          return;
        case 'invalid_name':
          this.sendError(res, 400, 'INVALID_NAME', 'Name must be 1-100 characters');
          return;
        default:
          this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
          return;
      }
    }

    this.sendJson(res, 200, {
      id: result.value.id,
      name: result.value.name,
      email: result.value.email,
      createdAt: result.value.createdAt.toISOString(),
      updatedAt: result.value.updatedAt.toISOString(),
    });
  }

  /**
   * PATCH /users/me/password
   */
  async updatePassword(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
    const validation = await this.validationMiddleware.validate(req, res, updatePasswordSchema);
    if (!validation.success) return;

    const { currentPassword, newPassword } = validation.data;
    const requestId = crypto.randomUUID();

    const result = await this.changePasswordUseCase.execute({
      userId,
      currentPassword,
      newPassword,
      causationId: requestId,
      correlationId: requestId,
    });

    if (result.isFailure()) {
      switch (result.error) {
        case 'user_not_found':
          this.sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
          return;
        case 'incorrect_password':
          this.sendError(res, 400, 'INCORRECT_PASSWORD', 'Current password is incorrect');
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

  private sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, status: number, code: string, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code, message }));
  }
}
