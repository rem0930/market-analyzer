/**
 * @what 商圏ドメインのエクスポート
 */

export { CenterPoint } from './center-point.js';
export { Radius } from './radius.js';
export { TradeAreaName } from './trade-area-name.js';
export { DemographicData, type AgeDistributionEntry } from './demographic-data.js';
export {
  TradeAreaId,
  TradeArea,
  TradeAreaCreatedEvent,
  type CreateTradeAreaParams,
} from './trade-area.js';
export type { TradeAreaRepository } from './trade-area-repository.js';
export type { DemographicDataProvider } from './demographic-data-provider.js';
