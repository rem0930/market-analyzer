/**
 * @layer features
 * @segment competitor-search
 * @what 検索結果の個別アイテム
 */

'use client';

import type { SearchCompetitorItem } from '@/entities/competitor';

interface SearchResultItemProps {
  item: SearchCompetitorItem;
  isSelected: boolean;
  onToggle: (placeId: string) => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

export function SearchResultItem({ item, isSelected, onToggle }: SearchResultItemProps) {
  const isDisabled = item.alreadyRegistered;

  return (
    <label
      className={`flex items-start gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
        isDisabled
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-default'
          : isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        disabled={isDisabled}
        onChange={() => !isDisabled && onToggle(item.googlePlaceId)}
        className="mt-0.5 rounded"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium truncate">{item.name}</span>
          {item.alreadyRegistered && (
            <span className="shrink-0 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
              Registered
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{item.address}</div>
        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
          <span>{item.category}</span>
          <span>{formatDistance(item.distanceMeters)}</span>
        </div>
      </div>
    </label>
  );
}
