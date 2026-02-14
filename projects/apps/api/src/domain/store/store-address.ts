/**
 * @what 店舗住所を表す値オブジェクト
 * @why 1〜500文字の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type StoreAddressProps = {
  value: string;
};

const MIN_LENGTH = 1;
const MAX_LENGTH = 500;

export class StoreAddress extends ValueObject<StoreAddressProps> {
  private constructor(props: StoreAddressProps) {
    super(props);
  }

  protected validate(props: StoreAddressProps): void {
    const trimmed = props.value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Invalid store address: length must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
    }
  }

  static create(value: string): StoreAddress {
    return new StoreAddress({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
