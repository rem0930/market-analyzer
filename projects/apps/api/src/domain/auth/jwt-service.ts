/**
 * @what JWTサービスのインターフェース
 * @why トークン生成・検証の抽象化（domain層）
 */

import type { Result } from '@monorepo/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export type JwtServiceError = 'sign_failed' | 'verify_failed' | 'token_expired' | 'invalid_token';

export interface JwtService {
  generateTokenPair(userId: string, email: string): Result<TokenPair, JwtServiceError>;
  generateAccessToken(userId: string, email: string): Result<string, JwtServiceError>;
  verifyAccessToken(token: string): Result<JwtPayload, JwtServiceError>;
  verifyRefreshToken(token: string): Result<JwtPayload, JwtServiceError>;
}
