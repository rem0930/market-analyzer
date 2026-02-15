/**
 * @layer entities
 * @segment store
 * @what 自店舗のフロントエンド型定義
 */

export interface Store {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoresResponse {
  stores: Store[];
}

export interface CreateStoreRequest {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
}

export interface UpdateStoreRequest {
  name?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
}
