/**
 * @what バリデーションスキーマのエクスポート
 * @why スキーマの公開APIを明示
 */

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type LogoutInput,
} from './auth-schemas.js';

export { createUserSchema, type CreateUserInput } from './user-schemas.js';

export {
  createTradeAreaSchema,
  updateTradeAreaSchema,
  type CreateTradeAreaInput,
  type UpdateTradeAreaInput,
} from './trade-area-schemas.js';

export {
  updateNameSchema,
  updatePasswordSchema,
  type UpdateNameInput,
  type UpdatePasswordInput,
} from './profile-schemas.js';

export {
  createStoreSchema,
  updateStoreSchema,
  type CreateStoreInput,
  type UpdateStoreInput,
} from './store-schemas.js';

export {
  createCompetitorSchema,
  updateCompetitorSchema,
  type CreateCompetitorInput,
  type UpdateCompetitorInput,
} from './competitor-schemas.js';

export {
  searchCompetitorsSchema,
  bulkCreateCompetitorsSchema,
  type SearchCompetitorsInput,
  type BulkCreateCompetitorsInput,
} from './competitor-search-schemas.js';
