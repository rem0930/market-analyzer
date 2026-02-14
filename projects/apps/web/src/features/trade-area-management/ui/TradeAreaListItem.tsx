/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏リストの個別アイテム
 */

'use client';

import type { TradeArea } from '@/entities/trade-area';

interface TradeAreaListItemProps {
  tradeArea: TradeArea;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TradeAreaListItem({
  tradeArea,
  isSelected,
  onSelect,
  onDelete,
}: TradeAreaListItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(tradeArea.id)}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-gray-900 truncate">{tradeArea.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">Radius: {tradeArea.radiusKm.toFixed(1)} km</p>
          <p className="text-xs text-gray-400 mt-0.5">
            ({tradeArea.latitude.toFixed(4)}, {tradeArea.longitude.toFixed(4)})
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tradeArea.id);
          }}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`Delete ${tradeArea.name}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
