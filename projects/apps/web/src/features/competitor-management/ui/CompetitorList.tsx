/**
 * @layer features
 * @segment competitor-management
 * @what サイドパネルの競合店舗リスト
 */

'use client';

import { useCompetitorsByStore } from '../api/queries';
import { useDeleteCompetitor } from '../api/mutations';
import { useCompetitors } from '../model/useCompetitors';
import { CompetitorListItem } from './CompetitorListItem';

interface CompetitorListProps {
  storeId: string | null;
}

export function CompetitorList({ storeId }: CompetitorListProps) {
  const { data, isLoading, error } = useCompetitorsByStore(storeId);
  const { selectedCompetitorId, selectCompetitor } = useCompetitors();
  const deleteMutation = useDeleteCompetitor();

  if (!storeId) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Select a store to view competitors
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-red-500">Failed to load competitors</div>;
  }

  if (!data || data.competitors.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">No competitors yet</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-700">Competitors ({data.total})</h3>
      </div>
      {deleteMutation.isError && (
        <p className="text-xs text-red-500 px-1">Failed to delete competitor. Please try again.</p>
      )}
      <div className="space-y-1.5">
        {data.competitors.map((competitor) => (
          <CompetitorListItem
            key={competitor.id}
            competitor={competitor}
            isSelected={selectedCompetitorId === competitor.id}
            onSelect={selectCompetitor}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this competitor?')) {
                deleteMutation.mutate(id, {
                  onSuccess: () => {
                    if (selectedCompetitorId === id) {
                      selectCompetitor(null);
                    }
                  },
                });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
