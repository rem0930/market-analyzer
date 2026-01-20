/**
 * @what ユーザー作成ユースケース
 * @why アプリケーション層でビジネスフローを記述し、ドメインロジックと外部連携を調整
 *
 * usecase層のルール:
 * - domain層のみimport可能
 * - presentation層、infrastructure層をimportしない
 * - 入出力はDTOで定義
 * - Result<T>でエラーを明示
 */

import { Result, Email, type AsyncResult } from '@monorepo/shared';
import { User, UserId, type UserRepository } from '../../domain/index.js';

/**
 * ユースケースの入力DTO
 */
export interface CreateUserInput {
  email: string;
  name: string;
  /** リクエストを識別するID（因果追跡用） */
  requestId: string;
}

/**
 * ユースケースの出力DTO
 */
export interface CreateUserOutput {
  userId: string;
  email: string;
  name: string;
}

/**
 * ユースケースのエラー型
 */
export type CreateUserError =
  | 'invalid_email'
  | 'invalid_name'
  | 'email_already_exists'
  | 'repository_error';

/**
 * ユーザー作成ユースケース
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * ユーザーを作成
   */
  async execute(input: CreateUserInput): AsyncResult<CreateUserOutput, CreateUserError> {
    // 1. メールアドレスのバリデーション
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      return Result.fail('invalid_email');
    }

    // 2. メールアドレスの重複チェック
    const existsResult = await this.userRepository.emailExists(email);
    if (existsResult.isFailure()) {
      return Result.fail('repository_error');
    }
    if (existsResult.value) {
      return Result.fail('email_already_exists');
    }

    // 3. ユーザー集約を作成
    const userId = new UserId(crypto.randomUUID());
    const userResult = User.create({
      id: userId,
      email,
      name: input.name,
      causationId: input.requestId,
      correlationId: input.requestId,
    });

    if (userResult.isFailure()) {
      return Result.fail('invalid_name');
    }

    // 4. 永続化
    const saveResult = await this.userRepository.save(userResult.value);
    if (saveResult.isFailure()) {
      return Result.fail('repository_error');
    }

    // 5. 出力DTOを返す
    return Result.ok({
      userId: userResult.value.id.value,
      email: userResult.value.email.value,
      name: userResult.value.name,
    });
  }
}
