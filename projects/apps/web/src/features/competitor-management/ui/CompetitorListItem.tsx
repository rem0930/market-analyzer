/**
 * @layer features
 * @segment competitor-management
 * @what 競合店舗リストの個別アイテム
 */

'use client';

import type { Competitor } from '@/entities/competitor';

interface CompetitorListItemProps {
  competitor: Competitor;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CompetitorListItem({
  competitor,
  isSelected,
  onSelect,
  onDelete,
}: CompetitorListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-red-500 bg-red-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(competitor.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(competitor.id);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium text-gray-900 truncate">{competitor.name}</h4>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
              {competitor.source === 'google_places' ? 'Google' : 'manual'}
            </span>
          </div>
          {competitor.category && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{competitor.category}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            ({competitor.latitude.toFixed(4)}, {competitor.longitude.toFixed(4)})
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(competitor.id);
          }}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`Delete ${competitor.name}`}
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
