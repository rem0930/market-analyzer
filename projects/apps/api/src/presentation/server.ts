/**
 * @what HTTPサーバーエントリーポイント
 * @why アプリケーションの起動とDI構成
 *
 * presentation層のルール:
 * - composition（DI）からコントローラーを取得
 * - ルーターを通じてリクエストをハンドル
 */

import { createServer } from 'node:http';
import { handleRoutes } from './router.js';
import { createAppContext } from '../composition/container.js';
import { logger } from '../infrastructure/index.js';

const PORT = process.env.PORT ?? 3000;

// DI構成
const context = createAppContext();

const server = createServer(async (req, res) => {
  await handleRoutes(req, res, context);
});

server.listen(PORT, () => {
  logger.info('Server started', { port: Number(PORT), url: `http://localhost:${PORT}` });
});

export { server };
