/**
 * @what 認証ユーザーエンティティ
 * @why 認証に特化したユーザー情報を管理
 *
 * domain層のルール:
 * - 外部依存禁止（usecase, presentation, infrastructure をimportしない）
 * - 純粋なビジネスロジックのみ
 */

import {
  AggregateRoot,
  UUIDIdentifier,
  Email,
  Result,
  DomainEvent,
} from '@monorepo/shared';

/**
 * 認証ユーザーID
 */
export class AuthUserId extends UUIDIdentifier {}

/**
 * パスワードハッシュ値オブジェクト
 */
export class PasswordHash {
  private constructor(private readonly _value: string) {}

  static create(hash: string): PasswordHash {
    return new PasswordHash(hash);
  }

  get value(): string {
    return this._value;
  }
}

/**
 * ユーザー登録イベント
 */
export class AuthUserRegisteredEvent extends DomainEvent<'AuthUserRegistered'> {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    causationId: string,
    correlationId: string
  ) {
    super('AuthUserRegistered', userId, 1, causationId, correlationId);
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
    };
  }
}

/**
 * パスワード変更イベント
 */
export class PasswordChangedEvent extends DomainEvent<'PasswordChanged'> {
  constructor(
    userId: string,
    version: number,
    causationId: string,
    correlationId: string
  ) {
    super('PasswordChanged', userId, version, causationId, correlationId);
  }

  toPayload(): Record<string, unknown> {
    return {};
  }
}

/**
 * 認証ユーザー作成パラメータ
 */
export interface CreateAuthUserParams {
  id: AuthUserId;
  email: Email;
  passwordHash: PasswordHash;
  causationId: string;
  correlationId: string;
}

/**
 * 認証ユーザー集約
 */
export class AuthUser extends AggregateRoot<AuthUserId> {
  private _email: Email;
  private _passwordHash: PasswordHash;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: AuthUserId,
    email: Email,
    passwordHash: PasswordHash,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._email = email;
    this._passwordHash = passwordHash;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  /**
   * ファクトリメソッド - 新規ユーザー登録
   */
  static create(params: CreateAuthUserParams): Result<AuthUser, never> {
    const now = new Date();
    const user = new AuthUser(
      params.id,
      params.email,
      params.passwordHash,
      now,
      now
    );

    user.addDomainEvent(
      new AuthUserRegisteredEvent(
        params.id.value,
        params.email.value,
        params.causationId,
        params.correlationId
      )
    );

    return Result.ok(user);
  }

  /**
   * 永続化データからリストア
   */
  static restore(
    id: AuthUserId,
    email: Email,
    passwordHash: PasswordHash,
    createdAt: Date,
    updatedAt: Date,
    version: number
  ): AuthUser {
    const user = new AuthUser(id, email, passwordHash, createdAt, updatedAt);
    user.setVersion(version);
    return user;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * パスワードを変更
   */
  changePassword(
    newPasswordHash: PasswordHash,
    causationId: string,
    correlationId: string
  ): Result<void, never> {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(
      new PasswordChangedEvent(
        this.id.value,
        this.version,
        causationId,
        correlationId
      )
    );

    return Result.ok(undefined);
  }
}
