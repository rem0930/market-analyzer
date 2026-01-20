/**
 * @what Deep Ping コントローラー
 * @why HTTP リクエストを処理し、Deep Ping ユースケースを実行
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない
 */

import type { ServerResponse } from 'node:http';
import type { DeepPingUseCase } from '../../usecase/health/index.js';

/**
 * Deep Ping コントローラー
 */
export class DeepPingController {
  constructor(private readonly deepPingUseCase: DeepPingUseCase) {}

  /**
   * GET /ping/deep - Deep Ping を実行
   */
  async deepPing(res: ServerResponse): Promise<void> {
    try {
      const result = await this.deepPingUseCase.execute();
      this.sendJson(res, 200, result);
    } catch (_error) {
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
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
