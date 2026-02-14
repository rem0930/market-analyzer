/**
 * @layer features
 * @segment map-view
 * @what 地図ビューの状態管理
 */

import { create } from 'zustand';
import { MAP_DEFAULTS } from '../lib/map-config';

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapViewActions {
  setViewState: (state: Partial<MapViewState>) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  reset: () => void;
}

type MapViewStore = MapViewState & MapViewActions;

export const useMapView = create<MapViewStore>((set) => ({
  longitude: MAP_DEFAULTS.center.longitude,
  latitude: MAP_DEFAULTS.center.latitude,
  zoom: MAP_DEFAULTS.zoom,

  setViewState: (state) => set(state),

  flyTo: (longitude, latitude, zoom) =>
    set({
      longitude,
      latitude,
      ...(zoom !== undefined ? { zoom } : {}),
    }),

  reset: () =>
    set({
      longitude: MAP_DEFAULTS.center.longitude,
      latitude: MAP_DEFAULTS.center.latitude,
      zoom: MAP_DEFAULTS.zoom,
    }),
}));
