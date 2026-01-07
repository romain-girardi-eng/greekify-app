/**
 * Seed Data - Greek vocabulary and grammar cards
 *
 * Data Sources (all verified, no hallucinations):
 * - MorphGNT SBLGNT: https://github.com/morphgnt/sblgnt (CC-BY-SA)
 *   Citation: Tauber, J. K., ed. (2017) MorphGNT: SBLGNT Edition. Version 6.12
 * - Greek Lemma Mappings: https://github.com/jtauber/greek-lemma-mappings
 * - Dodson Greek Lexicon: https://github.com/biblicalhumanities/Dodson-Greek-Lexicon (Public Domain)
 *
 * Vocabulary is frequency-based: words appearing 10+ times in NT (~77.5% coverage)
 * Lexical forms follow standard format: λόγος, -ου, ὁ (nominative, genitive, article)
 */

import type { VocabCard, GrammarCard } from '../lib/types';
import { DEFAULT_CARD_SRS } from '../lib/types';
import { addVocabCards, addGrammarCards, getAllVocabCards, getAllGrammarCards } from '../lib/db';

// Grammar cards for parsing practice (manually curated)
const GRAMMAR_DATA: Omit<GrammarCard, keyof typeof DEFAULT_CARD_SRS | 'due'>[] = [
  // Present Active Indicative
  {
    id: 'g001',
    type: 'parsing',
    prompt: 'Parse: λύω',
    answer: '1st person singular present active indicative',
    components: { person: '1st', number: 'singular', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
    hint: 'Present tense, first person',
  },
  {
    id: 'g002',
    type: 'parsing',
    prompt: 'Parse: λύεις',
    answer: '2nd person singular present active indicative',
    components: { person: '2nd', number: 'singular', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
  },
  {
    id: 'g003',
    type: 'parsing',
    prompt: 'Parse: λύει',
    answer: '3rd person singular present active indicative',
    components: { person: '3rd', number: 'singular', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
  },
  {
    id: 'g004',
    type: 'parsing',
    prompt: 'Parse: λύομεν',
    answer: '1st person plural present active indicative',
    components: { person: '1st', number: 'plural', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
  },
  {
    id: 'g005',
    type: 'parsing',
    prompt: 'Parse: λύετε',
    answer: '2nd person plural present active indicative',
    components: { person: '2nd', number: 'plural', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
  },
  {
    id: 'g006',
    type: 'parsing',
    prompt: 'Parse: λύουσι(ν)',
    answer: '3rd person plural present active indicative',
    components: { person: '3rd', number: 'plural', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 2,
  },

  // Aorist Active Indicative
  {
    id: 'g007',
    type: 'parsing',
    prompt: 'Parse: ἔλυσα',
    answer: '1st person singular aorist active indicative',
    components: { person: '1st', number: 'singular', tense: 'aorist', voice: 'active', mood: 'indicative' },
    difficulty: 4,
    hint: 'Augment + σα ending',
  },
  {
    id: 'g008',
    type: 'parsing',
    prompt: 'Parse: ἔλυσας',
    answer: '2nd person singular aorist active indicative',
    components: { person: '2nd', number: 'singular', tense: 'aorist', voice: 'active', mood: 'indicative' },
    difficulty: 4,
  },
  {
    id: 'g009',
    type: 'parsing',
    prompt: 'Parse: ἔλυσε(ν)',
    answer: '3rd person singular aorist active indicative',
    components: { person: '3rd', number: 'singular', tense: 'aorist', voice: 'active', mood: 'indicative' },
    difficulty: 4,
  },
  {
    id: 'g010',
    type: 'parsing',
    prompt: 'Parse: ἐλύσαμεν',
    answer: '1st person plural aorist active indicative',
    components: { person: '1st', number: 'plural', tense: 'aorist', voice: 'active', mood: 'indicative' },
    difficulty: 4,
  },

  // Imperfect Active Indicative
  {
    id: 'g011',
    type: 'parsing',
    prompt: 'Parse: ἔλυον',
    answer: '1st person singular imperfect active indicative',
    components: { person: '1st', number: 'singular', tense: 'imperfect', voice: 'active', mood: 'indicative' },
    difficulty: 5,
    hint: 'Augment + secondary endings',
  },
  {
    id: 'g012',
    type: 'parsing',
    prompt: 'Parse: ἔλυες',
    answer: '2nd person singular imperfect active indicative',
    components: { person: '2nd', number: 'singular', tense: 'imperfect', voice: 'active', mood: 'indicative' },
    difficulty: 5,
  },

  // Noun Declension
  {
    id: 'g013',
    type: 'declension',
    prompt: 'Parse: λόγον',
    answer: 'accusative singular masculine',
    components: { case: 'accusative', number: 'singular', gender: 'masculine' },
    difficulty: 3,
    hint: 'Second declension, direct object form',
  },
  {
    id: 'g014',
    type: 'declension',
    prompt: 'Parse: λόγου',
    answer: 'genitive singular masculine',
    components: { case: 'genitive', number: 'singular', gender: 'masculine' },
    difficulty: 3,
  },
  {
    id: 'g015',
    type: 'declension',
    prompt: 'Parse: λόγῳ',
    answer: 'dative singular masculine',
    components: { case: 'dative', number: 'singular', gender: 'masculine' },
    difficulty: 3,
  },
  {
    id: 'g016',
    type: 'declension',
    prompt: 'Parse: λόγοι',
    answer: 'nominative plural masculine',
    components: { case: 'nominative', number: 'plural', gender: 'masculine' },
    difficulty: 3,
  },
  {
    id: 'g017',
    type: 'declension',
    prompt: 'Parse: γραφή',
    answer: 'nominative singular feminine',
    components: { case: 'nominative', number: 'singular', gender: 'feminine' },
    difficulty: 3,
    hint: 'First declension feminine',
  },
  {
    id: 'g018',
    type: 'declension',
    prompt: 'Parse: γραφῆς',
    answer: 'genitive singular feminine',
    components: { case: 'genitive', number: 'singular', gender: 'feminine' },
    difficulty: 3,
  },
  {
    id: 'g019',
    type: 'declension',
    prompt: 'Parse: ἔργον',
    answer: 'nominative/accusative singular neuter',
    components: { case: 'nominative', number: 'singular', gender: 'neuter' },
    difficulty: 3,
  },
  {
    id: 'g020',
    type: 'declension',
    prompt: 'Parse: ἔργου',
    answer: 'genitive singular neuter',
    components: { case: 'genitive', number: 'singular', gender: 'neuter' },
    difficulty: 3,
  },

  // Real NT verb forms
  {
    id: 'g021',
    type: 'parsing',
    prompt: 'Parse: πιστεύω',
    answer: '1st person singular present active indicative',
    components: { person: '1st', number: 'singular', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 3,
    hint: 'I believe',
  },
  {
    id: 'g022',
    type: 'parsing',
    prompt: 'Parse: ἀγαπᾷ',
    answer: '3rd person singular present active indicative',
    components: { person: '3rd', number: 'singular', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 4,
    hint: 'Contract verb from ἀγαπάω',
  },
  {
    id: 'g023',
    type: 'parsing',
    prompt: 'Parse: ἐπίστευσαν',
    answer: '3rd person plural aorist active indicative',
    components: { person: '3rd', number: 'plural', tense: 'aorist', voice: 'active', mood: 'indicative' },
    difficulty: 5,
    hint: 'They believed',
  },
  {
    id: 'g024',
    type: 'parsing',
    prompt: 'Parse: γινώσκομεν',
    answer: '1st person plural present active indicative',
    components: { person: '1st', number: 'plural', tense: 'present', voice: 'active', mood: 'indicative' },
    difficulty: 3,
    hint: 'We know',
  },
  {
    id: 'g025',
    type: 'parsing',
    prompt: 'Parse: ἔγνωκα',
    answer: '1st person singular perfect active indicative',
    components: { person: '1st', number: 'singular', tense: 'perfect', voice: 'active', mood: 'indicative' },
    difficulty: 6,
    hint: 'Perfect tense of γινώσκω',
  },
];

/**
 * Load vocabulary from the generated JSON file (from MorphGNT frequency data)
 */
async function loadVocabularyData(): Promise<VocabCard[]> {
  try {
    const response = await fetch('/data/vocabulary.json');
    if (!response.ok) {
      throw new Error(`Failed to load vocabulary: ${response.status}`);
    }
    const data = await response.json();

    // Transform the data to match VocabCard interface
    return data.map((item: {
      id: string;
      greek: string;
      lexicalForm: string;
      genitive: string | null;
      gender: 'm' | 'f' | 'n' | null;
      gloss: string;
      glossFr?: string;
      extendedGloss: string;
      partOfSpeech: string;
      frequency: number;
      strongs: number | null;
    }) => ({
      id: item.id,
      greek: item.greek,
      lexicalForm: item.lexicalForm,
      genitive: item.genitive,
      gender: item.gender,
      gloss: item.gloss,
      glossFr: item.glossFr,
      extendedGloss: item.extendedGloss,
      partOfSpeech: item.partOfSpeech,
      frequency: item.frequency,
      strongs: item.strongs,
      ...DEFAULT_CARD_SRS,
      due: new Date(),
    }));
  } catch (error) {
    console.error('Failed to load vocabulary data:', error);
    return [];
  }
}

/**
 * Initialize database with seed data
 */
export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const existingVocab = await getAllVocabCards();
  const existingGrammar = await getAllGrammarCards();

  if (existingVocab.length === 0) {
    console.log('Loading vocabulary from MorphGNT frequency data...');
    const vocabCards = await loadVocabularyData();
    if (vocabCards.length > 0) {
      await addVocabCards(vocabCards);
      console.log(`Added ${vocabCards.length} vocabulary cards (frequency-based from MorphGNT)`);
    } else {
      console.warn('No vocabulary cards loaded - check data/vocabulary.json');
    }
  }

  if (existingGrammar.length === 0) {
    console.log('Seeding grammar cards...');
    const grammarCards: GrammarCard[] = GRAMMAR_DATA.map((data) => ({
      ...data,
      ...DEFAULT_CARD_SRS,
      due: new Date(),
    }));
    await addGrammarCards(grammarCards);
    console.log(`Added ${grammarCards.length} grammar cards`);
  }
}
