import { describe, it, expect, beforeEach } from 'vitest';
import { useStores } from './useStores';

describe('useStores', () => {
  beforeEach(() => {
    useStores.getState().selectStore(null);
  });

  describe('initial state', () => {
    it('should have selectedStoreId as null', () => {
      expect(useStores.getState().selectedStoreId).toBeNull();
    });
  });

  describe('selectStore', () => {
    it('should set selectedStoreId', () => {
      useStores.getState().selectStore('store-123');
      expect(useStores.getState().selectedStoreId).toBe('store-123');
    });

    it('should allow changing selection', () => {
      useStores.getState().selectStore('store-1');
      useStores.getState().selectStore('store-2');
      expect(useStores.getState().selectedStoreId).toBe('store-2');
    });

    it('should allow deselecting by passing null', () => {
      useStores.getState().selectStore('store-123');
      useStores.getState().selectStore(null);
      expect(useStores.getState().selectedStoreId).toBeNull();
    });
  });
});
