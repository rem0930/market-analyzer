/**
 * @layer features
 * @segment map-view
 * @what react-map-gl ラッパー（全画面地図）
 */

'use client';

import { useCallback, type ReactNode } from 'react';
import Map, { type MapMouseEvent, type ViewStateChangeEvent } from 'react-map-gl';
import { MAPBOX_CONFIG } from '@/shared/config/mapbox';
import { useMapView } from '../model/useMapView';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: ReactNode;
  onClick?: (e: MapMouseEvent) => void;
}

export function MapContainer({ children, onClick }: MapContainerProps) {
  const { longitude, latitude, zoom, setViewState } = useMapView();

  const handleMove = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewState({
        longitude: e.viewState.longitude,
        latitude: e.viewState.latitude,
        zoom: e.viewState.zoom,
      });
    },
    [setViewState]
  );

  return (
    <Map
      longitude={longitude}
      latitude={latitude}
      zoom={zoom}
      onMove={handleMove}
      onClick={onClick}
      mapboxAccessToken={MAPBOX_CONFIG.accessToken}
      mapStyle={MAPBOX_CONFIG.defaultStyle}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </Map>
  );
}
