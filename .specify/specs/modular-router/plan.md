# Plan: Modular API Router

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        router.ts (entry)                         │
│  - Global middleware (security, cors, csrf)                      │
│  - Route group registration                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┼───────────┬───────────┐
          ▼           ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ auth.ts  │ │ users.ts │ │ health.ts│ │ root.ts  │
    │ /auth/*  │ │ /users/* │ │ /health  │ │ /        │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │            │
         └────────────┴────────────┴────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    ┌───────────────┐      ┌───────────────┐
    │ route-factory │      │ error-handler │
    │ - auth wrap   │      │ - try/catch   │
    │ - rate limit  │      │ - log errors  │
    └───────────────┘      └───────────────┘
```

---

## Implementation Phases

### Phase 1: Create Route Factory (FR-002, FR-003, FR-004)

**File**: `projects/apps/api/src/presentation/route-factory.ts`

```typescript
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthMiddleware, AuthenticatedRequest } from './middleware/auth-middleware.js';
import { logger } from '../infrastructure/logger/index.js';

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
) => Promise<void>;

export type AuthenticatedRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  user: AuthenticatedRequest
) => Promise<void>;

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: RouteHandler | AuthenticatedRouteHandler;
  options?: {
    auth?: boolean;
    rateLimit?: boolean;
  };
}

export interface RouteGroupConfig {
  prefix: string;
  routes: RouteDefinition[];
}

export interface RouteContext {
  authMiddleware: AuthMiddleware;
  rateLimitMiddleware: RateLimitMiddleware;
}

export function createRouteHandler(
  definition: RouteDefinition,
  context: RouteContext
): RouteHandler {
  return async (req, res, params) => {
    try {
      // Rate limit check
      if (definition.options?.rateLimit) {
        if (context.rateLimitMiddleware.check(req, res)) return;
      }

      // Auth check
      if (definition.options?.auth) {
        const authResult = context.authMiddleware.authenticate(req);
        if (!authResult.authenticated) {
          context.authMiddleware.sendUnauthorized(res, authResult.error);
          return;
        }
        await (definition.handler as AuthenticatedRouteHandler)(
          req, res, params, authResult.user
        );
        return;
      }

      await (definition.handler as RouteHandler)(req, res, params);
    } catch (error) {
      logger.error('Unhandled error in route handler', { error, path: req.url });
      sendInternalError(res);
    }
  };
}

function sendInternalError(res: ServerResponse): void {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Internal Server Error' }));
}
```

---

### Phase 2: Create Route Modules (FR-001)

#### File: `projects/apps/api/src/presentation/routes/auth.ts`

```typescript
import type { RouteDefinition } from '../route-factory.js';
import type { AuthController } from '../controllers/auth-controller.js';

export function createAuthRoutes(controller: AuthController): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: '/auth/register',
      handler: (req, res) => controller.register(req, res),
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: (req, res) => controller.login(req, res),
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/refresh',
      handler: (req, res) => controller.refresh(req, res),
    },
    {
      method: 'POST',
      path: '/auth/forgot-password',
      handler: (req, res) => controller.forgotPassword(req, res),
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/reset-password',
      handler: (req, res) => controller.resetPassword(req, res),
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/logout',
      handler: (req, res, _params, user) => controller.logout(req, res, user.userId),
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: (req, res, _params, user) => controller.getCurrentUser(req, res, user.userId),
      options: { auth: true },
    },
  ];
}
```

#### File: `projects/apps/api/src/presentation/routes/users.ts`

```typescript
import type { RouteDefinition } from '../route-factory.js';
import type { UserController } from '../controllers/user-controller.js';
import type { ProfileController } from '../controllers/profile-controller.js';

export function createUserRoutes(
  userController: UserController,
  profileController: ProfileController
): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: '/users',
      handler: (req, res) => userController.createUser(req, res),
    },
    {
      method: 'GET',
      path: '/users/:id',
      handler: (req, res, params) => userController.getUser(req, res, params.id),
    },
    {
      method: 'PATCH',
      path: '/users/me/name',
      handler: (req, res, _params, user) => profileController.updateName(req, res, user.userId),
      options: { auth: true },
    },
    {
      method: 'PATCH',
      path: '/users/me/password',
      handler: (req, res, _params, user) => profileController.updatePassword(req, res, user.userId),
      options: { auth: true, rateLimit: true },
    },
  ];
}
```

#### File: `projects/apps/api/src/presentation/routes/health.ts`

```typescript
import type { RouteDefinition } from '../route-factory.js';
import type { DeepPingController } from '../controllers/deep-ping-controller.js';

export function createHealthRoutes(controller: DeepPingController): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: '/health',
      handler: async (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      },
    },
    {
      method: 'GET',
      path: '/ping/deep',
      handler: (_req, res) => controller.deepPing(res),
    },
    {
      method: 'GET',
      path: '/',
      handler: async (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: '@monorepo/api', version: '0.0.1' }));
      },
    },
  ];
}
```

---

### Phase 3: Refactor Router Entry Point

**File**: `projects/apps/api/src/presentation/router.ts`

```typescript
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRouteHandler, type RouteDefinition } from './route-factory.js';
import { createAuthRoutes } from './routes/auth.js';
import { createUserRoutes } from './routes/users.js';
import { createHealthRoutes } from './routes/health.js';
// ... middleware imports

export interface RouteContext { /* existing interface */ }

interface CompiledRoute {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void>;
}

function compileRoutes(definitions: RouteDefinition[], context: RouteContext): CompiledRoute[] {
  return definitions.map(def => {
    const paramNames: string[] = [];
    const pattern = new RegExp(
      '^' + def.path.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      }) + '$'
    );
    return {
      method: def.method,
      pattern,
      paramNames,
      handler: createRouteHandler(def, context),
    };
  });
}

export async function handleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext
): Promise<void> {
  // Apply global middleware
  context.securityMiddleware.applyHeaders(res);
  if (context.corsMiddleware.handle(req, res)) return;
  if (!context.csrfMiddleware.verify(req, res)) return;

  const url = new URL(req.url ?? '/', 'http://localhost');
  const method = req.method ?? 'GET';
  const pathname = url.pathname;

  // Compile all routes
  const allRoutes = [
    ...createAuthRoutes(context.authController),
    ...createUserRoutes(context.userController, context.profileController),
    ...createHealthRoutes(context.deepPingController),
  ];
  const compiled = compileRoutes(allRoutes, context);

  // Find matching route
  for (const route of compiled) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    await route.handler(req, res, params);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code: 'NOT_FOUND', message: 'Not Found' }));
}
```

---

## File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `src/presentation/route-factory.ts` | ルートファクトリ（auth/error wrap） |
| Create | `src/presentation/routes/auth.ts` | 認証関連ルート定義 |
| Create | `src/presentation/routes/users.ts` | ユーザー関連ルート定義 |
| Create | `src/presentation/routes/health.ts` | ヘルスチェックルート定義 |
| Create | `src/presentation/routes/index.ts` | ルートエクスポート |
| Modify | `src/presentation/router.ts` | エントリポイントをリファクタリング |
| Modify | `src/presentation/index.ts` | 新モジュールをエクスポート |

---

## Verification Steps

```bash
# DevContainer内で実行
docker exec -it feat-api-router-split-dev bash

# Quality gates
cd /workspace
./tools/contract format
./tools/contract lint
./tools/contract typecheck
./tools/contract test

# Manual verification
curl http://localhost:3000/health
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123"}'
```

---

## Rollback Plan

1. `git checkout HEAD -- projects/apps/api/src/presentation/`
2. 新規作成ファイルを削除
3. `./tools/contract test` で確認

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Claude | Initial plan |
