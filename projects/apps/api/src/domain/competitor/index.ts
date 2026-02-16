/**
 * @what 競合店舗ドメインのエクスポート
 */

export { CompetitorName } from './competitor-name.js';
export { CompetitorSource, type CompetitorSourceType } from './competitor-source.js';
export {
  CompetitorId,
  Competitor,
  CompetitorCreatedEvent,
  type CreateCompetitorParams,
} from './competitor.js';
export type { CompetitorRepository } from './competitor-repository.js';
export { CompetitorSearchResult } from './competitor-search-result.js';
export type { CompetitorSearchProvider } from './competitor-search-provider.js';
