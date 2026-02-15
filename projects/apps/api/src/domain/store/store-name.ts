/**
 * @what 店舗名を表す値オブジェクト
 * @why 1〜100文字の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type StoreNameProps = {
  value: string;
};

const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class StoreName extends ValueObject<StoreNameProps> {
  private constructor(props: StoreNameProps) {
    super(props);
  }

  protected validate(props: StoreNameProps): void {
    const trimmed = props.value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Invalid store name: length must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
    }
  }

  static create(value: string): StoreName {
    return new StoreName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
