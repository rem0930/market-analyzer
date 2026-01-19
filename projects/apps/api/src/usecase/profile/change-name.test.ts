/**
 * @what 名前変更ユースケースのユニットテスト
 * @why ユーザー名前変更処理の正確性を保証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result, Email } from '@monorepo/shared';
import { ChangeNameUseCase } from './change-name.js';
import { User, UserId, type UserRepository } from '../../domain/index.js';

describe('ChangeNameUseCase', () => {
  let useCase: ChangeNameUseCase;
  let mockUserRepository: UserRepository;

  const createMockUser = (name: string = 'Test User') => {
    return User.restore(
      new UserId('550e8400-e29b-41d4-a716-446655440000'),
      Email.create('test@example.com'),
      name,
      1
    );
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
      emailExists: vi.fn(),
    };

    useCase = new ChangeNameUseCase(mockUserRepository);
  });

  const validInput = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'New Name',
    causationId: 'causation-1',
    correlationId: 'correlation-1',
  };

  describe('successful name change', () => {
    it('should change name successfully', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute(validInput);

      expect(result.isSuccess()).toBe(true);
      expect(result.value.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.value.name).toBe('New Name');
      expect(result.value.email).toBe('test@example.com');
    });

    it('should persist the user after name change', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined));

      await useCase.execute(validInput);

      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should update name on the user entity', async () => {
      const user = createMockUser('Old Name');
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({ ...validInput, name: 'Updated Name' });

      expect(result.isSuccess()).toBe(true);
      expect(result.value.name).toBe('Updated Name');
    });
  });

  describe('user id validation', () => {
    it('should fail with invalid UUID format', async () => {
      const result = await useCase.execute({
        ...validInput,
        userId: 'invalid-uuid',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('user_not_found');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('user lookup', () => {
    it('should fail when user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(null as unknown as User));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('user_not_found');
    });

    it('should fail when repository returns error', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });

  describe('name validation', () => {
    it('should fail with empty name', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));

      const result = await useCase.execute({
        ...validInput,
        name: '',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_name');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should fail with name exceeding 100 characters', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));

      const result = await useCase.execute({
        ...validInput,
        name: 'a'.repeat(101),
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('invalid_name');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should accept name with exactly 100 characters', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({
        ...validInput,
        name: 'a'.repeat(100),
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept single character name', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined));

      const result = await useCase.execute({
        ...validInput,
        name: 'A',
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('same name validation', () => {
    it('should fail when changing to same name', async () => {
      const user = createMockUser('Test User');
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));

      const result = await useCase.execute({
        ...validInput,
        name: 'Test User',
      });

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('same_name');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('user persistence', () => {
    it('should fail when update fails', async () => {
      const user = createMockUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user));
      vi.mocked(mockUserRepository.update).mockResolvedValue(Result.fail('db_error'));

      const result = await useCase.execute(validInput);

      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('internal_error');
    });
  });
});
