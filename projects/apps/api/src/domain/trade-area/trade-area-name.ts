/**
 * @what 商圏名を表す値オブジェクト
 * @why 1〜100文字の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type TradeAreaNameProps = {
  value: string;
};

const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class TradeAreaName extends ValueObject<TradeAreaNameProps> {
  private constructor(props: TradeAreaNameProps) {
    super(props);
  }

  protected validate(props: TradeAreaNameProps): void {
    const trimmed = props.value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Invalid trade area name: length must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
    }
  }

  static create(value: string): TradeAreaName {
    return new TradeAreaName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
