/**
 * @what 店舗ユースケースのエクスポート
 */

export {
  CreateStoreUseCase,
  type CreateStoreInput,
  type CreateStoreOutput,
  type CreateStoreError,
} from './create-store.js';

export {
  GetStoreUseCase,
  type GetStoreInput,
  type GetStoreOutput,
  type GetStoreError,
} from './get-store.js';

export {
  ListStoresUseCase,
  type ListStoresInput,
  type ListStoresOutput,
  type ListStoresError,
  type StoreItem,
} from './list-stores.js';

export {
  UpdateStoreUseCase,
  type UpdateStoreInput,
  type UpdateStoreOutput,
  type UpdateStoreError,
} from './update-store.js';

export {
  DeleteStoreUseCase,
  type DeleteStoreInput,
  type DeleteStoreError,
} from './delete-store.js';
