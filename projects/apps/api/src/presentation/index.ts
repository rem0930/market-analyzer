/**
 * @what プレゼンテーション層のエクスポート
 * @why presentation層の公開APIを明示
 */

export { UserController } from './controllers/user-controller.js';
export { handleRoutes, type RouteContext } from './router.js';
