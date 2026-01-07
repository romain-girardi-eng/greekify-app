/**
 * Progress Store - Manages user progress, XP, achievements, and streaks
 */

import { create } from 'zustand';
import type { UserProgress, Achievement, ReviewQuality } from '../lib/types';
import { getProgress, updateProgress, updateStreak, getStatistics, recordDailyActivity, getDailyActivity, type DailyActivity } from '../lib/db';

// XP rewards per action
const XP_REWARDS = {
  correct: 10,
  perfect: 15, // quality 4
  newCardLearned: 25,
  sessionComplete: 50,
  streakBonus: (streak: number) => Math.min(streak * 5, 50),
};

// Level thresholds
const LEVEL_XP = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000, 26000,
  33000, 41000, 50000, 60000, 72000, 85000, 100000,
];

// Achievement definitions
const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first-card',
    name: 'First Steps',
    description: 'Review your first card',
    icon: '🎯',
    target: 1,
  },
  {
    id: 'vocab-10',
    name: 'Word Collector',
    description: 'Learn 10 vocabulary words',
    icon: '📚',
    target: 10,
  },
  {
    id: 'vocab-50',
    name: 'Lexicon Builder',
    description: 'Learn 50 vocabulary words',
    icon: '📖',
    target: 50,
  },
  {
    id: 'vocab-100',
    name: 'Greek Scholar',
    description: 'Learn 100 vocabulary words',
    icon: '🎓',
    target: 100,
  },
  {
    id: 'vocab-500',
    name: 'Language Master',
    description: 'Learn 500 vocabulary words',
    icon: '👑',
    target: 500,
  },
  {
    id: 'streak-3',
    name: 'Getting Consistent',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    target: 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    target: 7,
  },
  {
    id: 'streak-30',
    name: 'Monthly Devotion',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    target: 30,
  },
  {
    id: 'streak-100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    target: 100,
  },
  {
    id: 'perfect-10',
    name: 'Sharp Memory',
    description: 'Get 10 perfect recalls in a row',
    icon: '⭐',
    target: 10,
  },
  {
    id: 'session-complete',
    name: 'Daily Dedication',
    description: 'Complete a full study session',
    icon: '✅',
    target: 1,
  },
  {
    id: 'reviews-100',
    name: 'Review Rookie',
    description: 'Complete 100 reviews',
    icon: '📝',
    target: 100,
  },
  {
    id: 'reviews-1000',
    name: 'Review Veteran',
    description: 'Complete 1000 reviews',
    icon: '🥇',
    target: 1000,
  },
];

interface Stats {
  totalCards: number;
  learnedCards: number;
  dueNow: number;
  retentionRate: number;
  avgSessionTime: number;
  totalSessions: number;
}

interface ProgressState {
  progress: UserProgress | null;
  stats: Stats | null;
  heatmapData: DailyActivity[];
  isLoading: boolean;
  consecutivePerfect: number; // Track consecutive perfect recalls
  lastXpGain: number; // For XP animation
  showConfetti: boolean; // For celebration

  // Actions
  loadProgress: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadHeatmapData: () => Promise<void>;
  recordReview: (quality: ReviewQuality, isNewCard: boolean) => Promise<void>;
  completeSession: () => Promise<void>;
  checkAchievements: () => Promise<Achievement[]>;
  setShowConfetti: (show: boolean) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: null,
  stats: null,
  heatmapData: [],
  isLoading: true,
  consecutivePerfect: 0,
  lastXpGain: 0,
  showConfetti: false,

  setShowConfetti: (show: boolean) => set({ showConfetti: show }),

  loadProgress: async () => {
    set({ isLoading: true });
    try {
      const progress = await getProgress();
      set({ progress, isLoading: false });
    } catch (error) {
      console.error('Failed to load progress:', error);
      set({ isLoading: false });
    }
  },

  loadStats: async () => {
    try {
      const stats = await getStatistics();
      set({ stats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  loadHeatmapData: async () => {
    try {
      const data = await getDailyActivity(140);
      set({ heatmapData: data });
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    }
  },

  recordReview: async (quality: ReviewQuality, isNewCard: boolean) => {
    const { progress, consecutivePerfect } = get();
    if (!progress) return;

    let xpGained = 0;

    // Calculate XP
    if (quality >= 3) {
      xpGained += quality === 4 ? XP_REWARDS.perfect : XP_REWARDS.correct;
    }

    if (isNewCard && quality >= 2) {
      xpGained += XP_REWARDS.newCardLearned;
    }

    // Track consecutive perfect recalls
    const newConsecutive = quality === 4 ? consecutivePerfect + 1 : 0;
    set({ consecutivePerfect: newConsecutive });

    // Calculate new level
    const newXp = progress.xp + xpGained;
    const newLevel = calculateLevel(newXp);

    // Update progress
    const updates: Partial<UserProgress> = {
      xp: newXp,
      level: newLevel,
      totalReviews: progress.totalReviews + 1,
      totalCardsLearned: isNewCard && quality >= 2
        ? progress.totalCardsLearned + 1
        : progress.totalCardsLearned,
    };

    await updateProgress(updates);

    // Update streak
    const newStreak = await updateStreak();

    // Add streak bonus XP
    if (newStreak > progress.streak) {
      const streakBonus = XP_REWARDS.streakBonus(newStreak);
      await updateProgress({ xp: newXp + streakBonus });
      updates.xp = newXp + streakBonus;
    }

    // Record daily activity for heatmap
    await recordDailyActivity();

    // Check for streak milestones for confetti
    const streakMilestones = [7, 30, 100, 365];
    if (streakMilestones.includes(newStreak) && newStreak > progress.streak) {
      set({ showConfetti: true });
    }

    set({
      progress: { ...progress, ...updates, streak: newStreak },
      lastXpGain: xpGained,
    });

    // Check achievements after update
    await get().checkAchievements();
  },

  completeSession: async () => {
    const { progress } = get();
    if (!progress) return;

    const xpGained = XP_REWARDS.sessionComplete;
    const newXp = progress.xp + xpGained;
    const newLevel = calculateLevel(newXp);

    await updateProgress({
      xp: newXp,
      level: newLevel,
    });

    set({
      progress: { ...progress, xp: newXp, level: newLevel },
    });

    await get().checkAchievements();
  },

  checkAchievements: async () => {
    const { progress, consecutivePerfect, stats } = get();
    if (!progress) return [];

    const newlyUnlocked: Achievement[] = [];

    for (const def of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (progress.achievements.some(a => a.id === def.id && a.unlockedAt)) {
        continue;
      }

      let currentProgress = 0;
      let unlocked = false;

      switch (def.id) {
        case 'first-card':
          currentProgress = progress.totalReviews;
          unlocked = currentProgress >= (def.target || 1);
          break;
        case 'vocab-10':
        case 'vocab-50':
        case 'vocab-100':
        case 'vocab-500':
          currentProgress = progress.totalCardsLearned;
          unlocked = currentProgress >= (def.target || 0);
          break;
        case 'streak-3':
        case 'streak-7':
        case 'streak-30':
        case 'streak-100':
          currentProgress = progress.streak;
          unlocked = currentProgress >= (def.target || 0);
          break;
        case 'perfect-10':
          currentProgress = consecutivePerfect;
          unlocked = currentProgress >= (def.target || 10);
          break;
        case 'reviews-100':
        case 'reviews-1000':
          currentProgress = progress.totalReviews;
          unlocked = currentProgress >= (def.target || 0);
          break;
        case 'session-complete':
          currentProgress = stats?.totalSessions || 0;
          unlocked = currentProgress >= 1;
          break;
      }

      if (unlocked) {
        const achievement: Achievement = {
          ...def,
          unlockedAt: new Date(),
          progress: 100,
        };
        newlyUnlocked.push(achievement);

        // Update in database
        const updatedAchievements = [
          ...progress.achievements.filter(a => a.id !== def.id),
          achievement,
        ];
        await updateProgress({ achievements: updatedAchievements });

        set({
          progress: { ...progress, achievements: updatedAchievements },
        });
      } else {
        // Update progress for incomplete achievements
        const progressPercent = Math.min(
          100,
          Math.round((currentProgress / (def.target || 1)) * 100)
        );
        const existingIndex = progress.achievements.findIndex(
          a => a.id === def.id
        );

        if (existingIndex === -1) {
          const achievement: Achievement = {
            ...def,
            progress: progressPercent,
          };
          progress.achievements.push(achievement);
        } else {
          progress.achievements[existingIndex].progress = progressPercent;
        }
      }
    }

    return newlyUnlocked;
  },
}));

function calculateLevel(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length - 1];
}

export function getXpProgress(xp: number, level: number): number {
  const currentLevelXp = LEVEL_XP[level - 1] || 0;
  const nextLevelXp = LEVEL_XP[level] || currentLevelXp;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return Math.min(100, Math.max(0, progress));
}
