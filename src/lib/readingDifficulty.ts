/**
 * Reading Difficulty - Algorithm for calculating passage difficulty
 * Based on user's known vocabulary, word frequency, and syntax complexity
 */

import type { PassageDifficulty, NTPassage, Token } from './types';
import type { VocabCard } from './types';

// NT word frequency data (approximate occurrences in NT)
// Based on standard NT vocabulary frequency lists
const FREQUENCY_THRESHOLDS = {
  veryCommon: 500,    // Words appearing 500+ times
  common: 100,        // Words appearing 100-499 times
  intermediate: 50,   // Words appearing 50-99 times
  uncommon: 20,       // Words appearing 20-49 times
  rare: 10,           // Words appearing 10-19 times
  veryRare: 1,        // Words appearing 1-9 times
};

// Syntax complexity factors
const SYNTAX_COMPLEXITY_WEIGHTS = {
  // Moods (higher = more complex)
  indicative: 1,
  imperative: 1.5,
  subjunctive: 2,
  optative: 2.5,
  infinitive: 1.8,
  participle: 2.2,

  // Tenses
  present: 1,
  imperfect: 1.3,
  future: 1.2,
  aorist: 1.5,
  perfect: 1.7,
  pluperfect: 2,

  // Cases (for nouns)
  nominative: 1,
  accusative: 1.2,
  genitive: 1.5,
  dative: 1.6,
  vocative: 1.1,
};

/**
 * Calculate the difficulty score for a passage
 */
export function calculatePassageDifficulty(
  passage: NTPassage,
  knownLemmas: Set<string>,
  vocabCards?: VocabCard[]
): PassageDifficulty {
  const tokens = passage.tokens;

  if (tokens.length === 0) {
    return {
      score: 1,
      knownVocabPercent: 100,
      avgWordFrequency: 0,
      syntaxComplexity: 1,
      recommendedLevel: 'beginner',
    };
  }

  // Calculate known vocabulary percentage
  const uniqueLemmas = new Set(tokens.map(t => t.lemma));
  const knownCount = [...uniqueLemmas].filter(lemma => knownLemmas.has(lemma)).length;
  const knownVocabPercent = Math.round((knownCount / uniqueLemmas.size) * 100);

  // Calculate average word frequency
  const frequencies = tokens.map(t => t.frequency || 1);
  const avgWordFrequency = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;

  // Calculate syntax complexity
  const syntaxComplexity = calculateSyntaxComplexity(tokens);

  // Calculate overall difficulty score (1-10)
  const score = calculateOverallScore(knownVocabPercent, avgWordFrequency, syntaxComplexity);

  // Determine recommended level
  const recommendedLevel = getRecommendedLevel(score, knownVocabPercent);

  return {
    score,
    knownVocabPercent,
    avgWordFrequency: Math.round(avgWordFrequency),
    syntaxComplexity: Math.round(syntaxComplexity * 10) / 10,
    recommendedLevel,
  };
}

/**
 * Calculate syntax complexity based on grammatical features
 */
function calculateSyntaxComplexity(tokens: Token[]): number {
  if (tokens.length === 0) return 1;

  let totalComplexity = 0;
  let verbCount = 0;
  let nounCount = 0;

  for (const token of tokens) {
    if (!token.parsing) continue;

    const parsing = token.parsing.toLowerCase();

    // Check for verb forms
    if (parsing.includes('verb') || token.partOfSpeech === 'verb') {
      verbCount++;

      // Mood complexity
      if (parsing.includes('indicative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.indicative;
      else if (parsing.includes('subjunctive')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.subjunctive;
      else if (parsing.includes('imperative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.imperative;
      else if (parsing.includes('optative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.optative;
      else if (parsing.includes('infinitive')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.infinitive;
      else if (parsing.includes('participle')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.participle;

      // Tense complexity
      if (parsing.includes('present')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.present;
      else if (parsing.includes('imperfect')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.imperfect;
      else if (parsing.includes('future')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.future;
      else if (parsing.includes('aorist')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.aorist;
      else if (parsing.includes('perfect')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.perfect;
      else if (parsing.includes('pluperfect')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.pluperfect;
    }

    // Check for noun cases
    if (parsing.includes('noun') || token.partOfSpeech === 'noun') {
      nounCount++;

      if (parsing.includes('nominative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.nominative;
      else if (parsing.includes('accusative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.accusative;
      else if (parsing.includes('genitive')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.genitive;
      else if (parsing.includes('dative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.dative;
      else if (parsing.includes('vocative')) totalComplexity += SYNTAX_COMPLEXITY_WEIGHTS.vocative;
    }
  }

  const grammaticalTokens = verbCount + nounCount;
  if (grammaticalTokens === 0) return 1;

  return totalComplexity / grammaticalTokens;
}

/**
 * Calculate overall difficulty score (1-10)
 */
function calculateOverallScore(
  knownVocabPercent: number,
  avgFrequency: number,
  syntaxComplexity: number
): number {
  // Vocabulary contribution (40% of score)
  // Lower known % = higher difficulty
  const vocabScore = (100 - knownVocabPercent) / 10;

  // Frequency contribution (30% of score)
  // Lower average frequency = higher difficulty
  let freqScore: number;
  if (avgFrequency >= FREQUENCY_THRESHOLDS.veryCommon) freqScore = 1;
  else if (avgFrequency >= FREQUENCY_THRESHOLDS.common) freqScore = 2;
  else if (avgFrequency >= FREQUENCY_THRESHOLDS.intermediate) freqScore = 4;
  else if (avgFrequency >= FREQUENCY_THRESHOLDS.uncommon) freqScore = 6;
  else if (avgFrequency >= FREQUENCY_THRESHOLDS.rare) freqScore = 8;
  else freqScore = 10;

  // Syntax contribution (30% of score)
  // Normalize complexity to 1-10 range
  const syntaxScore = Math.min(10, Math.max(1, (syntaxComplexity - 1) * 3 + 1));

  // Weighted average
  const rawScore = (vocabScore * 0.4) + (freqScore * 0.3) + (syntaxScore * 0.3);

  // Clamp to 1-10 range
  return Math.round(Math.max(1, Math.min(10, rawScore)) * 10) / 10;
}

/**
 * Determine recommended level based on score and vocab knowledge
 */
function getRecommendedLevel(
  score: number,
  knownVocabPercent: number
): 'beginner' | 'intermediate' | 'advanced' {
  // Primarily based on vocabulary knowledge
  if (knownVocabPercent >= 80 || score <= 3) {
    return 'beginner';
  } else if (knownVocabPercent >= 50 || score <= 6) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Get suggested scaffolding mode based on difficulty
 */
export function getSuggestedScaffoldingMode(
  difficulty: PassageDifficulty
): 'full-gloss' | 'unknown-only' | 'hints' | 'interlinear' | 'pure' {
  if (difficulty.knownVocabPercent >= 95) {
    return 'pure';
  } else if (difficulty.knownVocabPercent >= 85) {
    return 'hints';
  } else if (difficulty.knownVocabPercent >= 70) {
    return 'unknown-only';
  } else if (difficulty.knownVocabPercent >= 50) {
    return 'full-gloss';
  } else {
    return 'interlinear';
  }
}

/**
 * Calculate difficulty for multiple passages and sort by difficulty
 */
export function rankPassagesByDifficulty(
  passages: NTPassage[],
  knownLemmas: Set<string>
): Array<{ passage: NTPassage; difficulty: PassageDifficulty }> {
  const ranked = passages.map(passage => ({
    passage,
    difficulty: calculatePassageDifficulty(passage, knownLemmas),
  }));

  // Sort by score (ascending - easiest first)
  ranked.sort((a, b) => a.difficulty.score - b.difficulty.score);

  return ranked;
}

/**
 * Get recommended passages for a user based on their vocabulary knowledge
 */
export function getRecommendedPassages(
  passages: NTPassage[],
  knownLemmas: Set<string>,
  targetDifficulty: 'easy' | 'moderate' | 'challenging' = 'moderate'
): NTPassage[] {
  const ranked = rankPassagesByDifficulty(passages, knownLemmas);

  // Target score ranges
  const ranges = {
    easy: { min: 1, max: 3.5 },
    moderate: { min: 3.5, max: 6.5 },
    challenging: { min: 6.5, max: 10 },
  };

  const { min, max } = ranges[targetDifficulty];

  return ranked
    .filter(r => r.difficulty.score >= min && r.difficulty.score <= max)
    .map(r => r.passage);
}

/**
 * Analyze a passage and return detailed statistics
 */
export function analyzePassage(
  passage: NTPassage,
  knownLemmas: Set<string>,
  vocabCards?: VocabCard[]
): {
  difficulty: PassageDifficulty;
  unknownWords: Array<{ lemma: string; gloss: string; frequency: number }>;
  verbForms: Array<{ form: string; parsing: string }>;
  wordCount: number;
  uniqueWords: number;
} {
  const difficulty = calculatePassageDifficulty(passage, knownLemmas, vocabCards);

  // Find unknown words
  const unknownWords: Array<{ lemma: string; gloss: string; frequency: number }> = [];
  const seenLemmas = new Set<string>();

  for (const token of passage.tokens) {
    if (!knownLemmas.has(token.lemma) && !seenLemmas.has(token.lemma)) {
      seenLemmas.add(token.lemma);
      unknownWords.push({
        lemma: token.lemma,
        gloss: token.gloss,
        frequency: token.frequency || 1,
      });
    }
  }

  // Sort unknown words by frequency (most common first - easier to learn)
  unknownWords.sort((a, b) => b.frequency - a.frequency);

  // Find verb forms for grammar practice
  const verbForms = passage.tokens
    .filter(t => t.partOfSpeech === 'verb' && t.parsing)
    .map(t => ({
      form: t.text,
      parsing: t.parsing!,
    }));

  return {
    difficulty,
    unknownWords,
    verbForms,
    wordCount: passage.tokens.length,
    uniqueWords: new Set(passage.tokens.map(t => t.lemma)).size,
  };
}

/**
 * Estimate reading time based on difficulty and word count
 */
export function estimateReadingTime(
  passage: NTPassage,
  difficulty: PassageDifficulty,
  baseWordsPerMinute: number = 30 // Base rate for Greek reading
): number {
  const wordCount = passage.tokens.length;

  // Adjust WPM based on difficulty
  const difficultyMultiplier = 1 + (difficulty.score - 1) * 0.15;
  const adjustedWPM = baseWordsPerMinute / difficultyMultiplier;

  // Calculate minutes, round up
  return Math.ceil(wordCount / adjustedWPM);
}

export default {
  calculatePassageDifficulty,
  getSuggestedScaffoldingMode,
  rankPassagesByDifficulty,
  getRecommendedPassages,
  analyzePassage,
  estimateReadingTime,
};
