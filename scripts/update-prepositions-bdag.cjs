#!/usr/bin/env node
/**
 * Update prepositions with BDAG-based definitions
 * Sources: BDAG, Thayer's Lexicon, franknelte.net NT Greek Prepositions
 */

const fs = require('fs');
const path = require('path');

// BDAG-based preposition definitions (verified from academic sources)
// French translations by Claude based on BDAG English definitions
const prepositionsBDAG = {
  'διά': [
    {
      case: 'génitif',
      meaningFr: 'à travers (espace), pendant (temps), par le moyen de (instrument/agent)',
      meaningEn: 'through (space), during (time), by means of (instrument/agent)',
      notes: 'Indique le passage à travers, la durée, ou l\'agent/moyen'
    },
    {
      case: 'accusatif',
      meaningFr: 'à cause de, en raison de',
      meaningEn: 'because of, on account of',
      notes: 'Indique la cause ou la raison'
    },
  ],
  'εἰς': [
    {
      case: 'accusatif',
      meaningFr: 'vers, dans (mouvement), en vue de, pour',
      meaningEn: 'into, to, toward, for the purpose of',
      notes: 'Mouvement vers l\'intérieur ou but'
    },
  ],
  'ἐκ': [
    {
      case: 'génitif',
      meaningFr: 'hors de, de l\'intérieur de, provenant de',
      meaningEn: 'out of, from within, from',
      notes: 'Mouvement depuis l\'intérieur, origine immédiate'
    },
  ],
  'ἐν': [
    {
      case: 'datif',
      meaningFr: 'dans, en, parmi, par (instrument)',
      meaningEn: 'in, on, among, by (instrument)',
      notes: 'Localisation, état, instrument'
    },
  ],
  'ἐπί': [
    {
      case: 'génitif',
      meaningFr: 'sur (position), du temps de, devant',
      meaningEn: 'upon, in the time of, before',
      notes: 'Position sur, époque (ἐπὶ Ἡρῴδου = du temps d\'Hérode)'
    },
    {
      case: 'datif',
      meaningFr: 'sur (repos), à, près de, à cause de',
      meaningEn: 'on (rest), at, near, because of',
      notes: 'Superposition, repos sur'
    },
    {
      case: 'accusatif',
      meaningFr: 'sur (mouvement vers), contre, vers',
      meaningEn: 'upon (motion toward), against, to',
      notes: 'Mouvement vers, extension'
    },
  ],
  'κατά': [
    {
      case: 'génitif',
      meaningFr: 'contre, en bas de',
      meaningEn: 'against, down from',
      notes: 'Opposition, mouvement descendant'
    },
    {
      case: 'accusatif',
      meaningFr: 'selon, conformément à, le long de, par (distributif)',
      meaningEn: 'according to, along, throughout, by (distributive)',
      notes: 'Conformité, distribution (κατ\' οἶκον = de maison en maison)'
    },
  ],
  'μετά': [
    {
      case: 'génitif',
      meaningFr: 'avec, parmi, en compagnie de',
      meaningEn: 'with, among, in company with',
      notes: 'Association, compagnie'
    },
    {
      case: 'accusatif',
      meaningFr: 'après (temps)',
      meaningEn: 'after (time)',
      notes: 'Succession temporelle (μετὰ ταῦτα = après cela)'
    },
  ],
  'παρά': [
    {
      case: 'génitif',
      meaningFr: 'de la part de, de chez, venant de',
      meaningEn: 'from (beside), from the presence of',
      notes: 'Origine, provenance d\'une personne'
    },
    {
      case: 'datif',
      meaningFr: 'auprès de, chez, aux yeux de',
      meaningEn: 'beside, with, in the sight of',
      notes: 'Proximité, présence (παρὰ θεῷ = auprès de Dieu)'
    },
    {
      case: 'accusatif',
      meaningFr: 'le long de, au-delà de, contrairement à',
      meaningEn: 'alongside, beyond, contrary to',
      notes: 'Mouvement le long de, transgression'
    },
  ],
  'περί': [
    {
      case: 'génitif',
      meaningFr: 'au sujet de, concernant, pour (sacrifice)',
      meaningEn: 'about, concerning, for (sacrifice)',
      notes: 'Sujet de discussion, sacrifice pour le péché'
    },
    {
      case: 'accusatif',
      meaningFr: 'autour de, aux environs de',
      meaningEn: 'around, about (place/time)',
      notes: 'Espace ou temps approximatif'
    },
  ],
  'πρός': [
    {
      case: 'accusatif',
      meaningFr: 'vers, auprès de, envers, pour',
      meaningEn: 'to, toward, with, for',
      notes: 'Direction, relation (πρὸς τὸν θεόν = auprès de Dieu)'
    },
    {
      case: 'datif',
      meaningFr: 'près de',
      meaningEn: 'near, at',
      notes: 'Rare dans le NT'
    },
  ],
  'ὑπέρ': [
    {
      case: 'génitif',
      meaningFr: 'pour, en faveur de, à la place de',
      meaningEn: 'for, on behalf of, in place of',
      notes: 'Représentation, substitution'
    },
    {
      case: 'accusatif',
      meaningFr: 'au-dessus de, plus que, au-delà de',
      meaningEn: 'above, beyond, more than',
      notes: 'Supériorité, excès'
    },
  ],
  'ὑπό': [
    {
      case: 'génitif',
      meaningFr: 'par (agent passif)',
      meaningEn: 'by (agent with passive)',
      notes: 'Agent du passif (ὑπὸ τοῦ θεοῦ = par Dieu)'
    },
    {
      case: 'accusatif',
      meaningFr: 'sous',
      meaningEn: 'under',
      notes: 'Position inférieure'
    },
  ],
  'ἀπό': [
    {
      case: 'génitif',
      meaningFr: 'de, depuis, loin de, à partir de',
      meaningEn: 'from, away from, since',
      notes: 'Séparation, origine, point de départ'
    },
  ],
  'πρό': [
    {
      case: 'génitif',
      meaningFr: 'avant (temps/lieu), devant',
      meaningEn: 'before (time/place), in front of',
      notes: 'Antériorité temporelle ou spatiale'
    },
  ],
  'σύν': [
    {
      case: 'datif',
      meaningFr: 'avec (union intime)',
      meaningEn: 'with (close union)',
      notes: 'Union plus intime que μετά'
    },
  ],
  'ἀντί': [
    {
      case: 'génitif',
      meaningFr: 'au lieu de, en échange de, pour',
      meaningEn: 'instead of, in exchange for',
      notes: 'Substitution, équivalence'
    },
  ],
  'ἀνά': [
    {
      case: 'accusatif',
      meaningFr: 'en haut, chacun (distributif)',
      meaningEn: 'up, each (distributive)',
      notes: 'ἀνὰ δύο = deux par deux'
    },
  ],
};

// Read vocabulary
const vocabPath = path.join(__dirname, '../public/data/vocabulary.json');
const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

console.log(`Loaded ${vocabulary.length} vocabulary entries`);

// Remove old case-specific preposition cards (we'll recreate them)
const oldLength = vocabulary.length;
const filteredVocab = vocabulary.filter(entry => {
  // Keep if not a preposition case variant
  return !entry.id.match(/-(gén|dat|acc|gni|géi)$/);
});
console.log(`Removed ${oldLength - filteredVocab.length} old case-specific cards`);

// Update prepositions and create case-specific cards
const newCards = [];
let updatedPreps = 0;

filteredVocab.forEach(entry => {
  const greek = entry.greek;

  // Check if this is a preposition we have BDAG data for
  let prepData = prepositionsBDAG[greek];

  // Try without parenthetical parts
  if (!prepData) {
    const cleanGreek = greek.split(',')[0].trim();
    prepData = prepositionsBDAG[cleanGreek];
  }

  if (entry.partOfSpeech === 'preposition' && prepData) {
    const cases = prepData;

    // Update main card with first/primary case
    entry.glossFr = `+ ${cases[0].case}: ${cases[0].meaningFr}`;
    entry.gloss = `+ ${cases[0].case}: ${cases[0].meaningEn}`;
    if (cases[0].notes) {
      entry.extendedGloss = cases[0].notes;
    }
    updatedPreps++;

    // Create additional cards for other cases
    for (let i = 1; i < cases.length; i++) {
      const caseInfo = cases[i];
      const caseAbbrev = caseInfo.case.substring(0, 3);
      const newCard = {
        ...entry,
        id: `${entry.id}-${caseAbbrev}`,
        lexicalForm: `${greek} + ${caseInfo.case}`,
        gloss: `+ ${caseInfo.case}: ${caseInfo.meaningEn}`,
        glossFr: `+ ${caseInfo.case}: ${caseInfo.meaningFr}`,
        extendedGloss: caseInfo.notes || '',
        // Approximate frequency split
        frequency: Math.floor(entry.frequency / cases.length),
      };
      newCards.push(newCard);
    }
  }
});

console.log(`Updated ${updatedPreps} prepositions with BDAG definitions`);
console.log(`Created ${newCards.length} case-specific cards`);

// Add new cards
filteredVocab.push(...newCards);

// Sort by frequency
filteredVocab.sort((a, b) => b.frequency - a.frequency);

// Write updated vocabulary
fs.writeFileSync(vocabPath, JSON.stringify(filteredVocab, null, 2), 'utf-8');
console.log(`\nWritten ${filteredVocab.length} entries to ${vocabPath}`);

// Show preposition examples
console.log('\n=== Prépositions avec définitions BDAG ===\n');
filteredVocab
  .filter(e => e.partOfSpeech === 'preposition')
  .slice(0, 20)
  .forEach(e => {
    console.log(`${e.lexicalForm || e.greek} (${e.frequency}x)`);
    console.log(`  FR: ${e.glossFr}`);
    console.log(`  EN: ${e.gloss}`);
    if (e.extendedGloss) console.log(`  Note: ${e.extendedGloss}`);
    console.log('');
  });
