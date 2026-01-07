#!/usr/bin/env node
/**
 * Generate vocabulary JSON from official Biblical Greek sources:
 *
 * Data sources:
 * - MorphGNT SBLGNT: https://github.com/morphgnt/sblgnt (CC-BY-SA)
 *   Citation: Tauber, J. K., ed. (2017) MorphGNT: SBLGNT Edition. Version 6.12
 *
 * - Greek Lemma Mappings: https://github.com/jtauber/greek-lemma-mappings
 *   Full citation forms from BDAG, Danker, Dodson, Mounce, Abbott-Smith
 *
 * - Dodson Greek Lexicon: https://github.com/biblicalhumanities/Dodson-Greek-Lexicon (Public Domain)
 *   Glosses from Abbott-Smith, Berry, Souter, Strong's
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Read MorphGNT data and count lemma frequencies
const morphgntPath = path.join(__dirname, '../public/data/morphgnt-all.txt');
const morphgntData = fs.readFileSync(morphgntPath, 'utf-8');

const lemmaFrequency = new Map();
const lemmaPartsOfSpeech = new Map();

morphgntData.split('\n').forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(' ');
  if (parts.length >= 7) {
    const pos = parts[1];
    const lemma = parts[6];
    lemmaFrequency.set(lemma, (lemmaFrequency.get(lemma) || 0) + 1);
    if (!lemmaPartsOfSpeech.has(lemma)) {
      lemmaPartsOfSpeech.set(lemma, pos);
    }
  }
});

// Read lexemes.yaml for citation forms
const lexemesPath = path.join(__dirname, '../public/data/lexemes.yaml');
const lexemesData = fs.readFileSync(lexemesPath, 'utf-8');
const lexemes = yaml.parse(lexemesData);

// Read Dodson lexicon for glosses
const dodsonPath = path.join(__dirname, '../public/data/dodson-lexicon.csv');
const dodsonData = fs.readFileSync(dodsonPath, 'utf-8');

// Build Strongs -> Gloss mapping from Dodson
const strongsGlosses = new Map();
dodsonData.split('\n').slice(1).forEach(line => {
  if (!line.trim()) return;
  const parts = line.split('\t').map(s => s.replace(/^"|"$/g, ''));
  if (parts.length >= 5) {
    const strongsNum = parseInt(parts[0], 10);
    strongsGlosses.set(strongsNum, {
      brief: parts[3],
      extended: parts[4]
    });
  }
});

// Map part of speech codes
function mapPartOfSpeech(code) {
  const posMap = {
    'N-': 'noun',
    'V-': 'verb',
    'A-': 'adjective',
    'D-': 'adverb',
    'RA': 'article',
    'RD': 'demonstrative pronoun',
    'RI': 'interrogative pronoun',
    'RP': 'personal pronoun',
    'RR': 'relative pronoun',
    'C-': 'conjunction',
    'P-': 'preposition',
    'X-': 'particle',
    'I-': 'interjection'
  };
  return posMap[code] || 'other';
}

// Parse citation form to extract genitive and gender
function parseCitationForm(fullForm, lemma) {
  if (!fullForm) return { genitive: null, gender: null, article: null };

  // Examples:
  // "ἀδελφός, οῦ, ὁ" -> genitive: "-οῦ", gender: "m", article: "ὁ"
  // "ἀγάπη, ης, ἡ" -> genitive: "-ης", gender: "f", article: "ἡ"
  // "ἔργον, ου, τό" -> genitive: "-ου", gender: "n", article: "τό"
  // "ἀγαθός, ή, όν" -> adjective, no article
  // "λέγω" -> verb, no genitive

  const parts = fullForm.split(',').map(p => p.trim());

  let genitive = null;
  let gender = null;
  let article = null;

  if (parts.length >= 2) {
    // Second part is usually genitive ending
    const genPart = parts[1].trim();
    if (genPart && !['ὁ', 'ἡ', 'τό', 'ή', 'όν', 'ές'].includes(genPart)) {
      genitive = genPart.startsWith('-') ? genPart : '-' + genPart;
    }
  }

  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart === 'ὁ') {
      gender = 'm';
      article = 'ὁ';
    } else if (lastPart === 'ἡ') {
      gender = 'f';
      article = 'ἡ';
    } else if (lastPart === 'τό') {
      gender = 'n';
      article = 'τό';
    }
  }

  return { genitive, gender, article };
}

// Sort lemmas by frequency (descending)
const sortedLemmas = [...lemmaFrequency.entries()]
  .sort((a, b) => b[1] - a[1]);

console.log(`Total unique lemmas: ${sortedLemmas.length}`);
console.log(`Total word tokens: ${[...lemmaFrequency.values()].reduce((a, b) => a + b, 0)}`);
console.log(`Lexemes in YAML: ${Object.keys(lexemes).length}`);
console.log(`Entries in Dodson: ${strongsGlosses.size}`);

// Generate vocabulary entries
const vocabEntries = [];

sortedLemmas.forEach(([lemma, frequency]) => {
  if (frequency < 10) return; // Skip words appearing < 10 times

  // Skip the article
  if (lemma === 'ὁ') return;

  const pos = lemmaPartsOfSpeech.get(lemma);
  const partOfSpeech = mapPartOfSpeech(pos);

  // Look up in lexemes.yaml (try variations)
  let lexemeEntry = lexemes[lemma];
  if (!lexemeEntry) {
    // Try without final sigma variation
    const altLemma = lemma.replace(/ς$/, 'σ');
    lexemeEntry = lexemes[altLemma];
  }
  if (!lexemeEntry) {
    // Try with different accent
    for (const key of Object.keys(lexemes)) {
      if (key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
          lemma.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
        lexemeEntry = lexemes[key];
        break;
      }
    }
  }

  // Get citation form and parse it
  let fullCitationForm = lexemeEntry?.['full-citation-form'] || lexemeEntry?.['danker-entry'] || lemma;
  const { genitive, gender, article } = parseCitationForm(fullCitationForm, lemma);

  // Get Strong's number for gloss lookup
  let gloss = '';
  let extendedGloss = '';
  if (lexemeEntry?.strongs) {
    const strongsNum = parseInt(lexemeEntry.strongs, 10);
    const glossEntry = strongsGlosses.get(strongsNum);
    if (glossEntry) {
      gloss = glossEntry.brief;
      extendedGloss = glossEntry.extended;
    }
  }

  // Fallback to part of speech if no gloss found
  if (!gloss) {
    gloss = `[${partOfSpeech}]`;
  }

  // Build lexical form string: "λόγος, -ου, ὁ" format
  let lexicalForm = lemma;
  if (genitive && article) {
    lexicalForm = `${lemma}, ${genitive}, ${article}`;
  } else if (genitive) {
    lexicalForm = `${lemma}, ${genitive}`;
  }

  vocabEntries.push({
    id: `vocab-${lemma.replace(/[^α-ωά-ώἀ-ῷ]/gi, '')}`,
    greek: lemma,
    lexicalForm,
    genitive,
    gender,
    gloss,
    extendedGloss,
    partOfSpeech,
    frequency,
    strongs: lexemeEntry?.strongs ? parseInt(lexemeEntry.strongs, 10) : null,
    // SRS defaults
    due: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0
  });
});

// Sort by frequency
vocabEntries.sort((a, b) => b.frequency - a.frequency);

// Stats
const withGloss = vocabEntries.filter(e => !e.gloss.startsWith('[')).length;
const withGenitive = vocabEntries.filter(e => e.genitive).length;
console.log(`\nGenerated ${vocabEntries.length} vocabulary entries (freq >= 10)`);
console.log(`  With gloss: ${withGloss} (${(withGloss/vocabEntries.length*100).toFixed(1)}%)`);
console.log(`  With genitive: ${withGenitive} (${(withGenitive/vocabEntries.length*100).toFixed(1)}%)`);

// Show some examples
console.log('\nExample entries:');
vocabEntries.slice(0, 10).forEach(e => {
  console.log(`  ${e.lexicalForm} (${e.frequency}x) - ${e.gloss}`);
});

// Find nouns to show lexical form examples
console.log('\nNoun examples with full lexical forms:');
vocabEntries.filter(e => e.partOfSpeech === 'noun' && e.genitive).slice(0, 10).forEach(e => {
  console.log(`  ${e.lexicalForm} (${e.frequency}x) - ${e.gloss}`);
});

// Write to JSON
const outputPath = path.join(__dirname, '../public/data/vocabulary.json');
fs.writeFileSync(outputPath, JSON.stringify(vocabEntries, null, 2), 'utf-8');
console.log(`\nWritten to ${outputPath}`);

// Coverage stats
const coverage = vocabEntries.reduce((sum, e) => sum + e.frequency, 0);
const total = [...lemmaFrequency.values()].reduce((a, b) => a + b, 0);
console.log(`Coverage: ${coverage}/${total} tokens (${(coverage/total*100).toFixed(1)}%)`);
