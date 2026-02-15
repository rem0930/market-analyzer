/**
 * @layer entities
 * @segment store
 * @what 地図上の店舗マーカー（青ピン）
 */

'use client';

import { Marker } from 'react-map-gl';

interface StoreMarkerProps {
  id: string;
  longitude: number;
  latitude: number;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

export function StoreMarker({
  id,
  longitude,
  latitude,
  isSelected = false,
  onClick,
}: StoreMarkerProps) {
  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.(id);
      }}
    >
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="cursor-pointer transition-transform"
        style={{ transform: isSelected ? 'scale(1.3)' : 'scale(1)' }}
      >
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z"
          fill={isSelected ? '#2563eb' : '#3b82f6'}
        />
        <circle cx="12" cy="12" r="5" fill="white" />
      </svg>
    </Marker>
  );
}
