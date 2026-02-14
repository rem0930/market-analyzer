/**
 * @layer features
 * @segment map-view
 * @what 地図のデフォルト設定
 */

export const MAP_DEFAULTS = {
  center: {
    longitude: 139.6917,
    latitude: 35.6895,
  },
  zoom: 11,
  minZoom: 3,
  maxZoom: 18,
} as const;
