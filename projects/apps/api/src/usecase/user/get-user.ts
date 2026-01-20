/**
 * @what ユーザー取得ユースケース
 * @why アプリケーション層でクエリ処理を記述
 *
 * usecase層のルール:
 * - domain層のみimport可能
 * - presentation層、infrastructure層をimportしない
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { UserId, type UserRepository } from '../../domain/index.js';

/**
 * ユースケースの入力DTO
 */
export interface GetUserInput {
  userId: string;
}

/**
 * ユースケースの出力DTO
 */
export interface GetUserOutput {
  userId: string;
  email: string;
  name: string;
}

/**
 * ユースケースのエラー型
 */
export type GetUserError = 'invalid_id' | 'user_not_found' | 'repository_error';

/**
 * ユーザー取得ユースケース
 */
export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * ユーザーを取得
   */
  async execute(input: GetUserInput): AsyncResult<GetUserOutput, GetUserError> {
    // 1. IDのバリデーション
    let userId: UserId;
    try {
      userId = new UserId(input.userId);
    } catch {
      return Result.fail('invalid_id');
    }

    // 2. ユーザーを取得
    const userResult = await this.userRepository.findById(userId);

    if (userResult.isFailure()) {
      const error = userResult.error;
      if (error === 'not_found') {
        return Result.fail('user_not_found');
      }
      return Result.fail('repository_error');
    }

    // 3. 出力DTOを返す
    const user = userResult.value;
    return Result.ok({
      userId: user.id.value,
      email: user.email.value,
      name: user.name,
    });
  }
}
