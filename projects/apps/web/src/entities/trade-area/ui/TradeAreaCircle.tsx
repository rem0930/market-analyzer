/**
 * @layer entities
 * @segment trade-area
 * @what 地図上の商圏円描画コンポーネント
 */

'use client';

import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl';
import { createCircleGeoJSON } from '@/shared/lib/geo';

interface TradeAreaCircleProps {
  id: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  color?: string;
  opacity?: number;
  isSelected?: boolean;
}

export function TradeAreaCircle({
  id,
  longitude,
  latitude,
  radiusKm,
  color = '#3b82f6',
  opacity = 0.2,
  isSelected = false,
}: TradeAreaCircleProps) {
  const geojson = useMemo(
    () => createCircleGeoJSON(longitude, latitude, radiusKm),
    [longitude, latitude, radiusKm]
  );

  const fillOpacity = isSelected ? opacity * 1.5 : opacity;
  const lineWidth = isSelected ? 3 : 1.5;

  return (
    <Source id={`trade-area-${id}`} type="geojson" data={geojson}>
      <Layer
        id={`trade-area-fill-${id}`}
        type="fill"
        paint={{
          'fill-color': color,
          'fill-opacity': fillOpacity,
        }}
      />
      <Layer
        id={`trade-area-line-${id}`}
        type="line"
        paint={{
          'line-color': color,
          'line-width': lineWidth,
        }}
      />
    </Source>
  );
}
