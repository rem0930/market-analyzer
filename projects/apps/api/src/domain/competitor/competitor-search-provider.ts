/**
 * @what 競合店舗検索プロバイダーのインターフェース
 * @why ドメイン層が外部検索 API に依存しないよう、インターフェースを定義
 */

import type { CenterPoint } from '../trade-area/center-point.js';
import type { CompetitorSearchResult } from './competitor-search-result.js';

export interface CompetitorSearchProvider {
  searchNearby(
    center: CenterPoint,
    radiusMeters: number,
    keyword: string,
    maxResults?: number
  ): Promise<CompetitorSearchResult[]>;
}
