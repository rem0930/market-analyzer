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
}

export interface ChangeNameOutput {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChangeNameError = 'user_not_found' | 'invalid_name' | 'internal_error';

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
    const changeResult = user.changeName(input.name);
    if (changeResult.isFailure()) {
      return Result.fail('invalid_name');
    }

    // 3. 保存
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isFailure()) {
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
