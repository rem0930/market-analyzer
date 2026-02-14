/**
 * @layer features
 * @segment trade-area-creation
 * @what 商圏作成フローの状態管理
 */

import { create } from 'zustand';

interface TradeAreaCreationState {
  isCreating: boolean;
  name: string;
  longitude: number | null;
  latitude: number | null;
  radiusKm: number;
}

interface TradeAreaCreationActions {
  startCreation: () => void;
  cancelCreation: () => void;
  setClickPoint: (longitude: number, latitude: number) => void;
  setName: (name: string) => void;
  setRadius: (radiusKm: number) => void;
  reset: () => void;
}

type TradeAreaCreationStore = TradeAreaCreationState & TradeAreaCreationActions;

const initialState: TradeAreaCreationState = {
  isCreating: false,
  name: '',
  longitude: null,
  latitude: null,
  radiusKm: 3,
};

export const useTradeAreaCreation = create<TradeAreaCreationStore>((set) => ({
  ...initialState,

  startCreation: () => set({ isCreating: true }),

  cancelCreation: () => set(initialState),

  setClickPoint: (longitude, latitude) => set({ longitude, latitude }),

  setName: (name) => set({ name }),

  setRadius: (radiusKm) => set({ radiusKm }),

  reset: () => set(initialState),
}));
