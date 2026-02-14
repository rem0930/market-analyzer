/**
 * @what 商圏半径を表す値オブジェクト
 * @why 0.1〜50km の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type RadiusProps = {
  value: number;
};

const MIN_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 50;

export class Radius extends ValueObject<RadiusProps> {
  private constructor(props: RadiusProps) {
    super(props);
  }

  protected validate(props: RadiusProps): void {
    if (
      !Number.isFinite(props.value) ||
      props.value < MIN_RADIUS_KM ||
      props.value > MAX_RADIUS_KM
    ) {
      throw new Error(
        `Invalid radius: ${props.value}. Must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM} km.`
      );
    }
  }

  static create(value: number): Radius {
    return new Radius({ value });
  }

  get value(): number {
    return this.props.value;
  }
}
