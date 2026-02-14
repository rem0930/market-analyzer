/**
 * @what 商圏ユースケースのエクスポート
 */

export {
  CreateTradeAreaUseCase,
  type CreateTradeAreaInput,
  type CreateTradeAreaOutput,
  type CreateTradeAreaError,
} from './create-trade-area.js';

export {
  GetTradeAreaUseCase,
  type GetTradeAreaInput,
  type GetTradeAreaOutput,
  type GetTradeAreaError,
} from './get-trade-area.js';

export {
  ListTradeAreasUseCase,
  type ListTradeAreasInput,
  type ListTradeAreasOutput,
  type ListTradeAreasError,
  type TradeAreaItem,
} from './list-trade-areas.js';

export {
  DeleteTradeAreaUseCase,
  type DeleteTradeAreaInput,
  type DeleteTradeAreaError,
} from './delete-trade-area.js';

export {
  UpdateTradeAreaUseCase,
  type UpdateTradeAreaInput,
  type UpdateTradeAreaOutput,
  type UpdateTradeAreaError,
} from './update-trade-area.js';

export {
  GetDemographicsUseCase,
  type GetDemographicsInput,
  type GetDemographicsOutput,
  type GetDemographicsError,
} from './get-demographics.js';
