// Core card types for the SRS system

export interface CardSRS {
  due: Date;
  interval: number; // days until next review
  easeFactor: number; // multiplier for interval (starts at 2.5)
  reps: number; // successful repetitions
  lapses: number; // times failed after learning
  lastReview?: Date;
}

export interface VocabCard extends CardSRS {
  id: string;
  greek: string; // λόγος
  lexicalForm: string; // λόγος, -ου, ὁ (full dictionary entry format)
  genitive?: string | null; // -ου (genitive ending for nouns)
  gender?: 'm' | 'f' | 'n' | null; // grammatical gender
  gloss: string; // word, message, reason (English)
  glossFr?: string; // French gloss
  extendedGloss?: string; // fuller definition
  partOfSpeech: PartOfSpeech;
  frequency: number; // NT occurrences (from MorphGNT)
  strongs?: number | null; // Strong's number for reference
  mounceChapter?: number; // textbook reference
  principalParts?: string[]; // for verbs
  relatedWords?: string[]; // cognates
  exampleVerse?: string; // John 1:1
  imageUrl?: string; // for dual coding
}

export interface GrammarCard extends CardSRS {
  id: string;
  type: GrammarType;
  prompt: string; // "Parse: ἔλυσεν"
  answer: string; // "3rd person singular aorist active indicative"
  components: MorphologyComponents;
  hint?: string;
  difficulty: number; // 1-10
}

export interface NTVerse {
  id: string; // "John.3.16"
  book: string;
  chapter: number;
  verse: number;
  greek: string; // Full verse in Greek
  tokens: Token[];
  difficulty: number; // 1-10 based on vocab/syntax complexity
}

export interface Token {
  surface: string; // actual word form
  lemma: string; // dictionary form
  morphology: MorphologyComponents;
  gloss: string;
  strongsNumber?: string;
}

export interface MorphologyComponents {
  person?: '1st' | '2nd' | '3rd';
  number?: 'singular' | 'plural';
  tense?: 'present' | 'imperfect' | 'future' | 'aorist' | 'perfect' | 'pluperfect';
  voice?: 'active' | 'middle' | 'passive';
  mood?: 'indicative' | 'subjunctive' | 'optative' | 'imperative' | 'infinitive' | 'participle';
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'vocative';
  gender?: 'masculine' | 'feminine' | 'neuter';
}

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'personal pronoun'
  | 'demonstrative pronoun'
  | 'interrogative pronoun'
  | 'relative pronoun'
  | 'preposition'
  | 'conjunction'
  | 'particle'
  | 'interjection'
  | 'article'
  | 'other';

export type GrammarType =
  | 'parsing'
  | 'declension'
  | 'conjugation'
  | 'syntax';

export type StudyCard =
  | { type: 'vocab'; card: VocabCard }
  | { type: 'grammar'; card: GrammarCard }
  | { type: 'verse'; verse: NTVerse; highlightedWord: string };

export type ReviewQuality = 1 | 2 | 3 | 4; // 1=again, 2=hard, 3=good, 4=easy

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: number;
  correctCount: number;
  newCardsLearned: number;
  reviewsCompleted: number;
}

export interface UserProgress {
  streak: number;
  lastStudyDate: string; // ISO date
  totalCardsLearned: number;
  totalReviews: number;
  totalStudyTime: number; // minutes
  xp: number;
  level: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number; // 0-100 for progressive achievements
  target?: number;
}

export interface Settings {
  newCardsPerDay: number;
  reviewsPerDay: number;
  cardOrder: 'due' | 'random' | 'difficulty';
  showHints: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // ms
  interleaveRatio: {
    vocab: number;
    grammar: number;
    verse: number;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  cardOrder: 'due',
  showHints: true,
  autoAdvance: false,
  autoAdvanceDelay: 1500,
  interleaveRatio: {
    vocab: 0.6,
    grammar: 0.3,
    verse: 0.1,
  },
};

export const DEFAULT_CARD_SRS: Omit<CardSRS, 'due'> = {
  interval: 0,
  easeFactor: 2.5,
  reps: 0,
  lapses: 0,
};

// ============================================
// STUDY FILTERS - Advanced Personalization
// ============================================

export interface MoodFilter {
  indicative: boolean;
  subjunctive: boolean;
  optative: boolean;
  imperative: boolean;
  infinitive: boolean;
  participle: boolean;
}

export interface TenseFilter {
  present: boolean;
  imperfect: boolean;
  future: boolean;
  aorist: boolean;
  perfect: boolean;
  pluperfect: boolean;
}

export interface VoiceFilter {
  active: boolean;
  middle: boolean;
  passive: boolean;
}

export interface GrammarTypeFilter {
  parsing: boolean;
  declension: boolean;
  conjugation: boolean;
  syntax: boolean;
}

export interface PartOfSpeechFilter {
  noun: boolean;
  verb: boolean;
  adjective: boolean;
  adverb: boolean;
  pronoun: boolean;
  preposition: boolean;
  conjunction: boolean;
  particle: boolean;
  article: boolean;
  other: boolean;
}

export interface FrequencyRange {
  min: number;
  max: number; // Use Infinity for no upper limit
}

export interface SRSStatusFilter {
  includeNew: boolean;
  includeLearning: boolean;
  includeReview: boolean;
  includeLeeches: boolean;
}

export interface StudyFilters {
  // Card type selection
  cardTypes: {
    vocab: boolean;
    grammar: boolean;
    verse: boolean;
  };

  // Grammar-specific filters
  grammarFilters: {
    moods: MoodFilter;
    tenses: TenseFilter;
    voices: VoiceFilter;
    grammarTypes: GrammarTypeFilter;
  };

  // Vocabulary-specific filters
  vocabFilters: {
    partsOfSpeech: PartOfSpeechFilter;
    frequencyRange: FrequencyRange;
    mounceChapters: number[]; // Empty array = all chapters
  };

  // SRS status filters
  srsFilters: SRSStatusFilter;
}

export interface StudyPreset {
  id: string;
  name: string;
  nameKey: string; // i18n key
  description: string;
  descriptionKey: string; // i18n key
  icon: string; // Lucide icon name
  filters: StudyFilters;
  isBuiltIn: boolean;
}

export interface SavedFilterConfig {
  id: string;
  name: string;
  filters: StudyFilters;
  createdAt: Date;
  lastUsedAt: Date;
}

// Default filter values - ALL enabled
export const DEFAULT_MOOD_FILTER: MoodFilter = {
  indicative: true,
  subjunctive: true,
  optative: true,
  imperative: true,
  infinitive: true,
  participle: true,
};

export const DEFAULT_TENSE_FILTER: TenseFilter = {
  present: true,
  imperfect: true,
  future: true,
  aorist: true,
  perfect: true,
  pluperfect: true,
};

export const DEFAULT_VOICE_FILTER: VoiceFilter = {
  active: true,
  middle: true,
  passive: true,
};

export const DEFAULT_GRAMMAR_TYPE_FILTER: GrammarTypeFilter = {
  parsing: true,
  declension: true,
  conjugation: true,
  syntax: true,
};

export const DEFAULT_POS_FILTER: PartOfSpeechFilter = {
  noun: true,
  verb: true,
  adjective: true,
  adverb: true,
  pronoun: true,
  preposition: true,
  conjunction: true,
  particle: true,
  article: true,
  other: true,
};

export const DEFAULT_SRS_FILTER: SRSStatusFilter = {
  includeNew: true,
  includeLearning: true,
  includeReview: true,
  includeLeeches: true,
};

export const DEFAULT_STUDY_FILTERS: StudyFilters = {
  cardTypes: {
    vocab: true,
    grammar: true,
    verse: true,
  },
  grammarFilters: {
    moods: DEFAULT_MOOD_FILTER,
    tenses: DEFAULT_TENSE_FILTER,
    voices: DEFAULT_VOICE_FILTER,
    grammarTypes: DEFAULT_GRAMMAR_TYPE_FILTER,
  },
  vocabFilters: {
    partsOfSpeech: DEFAULT_POS_FILTER,
    frequencyRange: { min: 0, max: Infinity },
    mounceChapters: [], // Empty = all
  },
  srsFilters: DEFAULT_SRS_FILTER,
};

// Built-in presets for common study modes
export const BUILT_IN_PRESETS: StudyPreset[] = [
  {
    id: 'all',
    name: 'Full Study',
    nameKey: 'preset_full_study',
    description: 'All cards, all categories',
    descriptionKey: 'preset_full_study_desc',
    icon: 'Layers',
    filters: DEFAULT_STUDY_FILTERS,
    isBuiltIn: true,
  },
  {
    id: 'vocab-only',
    name: 'Vocabulary Only',
    nameKey: 'preset_vocab_only',
    description: 'Focus on vocabulary, no grammar',
    descriptionKey: 'preset_vocab_only_desc',
    icon: 'BookOpen',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: true, grammar: false, verse: false },
    },
    isBuiltIn: true,
  },
  {
    id: 'grammar-only',
    name: 'Grammar Only',
    nameKey: 'preset_grammar_only',
    description: 'Focus on parsing and grammar',
    descriptionKey: 'preset_grammar_only_desc',
    icon: 'FileText',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: false, grammar: true, verse: false },
    },
    isBuiltIn: true,
  },
  {
    id: 'indicative-only',
    name: 'Indicative Mood',
    nameKey: 'preset_indicative',
    description: 'Grammar: indicative mood only',
    descriptionKey: 'preset_indicative_desc',
    icon: 'Target',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: false, grammar: true, verse: false },
      grammarFilters: {
        ...DEFAULT_STUDY_FILTERS.grammarFilters,
        moods: {
          indicative: true,
          subjunctive: false,
          optative: false,
          imperative: false,
          infinitive: false,
          participle: false,
        },
      },
    },
    isBuiltIn: true,
  },
  {
    id: 'high-frequency',
    name: 'High Frequency',
    nameKey: 'preset_high_freq',
    description: 'Words appearing 50+ times in NT',
    descriptionKey: 'preset_high_freq_desc',
    icon: 'TrendingUp',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: true, grammar: false, verse: false },
      vocabFilters: {
        ...DEFAULT_STUDY_FILTERS.vocabFilters,
        frequencyRange: { min: 50, max: Infinity },
      },
    },
    isBuiltIn: true,
  },
  {
    id: 'nouns-only',
    name: 'Nouns Only',
    nameKey: 'preset_nouns',
    description: 'Study noun vocabulary',
    descriptionKey: 'preset_nouns_desc',
    icon: 'Box',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: true, grammar: false, verse: false },
      vocabFilters: {
        ...DEFAULT_STUDY_FILTERS.vocabFilters,
        partsOfSpeech: {
          noun: true,
          verb: false,
          adjective: false,
          adverb: false,
          pronoun: false,
          preposition: false,
          conjunction: false,
          particle: false,
          article: false,
          other: false,
        },
      },
    },
    isBuiltIn: true,
  },
  {
    id: 'verbs-only',
    name: 'Verbs Only',
    nameKey: 'preset_verbs',
    description: 'Study verb vocabulary',
    descriptionKey: 'preset_verbs_desc',
    icon: 'Zap',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: true, grammar: false, verse: false },
      vocabFilters: {
        ...DEFAULT_STUDY_FILTERS.vocabFilters,
        partsOfSpeech: {
          noun: false,
          verb: true,
          adjective: false,
          adverb: false,
          pronoun: false,
          preposition: false,
          conjunction: false,
          particle: false,
          article: false,
          other: false,
        },
      },
    },
    isBuiltIn: true,
  },
  {
    id: 'aorist-tense',
    name: 'Aorist Tense',
    nameKey: 'preset_aorist',
    description: 'Grammar: aorist tense only',
    descriptionKey: 'preset_aorist_desc',
    icon: 'Clock',
    filters: {
      ...DEFAULT_STUDY_FILTERS,
      cardTypes: { vocab: false, grammar: true, verse: false },
      grammarFilters: {
        ...DEFAULT_STUDY_FILTERS.grammarFilters,
        tenses: {
          present: false,
          imperfect: false,
          future: false,
          aorist: true,
          perfect: false,
          pluperfect: false,
        },
      },
    },
    isBuiltIn: true,
  },
];

// ============================================
// VERSE MEMORIZATION - New Card Type
// ============================================

export type MemorizationStage =
  | 'exposure'      // Read verse with translation
  | 'cloze-easy'    // Hide 1-2 words
  | 'cloze-hard'    // Hide 3-5 words
  | 'first-letters' // Show only first letter of each word
  | 'full-recall';  // Type/recite entire verse

export interface VerseMemorizationCard extends CardSRS {
  id: string;
  reference: string;           // "John.3.16"
  greekText: string;
  tokens: Token[];
  translationEn: string;
  translationFr?: string;
  clozePositions: number[];    // Indices of words to hide
  memorizationLevel: 1 | 2 | 3 | 4 | 5; // Maps to MemorizationStage
  collectionId?: string;       // Which collection this belongs to
}

export interface VerseCollection {
  id: string;
  name: string;
  nameKey?: string;            // i18n key
  description?: string;
  verses: string[];            // Array of verse references
  isBuiltIn: boolean;
  createdAt?: Date;
}

export const BUILT_IN_VERSE_COLLECTIONS: VerseCollection[] = [
  {
    id: 'john-key-verses',
    name: 'Versets clés de Jean',
    nameKey: 'collection_john_key',
    description: 'Key verses from the Gospel of John',
    verses: ['John.1.1', 'John.1.14', 'John.3.16', 'John.14.6', 'John.20.31'],
    isBuiltIn: true,
  },
  {
    id: 'romans-road',
    name: 'Romains Road',
    nameKey: 'collection_romans_road',
    description: 'The path of salvation in Romans',
    verses: ['Rom.3.23', 'Rom.6.23', 'Rom.5.8', 'Rom.10.9', 'Rom.10.13'],
    isBuiltIn: true,
  },
  {
    id: 'beatitudes',
    name: 'Les Béatitudes',
    nameKey: 'collection_beatitudes',
    description: 'The Beatitudes from Matthew 5',
    verses: ['Matt.5.3', 'Matt.5.4', 'Matt.5.5', 'Matt.5.6', 'Matt.5.7', 'Matt.5.8', 'Matt.5.9', 'Matt.5.10'],
    isBuiltIn: true,
  },
  {
    id: 'lords-prayer',
    name: 'Notre Père',
    nameKey: 'collection_lords_prayer',
    description: "The Lord's Prayer",
    verses: ['Matt.6.9', 'Matt.6.10', 'Matt.6.11', 'Matt.6.12', 'Matt.6.13'],
    isBuiltIn: true,
  },
];

// ============================================
// READING PROGRESS - Adaptive Reader
// ============================================

export type ScaffoldingMode =
  | 'full-gloss'     // All words have hover glosses
  | 'unknown-only'   // Only unknown words show glosses
  | 'hints'          // First letter hints for unknown words
  | 'interlinear'    // Greek + English line by line
  | 'pure';          // No assistance

export interface PassageDifficulty {
  score: number;                    // 1-10
  knownVocabPercent: number;        // % of words user knows
  unknownWords: string[];           // Lemmas user doesn't know
  avgWordFrequency: number;         // Mean NT frequency
  syntaxComplexity: number;         // Based on clause structure
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface ReadingProgress {
  passageId: string;              // "John.1.1-18"
  firstReadAt: Date;
  lastReadAt: Date;
  completedAt?: Date;
  comprehensionScore?: number;    // Self-reported 1-5
  timeSpent: number;              // Total seconds
  scaffoldingUsed: ScaffoldingMode;
  wordsLookedUp: string[];        // Lemmas user clicked for gloss
}

export interface NTPassage {
  id: string;                     // "John.1.1-18"
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  title: string;
  titleKey?: string;              // i18n key
  verses: NTVerse[];
  difficulty: PassageDifficulty;
  recommendedOrder: number;       // Sequence in curriculum
}
