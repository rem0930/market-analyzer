/**
 * @what CSRFミドルウェアのユニットテスト
 * @why CSRF保護の正確性を保証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CsrfMiddleware } from './csrf-middleware.js';

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let mockReq: Partial<IncomingMessage>;
  let mockRes: Partial<ServerResponse>;

  beforeEach(() => {
    middleware = new CsrfMiddleware();
    mockReq = {
      method: 'POST',
      url: '/users/me/name',
      headers: {},
    };
    mockRes = {
      writeHead: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    } as unknown as ServerResponse;
  });

  describe('generateToken', () => {
    it('should generate a hex token of correct length', () => {
      const token = middleware.generateToken();
      // 32 bytes = 64 hex characters
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = middleware.generateToken();
      const token2 = middleware.generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('setTokenCookie', () => {
    it('should set cookie with correct attributes', () => {
      const token = 'test-token-123';
      middleware.setTokenCookie(mockRes as ServerResponse, token);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('csrf-token=test-token-123')
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('SameSite=Strict')
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('HttpOnly')
      );
    });
  });

  describe('verify', () => {
    describe('GET requests', () => {
      it('should allow GET requests without CSRF token', () => {
        mockReq.method = 'GET';
        mockReq.url = '/users/me/name';

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
        expect(mockRes.writeHead).not.toHaveBeenCalled();
      });

      it('should allow HEAD requests without CSRF token', () => {
        mockReq.method = 'HEAD';

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });

      it('should allow OPTIONS requests without CSRF token', () => {
        mockReq.method = 'OPTIONS';

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });
    });

    describe('excluded paths', () => {
      const excludedPaths = [
        '/health',
        '/ping/deep',
        '/',
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/refresh',
      ];

      excludedPaths.forEach((path) => {
        it(`should allow POST to ${path} without CSRF token`, () => {
          mockReq.method = 'POST';
          mockReq.url = path;

          const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

          expect(result).toBe(true);
        });
      });
    });

    describe('protected paths', () => {
      it('should reject POST without CSRF token', () => {
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {};

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(false);
        expect(mockRes.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'application/json' });
      });

      it('should reject POST with only cookie token', () => {
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          cookie: 'csrf-token=valid-token',
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(false);
      });

      it('should reject POST with only header token', () => {
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          'x-csrf-token': 'valid-token',
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(false);
      });

      it('should reject POST with mismatched tokens', () => {
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          cookie: 'csrf-token=token-one',
          'x-csrf-token': 'token-two',
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(false);
      });

      it('should allow POST with matching tokens', () => {
        const token = middleware.generateToken();
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          cookie: `csrf-token=${token}`,
          'x-csrf-token': token,
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });

      it('should allow PATCH with matching tokens', () => {
        const token = middleware.generateToken();
        mockReq.method = 'PATCH';
        mockReq.url = '/users/me/name';
        mockReq.headers = {
          cookie: `csrf-token=${token}`,
          'x-csrf-token': token,
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });

      it('should allow DELETE with matching tokens', () => {
        const token = middleware.generateToken();
        mockReq.method = 'DELETE';
        mockReq.url = '/users/123';
        mockReq.headers = {
          cookie: `csrf-token=${token}`,
          'x-csrf-token': token,
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });
    });

    describe('cookie parsing', () => {
      it('should handle multiple cookies', () => {
        const token = middleware.generateToken();
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          cookie: `session=abc123; csrf-token=${token}; other=value`,
          'x-csrf-token': token,
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });

      it('should handle cookies with spaces', () => {
        const token = middleware.generateToken();
        mockReq.method = 'POST';
        mockReq.url = '/auth/logout';
        mockReq.headers = {
          cookie: `  csrf-token=${token}  ;  other=value  `,
          'x-csrf-token': token,
        };

        const result = middleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

        expect(result).toBe(true);
      });
    });
  });

  describe('custom configuration', () => {
    it('should use custom cookie name', () => {
      const customMiddleware = new CsrfMiddleware({
        cookieName: 'my-csrf-token',
        headerName: 'x-my-csrf',
      });

      const token = customMiddleware.generateToken();
      mockReq.method = 'POST';
      mockReq.url = '/auth/logout';
      mockReq.headers = {
        cookie: `my-csrf-token=${token}`,
        'x-my-csrf': token,
      };

      const result = customMiddleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

      expect(result).toBe(true);
    });

    it('should use custom exclude paths', () => {
      const customMiddleware = new CsrfMiddleware({
        excludePaths: ['/custom-path'],
      });

      mockReq.method = 'POST';
      mockReq.url = '/custom-path';
      mockReq.headers = {};

      const result = customMiddleware.verify(mockReq as IncomingMessage, mockRes as ServerResponse);

      expect(result).toBe(true);
    });
  });
});
