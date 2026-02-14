/**
 * @what モック人口統計データプロバイダー
 * @why 座標ベースの決定論的モックデータ生成（同じ地点 = 同じデータ）
 */

import {
  DemographicData,
  type AgeDistributionEntry,
  type DemographicDataProvider,
  type CenterPoint,
  type Radius,
} from '../../domain/index.js';

/**
 * 座標から決定論的なシード値を生成
 */
function hashSeed(lng: number, lat: number, radiusKm: number): number {
  const str = `${lng.toFixed(4)}:${lat.toFixed(4)}:${radiusKm.toFixed(2)}`;
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

export class MockDemographicDataProvider implements DemographicDataProvider {
  async getDemographics(
    _tradeAreaId: string,
    center: CenterPoint,
    radius: Radius
  ): Promise<DemographicData> {
    const seed = hashSeed(center.longitude, center.latitude, radius.value);

    // 半径に比例した人口（半径^2 に面積が比例）
    const areaFactor = radius.value * radius.value;
    const basePop = 1000 + Math.floor(seededRandom(seed, 0) * 5000);
    const population = Math.floor(basePop * areaFactor);
    const households = Math.floor(population / (2 + seededRandom(seed, 1) * 2));
    const averageIncome = Math.floor(3000000 + seededRandom(seed, 2) * 5000000);

    const ageRanges = ['0-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const rawWeights = ageRanges.map((_, i) => 0.5 + seededRandom(seed, 10 + i) * 2);
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);

    const ageDistribution: AgeDistributionEntry[] = ageRanges.map((range, i) => {
      const percentage = (rawWeights[i] / totalWeight) * 100;
      const count = Math.floor((percentage / 100) * population);
      return {
        range,
        count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    return DemographicData.create(population, households, averageIncome, ageDistribution);
  }
}
