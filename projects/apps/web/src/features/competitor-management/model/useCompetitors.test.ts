import { describe, it, expect, beforeEach } from 'vitest';
import { useCompetitors } from './useCompetitors';

describe('useCompetitors', () => {
  beforeEach(() => {
    useCompetitors.getState().selectCompetitor(null);
  });

  describe('initial state', () => {
    it('should have selectedCompetitorId as null', () => {
      expect(useCompetitors.getState().selectedCompetitorId).toBeNull();
    });
  });

  describe('selectCompetitor', () => {
    it('should set selectedCompetitorId', () => {
      useCompetitors.getState().selectCompetitor('competitor-123');
      expect(useCompetitors.getState().selectedCompetitorId).toBe('competitor-123');
    });

    it('should allow changing selection', () => {
      useCompetitors.getState().selectCompetitor('competitor-1');
      useCompetitors.getState().selectCompetitor('competitor-2');
      expect(useCompetitors.getState().selectedCompetitorId).toBe('competitor-2');
    });

    it('should allow deselecting by passing null', () => {
      useCompetitors.getState().selectCompetitor('competitor-123');
      useCompetitors.getState().selectCompetitor(null);
      expect(useCompetitors.getState().selectedCompetitorId).toBeNull();
    });
  });
});
