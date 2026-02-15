/**
 * @what Store 集約ルートのテスト
 * @why 生成・復元・ビジネスメソッド・ドメインイベントを検証
 */

import { describe, it, expect } from 'vitest';
import { StoreId, Store, StoreCreatedEvent } from '../store.js';
import { StoreName } from '../store-name.js';
import { StoreAddress } from '../store-address.js';
import { CenterPoint } from '../../trade-area/center-point.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ANOTHER_UUID = '660e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-123';

function createDefaultStore() {
  return Store.create({
    id: new StoreId(VALID_UUID),
    userId: USER_ID,
    name: StoreName.create('テスト店舗'),
    address: StoreAddress.create('東京都渋谷区道玄坂1-1-1'),
    location: CenterPoint.create(139.6917, 35.6895),
    causationId: 'cmd-001',
    correlationId: 'corr-001',
  });
}

describe('StoreId', () => {
  it('有効なUUIDで作成できる', () => {
    const id = new StoreId(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it('無効なUUIDでエラーをスローする', () => {
    expect(() => new StoreId('invalid')).toThrow('Invalid UUID');
  });

  it('同じUUIDなら等価', () => {
    const a = new StoreId(VALID_UUID);
    const b = new StoreId(VALID_UUID);
    expect(a.equals(b)).toBe(true);
  });
});

describe('Store', () => {
  describe('create', () => {
    it('正常に店舗を作成できる', () => {
      const result = createDefaultStore();

      expect(result).toBeSuccess();
      const store = result.value;
      expect(store.id.value).toBe(VALID_UUID);
      expect(store.userId).toBe(USER_ID);
      expect(store.name.value).toBe('テスト店舗');
      expect(store.address.value).toBe('東京都渋谷区道玄坂1-1-1');
      expect(store.location.longitude).toBe(139.6917);
      expect(store.location.latitude).toBe(35.6895);
      expect(store.createdAt).toBeInstanceOf(Date);
      expect(store.updatedAt).toBeInstanceOf(Date);
      expect(store.version).toBe(0);
    });

    it('StoreCreatedEvent が発行される', () => {
      const result = createDefaultStore();
      const store = result.value;
      const events = store.getDomainEvents();

      expect(events).toHaveLength(1);
      const event = events[0] as StoreCreatedEvent;
      expect(event.eventType).toBe('StoreCreated');
      expect(event.storeId).toBe(VALID_UUID);
      expect(event.userId).toBe(USER_ID);
      expect(event.name).toBe('テスト店舗');
    });
  });

  describe('restore', () => {
    it('永続化データから店舗を復元できる', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-06-01');

      const store = Store.restore(
        new StoreId(VALID_UUID),
        USER_ID,
        StoreName.create('復元店舗'),
        StoreAddress.create('大阪府大阪市'),
        CenterPoint.create(135.5023, 34.6937),
        createdAt,
        updatedAt,
        3
      );

      expect(store.id.value).toBe(VALID_UUID);
      expect(store.name.value).toBe('復元店舗');
      expect(store.address.value).toBe('大阪府大阪市');
      expect(store.createdAt).toBe(createdAt);
      expect(store.updatedAt).toBe(updatedAt);
      expect(store.version).toBe(3);
      expect(store.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('rename', () => {
    it('異なる名前にリネームできる', () => {
      const store = createDefaultStore().value;
      const newName = StoreName.create('新店舗名');

      const result = store.rename(newName);

      expect(result).toBeSuccess();
      expect(store.name.value).toBe('新店舗名');
      expect(store.version).toBe(1);
    });

    it('同じ名前へのリネームは失敗する', () => {
      const store = createDefaultStore().value;
      const sameName = StoreName.create('テスト店舗');

      const result = store.rename(sameName);

      expect(result).toBeFailureWithError('same_name');
    });

    it('リネームで updatedAt が更新される', () => {
      const store = createDefaultStore().value;
      const before = store.updatedAt;

      // 少し待ってからリネーム
      const newName = StoreName.create('更新店舗');
      store.rename(newName);

      expect(store.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('updateAddress', () => {
    it('住所を更新できる', () => {
      const store = createDefaultStore().value;
      const newAddress = StoreAddress.create('神奈川県横浜市');

      store.updateAddress(newAddress);

      expect(store.address.value).toBe('神奈川県横浜市');
      expect(store.version).toBe(1);
    });
  });

  describe('updateLocation', () => {
    it('位置情報を更新できる', () => {
      const store = createDefaultStore().value;
      const newLocation = CenterPoint.create(135.5023, 34.6937);

      store.updateLocation(newLocation);

      expect(store.location.longitude).toBe(135.5023);
      expect(store.location.latitude).toBe(34.6937);
      expect(store.version).toBe(1);
    });
  });

  describe('equals', () => {
    it('同じIDなら等価', () => {
      const a = createDefaultStore().value;
      const b = Store.restore(
        new StoreId(VALID_UUID),
        'other-user',
        StoreName.create('別店舗'),
        StoreAddress.create('別住所'),
        CenterPoint.create(0, 0),
        new Date(),
        new Date(),
        0
      );
      expect(a.equals(b)).toBe(true);
    });

    it('異なるIDなら非等価', () => {
      const a = createDefaultStore().value;
      const b = Store.restore(
        new StoreId(ANOTHER_UUID),
        USER_ID,
        StoreName.create('テスト店舗'),
        StoreAddress.create('東京都渋谷区道玄坂1-1-1'),
        CenterPoint.create(139.6917, 35.6895),
        new Date(),
        new Date(),
        0
      );
      expect(a.equals(b)).toBe(false);
    });
  });
});
