import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { GlassFilter, GlassSelect } from '../components/ui/LiquidGlass';
import { useI18n } from '../lib/i18n';
import { useReadingStore } from '../stores/readingStore';
import { useDeckStore } from '../stores/deckStore';
import type { ScaffoldingMode } from '../lib/types';
import { cn } from '../lib/utils';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  X,
  BookOpen,
  Volume2,
  Eye,
  EyeOff,
  Lightbulb,
  Layers,
  Sparkles,
  BarChart3,
  Target,
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================
// NT DATA - John Chapter 1 (Sample)
// Source: SBLGNT / MorphGNT
// ============================================

interface WordToken {
  greek: string;
  lemma: string;
  gloss: string;
  glossFr: string;
  morphology: string;
}

interface Verse {
  number: number;
  tokens: WordToken[];
}

interface Chapter {
  book: string;
  bookFr: string;
  chapter: number;
  verses: Verse[];
}

// John 1:1-18 (Prologue) - Sample data
const johnChapter1: Chapter = {
  book: 'John',
  bookFr: 'Jean',
  chapter: 1,
  verses: [
    {
      number: 1,
      tokens: [
        { greek: 'Ἐν', lemma: 'ἐν', gloss: 'In', glossFr: 'Au', morphology: 'preposition' },
        { greek: 'ἀρχῇ', lemma: 'ἀρχή', gloss: 'beginning', glossFr: 'commencement', morphology: 'noun, dative singular feminine' },
        { greek: 'ἦν', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'ὁ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular masculine' },
        { greek: 'λόγος,', lemma: 'λόγος', gloss: 'Word', glossFr: 'Parole', morphology: 'noun, nominative singular masculine' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ὁ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular masculine' },
        { greek: 'λόγος', lemma: 'λόγος', gloss: 'Word', glossFr: 'Parole', morphology: 'noun, nominative singular masculine' },
        { greek: 'ἦν', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'πρὸς', lemma: 'πρός', gloss: 'with', glossFr: 'auprès de', morphology: 'preposition' },
        { greek: 'τὸν', lemma: 'ὁ', gloss: 'the', glossFr: 'le', morphology: 'article, accusative singular masculine' },
        { greek: 'θεόν,', lemma: 'θεός', gloss: 'God', glossFr: 'Dieu', morphology: 'noun, accusative singular masculine' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'θεὸς', lemma: 'θεός', gloss: 'God', glossFr: 'Dieu', morphology: 'noun, nominative singular masculine' },
        { greek: 'ἦν', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'ὁ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular masculine' },
        { greek: 'λόγος.', lemma: 'λόγος', gloss: 'Word', glossFr: 'Parole', morphology: 'noun, nominative singular masculine' },
      ],
    },
    {
      number: 2,
      tokens: [
        { greek: 'οὗτος', lemma: 'οὗτος', gloss: 'This one', glossFr: 'Celui-ci', morphology: 'demonstrative pronoun, nominative singular masculine' },
        { greek: 'ἦν', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'ἐν', lemma: 'ἐν', gloss: 'in', glossFr: 'au', morphology: 'preposition' },
        { greek: 'ἀρχῇ', lemma: 'ἀρχή', gloss: 'beginning', glossFr: 'commencement', morphology: 'noun, dative singular feminine' },
        { greek: 'πρὸς', lemma: 'πρός', gloss: 'with', glossFr: 'auprès de', morphology: 'preposition' },
        { greek: 'τὸν', lemma: 'ὁ', gloss: 'the', glossFr: 'le', morphology: 'article, accusative singular masculine' },
        { greek: 'θεόν.', lemma: 'θεός', gloss: 'God', glossFr: 'Dieu', morphology: 'noun, accusative singular masculine' },
      ],
    },
    {
      number: 3,
      tokens: [
        { greek: 'πάντα', lemma: 'πᾶς', gloss: 'All things', glossFr: 'Toutes choses', morphology: 'adjective, nominative plural neuter' },
        { greek: "δι'", lemma: 'διά', gloss: 'through', glossFr: 'par', morphology: 'preposition' },
        { greek: 'αὐτοῦ', lemma: 'αὐτός', gloss: 'him', glossFr: 'lui', morphology: 'personal pronoun, genitive singular masculine' },
        { greek: 'ἐγένετο,', lemma: 'γίνομαι', gloss: 'came into being', glossFr: 'furent faites', morphology: 'verb, 3rd singular aorist middle indicative' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'χωρὶς', lemma: 'χωρίς', gloss: 'without', glossFr: 'sans', morphology: 'preposition' },
        { greek: 'αὐτοῦ', lemma: 'αὐτός', gloss: 'him', glossFr: 'lui', morphology: 'personal pronoun, genitive singular masculine' },
        { greek: 'ἐγένετο', lemma: 'γίνομαι', gloss: 'came into being', glossFr: 'ne fut faite', morphology: 'verb, 3rd singular aorist middle indicative' },
        { greek: 'οὐδὲ', lemma: 'οὐδέ', gloss: 'not even', glossFr: 'pas même', morphology: 'conjunction' },
        { greek: 'ἕν.', lemma: 'εἷς', gloss: 'one thing', glossFr: 'une seule', morphology: 'adjective, nominative singular neuter' },
      ],
    },
    {
      number: 4,
      tokens: [
        { greek: 'ὃ', lemma: 'ὅς', gloss: 'What', glossFr: 'Ce qui', morphology: 'relative pronoun, nominative singular neuter' },
        { greek: 'γέγονεν', lemma: 'γίνομαι', gloss: 'has come into being', glossFr: 'a été fait', morphology: 'verb, 3rd singular perfect active indicative' },
        { greek: 'ἐν', lemma: 'ἐν', gloss: 'in', glossFr: 'en', morphology: 'preposition' },
        { greek: 'αὐτῷ', lemma: 'αὐτός', gloss: 'him', glossFr: 'lui', morphology: 'personal pronoun, dative singular masculine' },
        { greek: 'ζωὴ', lemma: 'ζωή', gloss: 'life', glossFr: 'vie', morphology: 'noun, nominative singular feminine' },
        { greek: 'ἦν,', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ἡ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular feminine' },
        { greek: 'ζωὴ', lemma: 'ζωή', gloss: 'life', glossFr: 'vie', morphology: 'noun, nominative singular feminine' },
        { greek: 'ἦν', lemma: 'εἰμί', gloss: 'was', glossFr: 'était', morphology: 'verb, 3rd singular imperfect active indicative' },
        { greek: 'τὸ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular neuter' },
        { greek: 'φῶς', lemma: 'φῶς', gloss: 'light', glossFr: 'lumière', morphology: 'noun, nominative singular neuter' },
        { greek: 'τῶν', lemma: 'ὁ', gloss: 'of the', glossFr: 'des', morphology: 'article, genitive plural masculine' },
        { greek: 'ἀνθρώπων·', lemma: 'ἄνθρωπος', gloss: 'men', glossFr: 'hommes', morphology: 'noun, genitive plural masculine' },
      ],
    },
    {
      number: 5,
      tokens: [
        { greek: 'καὶ', lemma: 'καί', gloss: 'And', glossFr: 'Et', morphology: 'conjunction' },
        { greek: 'τὸ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular neuter' },
        { greek: 'φῶς', lemma: 'φῶς', gloss: 'light', glossFr: 'lumière', morphology: 'noun, nominative singular neuter' },
        { greek: 'ἐν', lemma: 'ἐν', gloss: 'in', glossFr: 'dans', morphology: 'preposition' },
        { greek: 'τῇ', lemma: 'ὁ', gloss: 'the', glossFr: 'les', morphology: 'article, dative singular feminine' },
        { greek: 'σκοτίᾳ', lemma: 'σκοτία', gloss: 'darkness', glossFr: 'ténèbres', morphology: 'noun, dative singular feminine' },
        { greek: 'φαίνει,', lemma: 'φαίνω', gloss: 'shines', glossFr: 'luit', morphology: 'verb, 3rd singular present active indicative' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ἡ', lemma: 'ὁ', gloss: 'the', glossFr: 'les', morphology: 'article, nominative singular feminine' },
        { greek: 'σκοτία', lemma: 'σκοτία', gloss: 'darkness', glossFr: 'ténèbres', morphology: 'noun, nominative singular feminine' },
        { greek: 'αὐτὸ', lemma: 'αὐτός', gloss: 'it', glossFr: 'elle', morphology: 'personal pronoun, accusative singular neuter' },
        { greek: 'οὐ', lemma: 'οὐ', gloss: 'not', glossFr: 'ne...pas', morphology: 'negative particle' },
        { greek: 'κατέλαβεν.', lemma: 'καταλαμβάνω', gloss: 'overcame', glossFr: 'saisie', morphology: 'verb, 3rd singular aorist active indicative' },
      ],
    },
    {
      number: 14,
      tokens: [
        { greek: 'Καὶ', lemma: 'καί', gloss: 'And', glossFr: 'Et', morphology: 'conjunction' },
        { greek: 'ὁ', lemma: 'ὁ', gloss: 'the', glossFr: 'la', morphology: 'article, nominative singular masculine' },
        { greek: 'λόγος', lemma: 'λόγος', gloss: 'Word', glossFr: 'Parole', morphology: 'noun, nominative singular masculine' },
        { greek: 'σὰρξ', lemma: 'σάρξ', gloss: 'flesh', glossFr: 'chair', morphology: 'noun, nominative singular feminine' },
        { greek: 'ἐγένετο', lemma: 'γίνομαι', gloss: 'became', glossFr: 'devenue', morphology: 'verb, 3rd singular aorist middle indicative' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ἐσκήνωσεν', lemma: 'σκηνόω', gloss: 'dwelt', glossFr: 'habité', morphology: 'verb, 3rd singular aorist active indicative' },
        { greek: 'ἐν', lemma: 'ἐν', gloss: 'among', glossFr: 'parmi', morphology: 'preposition' },
        { greek: 'ἡμῖν,', lemma: 'ἐγώ', gloss: 'us', glossFr: 'nous', morphology: 'personal pronoun, dative plural' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ἐθεασάμεθα', lemma: 'θεάομαι', gloss: 'we beheld', glossFr: 'contemplé', morphology: 'verb, 1st plural aorist middle indicative' },
        { greek: 'τὴν', lemma: 'ὁ', gloss: 'the', glossFr: 'sa', morphology: 'article, accusative singular feminine' },
        { greek: 'δόξαν', lemma: 'δόξα', gloss: 'glory', glossFr: 'gloire', morphology: 'noun, accusative singular feminine' },
        { greek: 'αὐτοῦ,', lemma: 'αὐτός', gloss: 'his', glossFr: 'de lui', morphology: 'personal pronoun, genitive singular masculine' },
        { greek: 'δόξαν', lemma: 'δόξα', gloss: 'glory', glossFr: 'gloire', morphology: 'noun, accusative singular feminine' },
        { greek: 'ὡς', lemma: 'ὡς', gloss: 'as', glossFr: 'comme', morphology: 'conjunction' },
        { greek: 'μονογενοῦς', lemma: 'μονογενής', gloss: 'only begotten', glossFr: 'unique', morphology: 'adjective, genitive singular masculine' },
        { greek: 'παρὰ', lemma: 'παρά', gloss: 'from', glossFr: 'auprès du', morphology: 'preposition' },
        { greek: 'πατρός,', lemma: 'πατήρ', gloss: 'Father', glossFr: 'Père', morphology: 'noun, genitive singular masculine' },
        { greek: 'πλήρης', lemma: 'πλήρης', gloss: 'full', glossFr: 'pleine', morphology: 'adjective, nominative singular masculine' },
        { greek: 'χάριτος', lemma: 'χάρις', gloss: 'of grace', glossFr: 'de grâce', morphology: 'noun, genitive singular feminine' },
        { greek: 'καὶ', lemma: 'καί', gloss: 'and', glossFr: 'et', morphology: 'conjunction' },
        { greek: 'ἀληθείας.', lemma: 'ἀλήθεια', gloss: 'truth', glossFr: 'vérité', morphology: 'noun, genitive singular feminine' },
      ],
    },
  ],
};

// Available books for navigation
const ntBooks = [
  { id: 'matthew', name: 'Matthew', nameFr: 'Matthieu', chapters: 28 },
  { id: 'mark', name: 'Mark', nameFr: 'Marc', chapters: 16 },
  { id: 'luke', name: 'Luke', nameFr: 'Luc', chapters: 24 },
  { id: 'john', name: 'John', nameFr: 'Jean', chapters: 21 },
  { id: 'acts', name: 'Acts', nameFr: 'Actes', chapters: 28 },
  { id: 'romans', name: 'Romans', nameFr: 'Romains', chapters: 16 },
  { id: '1corinthians', name: '1 Corinthians', nameFr: '1 Corinthiens', chapters: 16 },
  { id: 'galatians', name: 'Galatians', nameFr: 'Galates', chapters: 6 },
  { id: 'ephesians', name: 'Ephesians', nameFr: 'Éphésiens', chapters: 6 },
  { id: 'philippians', name: 'Philippians', nameFr: 'Philippiens', chapters: 4 },
  { id: 'colossians', name: 'Colossians', nameFr: 'Colossiens', chapters: 4 },
  { id: '1thessalonians', name: '1 Thessalonians', nameFr: '1 Thessaloniciens', chapters: 5 },
  { id: 'hebrews', name: 'Hebrews', nameFr: 'Hébreux', chapters: 13 },
  { id: 'james', name: 'James', nameFr: 'Jacques', chapters: 5 },
  { id: '1peter', name: '1 Peter', nameFr: '1 Pierre', chapters: 5 },
  { id: '1john', name: '1 John', nameFr: '1 Jean', chapters: 5 },
  { id: 'revelation', name: 'Revelation', nameFr: 'Apocalypse', chapters: 22 },
];

// ============================================
// SCAFFOLDING MODE CONFIG
// ============================================

const scaffoldingModes: Array<{
  mode: ScaffoldingMode;
  icon: React.ReactNode;
  label: string;
  labelFr: string;
  description: string;
  descriptionFr: string;
}> = [
  {
    mode: 'full-gloss',
    icon: <Eye className="w-4 h-4" />,
    label: 'Full Gloss',
    labelFr: 'Gloses complètes',
    description: 'Hover to see all translations',
    descriptionFr: 'Survolez pour voir toutes les traductions',
  },
  {
    mode: 'unknown-only',
    icon: <Target className="w-4 h-4" />,
    label: 'Unknown Only',
    labelFr: 'Mots inconnus',
    description: 'Only show glosses for unknown words',
    descriptionFr: 'Gloses uniquement pour les mots inconnus',
  },
  {
    mode: 'hints',
    icon: <Lightbulb className="w-4 h-4" />,
    label: 'Hints',
    labelFr: 'Indices',
    description: 'Show first letters for unknown words',
    descriptionFr: 'Première lettre pour les mots inconnus',
  },
  {
    mode: 'interlinear',
    icon: <Layers className="w-4 h-4" />,
    label: 'Interlinear',
    labelFr: 'Interlinéaire',
    description: 'Greek with translation below',
    descriptionFr: 'Grec avec traduction dessous',
  },
  {
    mode: 'pure',
    icon: <Sparkles className="w-4 h-4" />,
    label: 'Pure Greek',
    labelFr: 'Grec pur',
    description: 'No assistance',
    descriptionFr: 'Aucune aide',
  },
];

// ============================================
// COMPONENTS
// ============================================

// Scaffolding Mode Selector
interface ScaffoldingModeSelectorProps {
  currentMode: ScaffoldingMode;
  onModeChange: (mode: ScaffoldingMode) => void;
  language: 'fr' | 'en';
}

function ScaffoldingModeSelector({ currentMode, onModeChange, language }: ScaffoldingModeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentConfig = scaffoldingModes.find(m => m.mode === currentMode) || scaffoldingModes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all"
      >
        {currentConfig.icon}
        <span className="text-sm text-slate-200">
          {language === 'fr' ? currentConfig.labelFr : currentConfig.label}
        </span>
        <ChevronRight className={cn(
          "w-4 h-4 text-slate-400 transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-64 p-2 rounded-xl bg-slate-900/95 border border-white/[0.1] backdrop-blur-xl z-20"
          >
            {scaffoldingModes.map(({ mode, icon, label, labelFr, description, descriptionFr }) => (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  setIsExpanded(false);
                }}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left",
                  currentMode === mode
                    ? "bg-blue-500/20 text-blue-200"
                    : "hover:bg-white/[0.06] text-slate-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  currentMode === mode ? "bg-blue-500/30" : "bg-white/[0.08]"
                )}>
                  {icon}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {language === 'fr' ? labelFr : label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {language === 'fr' ? descriptionFr : description}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Difficulty Badge
interface DifficultyBadgeProps {
  knownPercent: number;
  language: 'fr' | 'en';
}

function DifficultyBadge({ knownPercent, language }: DifficultyBadgeProps) {
  const level = knownPercent >= 80 ? 'easy' : knownPercent >= 50 ? 'medium' : 'hard';
  const colors = {
    easy: 'bg-green-500/20 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  const labels = {
    easy: { en: 'Easy', fr: 'Facile' },
    medium: { en: 'Moderate', fr: 'Modéré' },
    hard: { en: 'Challenging', fr: 'Difficile' },
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
      colors[level]
    )}>
      <BarChart3 className="w-4 h-4" />
      <span className="text-xs font-medium">
        {language === 'fr' ? labels[level].fr : labels[level].en}
      </span>
      <span className="text-xs opacity-70">
        {knownPercent}% {language === 'fr' ? 'connu' : 'known'}
      </span>
    </div>
  );
}

interface WordProps {
  token: WordToken;
  onClick: () => void;
  isSelected: boolean;
  isKnown: boolean;
  scaffoldingMode: ScaffoldingMode;
  showGloss: boolean;
  language: 'fr' | 'en';
  highlightUnknown: boolean;
}

function Word({
  token,
  onClick,
  isSelected,
  isKnown,
  scaffoldingMode,
  showGloss,
  language,
  highlightUnknown
}: WordProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine what to show based on scaffolding mode
  const shouldShowGloss = () => {
    if (scaffoldingMode === 'pure') return false;
    if (scaffoldingMode === 'interlinear') return true;
    if (scaffoldingMode === 'full-gloss') return isHovered;
    if (scaffoldingMode === 'unknown-only') return !isKnown && isHovered;
    if (scaffoldingMode === 'hints') return !isKnown && isHovered;
    return false;
  };

  const getGlossText = () => {
    const gloss = language === 'fr' ? token.glossFr : token.gloss;
    if (scaffoldingMode === 'hints' && !isKnown) {
      // Show first letter + ellipsis
      return gloss.charAt(0) + '...';
    }
    return gloss;
  };

  // Interlinear mode renders differently
  if (scaffoldingMode === 'interlinear') {
    return (
      <span
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "inline-flex flex-col items-center mx-1 cursor-pointer rounded transition-all",
          isSelected && "bg-blue-500/30",
          !isKnown && highlightUnknown && "bg-amber-500/10",
          isHovered && "bg-white/10"
        )}
      >
        <span className="greek-text text-slate-100">{token.greek}</span>
        <span className="text-xs text-slate-400">{getGlossText()}</span>
      </span>
    );
  }

  // Standard word rendering with hover tooltip
  return (
    <span className="relative inline-block">
      <motion.span
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "greek-text cursor-pointer px-0.5 py-1 rounded transition-all inline-block",
          isSelected && "bg-blue-500/30 text-blue-200",
          !isSelected && !isKnown && highlightUnknown && "bg-amber-500/10 text-amber-200",
          !isSelected && (isKnown || !highlightUnknown) && "hover:bg-white/10 text-slate-100"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {token.greek}
      </motion.span>

      {/* Hover tooltip */}
      <AnimatePresence>
        {shouldShowGloss() && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-800 border border-white/[0.1] whitespace-nowrap z-10"
          >
            <span className="text-xs text-slate-200">{getGlossText()}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

interface WordModalProps {
  token: WordToken | null;
  onClose: () => void;
  language: 'fr' | 'en';
}

function WordModal({ token, onClose, language }: WordModalProps) {
  if (!token) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard glow="blue" className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="p-6">
            {/* Greek word */}
            <div className="text-center mb-6">
              <span className="greek-text text-4xl text-slate-100">{token.greek.replace(/[,.:;·]$/, '')}</span>
            </div>

            {/* Lemma */}
            <div className="mb-4 p-3 rounded-xl bg-white/[0.04]">
              <div className="text-xs text-slate-500 mb-1">Lemme</div>
              <div className="greek-text text-lg text-slate-200">{token.lemma}</div>
            </div>

            {/* Gloss */}
            <div className="mb-4 p-3 rounded-xl bg-blue-500/10">
              <div className="text-xs text-blue-400 mb-1">
                {language === 'fr' ? 'Traduction' : 'Translation'}
              </div>
              <div className="text-lg text-slate-100">
                {language === 'fr' ? token.glossFr : token.gloss}
              </div>
            </div>

            {/* Morphology */}
            <div className="p-3 rounded-xl bg-white/[0.04]">
              <div className="text-xs text-slate-500 mb-1">Morphologie</div>
              <div className="text-sm text-slate-300">{token.morphology}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button variant="ghost" size="sm" icon={<Volume2 className="w-4 h-4" />} className="flex-1">
                Écouter
              </Button>
              <Button variant="ghost" size="sm" icon={<BookOpen className="w-4 h-4" />} className="flex-1">
                Ajouter
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Reader() {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  // Reading store
  const {
    scaffoldingMode,
    setScaffoldingMode,
    highlightUnknown,
    setHighlightUnknown,
    startReadingSession,
    endReadingSession,
    recordWordLookup,
  } = useReadingStore();

  // Deck store for vocabulary knowledge
  const { vocabCards } = useDeckStore();

  const [selectedBook, setSelectedBook] = useState('john');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedWord, setSelectedWord] = useState<WordToken | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(['john-1-1', 'john-1-14']);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Build set of known lemmas from vocabulary cards
  const knownLemmas = useMemo(() => {
    // Consider a word "known" if it has been reviewed at least once
    return new Set(
      vocabCards
        .filter(card => card.reps > 0)
        .map(card => card.lemma)
    );
  }, [vocabCards]);

  // Get current book info
  const currentBook = ntBooks.find((b) => b.id === selectedBook) || ntBooks[3];

  // Get chapter data (for now, only John 1 has data)
  const chapterData = selectedBook === 'john' && selectedChapter === 1 ? johnChapter1 : null;

  // Calculate passage difficulty
  const passageStats = useMemo(() => {
    if (!chapterData) return null;

    const allLemmas = new Set<string>();
    chapterData.verses.forEach(verse => {
      verse.tokens.forEach(token => {
        allLemmas.add(token.lemma);
      });
    });

    const knownCount = [...allLemmas].filter(lemma => knownLemmas.has(lemma)).length;
    const knownPercent = Math.round((knownCount / allLemmas.size) * 100);
    const totalWords = chapterData.verses.reduce((sum, v) => sum + v.tokens.length, 0);

    return {
      totalWords,
      uniqueWords: allLemmas.size,
      knownPercent,
    };
  }, [chapterData, knownLemmas]);

  // Session tracking
  useEffect(() => {
    const passageId = `${selectedBook}-${selectedChapter}`;
    startReadingSession(passageId);

    return () => {
      endReadingSession();
    };
  }, [selectedBook, selectedChapter, startReadingSession, endReadingSession]);

  // Check if a word is known
  const isWordKnown = useCallback((lemma: string) => {
    return knownLemmas.has(lemma);
  }, [knownLemmas]);

  // Check if current verse is bookmarked
  const isBookmarked = useCallback(
    (verseNum: number) => bookmarks.includes(`${selectedBook}-${selectedChapter}-${verseNum}`),
    [bookmarks, selectedBook, selectedChapter]
  );

  // Toggle bookmark
  const toggleBookmark = (verseNum: number) => {
    const key = `${selectedBook}-${selectedChapter}-${verseNum}`;
    setBookmarks((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]
    );
  };

  // Navigate chapters
  const goToPrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    }
  };

  const goToNextChapter = () => {
    if (selectedChapter < currentBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  // Font size classes
  const fontSizeClasses = {
    normal: 'text-xl leading-relaxed',
    large: 'text-2xl leading-relaxed',
    xlarge: 'text-3xl leading-loose',
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <GlassFilter />

      <motion.div
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header className="flex items-center gap-4" variants={itemVariants}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('back')}
          </Button>
          <h1 className="text-2xl font-bold text-slate-100">{t('nt_reader')}</h1>
        </motion.header>

        {/* Navigation */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Book selector */}
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">
                  {language === 'fr' ? 'Livre' : 'Book'}
                </label>
                <GlassSelect
                  value={selectedBook}
                  onChange={(e) => {
                    setSelectedBook(e.target.value);
                    setSelectedChapter(1);
                  }}
                  options={ntBooks.map((book) => ({
                    value: book.id,
                    label: language === 'fr' ? book.nameFr : book.name,
                  }))}
                />
              </div>

              {/* Chapter selector */}
              <div className="w-32">
                <label className="text-xs text-slate-500 mb-1 block">
                  {language === 'fr' ? 'Chapitre' : 'Chapter'}
                </label>
                <GlassSelect
                  value={selectedChapter.toString()}
                  onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                  options={Array.from({ length: currentBook.chapters }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: (i + 1).toString(),
                  }))}
                />
              </div>

              {/* Font size */}
              <div className="w-32">
                <label className="text-xs text-slate-500 mb-1 block">
                  {language === 'fr' ? 'Taille' : 'Size'}
                </label>
                <GlassSelect
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'large', label: language === 'fr' ? 'Grand' : 'Large' },
                    { value: 'xlarge', label: language === 'fr' ? 'Très grand' : 'Extra Large' },
                  ]}
                />
              </div>
            </div>

            {/* Scaffolding Mode & Difficulty */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.08]">
              <ScaffoldingModeSelector
                currentMode={scaffoldingMode}
                onModeChange={setScaffoldingMode}
                language={language}
              />

              {/* Highlight unknown toggle */}
              <button
                onClick={() => setHighlightUnknown(!highlightUnknown)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                  highlightUnknown
                    ? "bg-amber-500/20 border-amber-500/30 text-amber-200"
                    : "bg-white/[0.06] border-white/[0.1] text-slate-400 hover:bg-white/[0.1]"
                )}
              >
                {highlightUnknown ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm">
                  {language === 'fr' ? 'Mots inconnus' : 'Unknown words'}
                </span>
              </button>

              {/* Difficulty badge */}
              {passageStats && (
                <DifficultyBadge
                  knownPercent={passageStats.knownPercent}
                  language={language}
                />
              )}

              {/* Word stats */}
              {passageStats && (
                <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
                  <span>{passageStats.totalWords} {language === 'fr' ? 'mots' : 'words'}</span>
                  <span>{passageStats.uniqueWords} {language === 'fr' ? 'uniques' : 'unique'}</span>
                </div>
              )}
            </div>

            {/* Chapter navigation */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevChapter}
                disabled={selectedChapter <= 1}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                {language === 'fr' ? 'Précédent' : 'Previous'}
              </Button>

              <span className="text-slate-400">
                {language === 'fr' ? currentBook.nameFr : currentBook.name} {selectedChapter}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextChapter}
                disabled={selectedChapter >= currentBook.chapters}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                {language === 'fr' ? 'Suivant' : 'Next'}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Text Content */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="blue" className="p-6">
            {chapterData ? (
              <div className={cn(
                "space-y-6",
                fontSizeClasses[fontSize],
                scaffoldingMode === 'interlinear' && "space-y-8"
              )}>
                {chapterData.verses.map((verse) => (
                  <motion.div
                    key={verse.number}
                    className="group relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: verse.number * 0.05 }}
                  >
                    {/* Verse number */}
                    <sup className="text-blue-400 text-sm mr-2 font-medium">{verse.number}</sup>

                    {/* Words */}
                    <span className={cn(
                      scaffoldingMode === 'interlinear' && "flex flex-wrap items-start gap-1"
                    )}>
                      {verse.tokens.map((token, idx) => (
                        <Word
                          key={idx}
                          token={token}
                          onClick={() => {
                            setSelectedWord(token);
                            recordWordLookup(token.lemma);
                          }}
                          isSelected={selectedWord?.greek === token.greek}
                          isKnown={isWordKnown(token.lemma)}
                          scaffoldingMode={scaffoldingMode}
                          showGloss={true}
                          language={language}
                          highlightUnknown={highlightUnknown}
                        />
                      ))}
                    </span>

                    {/* Bookmark button */}
                    <button
                      onClick={() => toggleBookmark(verse.number)}
                      className="absolute -right-2 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isBookmarked(verse.number) ? (
                        <BookmarkCheck className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  {language === 'fr' ? 'Texte non disponible' : 'Text not available'}
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {language === 'fr'
                    ? 'Seul Jean chapitre 1 est disponible dans cette version de démonstration. Plus de texte sera ajouté prochainement.'
                    : 'Only John chapter 1 is available in this demo version. More text will be added soon.'}
                </p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => {
                    setSelectedBook('john');
                    setSelectedChapter(1);
                  }}
                >
                  {language === 'fr' ? 'Lire Jean 1' : 'Read John 1'}
                </Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Reading tip */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-1">
                  {language === 'fr' ? 'Astuce de lecture' : 'Reading tip'}
                </h4>
                <p className="text-sm text-slate-400">
                  {language === 'fr'
                    ? 'Cliquez sur n\'importe quel mot grec pour voir sa traduction, son lemme et son analyse morphologique.'
                    : 'Click on any Greek word to see its translation, lemma, and morphological analysis.'}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Word Modal */}
      <AnimatePresence>
        {selectedWord && (
          <WordModal
            token={selectedWord}
            onClose={() => setSelectedWord(null)}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
