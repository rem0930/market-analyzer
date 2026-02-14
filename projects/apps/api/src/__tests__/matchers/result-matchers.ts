/**
 * @what Result<T, E> 用カスタム Vitest マッチャー
 * @why expect(result).toBeSuccess() で簡潔にアサーションできるようにする
 */

import type { ExpectationResult } from 'vitest';
import { Result } from '@monorepo/shared';

interface ResultLike {
  isSuccess(): boolean;
  isFailure(): boolean;
  error?: unknown;
}

function isResultLike(value: unknown): value is ResultLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    'isSuccess' in value &&
    typeof (value as ResultLike).isSuccess === 'function' &&
    'isFailure' in value &&
    typeof (value as ResultLike).isFailure === 'function'
  );
}

export const resultMatchers = {
  toBeSuccess(received: unknown): ExpectationResult {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => 'Expected value to be a Result instance',
        actual: received,
        expected: 'Result instance',
      };
    }
    return {
      pass: received.isSuccess(),
      message: () =>
        received.isSuccess()
          ? `Expected Result to be failure, but was success`
          : `Expected Result to be success, but was failure with error: ${JSON.stringify(received.error)}`,
      actual: received.isSuccess() ? 'success' : `failure(${JSON.stringify(received.error)})`,
      expected: 'success',
    };
  },

  toBeFailure(received: unknown): ExpectationResult {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => 'Expected value to be a Result instance',
        actual: received,
        expected: 'Result instance',
      };
    }
    return {
      pass: received.isFailure(),
      message: () =>
        received.isFailure()
          ? `Expected Result to be success, but was failure`
          : `Expected Result to be failure, but was success`,
      actual: received.isFailure() ? 'failure' : 'success',
      expected: 'failure',
    };
  },

  toBeFailureWithError(received: unknown, expectedError: unknown): ExpectationResult {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => 'Expected value to be a Result instance',
        actual: received,
        expected: 'Result instance',
      };
    }
    const isFailure = received.isFailure();
    const errorMatches = received.error === expectedError;
    return {
      pass: isFailure && errorMatches,
      message: () => {
        if (!isFailure) {
          return `Expected Result to be failure with error ${JSON.stringify(expectedError)}, but was success`;
        }
        return `Expected Result to have error ${JSON.stringify(expectedError)}, but got ${JSON.stringify(received.error)}`;
      },
      actual: isFailure ? received.error : 'success',
      expected: expectedError,
    };
  },
};

declare module 'vitest' {
  interface Assertion<T> {
    toBeSuccess(): void;
    toBeFailure(): void;
    toBeFailureWithError(expectedError: unknown): void;
  }
  interface AsymmetricMatchersContaining {
    toBeSuccess(): void;
    toBeFailure(): void;
    toBeFailureWithError(expectedError: unknown): void;
  }
}
