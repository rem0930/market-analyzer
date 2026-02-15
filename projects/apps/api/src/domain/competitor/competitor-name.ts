/**
 * @what 競合店舗名を表す値オブジェクト
 * @why 1〜100文字の範囲バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

type CompetitorNameProps = {
  value: string;
};

const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class CompetitorName extends ValueObject<CompetitorNameProps> {
  private constructor(props: CompetitorNameProps) {
    super(props);
  }

  protected validate(props: CompetitorNameProps): void {
    const trimmed = props.value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Invalid competitor name: length must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
    }
  }

  static create(value: string): CompetitorName {
    return new CompetitorName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
