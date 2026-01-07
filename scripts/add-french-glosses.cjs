#!/usr/bin/env node
/**
 * Add French glosses to vocabulary.json from "Nouveau Testament.xml"
 *
 * Source: User-provided Excel XML export with French glosses
 */

const fs = require('fs');
const path = require('path');

// Read the XML file
const xmlPath = path.join(__dirname, '../Nouveau Testament.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Parse XML to extract Greek lemmas and French glosses
const frenchGlosses = new Map();

// Extract all rows
const rowRegex = /<Row>([\s\S]*?)<\/Row>/g;
let match;
let rowCount = 0;
let withGloss = 0;

while ((match = rowRegex.exec(xmlContent)) !== null) {
  const row = match[1];
  rowCount++;

  // Extract all Data elements
  const dataRegex = /<Data ss:Type="(?:String|Number)">(.*?)<\/Data>/g;
  const cells = [];
  let dataMatch;
  while ((dataMatch = dataRegex.exec(row)) !== null) {
    cells.push(dataMatch[1]);
  }

  // Skip header row
  if (cells[0] === 'Lemme') continue;

  // Structure: Lemme, Recto, Nombre, Glose, Section
  if (cells.length >= 4) {
    const lemme = cells[0]?.trim();
    const recto = cells[1]?.trim(); // Clean form (without numbers like "μήν 1")
    const glose = cells[3]?.trim();

    if (lemme && glose) {
      // Use recto (clean form) as key, fallback to lemme
      const key = recto || lemme;
      // Remove trailing numbers like "μήν 1" -> "μήν"
      const cleanKey = key.replace(/\s+\d+$/, '').trim();
      frenchGlosses.set(cleanKey, glose);
      withGloss++;
    }
  }
}

console.log(`Parsed ${rowCount} rows from XML`);
console.log(`Found ${withGloss} entries with French glosses`);

// Read existing vocabulary.json
const vocabPath = path.join(__dirname, '../public/data/vocabulary.json');
const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

console.log(`\nLoaded ${vocabulary.length} vocabulary entries`);

// Add French glosses
let matched = 0;
let unmatched = [];

vocabulary.forEach(entry => {
  const greek = entry.greek;

  // Try exact match first
  let frGloss = frenchGlosses.get(greek);

  // Try without final sigma variation
  if (!frGloss) {
    const altGreek = greek.replace(/ς$/, 'σ');
    frGloss = frenchGlosses.get(altGreek);
  }

  // Try normalized (remove accents for comparison)
  if (!frGloss) {
    const normalizedGreek = greek.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, value] of frenchGlosses) {
      const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedKey === normalizedGreek) {
        frGloss = value;
        break;
      }
    }
  }

  if (frGloss) {
    entry.glossFr = frGloss;
    matched++;
  } else {
    unmatched.push({ greek, freq: entry.frequency });
  }
});

console.log(`Matched ${matched} entries with French glosses`);
console.log(`Unmatched: ${unmatched.length}`);

// Show some unmatched high-frequency words
console.log('\nTop unmatched words by frequency:');
unmatched.sort((a, b) => b.freq - a.freq);
unmatched.slice(0, 20).forEach(w => {
  console.log(`  ${w.greek} (${w.freq}x)`);
});

// Show some matched examples
console.log('\nMatched examples:');
vocabulary.filter(e => e.glossFr).slice(0, 10).forEach(e => {
  console.log(`  ${e.greek} -> FR: "${e.glossFr}" | EN: "${e.gloss}"`);
});

// Write updated vocabulary
fs.writeFileSync(vocabPath, JSON.stringify(vocabulary, null, 2), 'utf-8');
console.log(`\nUpdated ${vocabPath}`);

// Stats
const withFrench = vocabulary.filter(e => e.glossFr).length;
console.log(`\nFinal stats:`);
console.log(`  Total entries: ${vocabulary.length}`);
console.log(`  With French gloss: ${withFrench} (${(withFrench/vocabulary.length*100).toFixed(1)}%)`);
