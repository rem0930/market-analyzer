/**
 * @what HTTPコントローラー（プレゼンテーション層）
 * @why ユースケースを呼び出し、HTTPレスポンスに変換
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない
 * - HTTPリクエスト/レスポンスの変換を担当
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CreateUserUseCase, GetUserUseCase } from '../../usecase/index.js';
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson } from '../middleware/error-handler.js';

/**
 * ユーザーコントローラー
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  /**
   * POST /users - ユーザー作成
   */
  async createUser(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      // リクエストボディをパース
      const body = await this.parseJsonBody(req);

      const email = body.email;
      const name = body.name;

      if (typeof email !== 'string' || typeof name !== 'string') {
        throw AppError.validation([
          { field: 'email', code: 'REQUIRED_FIELD' },
          { field: 'name', code: 'REQUIRED_FIELD' },
        ]);
      }

      // ユースケースを実行
      const result = await this.createUserUseCase.execute({
        email,
        name,
        requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_email':
            throw AppError.validation([{ field: 'email', code: 'INVALID_FORMAT' }], {
              reason: 'INVALID_EMAIL',
            });
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }], {
              reason: 'INVALID_VALUE',
            });
          case 'email_already_exists':
            throw AppError.conflict('EMAIL_EXISTS');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 201, result.value, requestId);
    });
  }

  /**
   * GET /users/:id - ユーザー取得
   */
  async getUser(
    _req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getUserUseCase.execute({ userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'user_not_found':
            throw AppError.notFound('USER_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, result.value, requestId);
    });
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
}
