/**
 * @what 認証関連テストフィクスチャ
 * @why テストデータを一元管理し、テストの可読性と保守性を向上させる
 */

import { Email } from '@monorepo/shared';
import { AuthUser, AuthUserId, PasswordHash, type TokenPair } from '../../domain/index.js';

/**
 * テスト用 AuthUser を作成
 * デフォルト値を持ち、overrides で部分的にカスタマイズ可能
 */
export function createTestAuthUser(
  overrides: {
    id?: string;
    email?: string;
    passwordHash?: string;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  } = {}
): AuthUser {
  return AuthUser.restore(
    new AuthUserId(overrides.id ?? '550e8400-e29b-41d4-a716-446655440000'),
    Email.create(overrides.email ?? 'test@example.com'),
    PasswordHash.create(overrides.passwordHash ?? '$2b$12$hashedpassword'),
    overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    overrides.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
    overrides.version ?? 1
  );
}

/**
 * テスト用 TokenPair を作成
 */
export function createTestTokenPair(overrides: Partial<TokenPair> = {}): TokenPair {
  return {
    accessToken: overrides.accessToken ?? 'access-token-123',
    refreshToken: overrides.refreshToken ?? 'refresh-token-456',
    accessTokenExpiresIn: overrides.accessTokenExpiresIn ?? 900,
    refreshTokenExpiresIn: overrides.refreshTokenExpiresIn ?? 604800,
  };
}

/**
 * テスト用ログイン入力を作成
 */
export function validLoginInput(
  overrides: {
    email?: string;
    password?: string;
  } = {}
): { email: string; password: string } {
  return {
    email: overrides.email ?? 'test@example.com',
    password: overrides.password ?? 'SecurePass123',
  };
}
