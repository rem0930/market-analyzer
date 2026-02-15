/**
 * @layer features
 * @segment competitor-search
 * @what 競合検索の UI 状態管理（Zustand）
 */

import { create } from 'zustand';
import type { SearchCompetitorsRequest } from '@/entities/competitor';

interface CompetitorSearchState {
  isOpen: boolean;
  radiusMeters: number;
  keyword: string;
  submittedParams: SearchCompetitorsRequest | null;
  selectedPlaceIds: Set<string>;
}

interface CompetitorSearchActions {
  openDialog: () => void;
  closeDialog: () => void;
  setRadiusMeters: (value: number) => void;
  setKeyword: (value: string) => void;
  submitSearch: () => void;
  toggleSelection: (placeId: string) => void;
  toggleAll: (placeIds: string[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

type CompetitorSearchStore = CompetitorSearchState & CompetitorSearchActions;

const initialState: CompetitorSearchState = {
  isOpen: false,
  radiusMeters: 1000,
  keyword: '',
  submittedParams: null,
  selectedPlaceIds: new Set(),
};

export const useCompetitorSearch = create<CompetitorSearchStore>((set, get) => ({
  ...initialState,

  openDialog: () => set({ isOpen: true }),

  closeDialog: () =>
    set({
      ...initialState,
    }),

  setRadiusMeters: (value) => set({ radiusMeters: value }),

  setKeyword: (value) => set({ keyword: value }),

  submitSearch: () => {
    const { radiusMeters, keyword } = get();
    set({
      submittedParams: { radiusMeters, keyword },
      selectedPlaceIds: new Set(),
    });
  },

  toggleSelection: (placeId) => {
    const { selectedPlaceIds } = get();
    const next = new Set(selectedPlaceIds);
    if (next.has(placeId)) {
      next.delete(placeId);
    } else {
      next.add(placeId);
    }
    set({ selectedPlaceIds: next });
  },

  toggleAll: (placeIds) => {
    const { selectedPlaceIds } = get();
    const allSelected = placeIds.every((id) => selectedPlaceIds.has(id));
    if (allSelected) {
      set({ selectedPlaceIds: new Set() });
    } else {
      set({ selectedPlaceIds: new Set(placeIds) });
    }
  },

  clearSelection: () => set({ selectedPlaceIds: new Set() }),

  reset: () => set({ ...initialState, selectedPlaceIds: new Set() }),
}));
