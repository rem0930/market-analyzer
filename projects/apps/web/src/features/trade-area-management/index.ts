/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏管理機能の public API
 */

export { TradeAreaList } from './ui/TradeAreaList';
export { TradeAreaListItem } from './ui/TradeAreaListItem';
export { useTradeAreaList, useTradeArea, tradeAreaKeys } from './api/queries';
export { useCreateTradeArea, useUpdateTradeArea, useDeleteTradeArea } from './api/mutations';
export { useTradeAreas } from './model/useTradeAreas';
