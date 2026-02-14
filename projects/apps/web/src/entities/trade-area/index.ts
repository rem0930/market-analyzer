/**
 * @layer entities
 * @segment trade-area
 * @what 商圏エンティティの public API
 */

export type {
  TradeArea,
  TradeAreasResponse,
  AgeDistribution,
  DemographicData,
  CreateTradeAreaRequest,
  UpdateTradeAreaRequest,
} from './model/types';
export { TradeAreaCircle } from './ui/TradeAreaCircle';
