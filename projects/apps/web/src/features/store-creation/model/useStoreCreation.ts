/**
 * @layer features
 * @segment store-creation
 * @what 店舗作成フローの状態管理
 */

import { create } from 'zustand';

interface StoreCreationState {
  isCreating: boolean;
  name: string;
  address: string;
  longitude: number | null;
  latitude: number | null;
}

interface StoreCreationActions {
  startCreation: () => void;
  cancelCreation: () => void;
  setClickPoint: (longitude: number, latitude: number) => void;
  setName: (name: string) => void;
  setAddress: (address: string) => void;
  reset: () => void;
}

type StoreCreationStore = StoreCreationState & StoreCreationActions;

const initialState: StoreCreationState = {
  isCreating: false,
  name: '',
  address: '',
  longitude: null,
  latitude: null,
};

export const useStoreCreation = create<StoreCreationStore>((set) => ({
  ...initialState,

  startCreation: () => set({ isCreating: true }),

  cancelCreation: () => set(initialState),

  setClickPoint: (longitude, latitude) => set({ longitude, latitude }),

  setName: (name) => set({ name }),

  setAddress: (address) => set({ address }),

  reset: () => set(initialState),
}));
