/**
 * @what 人口統計データプロバイダーのインターフェース
 * @why ドメイン層がデータソースに依存しないよう、インターフェースを定義
 */

import type { DemographicData } from './demographic-data.js';
import type { CenterPoint } from './center-point.js';
import type { Radius } from './radius.js';

export interface DemographicDataProvider {
  getDemographics(
    tradeAreaId: string,
    center: CenterPoint,
    radius: Radius
  ): Promise<DemographicData>;
}
