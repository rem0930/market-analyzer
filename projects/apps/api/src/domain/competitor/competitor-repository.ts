/**
 * @what 競合店舗リポジトリのインターフェース
 * @why ドメイン層がインフラ層に依存しないよう、インターフェースを定義
 */

import type { Repository, RepositoryError, Result } from '@monorepo/shared';
import type { Competitor, CompetitorId } from './competitor.js';

export interface CompetitorRepository extends Repository<Competitor, CompetitorId> {
  findByStoreId(storeId: string): Promise<Result<Competitor[], RepositoryError>>;
}
