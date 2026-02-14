/**
 * @what 商圏リポジトリのインターフェース
 * @why ドメイン層がインフラ層に依存しないよう、インターフェースを定義
 */

import type { Repository, RepositoryError, Result } from '@monorepo/shared';
import type { TradeArea, TradeAreaId } from './trade-area.js';

export interface TradeAreaRepository extends Repository<TradeArea, TradeAreaId> {
  findByUserId(userId: string): Promise<Result<TradeArea[], RepositoryError>>;
}
