/**
 * @layer features
 * @segment trade-area-creation
 * @what 地図クリックハンドラ + プレビュー円
 */

'use client';

import { TradeAreaCircle } from '@/entities/trade-area';
import { useTradeAreaCreation } from '../model/useTradeAreaCreation';

export function TradeAreaCreationMode() {
  const { isCreating, longitude, latitude, radiusKm } = useTradeAreaCreation();

  if (!isCreating || longitude === null || latitude === null) {
    return null;
  }

  return (
    <TradeAreaCircle
      id="preview"
      longitude={longitude}
      latitude={latitude}
      radiusKm={radiusKm}
      color="#f59e0b"
      opacity={0.3}
    />
  );
}
