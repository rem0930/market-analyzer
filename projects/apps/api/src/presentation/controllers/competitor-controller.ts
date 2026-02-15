/**
 * @what 競合店舗HTTPコントローラー
 * @why 競合店舗関連のエンドポイントを処理
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  CreateCompetitorUseCase,
  GetCompetitorUseCase,
  ListCompetitorsByStoreUseCase,
  DeleteCompetitorUseCase,
  UpdateCompetitorUseCase,
} from '../../usecase/index.js';
import type { ValidationMiddleware } from '../middleware/validation-middleware.js';
import { createCompetitorSchema, updateCompetitorSchema } from '../schemas/competitor-schemas.js';
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson, sendNoContent } from '../middleware/error-handler.js';

export class CompetitorController {
  constructor(
    private readonly createCompetitorUseCase: CreateCompetitorUseCase,
    private readonly getCompetitorUseCase: GetCompetitorUseCase,
    private readonly listCompetitorsByStoreUseCase: ListCompetitorsByStoreUseCase,
    private readonly deleteCompetitorUseCase: DeleteCompetitorUseCase,
    private readonly updateCompetitorUseCase: UpdateCompetitorUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  async create(
    req: IncomingMessage,
    res: ServerResponse,
    storeId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, createCompetitorSchema);
      if (!validation.success) return;

      const { name, longitude, latitude, source, googlePlaceId, category } = validation.data;
      const result = await this.createCompetitorUseCase.execute({
        storeId,
        userId,
        name,
        longitude,
        latitude,
        source,
        googlePlaceId,
        category,
        requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
          case 'invalid_location':
            throw AppError.validation([{ field: 'location', code: 'INVALID_FORMAT' }]);
          case 'invalid_source':
            throw AppError.validation([{ field: 'source', code: 'INVALID_FORMAT' }]);
          case 'store_not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
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
    competitorId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getCompetitorUseCase.execute({ competitorId, userId });

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

  async listByStore(
    _req: IncomingMessage,
    res: ServerResponse,
    storeId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.listCompetitorsByStoreUseCase.execute({ storeId, userId });

      if (result.isFailure()) {
        switch (result.error) {
          case 'store_not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, result.value, requestId);
    });
  }

  async delete(
    _req: IncomingMessage,
    res: ServerResponse,
    competitorId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.deleteCompetitorUseCase.execute({ competitorId, userId });

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
    competitorId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, updateCompetitorSchema);
      if (!validation.success) return;

      const result = await this.updateCompetitorUseCase.execute({
        competitorId,
        userId,
        ...validation.data,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
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
