/**
 * @layer features
 * @segment trade-area-management
 * @what 商圏選択状態の管理
 */

import { create } from 'zustand';

interface TradeAreasState {
  selectedTradeAreaId: string | null;
}

interface TradeAreasActions {
  selectTradeArea: (id: string | null) => void;
}

type TradeAreasStore = TradeAreasState & TradeAreasActions;

export const useTradeAreas = create<TradeAreasStore>((set) => ({
  selectedTradeAreaId: null,

  selectTradeArea: (id) => set({ selectedTradeAreaId: id }),
}));
