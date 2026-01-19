/**
 * @what パスワードリセット要求ユースケースのユニットテスト
 * @why パスワードリセットトークン生成の正確性を保証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result, Email } from '@monorepo/shared';
import { ForgotPasswordUseCase, type EmailService } from './forgot-password.js';
import {
  AuthUser,
  AuthUserId,
  PasswordHash,
  TokenHash,
  type AuthUserRepository,
  type PasswordResetTokenRepository,
  type TokenHashService,
} from '../../domain/index.js';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let mockAuthUserRepository: AuthUserRepository;
  let mockPasswordResetTokenRepository: PasswordResetTokenRepository;
  let mockTokenHashService: TokenHashService;
  let mockEmailService: EmailService;

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
      save: vi.fn(),
      delete: vi.fn(),
      invalidateAllByUserId: vi.fn(),
    };

    mockTokenHashService = {
      generateToken: vi.fn(),
      hashToken: vi.fn(),
    };

    mockEmailService = {
      sendPasswordResetEmail: vi.fn(),
    };

    useCase = new ForgotPasswordUseCase(
      mockAuthUserRepository,
      mockPasswordResetTokenRepository,
      mockTokenHashService,
      mockEmailService,
      false
    );
  });

  const validInput = {
    email: 'test@example.com',
  };

  describe('successful password reset request', () => {
    it('should return success message when user exists', async () => {
      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('raw-token');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockEmailService.sendPasswordResetEmail).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value.message).toBe('If the email exists, a reset link has been sent.');
    });

    it('should invalidate existing tokens before creating new one', async () => {
      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('raw-token');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockEmailService.sendPasswordResetEmail).mockResolvedValue(Result.ok(undefined));

      await useCase.execute(validInput);

      expect(mockPasswordResetTokenRepository.invalidateAllByUserId).toHaveBeenCalled();
    });

    it('should send email with reset token', async () => {
      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('raw-token-abc');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockEmailService.sendPasswordResetEmail).mockResolvedValue(Result.ok(undefined));

      await useCase.execute(validInput);

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'raw-token-abc'
      );
    });

    it('should save hashed token to repository', async () => {
      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('raw-token');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockEmailService.sendPasswordResetEmail).mockResolvedValue(Result.ok(undefined));

      await useCase.execute(validInput);

      expect(mockTokenHashService.hashToken).toHaveBeenCalledWith('raw-token');
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('debug mode', () => {
    it('should include raw token in output when debug is true', async () => {
      const debugUseCase = new ForgotPasswordUseCase(
        mockAuthUserRepository,
        mockPasswordResetTokenRepository,
        mockTokenHashService,
        mockEmailService,
        true // debug mode
      );

      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('debug-token');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.ok(undefined));
      vi.mocked(mockEmailService.sendPasswordResetEmail).mockResolvedValue(Result.ok(undefined));

      const result = await debugUseCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value._debug?.token).toBe('debug-token');
    });
  });

  describe('security - timing attack prevention', () => {
    it('should return same message for invalid email format', async () => {
      const result = await useCase.execute({ email: 'invalid-email' });

      expect(result.isSuccess()).toBe(true);
      expect(result.value.message).toBe('If the email exists, a reset link has been sent.');
      expect(mockAuthUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should return same message when user not found', async () => {
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(
        Result.ok(null as unknown as AuthUser)
      );

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value.message).toBe('If the email exists, a reset link has been sent.');
    });
  });

  describe('error handling', () => {
    it('should fail when findByEmail returns error', async () => {
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });

    it('should fail when save fails', async () => {
      const user = createMockUser();
      vi.mocked(mockAuthUserRepository.findByEmail).mockResolvedValue(Result.ok(user));
      vi.mocked(mockPasswordResetTokenRepository.invalidateAllByUserId).mockResolvedValue(
        Result.ok(undefined)
      );
      vi.mocked(mockTokenHashService.generateToken).mockReturnValue('raw-token');
      vi.mocked(mockTokenHashService.hashToken).mockReturnValue(TokenHash.create('hashed-token'));
      vi.mocked(mockPasswordResetTokenRepository.save).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });
});
