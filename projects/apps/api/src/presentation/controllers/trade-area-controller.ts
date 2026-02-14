/**
 * @what 商圏HTTPコントローラー
 * @why 商圏関連のエンドポイントを処理
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  CreateTradeAreaUseCase,
  GetTradeAreaUseCase,
  ListTradeAreasUseCase,
  DeleteTradeAreaUseCase,
  UpdateTradeAreaUseCase,
  GetDemographicsUseCase,
} from '../../usecase/index.js';
import type { ValidationMiddleware } from '../middleware/validation-middleware.js';
import { createTradeAreaSchema, updateTradeAreaSchema } from '../schemas/trade-area-schemas.js';
import { AppError } from '@monorepo/shared';
import { withErrorHandler, sendJson, sendNoContent } from '../middleware/error-handler.js';

export class TradeAreaController {
  constructor(
    private readonly createTradeAreaUseCase: CreateTradeAreaUseCase,
    private readonly getTradeAreaUseCase: GetTradeAreaUseCase,
    private readonly listTradeAreasUseCase: ListTradeAreasUseCase,
    private readonly deleteTradeAreaUseCase: DeleteTradeAreaUseCase,
    private readonly updateTradeAreaUseCase: UpdateTradeAreaUseCase,
    private readonly getDemographicsUseCase: GetDemographicsUseCase,
    private readonly validationMiddleware: ValidationMiddleware
  ) {}

  async create(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, createTradeAreaSchema);
      if (!validation.success) return;

      const { name, longitude, latitude, radiusKm } = validation.data;
      const result = await this.createTradeAreaUseCase.execute({
        userId,
        name,
        longitude,
        latitude,
        radiusKm,
        requestId,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
          case 'invalid_center':
            throw AppError.validation([{ field: 'longitude', code: 'INVALID_FORMAT' }]);
          case 'invalid_radius':
            throw AppError.validation([{ field: 'radiusKm', code: 'INVALID_FORMAT' }]);
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
    tradeAreaId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getTradeAreaUseCase.execute({ tradeAreaId, userId });

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
      const result = await this.listTradeAreasUseCase.execute({ userId });

      if (result.isFailure()) {
        throw AppError.fromUnknown(new Error(result.error));
      }

      sendJson(res, 200, result.value, requestId);
    });
  }

  async delete(
    _req: IncomingMessage,
    res: ServerResponse,
    tradeAreaId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.deleteTradeAreaUseCase.execute({ tradeAreaId, userId });

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
    tradeAreaId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const validation = await this.validationMiddleware.validate(req, res, updateTradeAreaSchema);
      if (!validation.success) return;

      const result = await this.updateTradeAreaUseCase.execute({
        tradeAreaId,
        userId,
        ...validation.data,
      });

      if (result.isFailure()) {
        switch (result.error) {
          case 'invalid_id':
            throw AppError.validation([{ field: 'id', code: 'INVALID_FORMAT' }]);
          case 'invalid_name':
            throw AppError.validation([{ field: 'name', code: 'INVALID_FORMAT' }]);
          case 'invalid_center':
            throw AppError.validation([{ field: 'longitude', code: 'INVALID_FORMAT' }]);
          case 'invalid_radius':
            throw AppError.validation([{ field: 'radiusKm', code: 'INVALID_FORMAT' }]);
          case 'not_found':
            throw AppError.notFound('RESOURCE_NOT_FOUND');
          default:
            throw AppError.fromUnknown(new Error(result.error));
        }
      }

      sendJson(res, 200, result.value, requestId);
    });
  }

  async getDemographics(
    _req: IncomingMessage,
    res: ServerResponse,
    tradeAreaId: string,
    userId: string,
    requestId: string
  ): Promise<void> {
    await withErrorHandler(res, requestId, async () => {
      const result = await this.getDemographicsUseCase.execute({ tradeAreaId, userId });

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
}
