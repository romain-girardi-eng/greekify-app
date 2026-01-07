#!/usr/bin/env node
/**
 * Enhance vocabulary:
 * 1. Add French translations for remaining words
 * 2. Create case-specific cards for prepositions
 */

const fs = require('fs');
const path = require('path');

// Read vocabulary
const vocabPath = path.join(__dirname, '../public/data/vocabulary.json');
const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

console.log(`Loaded ${vocabulary.length} vocabulary entries`);

// 1. Add missing French translations
const missingTranslations = {
  'οὕτω(ς)': 'ainsi, de cette manière',
  'οὕτως': 'ainsi, de cette manière',
  'φοβέομαι': 'craindre, avoir peur',
  'ἔξεστι(ν)': 'il est permis',
  'ἔξεστιν': 'il est permis',
  'προσκαλέομαι': 'appeler à soi, convoquer',
  'ἕνεκεν': 'à cause de',
  'μέχρι(ς)': 'jusqu\'à',
  'μέχρις': 'jusqu\'à',
  'μέχρι': 'jusqu\'à',
  'κοιμάομαι': 'dormir, s\'endormir',
  'ὠφελέω': 'être utile, profiter à',
  'ἐντέλλομαι': 'ordonner, commander',
  'ὀψία': 'soir',
  'ἀφίσταμαι': 's\'éloigner, se retirer, apostasier',
  'ἐκπλήσσομαι': 'être frappé d\'étonnement',
  'προσλαμβάνομαι': 'prendre avec soi, accueillir',
  'κολλάομαι': 's\'attacher à, se joindre à',
  'εἴκοσι(ν)': 'vingt',
  'εἴκοσιν': 'vingt',
  'εἴκοσι': 'vingt',
  'σέβομαι': 'adorer, vénérer',
};

let addedTranslations = 0;
vocabulary.forEach(entry => {
  if (!entry.glossFr) {
    // Try exact match
    let frGloss = missingTranslations[entry.greek];

    // Try without parentheses
    if (!frGloss) {
      const cleanGreek = entry.greek.replace(/[()]/g, '');
      frGloss = missingTranslations[cleanGreek];
    }

    if (frGloss) {
      entry.glossFr = frGloss;
      addedTranslations++;
      console.log(`Added: ${entry.greek} -> "${frGloss}"`);
    }
  }
});

console.log(`\nAdded ${addedTranslations} missing French translations`);

// 2. Create case-specific preposition cards
// Prepositions with different meanings based on case
const prepositionCases = {
  'διά': [
    { case: 'génitif', meaning: 'à travers, par', meaningEn: 'through, by means of' },
    { case: 'accusatif', meaning: 'à cause de', meaningEn: 'because of, on account of' },
  ],
  'εἰς': [
    { case: 'accusatif', meaning: 'vers, dans (mouvement)', meaningEn: 'into, to, toward' },
  ],
  'ἐκ': [
    { case: 'génitif', meaning: 'hors de, depuis', meaningEn: 'out of, from' },
  ],
  'ἐν': [
    { case: 'datif', meaning: 'dans, en, parmi', meaningEn: 'in, on, among' },
  ],
  'ἐπί': [
    { case: 'génitif', meaning: 'sur, au temps de', meaningEn: 'on, upon, at the time of' },
    { case: 'datif', meaning: 'sur, à, près de', meaningEn: 'on, at, near' },
    { case: 'accusatif', meaning: 'sur, vers, contre', meaningEn: 'on, to, against' },
  ],
  'κατά': [
    { case: 'génitif', meaning: 'contre, en bas de', meaningEn: 'against, down from' },
    { case: 'accusatif', meaning: 'selon, le long de', meaningEn: 'according to, along' },
  ],
  'μετά': [
    { case: 'génitif', meaning: 'avec', meaningEn: 'with' },
    { case: 'accusatif', meaning: 'après', meaningEn: 'after' },
  ],
  'παρά': [
    { case: 'génitif', meaning: 'de la part de', meaningEn: 'from (beside)' },
    { case: 'datif', meaning: 'auprès de, chez', meaningEn: 'beside, with' },
    { case: 'accusatif', meaning: 'le long de, contrairement à', meaningEn: 'alongside, contrary to' },
  ],
  'περί': [
    { case: 'génitif', meaning: 'au sujet de, concernant', meaningEn: 'about, concerning' },
    { case: 'accusatif', meaning: 'autour de', meaningEn: 'around' },
  ],
  'πρός': [
    { case: 'accusatif', meaning: 'vers, auprès de, envers', meaningEn: 'to, toward, with' },
    { case: 'datif', meaning: 'près de', meaningEn: 'near' },
    { case: 'génitif', meaning: 'de la part de', meaningEn: 'from' },
  ],
  'ὑπέρ': [
    { case: 'génitif', meaning: 'pour, en faveur de', meaningEn: 'for, on behalf of' },
    { case: 'accusatif', meaning: 'au-dessus de, plus que', meaningEn: 'above, beyond' },
  ],
  'ὑπό': [
    { case: 'génitif', meaning: 'par (agent)', meaningEn: 'by (agent)' },
    { case: 'accusatif', meaning: 'sous', meaningEn: 'under' },
  ],
  'ἀπό': [
    { case: 'génitif', meaning: 'de, depuis, loin de', meaningEn: 'from, away from' },
  ],
  'πρό': [
    { case: 'génitif', meaning: 'avant, devant', meaningEn: 'before, in front of' },
  ],
  'σύν': [
    { case: 'datif', meaning: 'avec', meaningEn: 'with' },
  ],
  'ἀντί': [
    { case: 'génitif', meaning: 'au lieu de, en échange de', meaningEn: 'instead of, in place of' },
  ],
};

// Find prepositions in vocabulary and update them or create case-specific cards
const newCards = [];
let updatedPreps = 0;

vocabulary.forEach(entry => {
  if (entry.partOfSpeech === 'preposition' && prepositionCases[entry.greek]) {
    const cases = prepositionCases[entry.greek];

    if (cases.length === 1) {
      // Single case - just update the gloss to include case info
      entry.glossFr = `+ ${cases[0].case}: ${cases[0].meaning}`;
      entry.gloss = `+ ${cases[0].case}: ${cases[0].meaningEn}`;
      updatedPreps++;
    } else {
      // Multiple cases - update main card and create additional cards
      // Main card becomes the first/most common usage
      entry.glossFr = `+ ${cases[0].case}: ${cases[0].meaning}`;
      entry.gloss = `+ ${cases[0].case}: ${cases[0].meaningEn}`;
      updatedPreps++;

      // Create additional cards for other cases
      for (let i = 1; i < cases.length; i++) {
        const caseInfo = cases[i];
        const newCard = {
          ...entry,
          id: `${entry.id}-${caseInfo.case.substring(0, 3)}`,
          lexicalForm: `${entry.greek} + ${caseInfo.case}`,
          gloss: `+ ${caseInfo.case}: ${caseInfo.meaningEn}`,
          glossFr: `+ ${caseInfo.case}: ${caseInfo.meaning}`,
          // Keep same frequency but mark as variant
          frequency: Math.floor(entry.frequency / cases.length), // Approximate split
        };
        newCards.push(newCard);
      }
    }
  }
});

console.log(`\nUpdated ${updatedPreps} prepositions with case info`);
console.log(`Created ${newCards.length} additional case-specific cards`);

// Add new cards to vocabulary
vocabulary.push(...newCards);

// Sort by frequency
vocabulary.sort((a, b) => b.frequency - a.frequency);

// Write updated vocabulary
fs.writeFileSync(vocabPath, JSON.stringify(vocabulary, null, 2), 'utf-8');
console.log(`\nWritten ${vocabulary.length} total entries to ${vocabPath}`);

// Show some examples
console.log('\nPreposition examples:');
vocabulary
  .filter(e => e.partOfSpeech === 'preposition')
  .slice(0, 15)
  .forEach(e => {
    console.log(`  ${e.lexicalForm || e.greek} (${e.frequency}x) - FR: "${e.glossFr}"`);
  });

// Final stats
const withFrench = vocabulary.filter(e => e.glossFr).length;
console.log(`\nFinal stats:`);
console.log(`  Total entries: ${vocabulary.length}`);
console.log(`  With French gloss: ${withFrench} (${(withFrench/vocabulary.length*100).toFixed(1)}%)`);
