/**
 * @layer features
 * @segment store-management
 * @what 店舗選択状態の管理
 */

import { create } from 'zustand';

interface StoresState {
  selectedStoreId: string | null;
}

interface StoresActions {
  selectStore: (id: string | null) => void;
}

type StoresStore = StoresState & StoresActions;

export const useStores = create<StoresStore>((set) => ({
  selectedStoreId: null,

  selectStore: (id) => set({ selectedStoreId: id }),
}));
