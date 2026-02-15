import { describe, it, expect, beforeEach } from 'vitest';
import { useStoreCreation } from './useStoreCreation';

describe('useStoreCreation', () => {
  beforeEach(() => {
    useStoreCreation.getState().reset();
  });

  describe('initial state', () => {
    it('should have isCreating as false', () => {
      expect(useStoreCreation.getState().isCreating).toBe(false);
    });

    it('should have empty name and address', () => {
      const state = useStoreCreation.getState();
      expect(state.name).toBe('');
      expect(state.address).toBe('');
    });

    it('should have null coordinates', () => {
      const state = useStoreCreation.getState();
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });

  describe('startCreation', () => {
    it('should set isCreating to true', () => {
      useStoreCreation.getState().startCreation();
      expect(useStoreCreation.getState().isCreating).toBe(true);
    });
  });

  describe('cancelCreation', () => {
    it('should reset all state to initial values', () => {
      const store = useStoreCreation.getState();
      store.startCreation();
      store.setName('Test Store');
      store.setAddress('Tokyo');
      store.setClickPoint(139.7, 35.6);

      useStoreCreation.getState().cancelCreation();

      const state = useStoreCreation.getState();
      expect(state.isCreating).toBe(false);
      expect(state.name).toBe('');
      expect(state.address).toBe('');
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });

  describe('setClickPoint', () => {
    it('should set longitude and latitude', () => {
      useStoreCreation.getState().setClickPoint(139.6917, 35.6895);

      const state = useStoreCreation.getState();
      expect(state.longitude).toBe(139.6917);
      expect(state.latitude).toBe(35.6895);
    });
  });

  describe('setName / setAddress', () => {
    it('should update name', () => {
      useStoreCreation.getState().setName('New Store');
      expect(useStoreCreation.getState().name).toBe('New Store');
    });

    it('should update address', () => {
      useStoreCreation.getState().setAddress('Shibuya, Tokyo');
      expect(useStoreCreation.getState().address).toBe('Shibuya, Tokyo');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useStoreCreation.getState();
      store.startCreation();
      store.setName('Store');
      store.setAddress('Address');
      store.setClickPoint(140.0, 36.0);

      useStoreCreation.getState().reset();

      const state = useStoreCreation.getState();
      expect(state.isCreating).toBe(false);
      expect(state.name).toBe('');
      expect(state.address).toBe('');
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });
});
