/**
 * @what 競合店舗の登録ソースを表す値オブジェクト
 * @why manual | google_places の enum バリデーションを型で保証
 */

import { ValueObject } from '@monorepo/shared';

export type CompetitorSourceType = 'manual' | 'google_places';

type CompetitorSourceProps = {
  value: CompetitorSourceType;
};

const VALID_SOURCES: CompetitorSourceType[] = ['manual', 'google_places'];

export class CompetitorSource extends ValueObject<CompetitorSourceProps> {
  private constructor(props: CompetitorSourceProps) {
    super(props);
  }

  protected validate(props: CompetitorSourceProps): void {
    if (!VALID_SOURCES.includes(props.value)) {
      throw new Error(
        `Invalid competitor source: "${props.value}". Must be one of: ${VALID_SOURCES.join(', ')}.`
      );
    }
  }

  static create(value: string): CompetitorSource {
    return new CompetitorSource({ value: value as CompetitorSourceType });
  }

  get value(): CompetitorSourceType {
    return this.props.value;
  }
}
