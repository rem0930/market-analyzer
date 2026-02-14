/**
 * @what 共通モックビルダー
 * @why テストごとにモック定義を繰り返さず、一貫したモックを簡潔に作成する
 */

import { vi } from 'vitest';
import type {
  AuthUserRepository,
  RefreshTokenRepository,
  PasswordService,
  TokenHashService,
  JwtService,
} from '../../domain/index.js';

/**
 * AuthUserRepository の全メソッドを vi.fn() でモック化
 */
export function createMockAuthUserRepository(): AuthUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    exists: vi.fn(),
    emailExists: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * RefreshTokenRepository の全メソッドを vi.fn() でモック化
 */
export function createMockRefreshTokenRepository(): RefreshTokenRepository {
  return {
    findById: vi.fn(),
    findByTokenHash: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    revokeAllByUserId: vi.fn(),
  };
}

/**
 * PasswordService の全メソッドを vi.fn() でモック化
 */
export function createMockPasswordService(): PasswordService {
  return {
    hash: vi.fn(),
    verify: vi.fn(),
    validateStrength: vi.fn(),
  };
}

/**
 * JwtService の全メソッドを vi.fn() でモック化
 */
export function createMockJwtService(): JwtService {
  return {
    generateTokenPair: vi.fn(),
    generateAccessToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
}

/**
 * TokenHashService の全メソッドを vi.fn() でモック化
 */
export function createMockTokenHashService(): TokenHashService {
  return {
    generateToken: vi.fn(),
    hashToken: vi.fn(),
  };
}
