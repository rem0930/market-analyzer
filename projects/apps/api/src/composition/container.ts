/**
 * @what DIコンテナ / 依存関係の構成
 * @why 各レイヤーの依存関係を組み立て、アプリケーションコンテキストを構築
 *
 * composition層のルール:
 * - すべてのレイヤーをimport可能
 * - 依存関係の注入とファクトリを担当
 * - アプリケーション全体の構成を1箇所に集約
 */

import { InMemoryUserRepository } from '../infrastructure/index.js';
import { CreateUserUseCase, GetUserUseCase } from '../usecase/index.js';
import { UserController, type RouteContext } from '../presentation/index.js';

/**
 * アプリケーションコンテキストを作成
 * 本番環境では環境変数等で実装を切り替える
 */
export function createAppContext(): RouteContext {
  // Infrastructure
  const userRepository = new InMemoryUserRepository();

  // UseCases
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);

  // Controllers
  const userController = new UserController(createUserUseCase, getUserUseCase);

  return {
    userController,
  };
}
