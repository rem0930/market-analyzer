/**
 * @layer features
 * @segment competitor-search
 * @what 競合検索ダイアログ（検索パラメータ入力 + 結果表示）
 */

'use client';

import { useCallback } from 'react';
import { useCompetitorSearch } from '../model/useCompetitorSearch';
import { useSearchCompetitors } from '../api/queries';
import { useBulkCreateCompetitors } from '../api/mutations';
import { SearchResults } from './SearchResults';
import type { SearchCompetitorItem } from '@/entities/competitor';

interface CompetitorSearchDialogProps {
  storeId: string;
}

export function CompetitorSearchDialog({ storeId }: CompetitorSearchDialogProps) {
  const {
    isOpen,
    radiusMeters,
    keyword,
    submittedParams,
    selectedPlaceIds,
    closeDialog,
    setRadiusMeters,
    setKeyword,
    submitSearch,
    toggleSelection,
    toggleAll,
    clearSelection,
  } = useCompetitorSearch();

  const { data, isLoading, error } = useSearchCompetitors(storeId, submittedParams);
  const bulkCreateMutation = useBulkCreateCompetitors();

  const handleSearch = useCallback(() => {
    if (!keyword.trim()) return;
    submitSearch();
  }, [keyword, submitSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleBulkSave = useCallback(() => {
    if (!data || selectedPlaceIds.size === 0) return;

    const selectedItems: SearchCompetitorItem[] = data.results.filter((r) =>
      selectedPlaceIds.has(r.googlePlaceId)
    );

    bulkCreateMutation.mutate(
      {
        storeId,
        data: {
          competitors: selectedItems.map((item) => ({
            name: item.name,
            longitude: item.longitude,
            latitude: item.latitude,
            googlePlaceId: item.googlePlaceId,
            category: item.category,
          })),
        },
      },
      {
        onSuccess: () => {
          clearSelection();
        },
      }
    );
  }, [data, selectedPlaceIds, storeId, bulkCreateMutation, clearSelection, closeDialog]);

  if (!isOpen) return null;

  const radiusKm = radiusMeters / 1000;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Search Nearby Competitors</h4>
        <button
          onClick={closeDialog}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Close search"
        >
          Close
        </button>
      </div>

      {/* Search Form */}
      <div className="space-y-2">
        <div>
          <label htmlFor="search-radius" className="block text-xs text-gray-600 mb-1">
            Radius: {radiusKm >= 1 ? `${radiusKm}km` : `${radiusMeters}m`}
          </label>
          <input
            id="search-radius"
            type="range"
            min={100}
            max={5000}
            step={100}
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>100m</span>
            <span>5km</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Keyword (e.g. コンビニ)"
            aria-label="Search keyword"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={!keyword.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">Search failed. Please try again.</p>}

      {/* Results */}
      {data && (
        <SearchResults
          results={data.results}
          total={data.total}
          selectedPlaceIds={selectedPlaceIds}
          onToggle={toggleSelection}
          onToggleAll={toggleAll}
          onBulkSave={handleBulkSave}
          isSaving={bulkCreateMutation.isPending}
          saveError={bulkCreateMutation.isError}
        />
      )}

      {/* Bulk save success message */}
      {bulkCreateMutation.isSuccess && (
        <p className="text-xs text-green-600">
          {bulkCreateMutation.data.total.created} competitors registered
          {bulkCreateMutation.data.total.skipped > 0 &&
            `, ${bulkCreateMutation.data.total.skipped} skipped (already registered)`}
        </p>
      )}
    </div>
  );
}
