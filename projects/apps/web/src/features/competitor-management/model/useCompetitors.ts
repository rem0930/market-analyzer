/**
 * @layer features
 * @segment competitor-management
 * @what 競合店舗選択状態の管理
 */

import { create } from 'zustand';

interface CompetitorsState {
  selectedCompetitorId: string | null;
}

interface CompetitorsActions {
  selectCompetitor: (id: string | null) => void;
}

type CompetitorsStore = CompetitorsState & CompetitorsActions;

export const useCompetitors = create<CompetitorsStore>((set) => ({
  selectedCompetitorId: null,

  selectCompetitor: (id) => set({ selectedCompetitorId: id }),
}));
