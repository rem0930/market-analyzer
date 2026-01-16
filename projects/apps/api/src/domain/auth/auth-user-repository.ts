/**
 * @what 認証ユーザーリポジトリのインターフェース
 * @why ドメイン層がインフラ層に依存しないよう、インターフェースを定義
 *
 * domain層のルール:
 * - インターフェースのみ定義（実装はinfrastructure層）
 * - Result<T>で戻り値を型安全に
 */

import type { Repository, RepositoryError, Result } from '@monorepo/shared';
import type { AuthUser, AuthUserId } from './auth-user.js';
import type { Email } from '@monorepo/shared';

/**
 * 認証ユーザー固有のリポジトリエラー
 */
export type AuthUserRepositoryError = RepositoryError | 'email_already_exists';

/**
 * 認証ユーザーリポジトリのインターフェース
 */
export interface AuthUserRepository extends Repository<AuthUser, AuthUserId> {
  /**
   * メールアドレスでユーザーを検索
   */
  findByEmail(email: Email): Promise<Result<AuthUser | null, RepositoryError>>;

  /**
   * メールアドレスが既に使用されているかチェック
   */
  emailExists(email: Email): Promise<Result<boolean, RepositoryError>>;
}
