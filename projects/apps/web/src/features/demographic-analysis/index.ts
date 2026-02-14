/**
 * @layer features
 * @segment demographic-analysis
 * @what 人口統計分析機能の public API
 */

export { DemographicPanel } from './ui/DemographicPanel';
export { PopulationChart } from './ui/PopulationChart';
export { AgeDistributionChart } from './ui/AgeDistributionChart';
export { useDemographics } from './api/queries';
export { useSelectedDemographics } from './model/useDemographics';
