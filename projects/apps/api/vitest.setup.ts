import { expect } from 'vitest';
import { resultMatchers } from './src/__tests__/matchers/result-matchers.js';

expect.extend(resultMatchers);
