import { describe, it, expect, beforeEach } from 'vitest';
import { useCompetitorCreation } from './useCompetitorCreation';

describe('useCompetitorCreation', () => {
  beforeEach(() => {
    useCompetitorCreation.getState().reset();
  });

  describe('initial state', () => {
    it('should have isCreating as false', () => {
      expect(useCompetitorCreation.getState().isCreating).toBe(false);
    });

    it('should have empty name and category', () => {
      const state = useCompetitorCreation.getState();
      expect(state.name).toBe('');
      expect(state.category).toBe('');
    });

    it('should have null coordinates', () => {
      const state = useCompetitorCreation.getState();
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });

  describe('startCreation', () => {
    it('should set isCreating to true', () => {
      useCompetitorCreation.getState().startCreation();
      expect(useCompetitorCreation.getState().isCreating).toBe(true);
    });

    it('should reset stale fields from a previous attempt', () => {
      const store = useCompetitorCreation.getState();
      store.startCreation();
      store.setName('Old Competitor');
      store.setCategory('Old Category');
      store.setClickPoint(139.0, 35.0);

      useCompetitorCreation.getState().startCreation();

      const state = useCompetitorCreation.getState();
      expect(state.isCreating).toBe(true);
      expect(state.name).toBe('');
      expect(state.category).toBe('');
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });

  describe('cancelCreation', () => {
    it('should reset all state to initial values', () => {
      const store = useCompetitorCreation.getState();
      store.startCreation();
      store.setName('Test Competitor');
      store.setCategory('Convenience Store');
      store.setClickPoint(139.7, 35.6);

      useCompetitorCreation.getState().cancelCreation();

      const state = useCompetitorCreation.getState();
      expect(state.isCreating).toBe(false);
      expect(state.name).toBe('');
      expect(state.category).toBe('');
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });

  describe('setClickPoint', () => {
    it('should set longitude and latitude', () => {
      useCompetitorCreation.getState().setClickPoint(139.6917, 35.6895);

      const state = useCompetitorCreation.getState();
      expect(state.longitude).toBe(139.6917);
      expect(state.latitude).toBe(35.6895);
    });
  });

  describe('setName / setCategory', () => {
    it('should update name', () => {
      useCompetitorCreation.getState().setName('New Competitor');
      expect(useCompetitorCreation.getState().name).toBe('New Competitor');
    });

    it('should update category', () => {
      useCompetitorCreation.getState().setCategory('Supermarket');
      expect(useCompetitorCreation.getState().category).toBe('Supermarket');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useCompetitorCreation.getState();
      store.startCreation();
      store.setName('Competitor');
      store.setCategory('Category');
      store.setClickPoint(140.0, 36.0);

      useCompetitorCreation.getState().reset();

      const state = useCompetitorCreation.getState();
      expect(state.isCreating).toBe(false);
      expect(state.name).toBe('');
      expect(state.category).toBe('');
      expect(state.longitude).toBeNull();
      expect(state.latitude).toBeNull();
    });
  });
});
