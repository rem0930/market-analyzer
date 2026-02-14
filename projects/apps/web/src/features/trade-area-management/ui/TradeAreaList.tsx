/**
 * @layer features
 * @segment trade-area-management
 * @what サイドパネルの商圏リスト
 */

'use client';

import { useTradeAreaList } from '../api/queries';
import { useDeleteTradeArea } from '../api/mutations';
import { useTradeAreas } from '../model/useTradeAreas';
import { TradeAreaListItem } from './TradeAreaListItem';

export function TradeAreaList() {
  const { data, isLoading, error } = useTradeAreaList();
  const { selectedTradeAreaId, selectTradeArea } = useTradeAreas();
  const deleteMutation = useDeleteTradeArea();

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-red-500">Failed to load trade areas</div>;
  }

  if (!data || data.tradeAreas.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No trade areas yet. Click on the map to create one.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-700">Trade Areas ({data.total})</h3>
      </div>
      <div className="space-y-1.5">
        {data.tradeAreas.map((tradeArea) => (
          <TradeAreaListItem
            key={tradeArea.id}
            tradeArea={tradeArea}
            isSelected={selectedTradeAreaId === tradeArea.id}
            onSelect={selectTradeArea}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
