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
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson } from '../middleware/error-handler.js';

export class ProfileController {
  constructor(
    private readonly changeNameUseCase: ChangeNameUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  /**
   * PATCH /users/me/name
   */
  async updateName(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, updateNameSchema);
      if (!validation.success) return;

      const { name } = validation.data;

      const result = await this.changeNameUseCase.execute({
        userId,
        name,
        causationId: requestId,
        correlationId: requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'user_not_found':
            throw AppError.notFound('USER_NOT_FOUND');
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }], {
              reason: 'INVALID_VALUE',
            });
          case 'same_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_VALUE' }], {
              reason: 'INVALID_VALUE',
            });
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(
        res,
        200,
        {
          id: result.value.id,
          name: result.value.name,
          email: result.value.email,
          createdAt: result.value.createdAt.toISOString(),
          updatedAt: result.value.updatedAt.toISOString(),
        },
        requestId
      );
    });
  }

  /**
   * PATCH /users/me/password
   */
  async updatePassword(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, updatePasswordSchema);
      if (!validation.success) return;

      const { currentPassword, newPassword } = validation.data;

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
            throw AppError.notFound('USER_NOT_FOUND');
          case 'incorrect_password':
            throw AppError.validation([{ field: 'currentPassword', code: 'INVALID_VALUE' }], {
              reason: 'INVALID_CREDENTIALS',
            });
          case 'weak_password':
            throw AppError.validation([{ field: 'newPassword', code: 'WEAK_PASSWORD' }], {
              reason: 'WEAK_PASSWORD',
            });
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, { message: result.value.message }, requestId);
    });
  }
}
