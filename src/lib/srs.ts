/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo 2 algorithm with modifications for language learning.
 * Research: Bjork (1994), Pimsleur (1967), Wozniak (1990)
 *
 * Quality ratings:
 * 1 = Again (complete failure, reset)
 * 2 = Hard (correct with difficulty)
 * 3 = Good (correct with some effort)
 * 4 = Easy (perfect recall)
 */

import type { CardSRS, ReviewQuality } from './types';

// Learning phase intervals (in minutes for first, then days)
const LEARNING_STEPS = [1, 10]; // 1 minute, 10 minutes
const GRADUATING_INTERVAL = 1; // 1 day after learning
const EASY_INTERVAL = 4; // 4 days if marked easy during learning

// Ease factor bounds
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3.0;
const DEFAULT_EASE_FACTOR = 2.5;

// Interval modifier (can be adjusted per user)
const INTERVAL_MODIFIER = 1.0;

// Maximum interval (days)
const MAX_INTERVAL = 365;

export interface ReviewResult {
  card: CardSRS;
  isLearning: boolean;
  nextReviewMinutes?: number; // Only set during learning phase
}

/**
 * Calculate the next review time based on quality of recall
 */
export function calculateNextReview(
  quality: ReviewQuality,
  card: CardSRS
): ReviewResult {
  const now = new Date();
  let { interval, easeFactor, reps, lapses } = card;
  let isLearning = reps < 2;
  let nextReviewMinutes: number | undefined;

  if (quality === 1) {
    // Again - failed recall
    lapses++;
    reps = 0;
    isLearning = true;

    // Reset to first learning step
    nextReviewMinutes = LEARNING_STEPS[0];
    interval = 0;

    // Decrease ease factor significantly
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  } else if (isLearning) {
    // Still in learning phase
    if (quality === 4) {
      // Easy during learning - graduate immediately with longer interval
      reps = 2;
      interval = EASY_INTERVAL;
      isLearning = false;
    } else if (reps === 0) {
      // First learning step
      reps = 1;
      nextReviewMinutes = LEARNING_STEPS[1] || LEARNING_STEPS[0];
    } else {
      // Graduate to review phase
      reps = 2;
      interval = GRADUATING_INTERVAL;
      isLearning = false;
    }
  } else {
    // Review phase
    reps++;

    // Calculate new interval
    if (reps === 2) {
      // First review after learning
      interval = quality === 4 ? EASY_INTERVAL : GRADUATING_INTERVAL;
    } else if (reps === 3) {
      // Second review
      interval = quality === 4 ? 7 : 3;
    } else {
      // Standard SM-2 calculation
      interval = Math.round(interval * easeFactor * INTERVAL_MODIFIER);

      // Apply quality bonus/penalty
      if (quality === 2) {
        interval = Math.round(interval * 0.8); // Hard - shorter interval
      } else if (quality === 4) {
        interval = Math.round(interval * 1.3); // Easy - longer interval
      }
    }

    // Clamp interval
    interval = Math.min(MAX_INTERVAL, Math.max(1, interval));

    // Update ease factor
    easeFactor = updateEaseFactor(easeFactor, quality);
  }

  // Calculate due date
  let due: Date;
  if (nextReviewMinutes !== undefined) {
    due = new Date(now.getTime() + nextReviewMinutes * 60 * 1000);
  } else {
    due = new Date(now);
    due.setDate(due.getDate() + interval);
    due.setHours(4, 0, 0, 0); // Set to 4 AM to give buffer
  }

  return {
    card: {
      due,
      interval,
      easeFactor,
      reps,
      lapses,
      lastReview: now,
    },
    isLearning,
    nextReviewMinutes,
  };
}

/**
 * Update ease factor based on quality
 * Formula: EF' = EF + (0.1 - (4-q) * (0.08 + (4-q) * 0.02))
 */
function updateEaseFactor(currentEF: number, quality: ReviewQuality): number {
  const q = quality;
  const delta = 0.1 - (4 - q) * (0.08 + (4 - q) * 0.02);
  const newEF = currentEF + delta;
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEF));
}

/**
 * Check if a card is due for review
 */
export function isDue(card: CardSRS): boolean {
  return new Date() >= new Date(card.due);
}

/**
 * Get cards due for review, sorted by due date
 */
export function getDueCards<T extends CardSRS>(cards: T[]): T[] {
  const now = new Date();
  return cards
    .filter(card => new Date(card.due) <= now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
}

/**
 * Get new cards (never reviewed)
 */
export function getNewCards<T extends CardSRS>(cards: T[]): T[] {
  return cards.filter(card => card.reps === 0 && card.lapses === 0);
}

/**
 * Get learning cards (in learning phase)
 */
export function getLearningCards<T extends CardSRS>(cards: T[]): T[] {
  return cards.filter(card => card.reps < 2 && card.reps > 0);
}

/**
 * Calculate retention rate for a set of cards
 */
export function calculateRetentionRate<T extends CardSRS>(cards: T[]): number {
  const reviewedCards = cards.filter(c => c.reps > 0);
  if (reviewedCards.length === 0) return 0;

  const totalReps = reviewedCards.reduce((sum, c) => sum + c.reps, 0);
  const totalLapses = reviewedCards.reduce((sum, c) => sum + c.lapses, 0);

  if (totalReps + totalLapses === 0) return 0;
  return (totalReps / (totalReps + totalLapses)) * 100;
}

/**
 * Estimate review forecast for upcoming days
 */
export function getReviewForecast<T extends CardSRS>(
  cards: T[],
  days: number = 7
): { date: string; count: number }[] {
  const forecast: Map<string, number> = new Map();
  const today = new Date();

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    forecast.set(date.toISOString().split('T')[0], 0);
  }

  // Count cards due each day
  cards.forEach(card => {
    const dueDate = new Date(card.due);
    const dateStr = dueDate.toISOString().split('T')[0];

    if (forecast.has(dateStr)) {
      forecast.set(dateStr, (forecast.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(forecast.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Create initial SRS state for a new card
 */
export function createInitialSRS(): CardSRS {
  return {
    due: new Date(),
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    reps: 0,
    lapses: 0,
  };
}

/**
 * Preview what the next interval would be for each quality rating
 * Returns human-readable strings like "1m", "10m", "1j", "4j"
 */
export function previewIntervals(card: CardSRS): {
  again: string;
  hard: string;
  good: string;
  easy: string;
} {
  const formatInterval = (minutes?: number, days?: number): string => {
    if (minutes !== undefined) {
      if (minutes < 60) return `${minutes}m`;
      return `${Math.round(minutes / 60)}h`;
    }
    if (days !== undefined) {
      if (days === 1) return '1j';
      if (days < 30) return `${days}j`;
      if (days < 365) return `${Math.round(days / 30)}mo`;
      return `${Math.round(days / 365)}a`;
    }
    return '?';
  };

  // Calculate preview for each quality
  const againResult = calculateNextReview(1, card);
  const hardResult = calculateNextReview(2, card);
  const goodResult = calculateNextReview(3, card);
  const easyResult = calculateNextReview(4, card);

  return {
    again: formatInterval(againResult.nextReviewMinutes, againResult.isLearning ? undefined : againResult.card.interval),
    hard: formatInterval(hardResult.nextReviewMinutes, hardResult.isLearning ? undefined : hardResult.card.interval),
    good: formatInterval(goodResult.nextReviewMinutes, goodResult.isLearning ? undefined : goodResult.card.interval),
    easy: formatInterval(easyResult.nextReviewMinutes, easyResult.isLearning ? undefined : easyResult.card.interval),
  };
}

/**
 * Check if a card is a "leech" (failed too many times)
 * Leech threshold: 8 lapses (Anki default)
 */
export function isLeech(card: CardSRS, threshold: number = 8): boolean {
  return card.lapses >= threshold;
}

/**
 * Get leech status message
 */
export function getLeechStatus(card: CardSRS): { isLeech: boolean; message: string } {
  if (card.lapses >= 8) {
    return { isLeech: true, message: 'Carte difficile - envisagez de la reformuler' };
  }
  if (card.lapses >= 5) {
    return { isLeech: false, message: 'Carte en difficulté' };
  }
  return { isLeech: false, message: '' };
}
