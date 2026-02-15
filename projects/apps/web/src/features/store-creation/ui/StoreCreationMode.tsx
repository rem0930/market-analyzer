/**
 * @layer features
 * @segment store-creation
 * @what 地図上の店舗作成プレビューマーカー
 */

'use client';

import { StoreMarker } from '@/entities/store';
import { useStoreCreation } from '../model/useStoreCreation';

export function StoreCreationMode() {
  const { isCreating, longitude, latitude } = useStoreCreation();

  if (!isCreating || longitude === null || latitude === null) {
    return null;
  }

  return <StoreMarker id="preview" longitude={longitude} latitude={latitude} isSelected />;
}
