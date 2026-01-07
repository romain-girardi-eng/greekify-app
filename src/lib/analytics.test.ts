/**
 * Tests for the Analytics module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateRetention,
  estimateStability,
  daysUntilForgotten,
} from './analytics';
import type { VocabCard } from './types';

// Helper to create mock vocab card
function createMockVocabCard(overrides: Partial<VocabCard> = {}): VocabCard {
  return {
    id: 'test-1',
    greek: 'λόγος',
    lemma: 'λόγος',
    gloss: 'word',
    partOfSpeech: 'noun',
    frequency: 300,
    due: new Date(),
    interval: 7,
    easeFactor: 2.5,
    ease: 2.5,
    reps: 5,
    lapses: 0,
    lastReview: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    nextReview: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

describe('Analytics Module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  describe('calculateRetention', () => {
    it('should return 100% for cards just reviewed', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const lastReview = new Date('2024-01-15T12:00:00Z');
      const stability = 10;

      const retention = calculateRetention(lastReview, stability, now);

      expect(retention).toBe(100);
    });

    it('should return 0 for cards never reviewed', () => {
      const retention = calculateRetention(null, 10);

      expect(retention).toBe(0);
    });

    it('should decrease retention over time', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const lastReview1Day = new Date('2024-01-14T12:00:00Z');
      const lastReview7Days = new Date('2024-01-08T12:00:00Z');
      const stability = 7;

      const retention1Day = calculateRetention(lastReview1Day, stability, now);
      const retention7Days = calculateRetention(lastReview7Days, stability, now);

      expect(retention1Day).toBeGreaterThan(retention7Days);
      expect(retention1Day).toBeLessThan(100);
      expect(retention7Days).toBeLessThan(retention1Day);
    });

    it('should approach 37% at stability time (e^-1)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const stability = 10;
      const lastReview = new Date(now.getTime() - stability * 24 * 60 * 60 * 1000);

      const retention = calculateRetention(lastReview, stability, now);

      // e^-1 ≈ 0.368
      expect(retention).toBeCloseTo(36.8, 0);
    });
  });

  describe('estimateStability', () => {
    it('should return higher stability for well-known cards', () => {
      const wellKnownCard = createMockVocabCard({
        interval: 30,
        ease: 2.8,
        reps: 10,
        lapses: 0,
      });

      const newCard = createMockVocabCard({
        interval: 1,
        ease: 2.5,
        reps: 2,
        lapses: 0,
      });

      const wellKnownStability = estimateStability(wellKnownCard);
      const newCardStability = estimateStability(newCard);

      expect(wellKnownStability).toBeGreaterThan(newCardStability);
    });

    it('should penalize cards with many lapses', () => {
      const normalCard = createMockVocabCard({
        interval: 7,
        ease: 2.5,
        reps: 5,
        lapses: 0,
      });

      const leechCard = createMockVocabCard({
        interval: 7,
        ease: 2.5,
        reps: 5,
        lapses: 5,
      });

      const normalStability = estimateStability(normalCard);
      const leechStability = estimateStability(leechCard);

      expect(leechStability).toBeLessThan(normalStability);
    });

    it('should factor in ease', () => {
      const highEaseCard = createMockVocabCard({
        interval: 7,
        ease: 3.0,
        reps: 5,
        lapses: 0,
      });

      const lowEaseCard = createMockVocabCard({
        interval: 7,
        ease: 1.5,
        reps: 5,
        lapses: 0,
      });

      const highEaseStability = estimateStability(highEaseCard);
      const lowEaseStability = estimateStability(lowEaseCard);

      expect(highEaseStability).toBeGreaterThan(lowEaseStability);
    });
  });

  describe('daysUntilForgotten', () => {
    it('should return 0 when already below threshold', () => {
      const days = daysUntilForgotten(40, 10, 50);

      expect(days).toBe(0);
    });

    it('should return positive days when above threshold', () => {
      const days = daysUntilForgotten(80, 10, 50);

      expect(days).toBeGreaterThan(0);
    });

    it('should return more days for higher stability', () => {
      const daysLowStability = daysUntilForgotten(80, 5, 50);
      const daysHighStability = daysUntilForgotten(80, 20, 50);

      expect(daysHighStability).toBeGreaterThan(daysLowStability);
    });

    it('should return more days for higher current retention', () => {
      const daysHighRetention = daysUntilForgotten(90, 10, 50);
      const daysLowRetention = daysUntilForgotten(60, 10, 50);

      expect(daysHighRetention).toBeGreaterThan(daysLowRetention);
    });
  });
});

describe('Analytics Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should handle very small stability values', () => {
    const retention = calculateRetention(
      new Date('2024-01-14T12:00:00Z'),
      0.1, // Very small stability
      new Date('2024-01-15T12:00:00Z')
    );

    expect(retention).toBeGreaterThanOrEqual(0);
    expect(retention).toBeLessThanOrEqual(100);
    expect(Number.isFinite(retention)).toBe(true);
  });

  it('should handle zero interval cards', () => {
    const card = createMockVocabCard({ interval: 0, reps: 0 });
    const stability = estimateStability(card);

    expect(stability).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(stability)).toBe(true);
  });

  it('should handle cards reviewed in the future', () => {
    const futureReview = new Date('2024-01-16T12:00:00Z');
    const now = new Date('2024-01-15T12:00:00Z');

    const retention = calculateRetention(futureReview, 10, now);

    // Negative time should still produce valid result (100% or capped)
    expect(retention).toBeGreaterThanOrEqual(0);
    expect(retention).toBeLessThanOrEqual(100);
  });
});
