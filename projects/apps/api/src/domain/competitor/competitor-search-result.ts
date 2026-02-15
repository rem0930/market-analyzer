/**
 * @what 競合店舗検索結果を表す値オブジェクト
 * @why Google Places API 等の外部検索結果を型安全に保持し、座標バリデーションを保証
 */

import { ValueObject } from '@monorepo/shared';

type CompetitorSearchResultProps = {
  name: string;
  longitude: number;
  latitude: number;
  googlePlaceId: string;
  category: string;
  address: string;
  distanceMeters: number;
};

export class CompetitorSearchResult extends ValueObject<CompetitorSearchResultProps> {
  private constructor(props: CompetitorSearchResultProps) {
    super(props);
  }

  protected validate(props: CompetitorSearchResultProps): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (!Number.isFinite(props.longitude) || props.longitude < -180 || props.longitude > 180) {
      throw new Error(`Invalid longitude: ${props.longitude}. Must be between -180 and 180.`);
    }
    if (!Number.isFinite(props.latitude) || props.latitude < -90 || props.latitude > 90) {
      throw new Error(`Invalid latitude: ${props.latitude}. Must be between -90 and 90.`);
    }
    if (!props.googlePlaceId || props.googlePlaceId.trim().length === 0) {
      throw new Error('googlePlaceId is required');
    }
    if (!props.address || props.address.trim().length === 0) {
      throw new Error('address is required');
    }
    if (!Number.isFinite(props.distanceMeters) || props.distanceMeters < 0) {
      throw new Error(`Invalid distanceMeters: ${props.distanceMeters}. Must be >= 0.`);
    }
  }

  static create(props: CompetitorSearchResultProps): CompetitorSearchResult {
    return new CompetitorSearchResult(props);
  }

  get name(): string {
    return this.props.name;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get googlePlaceId(): string {
    return this.props.googlePlaceId;
  }

  get category(): string {
    return this.props.category;
  }

  get address(): string {
    return this.props.address;
  }

  get distanceMeters(): number {
    return this.props.distanceMeters;
  }
}
