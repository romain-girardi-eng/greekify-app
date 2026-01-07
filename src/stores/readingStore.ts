/**
 * Reading Store - Manages reading progress and scaffolding preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScaffoldingMode, ReadingProgress } from '../lib/types';

interface ReadingState {
  // Scaffolding preferences
  scaffoldingMode: ScaffoldingMode;
  showInterlinear: boolean;
  highlightUnknown: boolean;

  // Reading progress by passage
  readingProgress: Record<string, ReadingProgress>;

  // Current session
  currentPassageId: string | null;
  sessionStartTime: Date | null;
  wordsLookedUpThisSession: string[];

  // Actions
  setScaffoldingMode: (mode: ScaffoldingMode) => void;
  setShowInterlinear: (show: boolean) => void;
  setHighlightUnknown: (show: boolean) => void;

  // Session management
  startReadingSession: (passageId: string) => void;
  endReadingSession: (comprehensionScore?: number) => void;
  recordWordLookup: (lemma: string) => void;

  // Progress tracking
  getPassageProgress: (passageId: string) => ReadingProgress | undefined;
  markPassageComplete: (passageId: string) => void;
  getCompletedPassages: () => string[];
  getTotalReadingTime: () => number;

  // Reset
  resetProgress: () => void;
}

const INITIAL_STATE = {
  scaffoldingMode: 'full-gloss' as ScaffoldingMode,
  showInterlinear: false,
  highlightUnknown: true,
  readingProgress: {} as Record<string, ReadingProgress>,
  currentPassageId: null as string | null,
  sessionStartTime: null as Date | null,
  wordsLookedUpThisSession: [] as string[],
};

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setScaffoldingMode: (mode) => set({ scaffoldingMode: mode }),

      setShowInterlinear: (show) => set({ showInterlinear: show }),

      setHighlightUnknown: (show) => set({ highlightUnknown: show }),

      startReadingSession: (passageId) => {
        const existing = get().readingProgress[passageId];
        const now = new Date();

        set({
          currentPassageId: passageId,
          sessionStartTime: now,
          wordsLookedUpThisSession: [],
        });

        // Create or update progress entry
        if (!existing) {
          set((state) => ({
            readingProgress: {
              ...state.readingProgress,
              [passageId]: {
                passageId,
                firstReadAt: now,
                lastReadAt: now,
                timeSpent: 0,
                scaffoldingUsed: state.scaffoldingMode,
                wordsLookedUp: [],
              },
            },
          }));
        } else {
          set((state) => ({
            readingProgress: {
              ...state.readingProgress,
              [passageId]: {
                ...existing,
                lastReadAt: now,
              },
            },
          }));
        }
      },

      endReadingSession: (comprehensionScore) => {
        const { currentPassageId, sessionStartTime, wordsLookedUpThisSession, readingProgress, scaffoldingMode } = get();

        if (!currentPassageId || !sessionStartTime) return;

        const sessionDuration = Math.round((Date.now() - sessionStartTime.getTime()) / 1000);
        const existing = readingProgress[currentPassageId];

        if (existing) {
          const updatedProgress: ReadingProgress = {
            ...existing,
            lastReadAt: new Date(),
            timeSpent: existing.timeSpent + sessionDuration,
            scaffoldingUsed: scaffoldingMode,
            wordsLookedUp: [...new Set([...existing.wordsLookedUp, ...wordsLookedUpThisSession])],
            ...(comprehensionScore !== undefined && { comprehensionScore }),
          };

          set((state) => ({
            readingProgress: {
              ...state.readingProgress,
              [currentPassageId]: updatedProgress,
            },
            currentPassageId: null,
            sessionStartTime: null,
            wordsLookedUpThisSession: [],
          }));
        }
      },

      recordWordLookup: (lemma) => {
        set((state) => ({
          wordsLookedUpThisSession: [...new Set([...state.wordsLookedUpThisSession, lemma])],
        }));
      },

      getPassageProgress: (passageId) => {
        return get().readingProgress[passageId];
      },

      markPassageComplete: (passageId) => {
        const existing = get().readingProgress[passageId];
        if (existing) {
          set((state) => ({
            readingProgress: {
              ...state.readingProgress,
              [passageId]: {
                ...existing,
                completedAt: new Date(),
              },
            },
          }));
        }
      },

      getCompletedPassages: () => {
        return Object.values(get().readingProgress)
          .filter((p) => p.completedAt)
          .map((p) => p.passageId);
      },

      getTotalReadingTime: () => {
        return Object.values(get().readingProgress).reduce(
          (total, p) => total + p.timeSpent,
          0
        );
      },

      resetProgress: () => {
        set(INITIAL_STATE);
      },
    }),
    {
      name: 'koine-reading-progress',
      partialize: (state) => ({
        scaffoldingMode: state.scaffoldingMode,
        showInterlinear: state.showInterlinear,
        highlightUnknown: state.highlightUnknown,
        readingProgress: state.readingProgress,
      }),
    }
  )
);

export default useReadingStore;
