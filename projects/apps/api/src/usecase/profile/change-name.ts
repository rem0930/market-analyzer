/**
 * @what 名前変更ユースケース
 * @why 認証済みユーザーが自分の名前を更新する
 */

import { Result } from '@monorepo/shared';
import type { UserRepository } from '../../domain/index.js';
import { UserId } from '../../domain/index.js';

export interface ChangeNameInput {
  userId: string;
  name: string;
  causationId: string;
  correlationId: string;
}

export interface ChangeNameOutput {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChangeNameError = 'user_not_found' | 'invalid_name' | 'same_name' | 'internal_error';

export class ChangeNameUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ChangeNameInput): Promise<Result<ChangeNameOutput, ChangeNameError>> {
    // 1. ユーザーの取得
    let userId: UserId;
    try {
      userId = new UserId(input.userId);
    } catch {
      return Result.fail('user_not_found');
    }

    const userResult = await this.userRepository.findById(userId);
    if (userResult.isFailure()) {
      return Result.fail('internal_error');
    }

    const user = userResult.value;
    if (!user) {
      return Result.fail('user_not_found');
    }

    // 2. 名前の変更
    const changeResult = user.changeName(input.name, input.causationId, input.correlationId);
    if (changeResult.isFailure()) {
      if (changeResult.error === 'same_name') {
        return Result.fail('same_name');
      }
      return Result.fail('invalid_name');
    }

    // 3. 保存（既存ユーザーの更新なので update を使用）
    const updateResult = await this.userRepository.update(user);
    if (updateResult.isFailure()) {
      return Result.fail('internal_error');
    }

    return Result.ok({
      id: user.id.value,
      name: user.name,
      email: user.email.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
