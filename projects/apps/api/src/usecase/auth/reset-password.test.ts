/**
 * @what パスワードリセット実行ユースケースのユニットテスト
 * @why パスワードリセット処理の正確性を保証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result, Email } from '@monorepo/shared';
import { ResetPasswordUseCase } from './reset-password.js';
import {
  AuthUser,
  AuthUserId,
  PasswordHash,
  PasswordResetToken,
  PasswordResetTokenId,
  TokenHash,
  type AuthUserRepository,
  type PasswordResetTokenRepository,
  type RefreshTokenRepository,
  type PasswordService,
  type TokenHashService,
} from '../../domain/index.js';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockAuthUserRepository: AuthUserRepository;
  let mockPasswordResetTokenRepository: PasswordResetTokenRepository;
  let mockRefreshTokenRepository: RefreshTokenRepository;
  let mockPasswordService: PasswordService;
  let mockTokenHashService: TokenHashService;

  const createMockUser = () => {
    return AuthUser.restore(
      new AuthUserId('550e8400-e29b-41d4-a716-446655440000'),
      Email.create('test@example.com'),
      PasswordHash.create('$2b$12$hashedpassword'),
      new Date(),
      new Date(),
      1
    );
  };

  const createMockResetToken = (options?: { used?: boolean; expired?: boolean }) => {
    const expiresAt = options?.expired
      ? new Date(Date.now() - 1000)
      : new Date(Date.now() + 3600000);
    return PasswordResetToken.restore(
      new PasswordResetTokenId('660e8400-e29b-41d4-a716-446655440000'),
      new AuthUserId('550e8400-e29b-41d4-a716-446655440000'),
      TokenHash.create('hashed-reset-token'),
      expiresAt,
      new Date(),
      options?.used ? new Date() : null
    );
  };

  beforeEach(() => {
    mockAuthUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      exists: vi.fn(),
      emailExists: vi.fn(),
      delete: vi.fn(),
    };

    mockPasswordResetTokenRepository = {
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      invalidateAllByUserId: vi.fn(),
    };

    mockRefreshTokenRepository = {
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      revokeAllByUserId: vi.fn(),
    };

    mockPasswordService = {
      hash: vi.fn(),
      verify: vi.fn(),
      validateStrength: vi.fn(),
    };

    mockTokenHashService = {
      generateToken: vi.fn(),
      hashToken: vi.fn(),
    };

    useCase = new ResetPasswordUseCase(
      mockAuthUserRepository,
      mockPasswordResetTokenRepository,
      mockRefreshTokenRepository,
      mockPasswordService,
      mockTokenHashService
    );
  });

  const validInput = {
    token: 'valid-reset-token',
    password: 'NewSecurePass123',
    causationId: 'cause-1',
    correlationId: 'corr-1',
  };

  describe('successful password reset', () => {
    it('should reset password successfully', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$newhashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockRefreshTokenRepository.revokeAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value.message).toBe('Password has been reset successfully.');
    });

    it('should hash the new password', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$newhashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockRefreshTokenRepository.revokeAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );

      await useCase.execute(validInput);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('NewSecurePass123');
    });

    it('should mark token as used', async () => {
      const resetToken = createMockResetToken();
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(resetToken)
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$newhashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockRefreshTokenRepository.revokeAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );

      await useCase.execute(validInput);

      // Token repository save is called to mark token as used
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should revoke all refresh tokens after password reset', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$newhashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockRefreshTokenRepository.revokeAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );

      await useCase.execute(validInput);

      expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalled();
    });
  });

  describe('password validation', () => {
    it('should fail when password is too weak', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.fail('weak_password'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('weak_password');
      expect(mockTokenHashService.hashToken).not.toHaveBeenCalled();
    });
  });

  describe('token validation', () => {
    it('should fail when token not found', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(null as unknown as PasswordResetToken)
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_token');
    });

    it('should fail when token is expired', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken({ expired: true }))
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('token_expired');
    });

    it('should fail when token is already used', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken({ used: true }))
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      // isValid returns false for used tokens
      expect(result.error).toBe('token_expired');
    });

    it('should fail when findByTokenHash returns error', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.fail('db_error')
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });

  describe('user validation', () => {
    it('should fail when user not found', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(
        Result.ok(null as unknown as AuthUser)
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_token');
    });

    it('should fail when findById returns error', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });

  describe('password hashing', () => {
    it('should fail when hashing fails', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(Result.fail('hash_failed'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });

  describe('user persistence', () => {
    it('should fail when user save fails', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(
        TokenHash.create('hashed-reset-token')
      );
      vi.mocked(mockPasswordResetTokenRepository.findByTokenHash).mockResolvedValue(
        Result.ok(createMockResetToken())
      );
      vi.mocked(mockAuthUserRepository.findById).mockResolvedValue(Result.ok(createMockUser()));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$newhashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });
});
