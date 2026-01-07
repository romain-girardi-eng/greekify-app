/**
 * Data Export/Import - Backup and restore user data
 *
 * Supports:
 * - Full JSON export (all data)
 * - CSV export (vocabulary only)
 * - JSON import with validation
 */

import { db } from './db';
import type {
  VocabCard,
  GrammarCard,
  VerseMemorizationCard,
  Settings,
  UserProgress,
} from './types';

// Export data structure
export interface ExportData {
  version: string;
  exportDate: string;
  vocabCards: VocabCard[];
  grammarCards: GrammarCard[];
  verseCards: VerseMemorizationCard[];
  settings: Settings;
  progress: UserProgress;
  dailyActivity: Array<{ date: string; count: number }>;
}

// Export options
export interface ExportOptions {
  includeVocab?: boolean;
  includeGrammar?: boolean;
  includeVerses?: boolean;
  includeSettings?: boolean;
  includeProgress?: boolean;
  includeActivity?: boolean;
}

const EXPORT_VERSION = '1.0.0';

/**
 * Export all user data as JSON
 */
export async function exportAllData(options: ExportOptions = {}): Promise<ExportData> {
  const {
    includeVocab = true,
    includeGrammar = true,
    includeVerses = true,
    includeSettings = true,
    includeProgress = true,
    includeActivity = true,
  } = options;

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    vocabCards: [],
    grammarCards: [],
    verseCards: [],
    settings: {} as Settings,
    progress: {} as UserProgress,
    dailyActivity: [],
  };

  // Fetch data based on options
  if (includeVocab) {
    data.vocabCards = await db.vocabCards.toArray();
  }

  if (includeGrammar) {
    data.grammarCards = await db.grammarCards.toArray();
  }

  if (includeVerses) {
    data.verseCards = await db.verseMemorizationCards.toArray();
  }

  if (includeSettings) {
    const settings = await db.settings.get('default');
    if (settings) {
      const { id, ...rest } = settings;
      data.settings = rest;
    }
  }

  if (includeProgress) {
    const progress = await db.progress.get('user');
    if (progress) {
      const { id, ...rest } = progress;
      data.progress = rest;
    }
  }

  if (includeActivity) {
    data.dailyActivity = await db.dailyActivity.toArray();
  }

  return data;
}

/**
 * Download data as JSON file
 */
export function downloadAsJson(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `koine-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export vocabulary cards as CSV
 */
export async function exportVocabAsCsv(): Promise<string> {
  const vocabCards = await db.vocabCards.toArray();

  const headers = [
    'greek',
    'lemma',
    'gloss',
    'glossFr',
    'partOfSpeech',
    'frequency',
    'mounceChapter',
    'reps',
    'interval',
    'ease',
    'lapses',
    'due',
  ];

  const rows = vocabCards.map(card => [
    escapeCSV(card.greek),
    escapeCSV(card.lemma),
    escapeCSV(card.gloss),
    escapeCSV(card.glossFr || ''),
    escapeCSV(card.partOfSpeech),
    card.frequency.toString(),
    card.mounceChapter?.toString() || '',
    card.reps.toString(),
    card.interval.toString(),
    card.ease.toFixed(2),
    card.lapses.toString(),
    card.due?.toISOString() || '',
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csv;
}

/**
 * Download vocabulary as CSV file
 */
export async function downloadVocabAsCsv(): Promise<void> {
  const csv = await exportVocabAsCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `koine-vocab-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape a value for CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Partial<ExportData>;

  // Check version
  if (typeof d.version !== 'string') return false;

  // Check arrays
  if (d.vocabCards && !Array.isArray(d.vocabCards)) return false;
  if (d.grammarCards && !Array.isArray(d.grammarCards)) return false;
  if (d.verseCards && !Array.isArray(d.verseCards)) return false;
  if (d.dailyActivity && !Array.isArray(d.dailyActivity)) return false;

  return true;
}

/**
 * Import data from JSON
 */
export async function importData(
  data: ExportData,
  options: {
    mergeMode?: 'replace' | 'merge' | 'skip';
    importVocab?: boolean;
    importGrammar?: boolean;
    importVerses?: boolean;
    importSettings?: boolean;
    importProgress?: boolean;
    importActivity?: boolean;
  } = {}
): Promise<{
  success: boolean;
  imported: {
    vocabCards: number;
    grammarCards: number;
    verseCards: number;
    settings: boolean;
    progress: boolean;
    activity: number;
  };
  errors: string[];
}> {
  const {
    mergeMode = 'merge',
    importVocab = true,
    importGrammar = true,
    importVerses = true,
    importSettings = true,
    importProgress = true,
    importActivity = true,
  } = options;

  const result = {
    success: true,
    imported: {
      vocabCards: 0,
      grammarCards: 0,
      verseCards: 0,
      settings: false,
      progress: false,
      activity: 0,
    },
    errors: [] as string[],
  };

  try {
    // Import vocabulary cards
    if (importVocab && data.vocabCards?.length > 0) {
      if (mergeMode === 'replace') {
        await db.vocabCards.clear();
      }

      for (const card of data.vocabCards) {
        try {
          // Convert date strings back to Date objects
          const cardWithDates = {
            ...card,
            due: card.due ? new Date(card.due) : new Date(),
            lastReview: card.lastReview ? new Date(card.lastReview) : null,
            nextReview: card.nextReview ? new Date(card.nextReview) : new Date(),
          };

          if (mergeMode === 'skip') {
            const existing = await db.vocabCards.get(card.id);
            if (!existing) {
              await db.vocabCards.put(cardWithDates);
              result.imported.vocabCards++;
            }
          } else {
            await db.vocabCards.put(cardWithDates);
            result.imported.vocabCards++;
          }
        } catch (e) {
          result.errors.push(`Failed to import vocab card ${card.id}: ${e}`);
        }
      }
    }

    // Import grammar cards
    if (importGrammar && data.grammarCards?.length > 0) {
      if (mergeMode === 'replace') {
        await db.grammarCards.clear();
      }

      for (const card of data.grammarCards) {
        try {
          const cardWithDates = {
            ...card,
            due: card.due ? new Date(card.due) : new Date(),
            lastReview: card.lastReview ? new Date(card.lastReview) : null,
            nextReview: card.nextReview ? new Date(card.nextReview) : new Date(),
          };

          if (mergeMode === 'skip') {
            const existing = await db.grammarCards.get(card.id);
            if (!existing) {
              await db.grammarCards.put(cardWithDates);
              result.imported.grammarCards++;
            }
          } else {
            await db.grammarCards.put(cardWithDates);
            result.imported.grammarCards++;
          }
        } catch (e) {
          result.errors.push(`Failed to import grammar card ${card.id}: ${e}`);
        }
      }
    }

    // Import verse cards
    if (importVerses && data.verseCards?.length > 0) {
      if (mergeMode === 'replace') {
        await db.verseMemorizationCards.clear();
      }

      for (const card of data.verseCards) {
        try {
          const cardWithDates = {
            ...card,
            due: card.due ? new Date(card.due) : new Date(),
            lastReview: card.lastReview ? new Date(card.lastReview) : null,
            nextReview: card.nextReview ? new Date(card.nextReview) : new Date(),
          };

          if (mergeMode === 'skip') {
            const existing = await db.verseMemorizationCards.get(card.id);
            if (!existing) {
              await db.verseMemorizationCards.put(cardWithDates);
              result.imported.verseCards++;
            }
          } else {
            await db.verseMemorizationCards.put(cardWithDates);
            result.imported.verseCards++;
          }
        } catch (e) {
          result.errors.push(`Failed to import verse card ${card.id}: ${e}`);
        }
      }
    }

    // Import settings
    if (importSettings && data.settings && Object.keys(data.settings).length > 0) {
      try {
        await db.settings.put({ id: 'default', ...data.settings });
        result.imported.settings = true;
      } catch (e) {
        result.errors.push(`Failed to import settings: ${e}`);
      }
    }

    // Import progress
    if (importProgress && data.progress && Object.keys(data.progress).length > 0) {
      try {
        await db.progress.put({ id: 'user', ...data.progress });
        result.imported.progress = true;
      } catch (e) {
        result.errors.push(`Failed to import progress: ${e}`);
      }
    }

    // Import activity
    if (importActivity && data.dailyActivity?.length > 0) {
      if (mergeMode === 'replace') {
        await db.dailyActivity.clear();
      }

      for (const activity of data.dailyActivity) {
        try {
          if (mergeMode === 'skip') {
            const existing = await db.dailyActivity.get(activity.date);
            if (!existing) {
              await db.dailyActivity.put(activity);
              result.imported.activity++;
            }
          } else if (mergeMode === 'merge') {
            const existing = await db.dailyActivity.get(activity.date);
            if (existing) {
              // Keep the higher count
              await db.dailyActivity.put({
                date: activity.date,
                count: Math.max(existing.count, activity.count),
              });
            } else {
              await db.dailyActivity.put(activity);
            }
            result.imported.activity++;
          } else {
            await db.dailyActivity.put(activity);
            result.imported.activity++;
          }
        } catch (e) {
          result.errors.push(`Failed to import activity ${activity.date}: ${e}`);
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
  }

  return result;
}

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Parse JSON from file
 */
export async function parseJsonFile(file: File): Promise<ExportData> {
  const text = await readFileAsText(file);
  const data = JSON.parse(text);

  if (!validateImportData(data)) {
    throw new Error('Invalid backup file format');
  }

  return data;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  vocabCards: number;
  grammarCards: number;
  verseCards: number;
  sessions: number;
  activityDays: number;
  estimatedSize: string;
}> {
  const [vocabCount, grammarCount, verseCount, sessionCount, activityCount] = await Promise.all([
    db.vocabCards.count(),
    db.grammarCards.count(),
    db.verseMemorizationCards.count(),
    db.sessions.count(),
    db.dailyActivity.count(),
  ]);

  // Rough estimate: ~1KB per card, ~0.1KB per activity entry
  const estimatedBytes =
    vocabCount * 1000 +
    grammarCount * 1000 +
    verseCount * 2000 +
    sessionCount * 500 +
    activityCount * 100;

  let estimatedSize: string;
  if (estimatedBytes < 1024) {
    estimatedSize = `${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    estimatedSize = `${(estimatedBytes / 1024).toFixed(1)} KB`;
  } else {
    estimatedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return {
    vocabCards: vocabCount,
    grammarCards: grammarCount,
    verseCards: verseCount,
    sessions: sessionCount,
    activityDays: activityCount,
    estimatedSize,
  };
}

export default {
  exportAllData,
  downloadAsJson,
  exportVocabAsCsv,
  downloadVocabAsCsv,
  validateImportData,
  importData,
  readFileAsText,
  parseJsonFile,
  getStorageStats,
};
