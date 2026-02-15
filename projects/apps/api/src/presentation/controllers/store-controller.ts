/**
 * @what 店舗HTTPコントローラー
 * @why 店舗関連のエンドポイントを処理
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  CreateStoreUseCase,
  GetStoreUseCase,
  ListStoresUseCase,
  DeleteStoreUseCase,
  UpdateStoreUseCase,
} from '../../usecase/index.js';
import type { ValidationMiddleware } from '../middleware/validation-middleware.js';
import { createStoreSchema, updateStoreSchema } from '../schemas/store-schemas.js';
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson, sendNoContent } from '../middleware/error-handler.js';

export class StoreController {
  constructor(
    private readonly createStoreUseCase: CreateStoreUseCase,
    private readonly getStoreUseCase: GetStoreUseCase,
    private readonly listStoresUseCase: ListStoresUseCase,
    private readonly deleteStoreUseCase: DeleteStoreUseCase,
    private readonly updateStoreUseCase: UpdateStoreUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  async create(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, createStoreSchema);
      if (!validation.success) return;

      const { name, address, longitude, latitude } = validation.data;
      const result = await this.createStoreUseCase.execute({
        userId,
        name,
        address,
        longitude,
        latitude,
        requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
          case 'invalid_address':
            throw AppError.validation([{ field: 'address', code: 'INVALID_FORMAT' }]);
          case 'invalid_location':
            throw AppError.validation([{ field: 'location', code: 'INVALID_FORMAT' }]);
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 201, result.value, requestId);
    });
  }

  async getById(
    _req: IncomingMessage,
    res: ServerResponse,
    storeId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getStoreUseCase.execute({ storeId, userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, result.value, requestId);
    });
  }

  async list(
    _req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.listStoresUseCase.execute({ userId });

      if (result.isFailure()) {
        throw AppError.fromUnknown(new Error(result.error));
      }

      sendJson(res, 200, result.value, requestId);
    });
  }

  async delete(
    _req: IncomingMessage,
    res: ServerResponse,
    storeId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.deleteStoreUseCase.execute({ storeId, userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendNoContent(res, requestId);
    });
  }

  async update(
    req: IncomingMessage,
    res: ServerResponse,
    storeId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, updateStoreSchema);
      if (!validation.success) return;

      const result = await this.updateStoreUseCase.execute({
        storeId,
        userId,
        ...validation.data,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
          case 'invalid_address':
            throw AppError.validation([{ field: 'address', code: 'INVALID_FORMAT' }]);
          case 'invalid_location':
            throw AppError.validation([{ field: 'location', code: 'INVALID_FORMAT' }]);
          case 'not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, result.value, requestId);
    });
  }
}
