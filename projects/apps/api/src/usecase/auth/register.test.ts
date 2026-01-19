/**
 * @what ユーザー登録ユースケースのユニットテスト
 * @why 認証フローの正確性を保証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '@monorepo/shared';
import { RegisterUseCase } from './register.js';
import { PasswordHash, type AuthUserRepository, type PasswordService } from '../../domain/index.js';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthUserRepository: AuthUserRepository;
  let mockPasswordService: PasswordService;

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

    mockPasswordService = {
      hash: vi.fn(),
      verify: vi.fn(),
      validateStrength: vi.fn(),
    };

    useCase = new RegisterUseCase(mockAuthUserRepository, mockPasswordService);
  });

  const validInput = {
    email: 'test@example.com',
    password: 'SecurePass123',
    causationId: 'cause-1',
    correlationId: 'corr-1',
  };

  describe('successful registration', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(false));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$hashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value.email).toBe('test@example.com');
      expect(result.value.id).toBeDefined();
      expect(result.value.createdAt).toBeInstanceOf(Date);
    });

    it('should hash password before saving', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(false));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$hashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.ok(undefined));

      await useCase.execute(validInput);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('SecurePass123');
    });
  });

  describe('email validation', () => {
    it('should fail with invalid email format', async () => {
      const result = await useCase.execute({
        ...validInput,
        email: 'invalid-email',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_email');
      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();
    });

    it('should fail with empty email', async () => {
      const result = await useCase.execute({
        ...validInput,
        email: '',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_email');
    });
  });

  describe('password validation', () => {
    it('should fail when password is too weak', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.fail('weak_password'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('weak_password');
      expect(mockAuthUserRepository.emailExists).not.toHaveBeenCalled();
    });
  });

  describe('email uniqueness', () => {
    it('should fail when email already exists', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(true));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('email_already_exists');
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
    });

    it('should fail when emailExists check fails', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });

    it('should handle conflict on save (race condition)', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(false));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$hashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.fail('conflict'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('email_already_exists');
    });
  });

  describe('password hashing', () => {
    it('should fail when hashing fails', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(false));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(Result.fail('hash_failed'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });

  describe('user persistence', () => {
    it('should fail when save fails with non-conflict error', async () => {
      vi.mocked(mockPasswordService.validateStrength).mockReturnValue(Result.ok(undefined));
      vi.mocked(mockAuthUserRepository.emailExists).mockResolvedValue(Result.ok(false));
      vi.mocked(mockPasswordService.hash).mockResolvedValue(
        Result.ok(PasswordHash.create('$2b$12$hashedpassword'))
      );
      vi.mocked(mockAuthUserRepository.save).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });
});
