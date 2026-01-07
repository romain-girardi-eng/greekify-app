/**
 * IndexedDB Database Setup using Dexie.js
 *
 * Provides offline-first storage for:
 * - Vocabulary cards
 * - Grammar cards
 * - NT verses
 * - User progress
 * - Study sessions
 */

import Dexie, { type Table } from 'dexie';
import type {
  VocabCard,
  GrammarCard,
  NTVerse,
  UserProgress,
  StudySession,
  Settings,
  VerseMemorizationCard,
  VerseCollection,
} from './types';
import { DEFAULT_SETTINGS } from './types';

// Daily activity tracking for heatmap
export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

export class KoineDatabase extends Dexie {
  vocabCards!: Table<VocabCard>;
  grammarCards!: Table<GrammarCard>;
  verses!: Table<NTVerse>;
  sessions!: Table<StudySession>;
  progress!: Table<UserProgress & { id: string }>;
  settings!: Table<Settings & { id: string }>;
  dailyActivity!: Table<DailyActivity>;
  verseMemorizationCards!: Table<VerseMemorizationCard>;
  verseCollections!: Table<VerseCollection>;

  constructor() {
    super('koine-greek-db');

    this.version(1).stores({
      vocabCards: 'id, greek, partOfSpeech, frequency, mounceChapter, due, reps',
      grammarCards: 'id, type, difficulty, due, reps',
      verses: 'id, book, chapter, verse, difficulty',
      sessions: 'id, startTime',
      progress: 'id',
      settings: 'id',
    });

    // Version 2: Add daily activity tracking
    this.version(2).stores({
      vocabCards: 'id, greek, partOfSpeech, frequency, mounceChapter, due, reps',
      grammarCards: 'id, type, difficulty, due, reps',
      verses: 'id, book, chapter, verse, difficulty',
      sessions: 'id, startTime',
      progress: 'id',
      settings: 'id',
      dailyActivity: 'date',
    });

    // Version 3: Add verse memorization cards and collections
    this.version(3).stores({
      vocabCards: 'id, greek, partOfSpeech, frequency, mounceChapter, due, reps',
      grammarCards: 'id, type, difficulty, due, reps',
      verses: 'id, book, chapter, verse, difficulty',
      sessions: 'id, startTime',
      progress: 'id',
      settings: 'id',
      dailyActivity: 'date',
      verseMemorizationCards: 'id, reference, collectionId, memorizationLevel, due, reps',
      verseCollections: 'id, name, isBuiltIn',
    });
  }
}

export const db = new KoineDatabase();

// Initialize with default settings and progress
export async function initializeDatabase(): Promise<void> {
  const existingSettings = await db.settings.get('default');
  if (!existingSettings) {
    await db.settings.put({ id: 'default', ...DEFAULT_SETTINGS });
  }

  const existingProgress = await db.progress.get('user');
  if (!existingProgress) {
    await db.progress.put({
      id: 'user',
      streak: 0,
      lastStudyDate: '',
      totalCardsLearned: 0,
      totalReviews: 0,
      totalStudyTime: 0,
      xp: 0,
      level: 1,
      achievements: [],
    });
  }
}

// Vocabulary card operations
export async function addVocabCard(card: VocabCard): Promise<void> {
  await db.vocabCards.put(card);
}

export async function addVocabCards(cards: VocabCard[]): Promise<void> {
  await db.vocabCards.bulkPut(cards);
}

export async function getVocabCard(id: string): Promise<VocabCard | undefined> {
  return db.vocabCards.get(id);
}

export async function getAllVocabCards(): Promise<VocabCard[]> {
  return db.vocabCards.toArray();
}

export async function getDueVocabCards(): Promise<VocabCard[]> {
  const now = new Date();
  return db.vocabCards.where('due').belowOrEqual(now).toArray();
}

export async function getNewVocabCards(limit: number): Promise<VocabCard[]> {
  return db.vocabCards.where('reps').equals(0).limit(limit).toArray();
}

export async function updateVocabCard(card: VocabCard): Promise<void> {
  await db.vocabCards.put(card);
}

// Grammar card operations
export async function addGrammarCard(card: GrammarCard): Promise<void> {
  await db.grammarCards.put(card);
}

export async function addGrammarCards(cards: GrammarCard[]): Promise<void> {
  await db.grammarCards.bulkPut(cards);
}

export async function getAllGrammarCards(): Promise<GrammarCard[]> {
  return db.grammarCards.toArray();
}

export async function getDueGrammarCards(): Promise<GrammarCard[]> {
  const now = new Date();
  return db.grammarCards.where('due').belowOrEqual(now).toArray();
}

export async function getNewGrammarCards(limit: number): Promise<GrammarCard[]> {
  return db.grammarCards.where('reps').equals(0).limit(limit).toArray();
}

export async function updateGrammarCard(card: GrammarCard): Promise<void> {
  await db.grammarCards.put(card);
}

// Verse operations
export async function addVerses(verses: NTVerse[]): Promise<void> {
  await db.verses.bulkPut(verses);
}

export async function getVersesByBook(book: string): Promise<NTVerse[]> {
  return db.verses.where('book').equals(book).toArray();
}

export async function getVersesByDifficulty(
  maxDifficulty: number
): Promise<NTVerse[]> {
  return db.verses.where('difficulty').belowOrEqual(maxDifficulty).toArray();
}

// Progress operations
export async function getProgress(): Promise<UserProgress> {
  const progress = await db.progress.get('user');
  if (!progress) {
    throw new Error('Progress not initialized');
  }
  const { id, ...rest } = progress;
  return rest;
}

export async function updateProgress(
  updates: Partial<UserProgress>
): Promise<void> {
  await db.progress.update('user', updates);
}

export async function updateStreak(): Promise<number> {
  const progress = await db.progress.get('user');
  if (!progress) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = progress.streak;

  if (progress.lastStudyDate === today) {
    // Already studied today, no change
  } else if (progress.lastStudyDate === yesterday) {
    // Streak continues
    newStreak++;
  } else {
    // Streak broken
    newStreak = 1;
  }

  await db.progress.update('user', {
    streak: newStreak,
    lastStudyDate: today,
  });

  return newStreak;
}

// Settings operations
export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get('default');
  if (!settings) {
    return DEFAULT_SETTINGS;
  }
  const { id, ...rest } = settings;
  return rest;
}

export async function updateSettings(
  updates: Partial<Settings>
): Promise<void> {
  await db.settings.update('default', updates);
}

// Session operations
export async function createSession(): Promise<string> {
  const session: StudySession = {
    id: `session-${Date.now()}`,
    startTime: new Date(),
    cardsStudied: 0,
    correctCount: 0,
    newCardsLearned: 0,
    reviewsCompleted: 0,
  };
  await db.sessions.add(session);
  return session.id;
}

export async function updateSession(
  id: string,
  updates: Partial<StudySession>
): Promise<void> {
  await db.sessions.update(id, updates);
}

export async function endSession(id: string): Promise<void> {
  await db.sessions.update(id, { endTime: new Date() });
}

export async function getRecentSessions(limit: number = 10): Promise<StudySession[]> {
  return db.sessions.orderBy('startTime').reverse().limit(limit).toArray();
}

// Statistics
export async function getStatistics() {
  const vocabCards = await db.vocabCards.toArray();
  const grammarCards = await db.grammarCards.toArray();
  const sessions = await db.sessions.toArray();

  const totalCards = vocabCards.length + grammarCards.length;
  const learnedCards = [...vocabCards, ...grammarCards].filter(
    c => c.reps >= 2
  ).length;
  const dueNow =
    (await getDueVocabCards()).length + (await getDueGrammarCards()).length;

  // Calculate retention rate
  const allCards = [...vocabCards, ...grammarCards];
  const totalReps = allCards.reduce((sum, c) => sum + c.reps, 0);
  const totalLapses = allCards.reduce((sum, c) => sum + c.lapses, 0);
  const retentionRate =
    totalReps + totalLapses > 0
      ? Math.round((totalReps / (totalReps + totalLapses)) * 100)
      : 0;

  // Calculate average session time
  const completedSessions = sessions.filter(s => s.endTime);
  const avgSessionTime =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => {
            const duration =
              (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) /
              60000;
            return sum + duration;
          }, 0) / completedSessions.length
        )
      : 0;

  return {
    totalCards,
    learnedCards,
    dueNow,
    retentionRate,
    avgSessionTime,
    totalSessions: sessions.length,
  };
}

// Daily activity operations
export async function recordDailyActivity(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await db.dailyActivity.get(today);

  if (existing) {
    await db.dailyActivity.update(today, { count: existing.count + 1 });
  } else {
    await db.dailyActivity.put({ date: today, count: 1 });
  }
}

export async function getDailyActivity(days: number = 140): Promise<DailyActivity[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];

  return db.dailyActivity
    .where('date')
    .aboveOrEqual(startStr)
    .toArray();
}

// Verse Memorization Card operations
export async function addVerseMemorizationCard(card: VerseMemorizationCard): Promise<void> {
  await db.verseMemorizationCards.put(card);
}

export async function addVerseMemorizationCards(cards: VerseMemorizationCard[]): Promise<void> {
  await db.verseMemorizationCards.bulkPut(cards);
}

export async function getAllVerseMemorizationCards(): Promise<VerseMemorizationCard[]> {
  return db.verseMemorizationCards.toArray();
}

export async function getVerseMemorizationCard(id: string): Promise<VerseMemorizationCard | undefined> {
  return db.verseMemorizationCards.get(id);
}

export async function getDueVerseMemorizationCards(): Promise<VerseMemorizationCard[]> {
  const now = new Date();
  return db.verseMemorizationCards.where('due').belowOrEqual(now).toArray();
}

export async function getNewVerseMemorizationCards(limit: number): Promise<VerseMemorizationCard[]> {
  return db.verseMemorizationCards.where('reps').equals(0).limit(limit).toArray();
}

export async function getVerseMemorizationCardsByCollection(collectionId: string): Promise<VerseMemorizationCard[]> {
  return db.verseMemorizationCards.where('collectionId').equals(collectionId).toArray();
}

export async function updateVerseMemorizationCard(card: VerseMemorizationCard): Promise<void> {
  await db.verseMemorizationCards.put(card);
}

export async function deleteVerseMemorizationCard(id: string): Promise<void> {
  await db.verseMemorizationCards.delete(id);
}

// Verse Collection operations
export async function addVerseCollection(collection: VerseCollection): Promise<void> {
  await db.verseCollections.put(collection);
}

export async function getAllVerseCollections(): Promise<VerseCollection[]> {
  return db.verseCollections.toArray();
}

export async function getVerseCollection(id: string): Promise<VerseCollection | undefined> {
  return db.verseCollections.get(id);
}

export async function updateVerseCollection(collection: VerseCollection): Promise<void> {
  await db.verseCollections.put(collection);
}

export async function deleteVerseCollection(id: string): Promise<void> {
  // Delete collection and all associated cards
  await db.verseMemorizationCards.where('collectionId').equals(id).delete();
  await db.verseCollections.delete(id);
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  await db.vocabCards.clear();
  await db.grammarCards.clear();
  await db.verses.clear();
  await db.sessions.clear();
  await db.dailyActivity.clear();
  await db.verseMemorizationCards.clear();
  await db.verseCollections.clear();
  await initializeDatabase();
}
