/**
 * @layer features
 * @segment competitor-creation
 * @what 競合店舗作成フローの状態管理
 */

import { create } from 'zustand';

interface CompetitorCreationState {
  isCreating: boolean;
  name: string;
  category: string;
  longitude: number | null;
  latitude: number | null;
}

interface CompetitorCreationActions {
  startCreation: () => void;
  cancelCreation: () => void;
  setClickPoint: (longitude: number, latitude: number) => void;
  setName: (name: string) => void;
  setCategory: (category: string) => void;
  reset: () => void;
}

type CompetitorCreationStore = CompetitorCreationState & CompetitorCreationActions;

const initialState: CompetitorCreationState = {
  isCreating: false,
  name: '',
  category: '',
  longitude: null,
  latitude: null,
};

export const useCompetitorCreation = create<CompetitorCreationStore>((set) => ({
  ...initialState,

  startCreation: () => set({ ...initialState, isCreating: true }),

  cancelCreation: () => set(initialState),

  setClickPoint: (longitude, latitude) => set({ longitude, latitude }),

  setName: (name) => set({ name }),

  setCategory: (category) => set({ category }),

  reset: () => set(initialState),
}));
