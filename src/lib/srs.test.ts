/**
 * Tests for the SM-2 Spaced Repetition Algorithm
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateNextReview,
  createInitialSRS,
  isDue,
  getDueCards,
  getNewCards,
  getLearningCards,
  calculateRetentionRate,
  isLeech,
  previewIntervals,
  getLeechStatus,
} from './srs';
import type { CardSRS } from './types';

describe('SRS Algorithm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  describe('createInitialSRS', () => {
    it('should create a new card with default values', () => {
      const srs = createInitialSRS();

      expect(srs.reps).toBe(0);
      expect(srs.lapses).toBe(0);
      expect(srs.interval).toBe(0);
      expect(srs.easeFactor).toBe(2.5);
      expect(srs.due).toBeInstanceOf(Date);
    });
  });

  describe('calculateNextReview - Learning Phase', () => {
    it('should move to first learning step on first review (Good)', () => {
      const card = createInitialSRS();
      const result = calculateNextReview(3, card);

      expect(result.isLearning).toBe(true);
      expect(result.card.reps).toBe(1);
      expect(result.nextReviewMinutes).toBe(10); // Second learning step
    });

    it('should graduate after completing learning steps (Good)', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 1,
      };
      const result = calculateNextReview(3, card);

      expect(result.isLearning).toBe(false);
      expect(result.card.reps).toBe(2);
      expect(result.card.interval).toBe(1); // Graduating interval
    });

    it('should graduate immediately with Easy during learning', () => {
      const card = createInitialSRS();
      const result = calculateNextReview(4, card);

      expect(result.isLearning).toBe(false);
      expect(result.card.reps).toBe(2);
      expect(result.card.interval).toBe(4); // Easy interval
    });

    it('should reset on Again during learning', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 1,
      };
      const result = calculateNextReview(1, card);

      expect(result.isLearning).toBe(true);
      expect(result.card.reps).toBe(0);
      expect(result.card.lapses).toBe(1);
      expect(result.nextReviewMinutes).toBe(1); // First learning step
    });
  });

  describe('calculateNextReview - Review Phase', () => {
    it('should increase interval on Good response', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 3,
        interval: 7,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(3, card);

      // 7 * 2.5 = 17.5 ≈ 18 (rounded)
      expect(result.card.interval).toBe(18);
      expect(result.card.reps).toBe(4);
      expect(result.isLearning).toBe(false);
    });

    it('should apply Hard penalty to interval', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 3,
        interval: 10,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(2, card);

      // 10 * 2.5 = 25, then * 0.8 = 20
      expect(result.card.interval).toBe(20);
    });

    it('should apply Easy bonus to interval', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 3,
        interval: 10,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(4, card);

      // 10 * 2.5 = 25, then * 1.3 = 32.5 ≈ 33
      expect(result.card.interval).toBe(33);
    });

    it('should reset on Again during review phase', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 5,
        interval: 30,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(1, card);

      expect(result.isLearning).toBe(true);
      expect(result.card.reps).toBe(0);
      expect(result.card.lapses).toBe(1);
      expect(result.card.interval).toBe(0);
    });

    it('should not exceed maximum interval of 365 days', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 10,
        interval: 300,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(4, card);

      expect(result.card.interval).toBeLessThanOrEqual(365);
    });
  });

  describe('Ease Factor Updates', () => {
    it('should decrease ease factor on Again', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 5,
        interval: 10,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(1, card);

      expect(result.card.easeFactor).toBe(2.3); // 2.5 - 0.2
    });

    it('should not go below minimum ease factor 1.3', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 5,
        interval: 10,
        easeFactor: 1.4,
      };
      const result = calculateNextReview(1, card);

      expect(result.card.easeFactor).toBe(1.3);
    });

    it('should increase ease factor on Easy', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 3,
        interval: 7,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(4, card);

      // Delta for q=4: 0.1 - (4-4) * (0.08 + (4-4) * 0.02) = 0.1
      expect(result.card.easeFactor).toBeCloseTo(2.6, 1);
    });

    it('should decrease ease factor on Hard', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 3,
        interval: 7,
        easeFactor: 2.5,
      };
      const result = calculateNextReview(2, card);

      // Delta for q=2: 0.1 - (4-2) * (0.08 + (4-2) * 0.02) = 0.1 - 2 * 0.12 = -0.14
      expect(result.card.easeFactor).toBeCloseTo(2.36, 1);
    });
  });

  describe('isDue', () => {
    it('should return true for cards past due date', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        due: new Date('2024-01-14T12:00:00Z'), // Yesterday
      };

      expect(isDue(card)).toBe(true);
    });

    it('should return true for cards due now', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        due: new Date('2024-01-15T12:00:00Z'), // Now
      };

      expect(isDue(card)).toBe(true);
    });

    it('should return false for future due cards', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        due: new Date('2024-01-16T12:00:00Z'), // Tomorrow
      };

      expect(isDue(card)).toBe(false);
    });
  });

  describe('getDueCards', () => {
    it('should return only due cards sorted by due date', () => {
      const cards = [
        { id: '1', due: new Date('2024-01-16T12:00:00Z'), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 },
        { id: '2', due: new Date('2024-01-14T12:00:00Z'), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 },
        { id: '3', due: new Date('2024-01-15T10:00:00Z'), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 },
      ];

      const dueCards = getDueCards(cards);

      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].id).toBe('2'); // Earlier due date first
      expect(dueCards[1].id).toBe('3');
    });
  });

  describe('getNewCards', () => {
    it('should return only new cards (never reviewed)', () => {
      const cards = [
        { id: '1', due: new Date(), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 },
        { id: '2', due: new Date(), interval: 1, easeFactor: 2.5, reps: 2, lapses: 0 },
        { id: '3', due: new Date(), interval: 0, easeFactor: 2.5, reps: 0, lapses: 1 }, // Lapsed but not new
      ];

      const newCards = getNewCards(cards);

      expect(newCards).toHaveLength(1);
      expect(newCards[0].id).toBe('1');
    });
  });

  describe('getLearningCards', () => {
    it('should return cards in learning phase (0 < reps < 2)', () => {
      const cards = [
        { id: '1', due: new Date(), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 }, // New
        { id: '2', due: new Date(), interval: 0, easeFactor: 2.5, reps: 1, lapses: 0 }, // Learning
        { id: '3', due: new Date(), interval: 1, easeFactor: 2.5, reps: 2, lapses: 0 }, // Graduated
      ];

      const learningCards = getLearningCards(cards);

      expect(learningCards).toHaveLength(1);
      expect(learningCards[0].id).toBe('2');
    });
  });

  describe('calculateRetentionRate', () => {
    it('should calculate correct retention rate', () => {
      const cards = [
        { id: '1', due: new Date(), interval: 5, easeFactor: 2.5, reps: 10, lapses: 2 },
        { id: '2', due: new Date(), interval: 3, easeFactor: 2.3, reps: 5, lapses: 1 },
      ];

      // Total reps: 15, Total lapses: 3
      // Retention: 15 / (15 + 3) * 100 = 83.33%
      const rate = calculateRetentionRate(cards);

      expect(rate).toBeCloseTo(83.33, 1);
    });

    it('should return 0 for cards with no reviews', () => {
      const cards = [
        { id: '1', due: new Date(), interval: 0, easeFactor: 2.5, reps: 0, lapses: 0 },
      ];

      expect(calculateRetentionRate(cards)).toBe(0);
    });
  });

  describe('isLeech', () => {
    it('should identify leech cards (8+ lapses)', () => {
      const leechCard: CardSRS = { ...createInitialSRS(), lapses: 8 };
      const normalCard: CardSRS = { ...createInitialSRS(), lapses: 7 };

      expect(isLeech(leechCard)).toBe(true);
      expect(isLeech(normalCard)).toBe(false);
    });

    it('should support custom threshold', () => {
      const card: CardSRS = { ...createInitialSRS(), lapses: 5 };

      expect(isLeech(card, 5)).toBe(true);
      expect(isLeech(card, 6)).toBe(false);
    });
  });

  describe('getLeechStatus', () => {
    it('should return leech status for 8+ lapses', () => {
      const card: CardSRS = { ...createInitialSRS(), lapses: 8 };
      const status = getLeechStatus(card);

      expect(status.isLeech).toBe(true);
      expect(status.message).toContain('difficile');
    });

    it('should return warning for 5-7 lapses', () => {
      const card: CardSRS = { ...createInitialSRS(), lapses: 6 };
      const status = getLeechStatus(card);

      expect(status.isLeech).toBe(false);
      expect(status.message).toContain('difficulté');
    });

    it('should return empty message for <5 lapses', () => {
      const card: CardSRS = { ...createInitialSRS(), lapses: 3 };
      const status = getLeechStatus(card);

      expect(status.isLeech).toBe(false);
      expect(status.message).toBe('');
    });
  });

  describe('previewIntervals', () => {
    it('should return formatted intervals for a new card', () => {
      const card = createInitialSRS();
      const preview = previewIntervals(card);

      expect(preview.again).toBe('1m');
      expect(preview.good).toBe('10m');
      expect(preview.easy).toBe('4j');
    });

    it('should return formatted intervals for a mature card', () => {
      const card: CardSRS = {
        ...createInitialSRS(),
        reps: 5,
        interval: 30,
        easeFactor: 2.5,
      };
      const preview = previewIntervals(card);

      // Check format (exact values depend on algorithm)
      expect(preview.again).toBe('1m'); // Reset to learning
      expect(preview.hard).toMatch(/^\d+j$|^\d+mo$/); // Days or months
      expect(preview.good).toMatch(/^\d+j$|^\d+mo$/); // Days or months
      expect(preview.easy).toMatch(/^\d+j$|^\d+mo$/); // Days or months
    });
  });
});

describe('SRS Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should handle rapid succession reviews', () => {
    let card = createInitialSRS();

    // First review: Again
    let result = calculateNextReview(1, card);
    expect(result.card.lapses).toBe(1);

    // Immediately review again: Again
    result = calculateNextReview(1, result.card);
    expect(result.card.lapses).toBe(2);
    expect(result.card.reps).toBe(0);
  });

  it('should maintain minimum interval of 1 day', () => {
    const card: CardSRS = {
      ...createInitialSRS(),
      reps: 3,
      interval: 1,
      easeFactor: 1.3, // Very low ease
    };

    // Even with low ease and Hard response, interval should be at least 1
    const result = calculateNextReview(2, card);
    expect(result.card.interval).toBeGreaterThanOrEqual(1);
  });

  it('should correctly update lastReview timestamp', () => {
    const card = createInitialSRS();
    const result = calculateNextReview(3, card);

    expect(result.card.lastReview).toEqual(new Date('2024-01-15T12:00:00Z'));
  });
});
