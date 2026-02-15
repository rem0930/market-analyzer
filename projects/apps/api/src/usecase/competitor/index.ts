/**
 * @what 競合店舗ユースケースのエクスポート
 */

export {
  CreateCompetitorUseCase,
  type CreateCompetitorInput,
  type CreateCompetitorOutput,
  type CreateCompetitorError,
} from './create-competitor.js';

export {
  GetCompetitorUseCase,
  type GetCompetitorInput,
  type GetCompetitorOutput,
  type GetCompetitorError,
} from './get-competitor.js';

export {
  ListCompetitorsByStoreUseCase,
  type ListCompetitorsByStoreInput,
  type ListCompetitorsByStoreOutput,
  type ListCompetitorsByStoreError,
  type CompetitorItem,
} from './list-competitors-by-store.js';

export {
  UpdateCompetitorUseCase,
  type UpdateCompetitorInput,
  type UpdateCompetitorOutput,
  type UpdateCompetitorError,
} from './update-competitor.js';

export {
  DeleteCompetitorUseCase,
  type DeleteCompetitorInput,
  type DeleteCompetitorError,
} from './delete-competitor.js';
