/**
 * @what モック競合店舗検索プロバイダー
 * @why 座標ベースの決定論的モックデータ生成（同じ地点 = 同じ結果、API コール不要）
 */

import {
  CompetitorSearchResult,
  type CompetitorSearchProvider,
  type CenterPoint,
} from '../../domain/index.js';

const DEFAULT_MAX_RESULTS = 20;

const STORE_PREFIXES = [
  'セブンイレブン',
  'ファミリーマート',
  'ローソン',
  'まいばすけっと',
  'ミニストップ',
  'デイリーヤマザキ',
  'マルエツ',
  'サミット',
  'いなげや',
  'オーケー',
  'ドン・キホーテ',
  'マツモトキヨシ',
  'ウエルシア',
  'ツルハドラッグ',
  'ダイソー',
];

const CATEGORIES = [
  'コンビニ',
  'スーパーマーケット',
  'ドラッグストア',
  '100円ショップ',
  'ディスカウントストア',
];

/**
 * 座標とキーワードから決定論的なシード値を生成
 */
function hashSeed(lng: number, lat: number, keyword: string): number {
  const str = `${lng.toFixed(4)}:${lat.toFixed(4)}:${keyword}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * シード値から疑似乱数を生成（0〜1）
 */
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

export class MockCompetitorSearchProvider implements CompetitorSearchProvider {
  async searchNearby(
    center: CenterPoint,
    radiusMeters: number,
    keyword: string,
    maxResults?: number
  ): Promise<CompetitorSearchResult[]> {
    const limit = maxResults ?? DEFAULT_MAX_RESULTS;
    const seed = hashSeed(center.longitude, center.latitude, keyword);

    // 半径に応じた件数（5〜15件、半径が大きいほど多い）
    const baseCount = 5 + Math.floor(seededRandom(seed, 0) * 11);
    const count = Math.min(baseCount, limit);

    const results: CompetitorSearchResult[] = [];

    for (let i = 0; i < count; i++) {
      const nameIdx = Math.floor(seededRandom(seed, 10 + i) * STORE_PREFIXES.length);
      const catIdx = Math.floor(seededRandom(seed, 30 + i) * CATEGORIES.length);
      const suffix = `${Math.floor(seededRandom(seed, 50 + i) * 900 + 100)}`;

      // 中心からの距離（半径内にランダム配置）
      const distanceFraction = seededRandom(seed, 70 + i);
      const distanceMeters = Math.round(distanceFraction * radiusMeters * 100) / 100;

      // 中心からのオフセット座標（簡易的にメートルを度に変換）
      const angle = seededRandom(seed, 90 + i) * 2 * Math.PI;
      const metersPerDegreeLng = 111320 * Math.cos((center.latitude * Math.PI) / 180);
      const metersPerDegreeLat = 110540;
      const lngOffset = (Math.cos(angle) * distanceMeters) / metersPerDegreeLng;
      const latOffset = (Math.sin(angle) * distanceMeters) / metersPerDegreeLat;

      const lng = Math.round((center.longitude + lngOffset) * 10000) / 10000;
      const lat = Math.round((center.latitude + latOffset) * 10000) / 10000;

      results.push(
        CompetitorSearchResult.create({
          name: `${STORE_PREFIXES[nameIdx]} ${suffix}号店`,
          longitude: lng,
          latitude: lat,
          googlePlaceId: `ChIJ_mock_${seed}_${i}`,
          category: CATEGORIES[catIdx],
          address: `東京都千代田区${Math.floor(seededRandom(seed, 110 + i) * 10 + 1)}-${Math.floor(seededRandom(seed, 130 + i) * 20 + 1)}-${Math.floor(seededRandom(seed, 150 + i) * 30 + 1)}`,
          distanceMeters,
        })
      );
    }

    // 距離順にソート
    results.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return results;
  }
}
