/**
 * @layer entities
 * @segment competitor
 * @what 競合店舗のフロントエンド型定義
 */

export interface Competitor {
  id: string;
  storeId: string;
  name: string;
  longitude: number;
  latitude: number;
  source: string;
  googlePlaceId: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchCompetitorItem {
  name: string;
  longitude: number;
  latitude: number;
  googlePlaceId: string;
  category: string;
  address: string;
  distanceMeters: number;
  alreadyRegistered: boolean;
}

export interface SearchCompetitorsRequest {
  radiusMeters: number;
  keyword: string;
  maxResults?: number;
}

export interface SearchCompetitorsResponse {
  results: SearchCompetitorItem[];
  total: number;
  searchCenter: {
    longitude: number;
    latitude: number;
  };
}

export interface BulkCreateCompetitorItem {
  name: string;
  longitude: number;
  latitude: number;
  googlePlaceId: string;
  category?: string;
}

export interface BulkCreateCompetitorsRequest {
  competitors: BulkCreateCompetitorItem[];
}

export interface BulkCreateCompetitorsResponse {
  created: Competitor[];
  skipped: { googlePlaceId: string; reason: string }[];
  total: {
    created: number;
    skipped: number;
  };
}
