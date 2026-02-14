/**
 * @what 人口統計データを表す値オブジェクト
 * @why 商圏の人口・世帯数・年齢分布・収入を型安全に保持
 */

import { ValueObject } from '@monorepo/shared';

export interface AgeDistributionEntry {
  readonly range: string;
  readonly count: number;
  readonly percentage: number;
}

type DemographicDataProps = {
  population: number;
  households: number;
  averageIncome: number;
  ageDistribution: readonly AgeDistributionEntry[];
};

export class DemographicData extends ValueObject<DemographicDataProps> {
  private constructor(props: DemographicDataProps) {
    super(props);
  }

  protected validate(props: DemographicDataProps): void {
    if (props.population < 0) {
      throw new Error(`Invalid population: ${props.population}`);
    }
    if (props.households < 0) {
      throw new Error(`Invalid households: ${props.households}`);
    }
    if (props.averageIncome < 0) {
      throw new Error(`Invalid averageIncome: ${props.averageIncome}`);
    }
  }

  static create(
    population: number,
    households: number,
    averageIncome: number,
    ageDistribution: readonly AgeDistributionEntry[]
  ): DemographicData {
    return new DemographicData({ population, households, averageIncome, ageDistribution });
  }

  get population(): number {
    return this.props.population;
  }

  get households(): number {
    return this.props.households;
  }

  get averageIncome(): number {
    return this.props.averageIncome;
  }

  get ageDistribution(): readonly AgeDistributionEntry[] {
    return this.props.ageDistribution;
  }
}
