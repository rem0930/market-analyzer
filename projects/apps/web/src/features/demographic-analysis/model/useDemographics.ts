/**
 * @layer features
 * @segment demographic-analysis
 * @what 人口統計表示の状態管理
 */

'use client';

import { useDemographics as useDemographicsQuery } from '../api/queries';
import { useTradeAreas } from '@/features/trade-area-management';

export function useSelectedDemographics() {
  const selectedTradeAreaId = useTradeAreas((state) => state.selectedTradeAreaId);
  return useDemographicsQuery(selectedTradeAreaId);
}
