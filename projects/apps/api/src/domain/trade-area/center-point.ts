/**
 * @what 商圏の中心座標を表す値オブジェクト
 * @why 経度・緯度の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type CenterPointProps = {
  longitude: number;
  latitude: number;
};

export class CenterPoint extends ValueObject<CenterPointProps> {
  private constructor(props: CenterPointProps) {
    super(props);
  }

  protected validate(props: CenterPointProps): void {
    if (!Number.isFinite(props.longitude) || props.longitude < -180 || props.longitude > 180) {
      throw new Error(`Invalid longitude: ${props.longitude}. Must be between -180 and 180.`);
    }
    if (!Number.isFinite(props.latitude) || props.latitude < -90 || props.latitude > 90) {
      throw new Error(`Invalid latitude: ${props.latitude}. Must be between -90 and 90.`);
    }
  }

  static create(longitude: number, latitude: number): CenterPoint {
    return new CenterPoint({ longitude, latitude });
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get latitude(): number {
    return this.props.latitude;
  }
}
