/**
 * @layer entities
 * @segment trade-area
 * @what 商圏のフロントエンド型定義
 */

export interface TradeArea {
  id: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeAreasResponse {
  tradeAreas: TradeArea[];
  total: number;
}

export interface AgeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface DemographicData {
  tradeAreaId: string;
  population: number;
  households: number;
  averageIncome: number;
  ageDistribution: AgeDistribution[];
}

export interface CreateTradeAreaRequest {
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
}

export interface UpdateTradeAreaRequest {
  name?: string;
  longitude?: number;
  latitude?: number;
  radiusKm?: number;
}
