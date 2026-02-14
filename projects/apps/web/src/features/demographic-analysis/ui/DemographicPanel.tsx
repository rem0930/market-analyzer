/**
 * @layer features
 * @segment demographic-analysis
 * @what 選択中商圏の人口統計カード
 */

'use client';

import { useSelectedDemographics } from '../model/useDemographics';
import { PopulationChart } from './PopulationChart';
import { AgeDistributionChart } from './AgeDistributionChart';
import { useTradeAreas } from '@/features/trade-area-management';

export function DemographicPanel() {
  const selectedTradeAreaId = useTradeAreas((state) => state.selectedTradeAreaId);
  const { data, isLoading, error } = useSelectedDemographics();

  if (!selectedTradeAreaId) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Select a trade area to view demographics
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading demographics...</div>;
  }

  if (error || !data) {
    return <div className="p-4 text-center text-sm text-red-500">Failed to load demographics</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Demographics</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600">Population</p>
          <p className="text-lg font-bold text-blue-900">{data.population.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600">Households</p>
          <p className="text-lg font-bold text-green-900">{data.households.toLocaleString()}</p>
        </div>
        <div className="col-span-2 p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-600">Average Income</p>
          <p className="text-lg font-bold text-amber-900">¥{data.averageIncome.toLocaleString()}</p>
        </div>
      </div>

      <PopulationChart ageDistribution={data.ageDistribution} />
      <AgeDistributionChart ageDistribution={data.ageDistribution} />
    </div>
  );
}
