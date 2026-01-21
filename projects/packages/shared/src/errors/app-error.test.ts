/**
 * @what AppError クラスのユニットテスト
 * @why 統一エラーハンドリングの正確性を保証
 */

import { describe, it, expect } from 'vitest';
import { AppError, type ErrorItem } from './app-error.js';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with code only', () => {
      const error = new AppError('VALIDATION_ERROR');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation Error');
      expect(error.name).toBe('AppError');
    });

    it('should create error with all options', () => {
      const cause = new Error('Original error');
      const errors: ErrorItem[] = [{ field: 'email', code: 'INVALID_FORMAT' }];

      const error = new AppError('VALIDATION_ERROR', {
        reason: 'INVALID_EMAIL',
        messageKey: 'errors.validation.email',
        messageParams: { field: 'email' },
        errors,
        cause,
      });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.reason).toBe('INVALID_EMAIL');
      expect(error.messageKey).toBe('errors.validation.email');
      expect(error.messageParams).toEqual({ field: 'email' });
      expect(error.errors).toEqual(errors);
      expect(error.cause).toBe(cause);
    });
  });

  describe('toApiError', () => {
    it('should convert to ApiError with required fields', () => {
      const error = new AppError('UNAUTHORIZED');
      const apiError = error.toApiError('request-123');

      expect(apiError.type).toBe('about:blank');
      expect(apiError.title).toBe('Unauthorized');
      expect(apiError.status).toBe(401);
      expect(apiError.code).toBe('UNAUTHORIZED');
      expect(apiError.requestId).toBe('request-123');
      expect(apiError.reason).toBeUndefined();
      expect(apiError.messageKey).toBeUndefined();
      expect(apiError.errors).toBeUndefined();
    });

    it('should include optional fields when present', () => {
      const error = new AppError('VALIDATION_ERROR', {
        reason: 'INVALID_EMAIL',
        messageKey: 'errors.email.invalid',
        messageParams: { maxLength: 255 },
        errors: [{ field: 'email', code: 'INVALID_FORMAT' }],
      });

      const apiError = error.toApiError('request-456');

      expect(apiError.reason).toBe('INVALID_EMAIL');
      expect(apiError.messageKey).toBe('errors.email.invalid');
      expect(apiError.messageParams).toEqual({ maxLength: 255 });
      expect(apiError.errors).toEqual([{ field: 'email', code: 'INVALID_FORMAT' }]);
    });

    it('should not include empty errors array', () => {
      const error = new AppError('VALIDATION_ERROR', { errors: [] });
      const apiError = error.toApiError('request-789');

      expect(apiError.errors).toBeUndefined();
    });
  });

  describe('static fromUnknown', () => {
    it('should return same AppError if already AppError', () => {
      const original = new AppError('NOT_FOUND');
      const result = AppError.fromUnknown(original);

      expect(result).toBe(original);
    });

    it('should wrap Error as INTERNAL_ERROR', () => {
      const original = new Error('Something went wrong');
      const result = AppError.fromUnknown(original);

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.status).toBe(500);
      expect(result.cause).toBe(original);
    });

    it('should wrap non-Error as INTERNAL_ERROR', () => {
      const result = AppError.fromUnknown('string error');

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.cause).toBeInstanceOf(Error);
      expect((result.cause as Error).message).toBe('string error');
    });
  });

  describe('static validation', () => {
    it('should create VALIDATION_ERROR with errors', () => {
      const errors: ErrorItem[] = [
        { field: 'email', code: 'INVALID_FORMAT' },
        { field: 'password', code: 'TOO_SHORT' },
      ];

      const error = AppError.validation(errors);

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.errors).toEqual(errors);
    });

    it('should accept additional options', () => {
      const error = AppError.validation([{ field: 'email', code: 'INVALID_FORMAT' }], {
        reason: 'INVALID_EMAIL',
        messageKey: 'errors.email',
      });

      expect(error.reason).toBe('INVALID_EMAIL');
      expect(error.messageKey).toBe('errors.email');
    });
  });

  describe('static unauthorized', () => {
    it('should create UNAUTHORIZED without reason', () => {
      const error = AppError.unauthorized();

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.status).toBe(401);
      expect(error.reason).toBeUndefined();
    });

    it('should create UNAUTHORIZED with reason', () => {
      const error = AppError.unauthorized('TOKEN_EXPIRED');

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.reason).toBe('TOKEN_EXPIRED');
    });
  });

  describe('static forbidden', () => {
    it('should create FORBIDDEN', () => {
      const error = AppError.forbidden();

      expect(error.code).toBe('FORBIDDEN');
      expect(error.status).toBe(403);
    });
  });

  describe('static notFound', () => {
    it('should create NOT_FOUND without reason', () => {
      const error = AppError.notFound();

      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
    });

    it('should create NOT_FOUND with reason', () => {
      const error = AppError.notFound('USER_NOT_FOUND');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.reason).toBe('USER_NOT_FOUND');
    });
  });

  describe('static conflict', () => {
    it('should create CONFLICT with reason', () => {
      const error = AppError.conflict('EMAIL_EXISTS');

      expect(error.code).toBe('CONFLICT');
      expect(error.status).toBe(409);
      expect(error.reason).toBe('EMAIL_EXISTS');
    });
  });

  describe('static rateLimit', () => {
    it('should create RATE_LIMIT with TOO_MANY_REQUESTS reason', () => {
      const error = AppError.rateLimit();

      expect(error.code).toBe('RATE_LIMIT');
      expect(error.status).toBe(429);
      expect(error.reason).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('error code status mapping', () => {
    it.each([
      ['VALIDATION_ERROR', 400],
      ['UNAUTHORIZED', 401],
      ['FORBIDDEN', 403],
      ['NOT_FOUND', 404],
      ['CONFLICT', 409],
      ['RATE_LIMIT', 429],
      ['EXTERNAL_SERVICE_ERROR', 502],
      ['INTERNAL_ERROR', 500],
    ] as const)('should map %s to status %d', (code, expectedStatus) => {
      const error = new AppError(code);
      expect(error.status).toBe(expectedStatus);
    });
  });
});
