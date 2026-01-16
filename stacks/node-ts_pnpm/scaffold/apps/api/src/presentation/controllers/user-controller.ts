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

/**
 * ユーザーコントローラー
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) { }

  /**
   * POST /users - ユーザー作成
   */
  async createUser(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // リクエストボディをパース
      const body = await this.parseJsonBody(req);

      if (!body.email || !body.name) {
        this.sendError(res, 400, 'Missing required fields: email, name');
        return;
      }

      // リクエストIDを生成（因果追跡用）
      const requestId = crypto.randomUUID();

      // ユースケースを実行
      const result = await this.createUserUseCase.execute({
        email: body.email,
        name: body.name,
        requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_email':
            this.sendError(res, 400, 'Invalid email format');
            return;
          case 'invalid_name':
            this.sendError(res, 400, 'Invalid name (1-100 characters)');
            return;
          case 'email_already_exists':
            this.sendError(res, 409, 'Email already exists');
            return;
          default:
            this.sendError(res, 500, 'Internal server error');
            return;
        }
      }

      this.sendJson(res, 201, result.value);
    } catch (error) {
      this.sendError(res, 500, 'Internal server error');
    }
  }

  /**
   * GET /users/:id - ユーザー取得
   */
  async getUser(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string
  ): Promise<void> {
    try {
      const result = await this.getUserUseCase.execute({ userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            this.sendError(res, 400, 'Invalid user ID format');
            return;
          case 'user_not_found':
            this.sendError(res, 404, 'User not found');
            return;
          default:
            this.sendError(res, 500, 'Internal server error');
            return;
        }
      }

      this.sendJson(res, 200, result.value);
    } catch (error) {
      this.sendError(res, 500, 'Internal server error');
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

  private sendError(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
}
