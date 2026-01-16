/**
 * @what ドメイン層のエクスポート
 * @why domain層の公開APIを明示
 */

export { User, UserId, UserCreatedEvent, UserEmailChangedEvent } from './user/user.js';
export type { CreateUserParams } from './user/user.js';
export type { UserRepository, UserRepositoryError } from './user/user-repository.js';
