/**
 * @what 店舗集約ルート
 * @why 自店舗の作成・更新を集約単位で管理
 */

import { AggregateRoot, UUIDIdentifier, DomainEvent, Result } from '@monorepo/shared';
import { CenterPoint } from '../trade-area/center-point.js';
import { StoreName } from './store-name.js';
import { StoreAddress } from './store-address.js';

export class StoreId extends UUIDIdentifier {
  protected validate(value: string): void {
    super.validate(value);
  }
}

export class StoreCreatedEvent extends DomainEvent<'StoreCreated'> {
  constructor(
    public readonly storeId: string,
    public readonly userId: string,
    public readonly name: string,
    causationId: string,
    correlationId: string
  ) {
    super('StoreCreated', storeId, 1, causationId, correlationId);
  }

  toPayload(): Record<string, unknown> {
    return {
      storeId: this.storeId,
      userId: this.userId,
      name: this.name,
    };
  }
}

export interface CreateStoreParams {
  id: StoreId;
  userId: string;
  name: StoreName;
  address: StoreAddress;
  location: CenterPoint;
  causationId: string;
  correlationId: string;
}

export class Store extends AggregateRoot<StoreId> {
  private _userId: string;
  private _name: StoreName;
  private _address: StoreAddress;
  private _location: CenterPoint;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: StoreId,
    userId: string,
    name: StoreName,
    address: StoreAddress,
    location: CenterPoint,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._userId = userId;
    this._name = name;
    this._address = address;
    this._location = location;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(params: CreateStoreParams): Result<Store, never> {
    const now = new Date();
    const store = new Store(
      params.id,
      params.userId,
      params.name,
      params.address,
      params.location,
      now,
      now
    );

    store.addDomainEvent(
      new StoreCreatedEvent(
        params.id.value,
        params.userId,
        params.name.value,
        params.causationId,
        params.correlationId
      )
    );

    return Result.ok(store);
  }

  static restore(
    id: StoreId,
    userId: string,
    name: StoreName,
    address: StoreAddress,
    location: CenterPoint,
    createdAt: Date,
    updatedAt: Date,
    version: number
  ): Store {
    const store = new Store(id, userId, name, address, location, createdAt, updatedAt);
    store.setVersion(version);
    return store;
  }

  get userId(): string {
    return this._userId;
  }

  get name(): StoreName {
    return this._name;
  }

  get address(): StoreAddress {
    return this._address;
  }

  get location(): CenterPoint {
    return this._location;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  rename(newName: StoreName): Result<void, 'same_name'> {
    if (this._name.equals(newName)) {
      return Result.fail('same_name');
    }
    this._name = newName;
    this._updatedAt = new Date();
    this.incrementVersion();
    return Result.ok(undefined);
  }

  updateAddress(newAddress: StoreAddress): void {
    this._address = newAddress;
    this._updatedAt = new Date();
    this.incrementVersion();
  }

  updateLocation(newLocation: CenterPoint): void {
    this._location = newLocation;
    this._updatedAt = new Date();
    this.incrementVersion();
  }
}
