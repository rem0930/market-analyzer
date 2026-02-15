/**
 * @layer features
 * @segment competitor-creation
 * @what 地図上の競合店舗作成プレビューマーカー
 */

'use client';

import { CompetitorMarker } from '@/entities/competitor';
import { useCompetitorCreation } from '../model/useCompetitorCreation';

export function CompetitorCreationMode() {
  const { isCreating, longitude, latitude } = useCompetitorCreation();

  if (!isCreating || longitude === null || latitude === null) {
    return null;
  }

  return <CompetitorMarker id="preview" longitude={longitude} latitude={latitude} isSelected />;
}
