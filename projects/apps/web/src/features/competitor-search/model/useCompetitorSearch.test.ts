import { describe, it, expect, beforeEach } from 'vitest';
import { useCompetitorSearch } from './useCompetitorSearch';

describe('useCompetitorSearch', () => {
  beforeEach(() => {
    useCompetitorSearch.getState().reset();
  });

  describe('initial state', () => {
    it('should have dialog closed', () => {
      expect(useCompetitorSearch.getState().isOpen).toBe(false);
    });

    it('should have default search params', () => {
      const state = useCompetitorSearch.getState();
      expect(state.radiusMeters).toBe(1000);
      expect(state.keyword).toBe('');
    });

    it('should have empty selected items', () => {
      expect(useCompetitorSearch.getState().selectedPlaceIds).toEqual(new Set());
    });

    it('should have null search params (not yet submitted)', () => {
      expect(useCompetitorSearch.getState().submittedParams).toBeNull();
    });
  });

  describe('openDialog / closeDialog', () => {
    it('should open the dialog', () => {
      useCompetitorSearch.getState().openDialog();
      expect(useCompetitorSearch.getState().isOpen).toBe(true);
    });

    it('should close the dialog and reset state', () => {
      useCompetitorSearch.getState().openDialog();
      useCompetitorSearch.getState().setKeyword('コンビニ');
      useCompetitorSearch.getState().closeDialog();
      expect(useCompetitorSearch.getState().isOpen).toBe(false);
      expect(useCompetitorSearch.getState().keyword).toBe('');
      expect(useCompetitorSearch.getState().submittedParams).toBeNull();
    });
  });

  describe('setRadiusMeters / setKeyword', () => {
    it('should update radiusMeters', () => {
      useCompetitorSearch.getState().setRadiusMeters(3000);
      expect(useCompetitorSearch.getState().radiusMeters).toBe(3000);
    });

    it('should update keyword', () => {
      useCompetitorSearch.getState().setKeyword('ドラッグストア');
      expect(useCompetitorSearch.getState().keyword).toBe('ドラッグストア');
    });
  });

  describe('submitSearch', () => {
    it('should set submittedParams from current state', () => {
      useCompetitorSearch.getState().setRadiusMeters(2000);
      useCompetitorSearch.getState().setKeyword('コンビニ');
      useCompetitorSearch.getState().submitSearch();

      const params = useCompetitorSearch.getState().submittedParams;
      expect(params).toEqual({
        radiusMeters: 2000,
        keyword: 'コンビニ',
      });
    });

    it('should clear selections on new search', () => {
      useCompetitorSearch.getState().toggleSelection('place-1');
      useCompetitorSearch.getState().setKeyword('コンビニ');
      useCompetitorSearch.getState().submitSearch();
      expect(useCompetitorSearch.getState().selectedPlaceIds.size).toBe(0);
    });
  });

  describe('toggleSelection / toggleAll / clearSelection', () => {
    it('should add a place ID to selection', () => {
      useCompetitorSearch.getState().toggleSelection('place-1');
      expect(useCompetitorSearch.getState().selectedPlaceIds.has('place-1')).toBe(true);
    });

    it('should remove a place ID on second toggle', () => {
      useCompetitorSearch.getState().toggleSelection('place-1');
      useCompetitorSearch.getState().toggleSelection('place-1');
      expect(useCompetitorSearch.getState().selectedPlaceIds.has('place-1')).toBe(false);
    });

    it('should toggle all provided place IDs', () => {
      useCompetitorSearch.getState().toggleAll(['place-1', 'place-2', 'place-3']);
      const selected = useCompetitorSearch.getState().selectedPlaceIds;
      expect(selected.size).toBe(3);
      expect(selected.has('place-1')).toBe(true);
      expect(selected.has('place-2')).toBe(true);
      expect(selected.has('place-3')).toBe(true);
    });

    it('should deselect all when all are already selected', () => {
      useCompetitorSearch.getState().toggleAll(['place-1', 'place-2']);
      useCompetitorSearch.getState().toggleAll(['place-1', 'place-2']);
      expect(useCompetitorSearch.getState().selectedPlaceIds.size).toBe(0);
    });

    it('should clear all selections', () => {
      useCompetitorSearch.getState().toggleSelection('place-1');
      useCompetitorSearch.getState().toggleSelection('place-2');
      useCompetitorSearch.getState().clearSelection();
      expect(useCompetitorSearch.getState().selectedPlaceIds.size).toBe(0);
    });
  });
});
