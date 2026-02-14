/**
 * @layer shared
 * @segment lib
 * @what Turf.js ヘルパー（circle GeoJSON 生成）
 */

import circle from '@turf/circle';
import { point } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';

/**
 * 座標と半径から円の GeoJSON Polygon を生成
 */
export function createCircleGeoJSON(
  longitude: number,
  latitude: number,
  radiusKm: number,
  steps = 64
): Feature<Polygon> {
  const center = point([longitude, latitude]);
  return circle(center, radiusKm, { steps, units: 'kilometers' }) as Feature<Polygon>;
}
