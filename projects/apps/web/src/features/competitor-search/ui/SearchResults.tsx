/**
 * @layer features
 * @segment competitor-search
 * @what 検索結果リスト + 一括登録ボタン
 */

'use client';

import type { SearchCompetitorItem } from '@/entities/competitor';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  results: SearchCompetitorItem[];
  total: number;
  selectedPlaceIds: Set<string>;
  onToggle: (placeId: string) => void;
  onToggleAll: (placeIds: string[]) => void;
  onBulkSave: () => void;
  isSaving: boolean;
  saveError: boolean;
}

export function SearchResults({
  results,
  total,
  selectedPlaceIds,
  onToggle,
  onToggleAll,
  onBulkSave,
  isSaving,
  saveError,
}: SearchResultsProps) {
  const selectablePlaceIds = results
    .filter((r) => !r.alreadyRegistered)
    .map((r) => r.googlePlaceId);

  const allSelectableSelected =
    selectablePlaceIds.length > 0 && selectablePlaceIds.every((id) => selectedPlaceIds.has(id));

  const selectedCount = selectedPlaceIds.size;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{total} results found</span>
        {selectablePlaceIds.length > 0 && (
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelectableSelected}
              onChange={() => onToggleAll(selectablePlaceIds)}
              className="rounded"
            />
            Select all
          </label>
        )}
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {results.map((item) => (
          <SearchResultItem
            key={item.googlePlaceId}
            item={item}
            isSelected={selectedPlaceIds.has(item.googlePlaceId)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {selectedCount > 0 && (
        <button
          onClick={onBulkSave}
          disabled={isSaving}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : `Register ${selectedCount} selected`}
        </button>
      )}

      {saveError && <p className="text-xs text-red-500">Failed to register. Please try again.</p>}
    </div>
  );
}
