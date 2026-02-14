/**
 * @layer shared
 * @segment config
 * @what Mapbox 設定
 */

export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  defaultStyle: 'mapbox://styles/mapbox/light-v11',
  defaultCenter: {
    longitude: 139.6917,
    latitude: 35.6895,
  },
  defaultZoom: 11,
} as const;
