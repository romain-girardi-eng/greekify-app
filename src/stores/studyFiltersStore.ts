/**
 * Study Filters Store - Advanced personalization for study sessions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StudyFilters,
  StudyPreset,
  SavedFilterConfig,
  MoodFilter,
  TenseFilter,
  VoiceFilter,
  PartOfSpeechFilter,
  GrammarTypeFilter,
} from '../lib/types';
import {
  DEFAULT_STUDY_FILTERS,
  BUILT_IN_PRESETS,
} from '../lib/types';

interface StudyFiltersState {
  // Current active filters
  activeFilters: StudyFilters;

  // Active preset ID (null if custom)
  activePresetId: string | null;

  // User's saved configurations
  savedConfigs: SavedFilterConfig[];

  // UI state
  isCustomMode: boolean;

  // Actions
  setActiveFilters: (filters: StudyFilters) => void;
  selectPreset: (presetId: string) => void;
  saveCurrentConfig: (name: string) => string;
  deleteSavedConfig: (configId: string) => void;
  loadSavedConfig: (configId: string) => void;
  resetToDefaults: () => void;

  // Getters
  getActivePreset: () => StudyPreset | null;
  getAllPresets: () => StudyPreset[];
  getFilterSummary: () => string;
  getMatchingCardCount: () => { vocab: number; grammar: number; total: number } | null;

  // Quick toggles
  toggleCardType: (type: 'vocab' | 'grammar' | 'verse') => void;
  toggleMood: (mood: keyof MoodFilter) => void;
  toggleTense: (tense: keyof TenseFilter) => void;
  toggleVoice: (voice: keyof VoiceFilter) => void;
  toggleGrammarType: (grammarType: keyof GrammarTypeFilter) => void;
  togglePartOfSpeech: (pos: keyof PartOfSpeechFilter) => void;
  setFrequencyRange: (min: number, max: number) => void;
  setMounceChapters: (chapters: number[]) => void;
  toggleSRSFilter: (filter: 'includeNew' | 'includeLearning' | 'includeReview' | 'includeLeeches') => void;

  // Bulk operations
  setAllMoods: (enabled: boolean) => void;
  setAllTenses: (enabled: boolean) => void;
  setAllVoices: (enabled: boolean) => void;
  setAllPartsOfSpeech: (enabled: boolean) => void;
  setAllGrammarTypes: (enabled: boolean) => void;
}

export const useStudyFiltersStore = create<StudyFiltersState>()(
  persist(
    (set, get) => ({
      activeFilters: DEFAULT_STUDY_FILTERS,
      activePresetId: 'all',
      savedConfigs: [],
      isCustomMode: false,

      setActiveFilters: (filters) =>
        set({
          activeFilters: filters,
          isCustomMode: true,
          activePresetId: null,
        }),

      selectPreset: (presetId) => {
        // Check built-in presets first
        let preset = BUILT_IN_PRESETS.find((p) => p.id === presetId);

        // If not found, check saved configs
        if (!preset) {
          const savedConfig = get().savedConfigs.find((c) => c.id === presetId);
          if (savedConfig) {
            set({
              activeFilters: savedConfig.filters,
              activePresetId: presetId,
              isCustomMode: false,
              savedConfigs: get().savedConfigs.map((c) =>
                c.id === presetId ? { ...c, lastUsedAt: new Date() } : c
              ),
            });
            return;
          }
        }

        if (preset) {
          set({
            activeFilters: preset.filters,
            activePresetId: presetId,
            isCustomMode: false,
          });
        }
      },

      saveCurrentConfig: (name) => {
        const id = `custom-${Date.now()}`;
        const config: SavedFilterConfig = {
          id,
          name,
          filters: JSON.parse(JSON.stringify(get().activeFilters)), // Deep clone
          createdAt: new Date(),
          lastUsedAt: new Date(),
        };
        set((state) => ({
          savedConfigs: [...state.savedConfigs, config],
          activePresetId: id,
          isCustomMode: false,
        }));
        return id;
      },

      deleteSavedConfig: (configId) => {
        const { activePresetId } = get();
        set((state) => ({
          savedConfigs: state.savedConfigs.filter((c) => c.id !== configId),
          // Reset to default if we deleted the active config
          activePresetId: activePresetId === configId ? 'all' : activePresetId,
          activeFilters:
            activePresetId === configId
              ? DEFAULT_STUDY_FILTERS
              : state.activeFilters,
        }));
      },

      loadSavedConfig: (configId) => {
        const config = get().savedConfigs.find((c) => c.id === configId);
        if (config) {
          set((state) => ({
            activeFilters: JSON.parse(JSON.stringify(config.filters)),
            activePresetId: configId,
            isCustomMode: false,
            savedConfigs: state.savedConfigs.map((c) =>
              c.id === configId ? { ...c, lastUsedAt: new Date() } : c
            ),
          }));
        }
      },

      resetToDefaults: () =>
        set({
          activeFilters: DEFAULT_STUDY_FILTERS,
          activePresetId: 'all',
          isCustomMode: false,
        }),

      getActivePreset: () => {
        const { activePresetId, savedConfigs } = get();
        if (!activePresetId) return null;

        // Check built-in first
        const builtIn = BUILT_IN_PRESETS.find((p) => p.id === activePresetId);
        if (builtIn) return builtIn;

        // Check saved configs
        const saved = savedConfigs.find((c) => c.id === activePresetId);
        if (saved) {
          return {
            id: saved.id,
            name: saved.name,
            nameKey: '',
            description: `Créé le ${new Date(saved.createdAt).toLocaleDateString()}`,
            descriptionKey: '',
            icon: 'Bookmark',
            filters: saved.filters,
            isBuiltIn: false,
          };
        }

        return null;
      },

      getAllPresets: () => {
        const { savedConfigs } = get();
        const customPresets: StudyPreset[] = savedConfigs.map((c) => ({
          id: c.id,
          name: c.name,
          nameKey: '',
          description: `Créé le ${new Date(c.createdAt).toLocaleDateString()}`,
          descriptionKey: '',
          icon: 'Bookmark',
          filters: c.filters,
          isBuiltIn: false,
        }));
        return [...BUILT_IN_PRESETS, ...customPresets];
      },

      getFilterSummary: () => {
        const { activeFilters, activePresetId, isCustomMode } = get();
        const parts: string[] = [];

        // If using a preset, show preset name
        if (!isCustomMode && activePresetId) {
          const preset = BUILT_IN_PRESETS.find((p) => p.id === activePresetId);
          if (preset && preset.id !== 'all') {
            return preset.name;
          }
        }

        // Card types
        const { vocab, grammar, verse } = activeFilters.cardTypes;
        if (!vocab && grammar && !verse) parts.push('Grammaire');
        else if (vocab && !grammar && !verse) parts.push('Vocabulaire');
        else if (!vocab && !grammar && verse) parts.push('Versets');

        // Mood restrictions
        const enabledMoods = Object.entries(activeFilters.grammarFilters.moods)
          .filter(([_, v]) => v)
          .map(([k]) => k);
        if (grammar && enabledMoods.length < 6 && enabledMoods.length > 0) {
          if (enabledMoods.length === 1) {
            parts.push(`Mode: ${enabledMoods[0]}`);
          } else {
            parts.push(`${enabledMoods.length} modes`);
          }
        }

        // Tense restrictions
        const enabledTenses = Object.entries(activeFilters.grammarFilters.tenses)
          .filter(([_, v]) => v)
          .map(([k]) => k);
        if (grammar && enabledTenses.length < 6 && enabledTenses.length > 0) {
          if (enabledTenses.length === 1) {
            parts.push(`Temps: ${enabledTenses[0]}`);
          } else {
            parts.push(`${enabledTenses.length} temps`);
          }
        }

        // Frequency
        const { min, max } = activeFilters.vocabFilters.frequencyRange;
        if (vocab && (min > 0 || max < Infinity)) {
          if (max === Infinity) {
            parts.push(`Fréq. ≥${min}`);
          } else {
            parts.push(`Fréq. ${min}-${max}`);
          }
        }

        // POS restrictions
        const enabledPOS = Object.entries(activeFilters.vocabFilters.partsOfSpeech)
          .filter(([_, v]) => v)
          .map(([k]) => k);
        if (vocab && enabledPOS.length < 10 && enabledPOS.length > 0) {
          if (enabledPOS.length <= 2) {
            parts.push(enabledPOS.join(', '));
          } else {
            parts.push(`${enabledPOS.length} catégories`);
          }
        }

        // Mounce chapters
        const chapters = activeFilters.vocabFilters.mounceChapters;
        if (chapters.length > 0) {
          if (chapters.length <= 3) {
            parts.push(`Ch. ${chapters.join(', ')}`);
          } else {
            parts.push(`${chapters.length} chapitres`);
          }
        }

        return parts.length > 0 ? parts.join(' · ') : 'Toutes les cartes';
      },

      getMatchingCardCount: () => {
        // This would need to be computed asynchronously with the actual cards
        // For now, return null (will be computed in the UI layer)
        return null;
      },

      // Quick toggles
      toggleCardType: (type) => {
        const current = get().activeFilters.cardTypes[type];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            cardTypes: {
              ...state.activeFilters.cardTypes,
              [type]: !current,
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      toggleMood: (mood) => {
        const current = get().activeFilters.grammarFilters.moods[mood];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              moods: {
                ...state.activeFilters.grammarFilters.moods,
                [mood]: !current,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      toggleTense: (tense) => {
        const current = get().activeFilters.grammarFilters.tenses[tense];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              tenses: {
                ...state.activeFilters.grammarFilters.tenses,
                [tense]: !current,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      toggleVoice: (voice) => {
        const current = get().activeFilters.grammarFilters.voices[voice];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              voices: {
                ...state.activeFilters.grammarFilters.voices,
                [voice]: !current,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      toggleGrammarType: (grammarType) => {
        const current = get().activeFilters.grammarFilters.grammarTypes[grammarType];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              grammarTypes: {
                ...state.activeFilters.grammarFilters.grammarTypes,
                [grammarType]: !current,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      togglePartOfSpeech: (pos) => {
        const current = get().activeFilters.vocabFilters.partsOfSpeech[pos];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            vocabFilters: {
              ...state.activeFilters.vocabFilters,
              partsOfSpeech: {
                ...state.activeFilters.vocabFilters.partsOfSpeech,
                [pos]: !current,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setFrequencyRange: (min, max) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            vocabFilters: {
              ...state.activeFilters.vocabFilters,
              frequencyRange: { min, max },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setMounceChapters: (chapters) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            vocabFilters: {
              ...state.activeFilters.vocabFilters,
              mounceChapters: chapters,
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      toggleSRSFilter: (filter) => {
        const current = get().activeFilters.srsFilters[filter];
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            srsFilters: {
              ...state.activeFilters.srsFilters,
              [filter]: !current,
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      // Bulk operations
      setAllMoods: (enabled) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              moods: {
                indicative: enabled,
                subjunctive: enabled,
                optative: enabled,
                imperative: enabled,
                infinitive: enabled,
                participle: enabled,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setAllTenses: (enabled) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              tenses: {
                present: enabled,
                imperfect: enabled,
                future: enabled,
                aorist: enabled,
                perfect: enabled,
                pluperfect: enabled,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setAllVoices: (enabled) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              voices: {
                active: enabled,
                middle: enabled,
                passive: enabled,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setAllPartsOfSpeech: (enabled) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            vocabFilters: {
              ...state.activeFilters.vocabFilters,
              partsOfSpeech: {
                noun: enabled,
                verb: enabled,
                adjective: enabled,
                adverb: enabled,
                pronoun: enabled,
                preposition: enabled,
                conjunction: enabled,
                particle: enabled,
                article: enabled,
                other: enabled,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },

      setAllGrammarTypes: (enabled) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            grammarFilters: {
              ...state.activeFilters.grammarFilters,
              grammarTypes: {
                parsing: enabled,
                declension: enabled,
                conjugation: enabled,
                syntax: enabled,
              },
            },
          },
          isCustomMode: true,
          activePresetId: null,
        }));
      },
    }),
    {
      name: 'koine-study-filters',
      partialize: (state) => ({
        savedConfigs: state.savedConfigs,
        activeFilters: state.activeFilters,
        activePresetId: state.activePresetId,
        isCustomMode: state.isCustomMode,
      }),
    }
  )
);

// Helper function to check if a filter matches a card
export function matchesVocabFilters(
  card: { partOfSpeech: string; frequency: number; mounceChapter?: number },
  filters: StudyFilters
): boolean {
  // Part of speech check
  const posKey = normalizePartOfSpeech(card.partOfSpeech);
  if (!filters.vocabFilters.partsOfSpeech[posKey]) {
    return false;
  }

  // Frequency check
  const { min, max } = filters.vocabFilters.frequencyRange;
  if (card.frequency < min || card.frequency > max) {
    return false;
  }

  // Mounce chapter check
  const chapters = filters.vocabFilters.mounceChapters;
  if (chapters.length > 0 && card.mounceChapter) {
    if (!chapters.includes(card.mounceChapter)) {
      return false;
    }
  }

  return true;
}

export function matchesGrammarFilters(
  card: {
    type: string;
    components: {
      mood?: string;
      tense?: string;
      voice?: string;
    };
  },
  filters: StudyFilters
): boolean {
  // Grammar type check
  const typeKey = card.type as keyof typeof filters.grammarFilters.grammarTypes;
  if (!filters.grammarFilters.grammarTypes[typeKey]) {
    return false;
  }

  // Mood check (if applicable)
  if (card.components.mood) {
    const moodKey = card.components.mood as keyof typeof filters.grammarFilters.moods;
    if (!filters.grammarFilters.moods[moodKey]) {
      return false;
    }
  }

  // Tense check (if applicable)
  if (card.components.tense) {
    const tenseKey = card.components.tense as keyof typeof filters.grammarFilters.tenses;
    if (!filters.grammarFilters.tenses[tenseKey]) {
      return false;
    }
  }

  // Voice check (if applicable)
  if (card.components.voice) {
    const voiceKey = card.components.voice as keyof typeof filters.grammarFilters.voices;
    if (!filters.grammarFilters.voices[voiceKey]) {
      return false;
    }
  }

  return true;
}

export function matchesSRSFilters(
  card: { reps: number; lapses: number },
  filters: StudyFilters
): boolean {
  const { includeNew, includeLearning, includeReview, includeLeeches } = filters.srsFilters;

  // Leech check (8+ lapses)
  const isLeech = card.lapses >= 8;
  if (isLeech && !includeLeeches) {
    return false;
  }

  // New card (0 reps)
  if (card.reps === 0 && !includeNew) {
    return false;
  }

  // Learning card (1-2 reps)
  if (card.reps >= 1 && card.reps < 3 && !includeLearning) {
    return false;
  }

  // Review card (3+ reps)
  if (card.reps >= 3 && !includeReview) {
    return false;
  }

  return true;
}

function normalizePartOfSpeech(pos: string): keyof PartOfSpeechFilter {
  // Map detailed POS to filter categories
  const posLower = pos.toLowerCase();

  if (posLower.includes('pronoun')) return 'pronoun';
  if (posLower.includes('noun')) return 'noun';
  if (posLower.includes('verb')) return 'verb';
  if (posLower.includes('adjective')) return 'adjective';
  if (posLower.includes('adverb')) return 'adverb';
  if (posLower.includes('preposition')) return 'preposition';
  if (posLower.includes('conjunction')) return 'conjunction';
  if (posLower.includes('particle')) return 'particle';
  if (posLower.includes('interjection')) return 'other';
  if (posLower.includes('article')) return 'article';

  return 'other';
}
