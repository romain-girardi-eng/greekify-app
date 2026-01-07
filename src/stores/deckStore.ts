/**
 * Deck Store - Manages vocabulary and grammar cards
 */

import { create } from 'zustand';
import type {
  VocabCard,
  GrammarCard,
  StudyCard,
  ReviewQuality,
  Settings,
  StudyFilters,
} from '../lib/types';
import { calculateNextReview } from '../lib/srs';
import {
  getAllVocabCards,
  getAllGrammarCards,
  updateVocabCard,
  updateGrammarCard,
  getDueVocabCards,
  getDueGrammarCards,
  getNewVocabCards,
  getNewGrammarCards,
  getSettings,
} from '../lib/db';
import {
  matchesVocabFilters,
  matchesGrammarFilters,
  matchesSRSFilters,
} from './studyFiltersStore';

// Learning card tracking
interface LearningCard {
  card: StudyCard;
  dueTime: Date;
}

interface DeckState {
  vocabCards: VocabCard[];
  grammarCards: GrammarCard[];
  studyQueue: StudyCard[];
  currentCardIndex: number;
  isLoading: boolean;
  learningCards: LearningCard[]; // Cards currently in learning phase
  nextLearningDue: Date | null;  // When next learning card is due

  // Actions
  loadCards: () => Promise<void>;
  buildStudyQueue: (filters?: StudyFilters) => Promise<void>;
  reviewCard: (quality: ReviewQuality) => Promise<void>;
  nextCard: () => void;
  getCurrentCard: () => StudyCard | null;
  getQueueStats: () => {
    total: number;
    remaining: number;
    new: number;
    review: number;
    learning: number;
  };
  checkLearningCards: () => void; // Check if any learning cards are due
  getLearningWaitTime: () => number | null; // Seconds until next learning card
}

export const useDeckStore = create<DeckState>((set, get) => ({
  vocabCards: [],
  grammarCards: [],
  studyQueue: [],
  currentCardIndex: 0,
  isLoading: true,
  learningCards: [],
  nextLearningDue: null,

  loadCards: async () => {
    set({ isLoading: true });
    try {
      const [vocab, grammar] = await Promise.all([
        getAllVocabCards(),
        getAllGrammarCards(),
      ]);
      set({
        vocabCards: vocab,
        grammarCards: grammar,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load cards:', error);
      set({ isLoading: false });
    }
  },

  buildStudyQueue: async (filters?: StudyFilters) => {
    const settings = await getSettings();
    const queue: StudyCard[] = [];

    // Import filters from store if not provided
    const activeFilters = filters || (await import('./studyFiltersStore')).useStudyFiltersStore.getState().activeFilters;

    // Get due cards
    const dueVocab = await getDueVocabCards();
    const dueGrammar = await getDueGrammarCards();

    // Get new cards (limited by settings)
    const newVocabCount = Math.round(
      settings.newCardsPerDay * settings.interleaveRatio.vocab
    );
    const newGrammarCount = Math.round(
      settings.newCardsPerDay * settings.interleaveRatio.grammar
    );

    const newVocab = await getNewVocabCards(newVocabCount);
    const newGrammar = await getNewGrammarCards(newGrammarCount);

    // Add and filter vocab cards
    if (activeFilters.cardTypes.vocab) {
      [...dueVocab, ...newVocab].forEach(card => {
        // Apply vocab filters
        if (matchesVocabFilters(card, activeFilters) && matchesSRSFilters(card, activeFilters)) {
          queue.push({ type: 'vocab', card });
        }
      });
    }

    // Add and filter grammar cards
    if (activeFilters.cardTypes.grammar) {
      [...dueGrammar, ...newGrammar].forEach(card => {
        // Apply grammar filters
        if (matchesGrammarFilters(card, activeFilters) && matchesSRSFilters(card, activeFilters)) {
          queue.push({ type: 'grammar', card });
        }
      });
    }

    // Interleave the queue
    const interleaved = interleaveCards(queue, settings);

    set({
      studyQueue: interleaved,
      currentCardIndex: 0,
    });
  },

  reviewCard: async (quality: ReviewQuality) => {
    const { studyQueue, currentCardIndex, vocabCards, grammarCards, learningCards } = get();
    const currentCard = studyQueue[currentCardIndex];

    if (!currentCard) return;

    const processReview = async (type: 'vocab' | 'grammar', card: VocabCard | GrammarCard) => {
      const result = calculateNextReview(quality, card);
      const updatedCard = { ...card, ...result.card };

      // Save to database
      if (type === 'vocab') {
        await updateVocabCard(updatedCard as VocabCard);
        const updatedVocab = vocabCards.map(c =>
          c.id === updatedCard.id ? updatedCard : c
        ) as VocabCard[];
        set({ vocabCards: updatedVocab });
      } else {
        await updateGrammarCard(updatedCard as GrammarCard);
        const updatedGrammar = grammarCards.map(c =>
          c.id === updatedCard.id ? updatedCard : c
        ) as GrammarCard[];
        set({ grammarCards: updatedGrammar });
      }

      // Handle learning phase cards
      if (result.isLearning && result.nextReviewMinutes !== undefined) {
        const dueTime = new Date(Date.now() + result.nextReviewMinutes * 60 * 1000);
        const newLearningCard: LearningCard = {
          card: { type, card: updatedCard } as StudyCard,
          dueTime,
        };

        // Add to learning queue, sorted by due time
        const newLearningCards = [...learningCards, newLearningCard].sort(
          (a, b) => a.dueTime.getTime() - b.dueTime.getTime()
        );

        // Update next due time
        const nextDue = newLearningCards[0]?.dueTime || null;

        set({
          learningCards: newLearningCards,
          nextLearningDue: nextDue,
        });
      }

      return result;
    };

    if (currentCard.type === 'vocab') {
      await processReview('vocab', currentCard.card);
    } else if (currentCard.type === 'grammar') {
      await processReview('grammar', currentCard.card);
    }
  },

  nextCard: () => {
    const { currentCardIndex, studyQueue } = get();
    if (currentCardIndex < studyQueue.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },

  getCurrentCard: () => {
    const { studyQueue, currentCardIndex } = get();
    return studyQueue[currentCardIndex] || null;
  },

  getQueueStats: () => {
    const { studyQueue, currentCardIndex, learningCards } = get();
    const remaining = studyQueue.slice(currentCardIndex);

    const newCards = remaining.filter(card => {
      if (card.type === 'vocab' || card.type === 'grammar') {
        return card.card.reps === 0;
      }
      return false;
    }).length;

    return {
      total: studyQueue.length,
      remaining: remaining.length,
      new: newCards,
      review: remaining.length - newCards,
      learning: learningCards.length,
    };
  },

  checkLearningCards: () => {
    const { learningCards, studyQueue, currentCardIndex } = get();

    if (learningCards.length === 0) return;

    const now = new Date();
    const dueCards: LearningCard[] = [];
    const notDueYet: LearningCard[] = [];

    learningCards.forEach(lc => {
      if (lc.dueTime <= now) {
        dueCards.push(lc);
      } else {
        notDueYet.push(lc);
      }
    });

    if (dueCards.length > 0) {
      // Add due learning cards to the front of remaining queue
      const newQueue = [...studyQueue];
      dueCards.forEach(dc => {
        // Insert right after current card
        newQueue.splice(currentCardIndex + 1, 0, dc.card);
      });

      const nextDue = notDueYet[0]?.dueTime || null;

      set({
        studyQueue: newQueue,
        learningCards: notDueYet,
        nextLearningDue: nextDue,
      });
    }
  },

  getLearningWaitTime: () => {
    const { nextLearningDue } = get();

    if (!nextLearningDue) return null;

    const now = new Date();
    const diff = nextLearningDue.getTime() - now.getTime();

    if (diff <= 0) return 0;

    return Math.ceil(diff / 1000); // Return seconds
  },
}));

/**
 * Interleave cards according to ratio settings
 * Uses Fisher-Yates shuffle within groups, then merges
 */
function interleaveCards(cards: StudyCard[], settings: Settings): StudyCard[] {
  if (cards.length === 0) return [];

  // Separate by type
  const vocab = cards.filter(c => c.type === 'vocab');
  const grammar = cards.filter(c => c.type === 'grammar');
  const verse = cards.filter(c => c.type === 'verse');

  // Shuffle each group
  shuffleArray(vocab);
  shuffleArray(grammar);
  shuffleArray(verse);

  // Interleave based on ratios
  const result: StudyCard[] = [];
  const ratios = settings.interleaveRatio;

  let vi = 0,
    gi = 0,
    vsi = 0;

  while (vi < vocab.length || gi < grammar.length || vsi < verse.length) {
    // Calculate target counts based on current result length
    const targetVocab = Math.round(result.length * ratios.vocab);
    const targetGrammar = Math.round(result.length * ratios.grammar);

    // Add vocab if under target
    if (vi < vocab.length && vi <= targetVocab) {
      result.push(vocab[vi++]);
    }
    // Add grammar if under target
    else if (gi < grammar.length && gi <= targetGrammar) {
      result.push(grammar[gi++]);
    }
    // Add verse (lowest priority)
    else if (vsi < verse.length) {
      result.push(verse[vsi++]);
    }
    // Fill remaining with whatever is available
    else if (vi < vocab.length) {
      result.push(vocab[vi++]);
    } else if (gi < grammar.length) {
      result.push(grammar[gi++]);
    }
  }

  return result;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
