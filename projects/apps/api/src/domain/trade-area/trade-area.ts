/**
 * @what 商圏集約ルート
 * @why 商圏の作成・更新・名前変更を集約単位で管理
 */

import { AggregateRoot, UUIDIdentifier, DomainEvent, Result } from '@monorepo/shared';
import { CenterPoint } from './center-point.js';
import { Radius } from './radius.js';
import { TradeAreaName } from './trade-area-name.js';

export class TradeAreaId extends UUIDIdentifier {
  protected validate(value: string): void {
    super.validate(value);
  }
}

export class TradeAreaCreatedEvent extends DomainEvent<'TradeAreaCreated'> {
  constructor(
    public readonly tradeAreaId: string,
    public readonly userId: string,
    public readonly name: string,
    causationId: string,
    correlationId: string
  ) {
    super('TradeAreaCreated', tradeAreaId, 1, causationId, correlationId);
  }

  toPayload(): Record<string, unknown> {
    return {
      tradeAreaId: this.tradeAreaId,
      userId: this.userId,
      name: this.name,
    };
  }
}

export interface CreateTradeAreaParams {
  id: TradeAreaId;
  userId: string;
  name: TradeAreaName;
  center: CenterPoint;
  radius: Radius;
  causationId: string;
  correlationId: string;
}

export class TradeArea extends AggregateRoot<TradeAreaId> {
  private _userId: string;
  private _name: TradeAreaName;
  private _center: CenterPoint;
  private _radius: Radius;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: TradeAreaId,
    userId: string,
    name: TradeAreaName,
    center: CenterPoint,
    radius: Radius,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._userId = userId;
    this._name = name;
    this._center = center;
    this._radius = radius;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(params: CreateTradeAreaParams): Result<TradeArea, never> {
    const now = new Date();
    const tradeArea = new TradeArea(
      params.id,
      params.userId,
      params.name,
      params.center,
      params.radius,
      now,
      now
    );

    tradeArea.addDomainEvent(
      new TradeAreaCreatedEvent(
        params.id.value,
        params.userId,
        params.name.value,
        params.causationId,
        params.correlationId
      )
    );

    return Result.ok(tradeArea);
  }

  static restore(
    id: TradeAreaId,
    userId: string,
    name: TradeAreaName,
    center: CenterPoint,
    radius: Radius,
    createdAt: Date,
    updatedAt: Date,
    version: number
  ): TradeArea {
    const tradeArea = new TradeArea(id, userId, name, center, radius, createdAt, updatedAt);
    tradeArea.setVersion(version);
    return tradeArea;
  }

  get userId(): string {
    return this._userId;
  }

  get name(): TradeAreaName {
    return this._name;
  }

  get center(): CenterPoint {
    return this._center;
  }

  get radius(): Radius {
    return this._radius;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  rename(newName: TradeAreaName): Result<void, 'same_name'> {
    if (this._name.equals(newName)) {
      return Result.fail('same_name');
    }
    this._name = newName;
    this._updatedAt = new Date();
    this.incrementVersion();
    return Result.ok(undefined);
  }

  updateCenter(newCenter: CenterPoint): void {
    this._center = newCenter;
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  updateRadius(newRadius: Radius): void {
    this._radius = newRadius;
    this._updatedAt = new Date();
    this.incrementVersion();
  }
}
