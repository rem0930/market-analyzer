/**
 * @what 競合店舗集約ルート
 * @why 自店舗に紐づく競合店舗の作成・更新を集約単位で管理
 */

import { AggregateRoot, UUIDIdentifier, DomainEvent, Result } from '@monorepo/shared';
import { CenterPoint } from '../trade-area/center-point.js';
import { CompetitorName } from './competitor-name.js';
import { CompetitorSource } from './competitor-source.js';

export class CompetitorId extends UUIDIdentifier {
  protected validate(value: string): void {
    super.validate(value);
  }
}

export class CompetitorCreatedEvent extends DomainEvent<'CompetitorCreated'> {
  constructor(
    public readonly competitorId: string,
    public readonly storeId: string,
    public readonly name: string,
    causationId: string,
    correlationId: string
  ) {
    super('CompetitorCreated', competitorId, 1, causationId, correlationId);
  }

  toPayload(): Record<string, unknown> {
    return {
      competitorId: this.competitorId,
      storeId: this.storeId,
      name: this.name,
    };
  }
}

export interface CreateCompetitorParams {
  id: CompetitorId;
  storeId: string;
  name: CompetitorName;
  location: CenterPoint;
  source: CompetitorSource;
  googlePlaceId: string | null;
  category: string | null;
  causationId: string;
  correlationId: string;
}

export class Competitor extends AggregateRoot<CompetitorId> {
  private _storeId: string;
  private _name: CompetitorName;
  private _location: CenterPoint;
  private _source: CompetitorSource;
  private _googlePlaceId: string | null;
  private _category: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: CompetitorId,
    storeId: string,
    name: CompetitorName,
    location: CenterPoint,
    source: CompetitorSource,
    googlePlaceId: string | null,
    category: string | null,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._storeId = storeId;
    this._name = name;
    this._location = location;
    this._source = source;
    this._googlePlaceId = googlePlaceId;
    this._category = category;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(params: CreateCompetitorParams): Result<Competitor, never> {
    const now = new Date();
    const competitor = new Competitor(
      params.id,
      params.storeId,
      params.name,
      params.location,
      params.source,
      params.googlePlaceId,
      params.category,
      now,
      now
    );

    competitor.addDomainEvent(
      new CompetitorCreatedEvent(
        params.id.value,
        params.storeId,
        params.name.value,
        params.causationId,
        params.correlationId
      )
    );

    return Result.ok(competitor);
  }

  static restore(
    id: CompetitorId,
    storeId: string,
    name: CompetitorName,
    location: CenterPoint,
    source: CompetitorSource,
    googlePlaceId: string | null,
    category: string | null,
    createdAt: Date,
    updatedAt: Date,
    version: number
  ): Competitor {
    const competitor = new Competitor(
      id,
      storeId,
      name,
      location,
      source,
      googlePlaceId,
      category,
      createdAt,
      updatedAt
    );
    competitor.setVersion(version);
    return competitor;
  }

  get storeId(): string {
    return this._storeId;
  }

  get name(): CompetitorName {
    return this._name;
  }

  get location(): CenterPoint {
    return this._location;
  }

  get source(): CompetitorSource {
    return this._source;
  }

  get googlePlaceId(): string | null {
    return this._googlePlaceId;
  }

  get category(): string | null {
    return this._category;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  rename(newName: CompetitorName): Result<void, 'same_name'> {
    if (this._name.equals(newName)) {
      return Result.fail('same_name');
    }
    this._name = newName;
    this._updatedAt = new Date();
    this.incrementVersion();
    return Result.ok(undefined);
  }

  updateLocation(newLocation: CenterPoint): void {
    this._location = newLocation;
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  updateCategory(newCategory: string | null): void {
    this._category = newCategory;
    this._updatedAt = new Date();
    this.incrementVersion();
  }
}
