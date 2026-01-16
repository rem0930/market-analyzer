/**
 * @what トークンハッシュサービス
 * @why リフレッシュトークンやリセットトークンのハッシュ化
 */

import { createHash, randomBytes } from 'node:crypto';
import { TokenHash } from '../../domain/auth/refresh-token.js';

export interface TokenHashService {
  generateToken(): string;
  hashToken(token: string): TokenHash;
}

export class CryptoTokenHashService implements TokenHashService {
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(token: string): TokenHash {
    const hash = createHash('sha256').update(token).digest('hex');
    return TokenHash.create(hash);
  }
}
