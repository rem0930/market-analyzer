/**
 * @what ユーザー登録ユースケース
 * @why 新規ユーザーの登録処理
 */

import { Result, Email } from '@monorepo/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  AuthUser,
  AuthUserId,
  type AuthUserRepository,
} from '../../domain/index.js';
import type { PasswordService } from '../../infrastructure/index.js';

export interface RegisterInput {
  email: string;
  password: string;
  causationId: string;
  correlationId: string;
}

export interface RegisterOutput {
  id: string;
  email: string;
  createdAt: Date;
}

export type RegisterError =
  | 'invalid_email'
  | 'weak_password'
  | 'email_already_exists'
  | 'internal_error';

export class RegisterUseCase {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordService: PasswordService
  ) {}

  async execute(input: RegisterInput): Promise<Result<RegisterOutput, RegisterError>> {
    // 1. メールアドレスのバリデーション
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      return Result.fail('invalid_email');
    }

    // 2. パスワード強度の検証
    const strengthResult = this.passwordService.validateStrength(input.password);
    if (strengthResult.isFailure()) {
      return Result.fail('weak_password');
    }

    // 3. メールアドレスの重複チェック
    const existsResult = await this.authUserRepository.emailExists(email);
    if (existsResult.isFailure()) {
      return Result.fail('internal_error');
    }
    if (existsResult.value) {
      return Result.fail('email_already_exists');
    }

    // 4. パスワードのハッシュ化
    const hashResult = await this.passwordService.hash(input.password);
    if (hashResult.isFailure()) {
      return Result.fail('internal_error');
    }

    // 5. ユーザーエンティティの作成
    const userId = new AuthUserId(uuidv4());
    const userResult = AuthUser.create({
      id: userId,
      email,
      passwordHash: hashResult.value,
      causationId: input.causationId,
      correlationId: input.correlationId,
    });

    if (userResult.isFailure()) {
      return Result.fail('internal_error');
    }

    // 6. ユーザーの保存
    const saveResult = await this.authUserRepository.save(userResult.value);
    if (saveResult.isFailure()) {
      if (saveResult.error === 'conflict') {
        return Result.fail('email_already_exists');
      }
      return Result.fail('internal_error');
    }

    return Result.ok({
      id: userId.value,
      email: email.value,
      createdAt: userResult.value.createdAt,
    });
  }
}
