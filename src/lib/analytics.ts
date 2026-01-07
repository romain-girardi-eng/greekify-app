/**
 * Advanced Analytics - Learning insights and predictions
 *
 * Features:
 * - Learning curve visualization
 * - Retention decay prediction
 * - Weak points identification
 * - Optimal review time calculation
 */

import { db } from './db';
import type { VocabCard, GrammarCard } from './types';

// Types for analytics data
export interface LearningCurvePoint {
  date: string;
  totalCards: number;
  masteredCards: number; // reps >= 5 and ease >= 2.5
  learningCards: number; // 1 <= reps < 5
  newCards: number; // reps === 0
}

export interface RetentionPrediction {
  cardId: string;
  cardType: 'vocab' | 'grammar';
  greek: string;
  currentRetention: number; // 0-100%
  daysUntilForgotten: number;
  optimalReviewDate: Date;
  stability: number;
}

export interface WeakPoint {
  category: string;
  categoryType: 'partOfSpeech' | 'grammarType' | 'mood' | 'tense' | 'mounceChapter';
  totalCards: number;
  avgLapses: number;
  avgEase: number;
  accuracy: number; // % of cards with lapses < 2
  needsWork: boolean;
}

export interface StudyPatternInsight {
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  avgSessionLength: number; // minutes
  avgCardsPerSession: number;
  consistency: number; // 0-100%
  currentStreak: number;
  longestStreak: number;
}

export interface OverallProgress {
  totalVocab: number;
  masteredVocab: number;
  totalGrammar: number;
  masteredGrammar: number;
  retentionRate: number;
  vocabularyCoverage: number; // % of NT vocab known
  estimatedReadingLevel: 'beginner' | 'intermediate' | 'advanced' | 'fluent';
}

// Constants for FSRS-inspired calculations
const DECAY_RATE = 0.9; // Memory decay factor
const STABILITY_MULTIPLIER = 1.5;
const MASTERY_THRESHOLD_REPS = 5;
const MASTERY_THRESHOLD_EASE = 2.5;

/**
 * Calculate retention probability using FSRS-inspired formula
 * R = e^(-t / S) where t = time since review, S = stability
 */
export function calculateRetention(
  lastReview: Date | null,
  stability: number,
  now: Date = new Date()
): number {
  if (!lastReview) return 0;

  const daysSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
  const retention = Math.exp(-daysSinceReview / Math.max(stability, 0.1));
  return Math.min(100, Math.max(0, retention * 100));
}

/**
 * Estimate stability based on card history
 * Higher ease and more reps = more stable memory
 */
export function estimateStability(card: VocabCard | GrammarCard): number {
  const baseStability = card.interval * STABILITY_MULTIPLIER;
  const easeFactor = card.ease / 2.5; // Normalize around default ease
  const repsFactor = Math.log2(card.reps + 1);
  const lapsePenalty = 1 / (1 + card.lapses * 0.3);

  return baseStability * easeFactor * repsFactor * lapsePenalty;
}

/**
 * Calculate days until retention drops below threshold
 */
export function daysUntilForgotten(
  retention: number,
  stability: number,
  threshold: number = 50
): number {
  if (retention <= threshold) return 0;

  // R = e^(-t/S), solve for t when R = threshold/100
  const t = -stability * Math.log(threshold / 100);
  const currentT = -stability * Math.log(retention / 100);

  return Math.max(0, Math.ceil(t - currentT));
}

/**
 * Generate learning curve data over time
 */
export async function getLearningCurve(
  days: number = 30
): Promise<LearningCurvePoint[]> {
  const vocabCards = await db.vocabCards.toArray();
  const grammarCards = await db.grammarCards.toArray();
  const allCards = [...vocabCards, ...grammarCards];

  const points: LearningCurvePoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(23, 59, 59, 999);
    const dateStr = date.toISOString().split('T')[0];

    let mastered = 0;
    let learning = 0;
    let newCards = 0;

    for (const card of allCards) {
      // Estimate card state at this date
      const lastReview = card.lastReview ? new Date(card.lastReview) : null;

      if (!lastReview || lastReview > date) {
        newCards++;
      } else if (card.reps >= MASTERY_THRESHOLD_REPS && card.ease >= MASTERY_THRESHOLD_EASE) {
        mastered++;
      } else if (card.reps >= 1) {
        learning++;
      } else {
        newCards++;
      }
    }

    points.push({
      date: dateStr,
      totalCards: allCards.length,
      masteredCards: mastered,
      learningCards: learning,
      newCards: newCards,
    });
  }

  return points;
}

/**
 * Get retention predictions for cards most at risk
 */
export async function getRetentionPredictions(
  limit: number = 20
): Promise<RetentionPrediction[]> {
  const vocabCards = await db.vocabCards.toArray();
  const grammarCards = await db.grammarCards.toArray();

  const predictions: RetentionPrediction[] = [];
  const now = new Date();

  // Process vocab cards
  for (const card of vocabCards) {
    if (card.reps === 0) continue; // Skip unlearned cards

    const stability = estimateStability(card);
    const retention = calculateRetention(card.lastReview, stability, now);
    const daysLeft = daysUntilForgotten(retention, stability);

    const optimalReviewDate = new Date(now);
    optimalReviewDate.setDate(optimalReviewDate.getDate() + Math.max(0, daysLeft - 1));

    predictions.push({
      cardId: card.id,
      cardType: 'vocab',
      greek: card.greek,
      currentRetention: Math.round(retention),
      daysUntilForgotten: daysLeft,
      optimalReviewDate,
      stability,
    });
  }

  // Process grammar cards
  for (const card of grammarCards) {
    if (card.reps === 0) continue;

    const stability = estimateStability(card);
    const retention = calculateRetention(card.lastReview, stability, now);
    const daysLeft = daysUntilForgotten(retention, stability);

    const optimalReviewDate = new Date(now);
    optimalReviewDate.setDate(optimalReviewDate.getDate() + Math.max(0, daysLeft - 1));

    predictions.push({
      cardId: card.id,
      cardType: 'grammar',
      greek: 'grammarType' in card ? card.grammarType : 'Grammar',
      currentRetention: Math.round(retention),
      daysUntilForgotten: daysLeft,
      optimalReviewDate,
      stability,
    });
  }

  // Sort by retention (lowest first = most at risk)
  return predictions
    .sort((a, b) => a.currentRetention - b.currentRetention)
    .slice(0, limit);
}

/**
 * Identify weak points by category
 */
export async function getWeakPoints(): Promise<WeakPoint[]> {
  const vocabCards = await db.vocabCards.toArray();
  const grammarCards = await db.grammarCards.toArray();

  const weakPoints: WeakPoint[] = [];

  // Group vocab by part of speech
  const posCounts: Record<string, { cards: VocabCard[] }> = {};
  for (const card of vocabCards) {
    const pos = card.partOfSpeech || 'unknown';
    if (!posCounts[pos]) posCounts[pos] = { cards: [] };
    posCounts[pos].cards.push(card);
  }

  for (const [pos, data] of Object.entries(posCounts)) {
    if (data.cards.length < 3) continue; // Skip tiny categories

    const avgLapses = data.cards.reduce((sum, c) => sum + c.lapses, 0) / data.cards.length;
    const avgEase = data.cards.reduce((sum, c) => sum + c.ease, 0) / data.cards.length;
    const accuracy = data.cards.filter(c => c.lapses < 2).length / data.cards.length * 100;

    weakPoints.push({
      category: pos,
      categoryType: 'partOfSpeech',
      totalCards: data.cards.length,
      avgLapses: Math.round(avgLapses * 10) / 10,
      avgEase: Math.round(avgEase * 100) / 100,
      accuracy: Math.round(accuracy),
      needsWork: avgLapses > 2 || avgEase < 2.3,
    });
  }

  // Group vocab by Mounce chapter
  const chapterCounts: Record<number, { cards: VocabCard[] }> = {};
  for (const card of vocabCards) {
    const chapter = card.mounceChapter || 0;
    if (!chapterCounts[chapter]) chapterCounts[chapter] = { cards: [] };
    chapterCounts[chapter].cards.push(card);
  }

  for (const [chapter, data] of Object.entries(chapterCounts)) {
    if (data.cards.length < 3 || chapter === '0') continue;

    const avgLapses = data.cards.reduce((sum, c) => sum + c.lapses, 0) / data.cards.length;
    const avgEase = data.cards.reduce((sum, c) => sum + c.ease, 0) / data.cards.length;
    const accuracy = data.cards.filter(c => c.lapses < 2).length / data.cards.length * 100;

    weakPoints.push({
      category: `Mounce Ch. ${chapter}`,
      categoryType: 'mounceChapter',
      totalCards: data.cards.length,
      avgLapses: Math.round(avgLapses * 10) / 10,
      avgEase: Math.round(avgEase * 100) / 100,
      accuracy: Math.round(accuracy),
      needsWork: avgLapses > 2 || avgEase < 2.3,
    });
  }

  // Group grammar by type
  const grammarTypeCounts: Record<string, { cards: GrammarCard[] }> = {};
  for (const card of grammarCards) {
    const type = card.grammarType || 'unknown';
    if (!grammarTypeCounts[type]) grammarTypeCounts[type] = { cards: [] };
    grammarTypeCounts[type].cards.push(card);
  }

  for (const [type, data] of Object.entries(grammarTypeCounts)) {
    if (data.cards.length < 3) continue;

    const avgLapses = data.cards.reduce((sum, c) => sum + c.lapses, 0) / data.cards.length;
    const avgEase = data.cards.reduce((sum, c) => sum + c.ease, 0) / data.cards.length;
    const accuracy = data.cards.filter(c => c.lapses < 2).length / data.cards.length * 100;

    weakPoints.push({
      category: type,
      categoryType: 'grammarType',
      totalCards: data.cards.length,
      avgLapses: Math.round(avgLapses * 10) / 10,
      avgEase: Math.round(avgEase * 100) / 100,
      accuracy: Math.round(accuracy),
      needsWork: avgLapses > 2 || avgEase < 2.3,
    });
  }

  // Sort by needsWork first, then by accuracy ascending
  return weakPoints.sort((a, b) => {
    if (a.needsWork && !b.needsWork) return -1;
    if (!a.needsWork && b.needsWork) return 1;
    return a.accuracy - b.accuracy;
  });
}

/**
 * Analyze study patterns from session history
 */
export async function getStudyPatterns(): Promise<StudyPatternInsight> {
  const sessions = await db.sessions.toArray();
  const activity = await db.dailyActivity.toArray();

  // Default values if no data
  if (sessions.length === 0) {
    return {
      bestDayOfWeek: 'N/A',
      bestTimeOfDay: 'N/A',
      avgSessionLength: 0,
      avgCardsPerSession: 0,
      consistency: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  // Analyze day of week performance
  const dayStats: Record<number, { count: number; cards: number }> = {};
  const hourStats: Record<number, { count: number; cards: number }> = {};

  for (const session of sessions) {
    const date = new Date(session.date);
    const day = date.getDay();
    const hour = date.getHours();

    if (!dayStats[day]) dayStats[day] = { count: 0, cards: 0 };
    dayStats[day].count++;
    dayStats[day].cards += session.cardsStudied;

    if (!hourStats[hour]) hourStats[hour] = { count: 0, cards: 0 };
    hourStats[hour].count++;
    hourStats[hour].cards += session.cardsStudied;
  }

  // Find best day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let bestDay = 0;
  let bestDayCards = 0;
  for (const [day, stats] of Object.entries(dayStats)) {
    if (stats.cards > bestDayCards) {
      bestDay = parseInt(day);
      bestDayCards = stats.cards;
    }
  }

  // Find best time of day
  let bestHour = 0;
  let bestHourCards = 0;
  for (const [hour, stats] of Object.entries(hourStats)) {
    if (stats.cards > bestHourCards) {
      bestHour = parseInt(hour);
      bestHourCards = stats.cards;
    }
  }

  const timeOfDay = bestHour < 12 ? 'Morning' : bestHour < 17 ? 'Afternoon' : 'Evening';

  // Calculate averages
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCards = sessions.reduce((sum, s) => sum + s.cardsStudied, 0);
  const avgSessionLength = Math.round(totalDuration / sessions.length / 60); // minutes
  const avgCardsPerSession = Math.round(totalCards / sessions.length);

  // Calculate streaks
  const sortedActivity = [...activity].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  for (let i = 0; i < sortedActivity.length; i++) {
    const current = sortedActivity[i];
    const prev = i > 0 ? sortedActivity[i - 1] : null;

    if (!prev) {
      tempStreak = 1;
    } else {
      const currentDate = new Date(current.date);
      const prevDate = new Date(prev.date);
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if this contributes to current streak
    if (current.date === today || current.date === yesterday) {
      currentStreak = tempStreak;
    }
  }

  // Calculate consistency (% of days in last 30 with activity)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const recentActivity = activity.filter(a => a.date >= thirtyDaysAgo);
  const consistency = Math.round((recentActivity.length / 30) * 100);

  return {
    bestDayOfWeek: dayNames[bestDay],
    bestTimeOfDay: timeOfDay,
    avgSessionLength,
    avgCardsPerSession,
    consistency,
    currentStreak,
    longestStreak,
  };
}

/**
 * Calculate overall progress summary
 */
export async function getOverallProgress(): Promise<OverallProgress> {
  const vocabCards = await db.vocabCards.toArray();
  const grammarCards = await db.grammarCards.toArray();

  const masteredVocab = vocabCards.filter(
    c => c.reps >= MASTERY_THRESHOLD_REPS && c.ease >= MASTERY_THRESHOLD_EASE
  ).length;

  const masteredGrammar = grammarCards.filter(
    c => c.reps >= MASTERY_THRESHOLD_REPS && c.ease >= MASTERY_THRESHOLD_EASE
  ).length;

  // Calculate average retention
  const now = new Date();
  let totalRetention = 0;
  let reviewedCards = 0;

  for (const card of [...vocabCards, ...grammarCards]) {
    if (card.reps > 0) {
      const stability = estimateStability(card);
      totalRetention += calculateRetention(card.lastReview, stability, now);
      reviewedCards++;
    }
  }

  const retentionRate = reviewedCards > 0 ? Math.round(totalRetention / reviewedCards) : 0;

  // Estimate vocabulary coverage of NT
  // NT has ~5,500 unique words, app has ~1,000 high-frequency
  const knownVocab = vocabCards.filter(c => c.reps >= 1).length;
  const vocabularyCoverage = Math.min(100, Math.round((knownVocab / 1000) * 100));

  // Estimate reading level
  let estimatedReadingLevel: 'beginner' | 'intermediate' | 'advanced' | 'fluent';
  if (masteredVocab < 100 && masteredGrammar < 20) {
    estimatedReadingLevel = 'beginner';
  } else if (masteredVocab < 300 && masteredGrammar < 50) {
    estimatedReadingLevel = 'intermediate';
  } else if (masteredVocab < 600 && masteredGrammar < 100) {
    estimatedReadingLevel = 'advanced';
  } else {
    estimatedReadingLevel = 'fluent';
  }

  return {
    totalVocab: vocabCards.length,
    masteredVocab,
    totalGrammar: grammarCards.length,
    masteredGrammar,
    retentionRate,
    vocabularyCoverage,
    estimatedReadingLevel,
  };
}

/**
 * Get cards that should be reviewed today for optimal retention
 */
export async function getOptimalReviewCards(): Promise<{
  urgent: number;
  recommended: number;
  optional: number;
}> {
  const predictions = await getRetentionPredictions(100);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let urgent = 0; // Below 50% retention
  let recommended = 0; // Optimal review today
  let optional = 0; // Can wait

  for (const pred of predictions) {
    if (pred.currentRetention < 50) {
      urgent++;
    } else if (pred.optimalReviewDate <= tomorrow) {
      recommended++;
    } else if (pred.optimalReviewDate <= nextWeek) {
      optional++;
    }
  }

  return { urgent, recommended, optional };
}

export default {
  calculateRetention,
  estimateStability,
  daysUntilForgotten,
  getLearningCurve,
  getRetentionPredictions,
  getWeakPoints,
  getStudyPatterns,
  getOverallProgress,
  getOptimalReviewCards,
};
