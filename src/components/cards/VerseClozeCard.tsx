/**
 * VerseClozeCard - Component for verse memorization with progressive cloze deletion
 *
 * Memorization Levels:
 * 1. Exposure - Read verse with full translation
 * 2. Cloze Easy - 1-2 words hidden
 * 3. Cloze Hard - 3-5 words hidden
 * 4. First Letters - Only first letters shown
 * 5. Full Recall - Type entire verse from memory
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VerseMemorizationCard, ReviewQuality, Token } from '../../lib/types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { previewIntervals, isLeech } from '../../lib/srs';
import { useI18n } from '../../lib/i18n';
import { useSwipe } from '../../hooks/useSwipe';
import { cn } from '../../lib/utils';
import {
  Eye,
  Lightbulb,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  Type,
  HelpCircle,
} from 'lucide-react';

interface VerseClozeCardProps {
  card: VerseMemorizationCard;
  onReview: (quality: ReviewQuality) => void;
}

// Level names for display
const levelNames = {
  1: { en: 'Exposure', fr: 'Découverte' },
  2: { en: 'Cloze Easy', fr: 'Texte à trous (facile)' },
  3: { en: 'Cloze Hard', fr: 'Texte à trous (difficile)' },
  4: { en: 'First Letters', fr: 'Premières lettres' },
  5: { en: 'Full Recall', fr: 'Récitation complète' },
};

// Level descriptions
const levelDescriptions = {
  1: { en: 'Read and familiarize yourself with the verse', fr: 'Lisez et familiarisez-vous avec le verset' },
  2: { en: 'Fill in 1-2 missing words', fr: 'Complétez 1-2 mots manquants' },
  3: { en: 'Fill in 3-5 missing words', fr: 'Complétez 3-5 mots manquants' },
  4: { en: 'Complete words from first letters only', fr: 'Complétez à partir des premières lettres' },
  5: { en: 'Type the entire verse from memory', fr: 'Récitez le verset entier de mémoire' },
};

export function VerseClozeCard({ card, onReview }: VerseClozeCardProps) {
  const { t, language } = useI18n();
  const level = card.memorizationLevel;

  // Calculate interval previews
  const intervals = useMemo(() => previewIntervals(card), [card]);
  const cardIsLeech = isLeech(card);

  // State
  const [isRevealed, setIsRevealed] = useState(level === 1); // Auto-reveal for exposure
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [fullAnswer, setFullAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showTranslation, setShowTranslation] = useState(level === 1);
  const [validationResults, setValidationResults] = useState<Record<number, boolean>>({});
  const [isFullAnswerCorrect, setIsFullAnswerCorrect] = useState<boolean | null>(null);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const fullInputRef = useRef<HTMLInputElement>(null);

  // Determine which tokens to hide based on level and clozePositions
  const hiddenIndices = useMemo(() => {
    if (level === 1) return []; // Exposure - show all
    if (level === 5) return []; // Full recall - handled differently

    // Use clozePositions if available, otherwise generate based on level
    if (card.clozePositions && card.clozePositions.length > 0) {
      if (level === 2) return card.clozePositions.slice(0, 2);
      if (level === 3) return card.clozePositions.slice(0, 5);
      if (level === 4) return card.clozePositions;
    }

    // Generate positions based on content words (skip articles, conjunctions)
    const contentWordIndices = card.tokens
      .map((token, idx) => ({ token, idx }))
      .filter(({ token }) => {
        const pos = token.partOfSpeech?.toLowerCase() || '';
        return !['article', 'conjunction', 'particle'].includes(pos);
      })
      .map(({ idx }) => idx);

    // Shuffle and pick based on level
    const shuffled = [...contentWordIndices].sort(() => Math.random() - 0.5);
    if (level === 2) return shuffled.slice(0, 2);
    if (level === 3) return shuffled.slice(0, 5);
    if (level === 4) return contentWordIndices; // All content words

    return [];
  }, [card.tokens, card.clozePositions, level]);

  // Swipe handling
  const handleSwipeReview = useCallback((rating: ReviewQuality) => {
    if (isRevealed) {
      onReview(rating);
    }
  }, [isRevealed, onReview]);

  const { handlers: swipeHandlers, swipeOffset, isSwiping } = useSwipe({
    onSwipeRight: () => handleSwipeReview(3),
    onSwipeLeft: () => handleSwipeReview(1),
    threshold: 80,
  });

  // Reset state when card changes
  useEffect(() => {
    setIsRevealed(level === 1);
    setUserAnswers({});
    setFullAnswer('');
    setShowHint(false);
    setShowTranslation(level === 1);
    setValidationResults({});
    setIsFullAnswerCorrect(null);
  }, [card.id, level]);

  // Focus first input
  useEffect(() => {
    if (level >= 2 && level <= 4) {
      const firstHidden = hiddenIndices[0];
      if (firstHidden !== undefined && inputRefs.current[firstHidden]) {
        inputRefs.current[firstHidden]?.focus();
      }
    } else if (level === 5 && fullInputRef.current) {
      fullInputRef.current.focus();
    }
  }, [card.id, level, hiddenIndices]);

  // Normalize Greek text for comparison
  const normalizeGreek = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[,.:;·]/g, '')
      .trim();
  };

  // Validate a single answer
  const validateAnswer = (index: number, answer: string): boolean => {
    const token = card.tokens[index];
    if (!token) return false;

    const normalized = normalizeGreek(answer);
    const expected = normalizeGreek(token.text);

    return normalized === expected;
  };

  // Validate all cloze answers
  const validateClozeAnswers = () => {
    const results: Record<number, boolean> = {};
    let allCorrect = true;

    hiddenIndices.forEach(idx => {
      const answer = userAnswers[idx] || '';
      const isCorrect = validateAnswer(idx, answer);
      results[idx] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setValidationResults(results);
    setIsRevealed(true);
    return allCorrect;
  };

  // Validate full recall answer
  const validateFullAnswer = () => {
    const userWords = fullAnswer.split(/\s+/).filter(w => w.length > 0);
    const expectedWords = card.tokens.map(t => t.text);

    // Check if word count matches and each word is correct
    if (userWords.length !== expectedWords.length) {
      setIsFullAnswerCorrect(false);
      setIsRevealed(true);
      return false;
    }

    const allCorrect = userWords.every((word, idx) =>
      normalizeGreek(word) === normalizeGreek(expectedWords[idx])
    );

    setIsFullAnswerCorrect(allCorrect);
    setIsRevealed(true);
    return allCorrect;
  };

  // Handle submit based on level
  const handleSubmit = () => {
    if (level === 5) {
      validateFullAnswer();
    } else if (level >= 2 && level <= 4) {
      validateClozeAnswers();
    } else {
      setIsRevealed(true);
    }
  };

  // Render word with cloze deletion or first letters
  const renderWord = (token: Token, index: number) => {
    const isHidden = hiddenIndices.includes(index);
    const userAnswer = userAnswers[index] || '';
    const validationResult = validationResults[index];

    // Level 1 - Show all
    if (level === 1) {
      return (
        <span key={index} className="greek-text text-slate-100">
          {token.text}{' '}
        </span>
      );
    }

    // Level 5 - Not rendered here (full input below)
    if (level === 5) {
      return null;
    }

    // Revealed - show correct answer with validation indicator
    if (isRevealed && isHidden) {
      return (
        <span
          key={index}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-lg mx-0.5",
            validationResult === true && "bg-emerald-500/20 text-emerald-200",
            validationResult === false && "bg-red-500/20 text-red-200"
          )}
        >
          <span className="greek-text">{token.text}</span>
          {validationResult === true && <CheckCircle2 className="w-3 h-3" />}
          {validationResult === false && <XCircle className="w-3 h-3" />}
        </span>
      );
    }

    // Not hidden - show normally
    if (!isHidden) {
      return (
        <span key={index} className="greek-text text-slate-100">
          {token.text}{' '}
        </span>
      );
    }

    // Hidden - show input or first letters
    if (level === 4) {
      // First letters mode
      const firstLetter = token.text.charAt(0);
      return (
        <span key={index} className="inline-block mx-0.5">
          <input
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswers(prev => ({ ...prev, [index]: e.target.value }))}
            placeholder={`${firstLetter}...`}
            className={cn(
              "w-24 px-2 py-1 text-center rounded-lg border transition-all greek-text",
              "bg-white/[0.06] border-white/[0.1] text-slate-200",
              "placeholder:text-slate-500 focus:outline-none focus:border-blue-400/50"
            )}
          />
        </span>
      );
    }

    // Cloze easy/hard - show blank input
    return (
      <span key={index} className="inline-block mx-0.5">
        <input
          ref={el => { inputRefs.current[index] = el; }}
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswers(prev => ({ ...prev, [index]: e.target.value }))}
          placeholder="..."
          className={cn(
            "w-20 px-2 py-1 text-center rounded-lg border transition-all greek-text",
            "bg-white/[0.06] border-white/[0.1] text-slate-200",
            "placeholder:text-slate-500 focus:outline-none focus:border-blue-400/50"
          )}
        />
      </span>
    );
  };

  // Get swipe indicator
  const getSwipeIndicator = () => {
    if (!isSwiping || !isRevealed) return null;
    if (swipeOffset.x > 50) return { side: 'right' };
    if (swipeOffset.x < -50) return { side: 'left' };
    return null;
  };

  const swipeIndicator = getSwipeIndicator();
  const translation = language === 'fr' ? card.translationFr : card.translationEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto relative"
    >
      {/* Swipe indicators */}
      {isRevealed && level !== 1 && (
        <>
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200",
            swipeIndicator?.side === 'left' ? 'opacity-100' : 'opacity-20'
          )}>
            <div className="flex items-center gap-2 text-red-400">
              <ArrowLeft className="w-6 h-6" />
              <span className="text-sm font-medium hidden sm:inline">{t('again')}</span>
            </div>
          </div>
          <div className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200",
            swipeIndicator?.side === 'right' ? 'opacity-100' : 'opacity-20'
          )}>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="text-sm font-medium hidden sm:inline">{t('good')}</span>
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </>
      )}

      <motion.div
        {...(isRevealed && level !== 1 ? swipeHandlers : {})}
        animate={{
          x: isRevealed && isSwiping ? swipeOffset.x * 0.3 : 0,
          rotate: isRevealed && isSwiping ? swipeOffset.x * 0.02 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ touchAction: isRevealed ? 'pan-y' : 'auto' }}
      >
        <GlassCard
          variant="elevated"
          padding="lg"
          glow={swipeIndicator?.side === 'right' ? 'emerald' : swipeIndicator?.side === 'left' ? 'amber' : 'purple'}
          className="relative"
        >
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {language === 'fr' ? 'Verset' : 'Verse'}
              </span>
              {card.reps === 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                  {t('new')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-lg",
                level === 1 && "bg-blue-500/20 text-blue-300",
                level === 2 && "bg-green-500/20 text-green-300",
                level === 3 && "bg-yellow-500/20 text-yellow-300",
                level === 4 && "bg-orange-500/20 text-orange-300",
                level === 5 && "bg-red-500/20 text-red-300"
              )}>
                {levelNames[level][language]}
              </span>
            </div>
          </div>

          {/* Reference */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-slate-200">{card.reference}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {levelDescriptions[level][language]}
            </p>
          </div>

          {/* Verse text */}
          <div className={cn(
            "text-center py-6 px-4 rounded-xl bg-white/[0.02] mb-4",
            level === 5 && !isRevealed && "min-h-[100px]"
          )}>
            {level === 5 && !isRevealed ? (
              // Full recall - empty canvas to type
              <textarea
                ref={fullInputRef as any}
                value={fullAnswer}
                onChange={(e) => setFullAnswer(e.target.value)}
                placeholder={language === 'fr' ? 'Tapez le verset en grec...' : 'Type the verse in Greek...'}
                className={cn(
                  "w-full h-32 px-4 py-3 text-center rounded-xl border transition-all greek-text text-lg resize-none",
                  "bg-white/[0.06] border-white/[0.1] text-slate-200",
                  "placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50"
                )}
              />
            ) : level === 5 && isRevealed ? (
              // Full recall - show comparison
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {language === 'fr' ? 'Votre réponse:' : 'Your answer:'}
                  </p>
                  <p className={cn(
                    "greek-text text-lg",
                    isFullAnswerCorrect ? "text-emerald-300" : "text-red-300"
                  )}>
                    {fullAnswer || '(vide)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {language === 'fr' ? 'Texte correct:' : 'Correct text:'}
                  </p>
                  <p className="greek-text text-lg text-slate-100">
                    {card.greekText}
                  </p>
                </div>
              </div>
            ) : (
              // Cloze modes
              <p className="greek-text text-xl leading-relaxed">
                {card.tokens.map((token, idx) => renderWord(token, idx))}
              </p>
            )}
          </div>

          {/* Translation toggle */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                showTranslation
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">
                {showTranslation
                  ? (language === 'fr' ? 'Cacher traduction' : 'Hide translation')
                  : (language === 'fr' ? 'Voir traduction' : 'Show translation')
                }
              </span>
            </button>
          </div>

          {/* Translation */}
          <AnimatePresence>
            {showTranslation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center px-4 py-3 rounded-xl bg-purple-500/10 mb-4"
              >
                <p className="text-slate-300">{translation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {!isRevealed ? (
            <div className="space-y-3">
              {/* Hint for cloze modes */}
              {level >= 2 && level <= 4 && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-slate-300"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showHint
                    ? (language === 'fr' ? 'Cacher les indices' : 'Hide hints')
                    : (language === 'fr' ? 'Voir les indices' : 'Show hints')
                  }
                </button>
              )}

              {/* Hints */}
              <AnimatePresence>
                {showHint && level >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-sm text-slate-500"
                  >
                    {hiddenIndices.map(idx => {
                      const token = card.tokens[idx];
                      return (
                        <span key={idx} className="inline-block mx-2">
                          {language === 'fr' ? token.gloss : token.gloss}
                        </span>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              {level !== 1 && (
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleSubmit}
                >
                  {language === 'fr' ? 'Vérifier' : 'Check'}
                </Button>
              )}

              {/* Continue button for exposure */}
              {level === 1 && (
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => onReview(3)}
                >
                  {language === 'fr' ? 'Continuer' : 'Continue'}
                </Button>
              )}
            </div>
          ) : level !== 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Leech warning */}
              {cardIsLeech && (
                <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{language === 'fr' ? `Verset difficile (${card.lapses} échecs)` : `Difficult verse (${card.lapses} failures)`}</span>
                </div>
              )}

              {/* Rating buttons */}
              <div className="space-y-3">
                <p className="text-center text-sm text-slate-500">
                  {t('how_well')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="danger"
                    onClick={() => onReview(1)}
                    className="flex-col py-3"
                  >
                    <span className="text-lg">1</span>
                    <span className="text-xs opacity-70">{t('again')}</span>
                    <span className="text-[10px] opacity-50 mt-1">{intervals.again}</span>
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => onReview(2)}
                    className="flex-col py-3"
                  >
                    <span className="text-lg">2</span>
                    <span className="text-xs opacity-70">{t('hard')}</span>
                    <span className="text-[10px] opacity-50 mt-1">{intervals.hard}</span>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => onReview(3)}
                    className="flex-col py-3"
                  >
                    <span className="text-lg">3</span>
                    <span className="text-xs opacity-70">{t('good')}</span>
                    <span className="text-[10px] opacity-50 mt-1">{intervals.good}</span>
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => onReview(4)}
                    className="flex-col py-3"
                  >
                    <span className="text-lg">4</span>
                    <span className="text-xs opacity-70">{t('easy')}</span>
                    <span className="text-[10px] opacity-50 mt-1">{intervals.easy}</span>
                  </Button>
                </div>
                <p className="text-center text-xs text-slate-600 hidden sm:block">
                  {t('press_1_4')}
                </p>
                <p className="text-center text-xs text-slate-600 sm:hidden">
                  {t('swipe_hint')}
                </p>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default VerseClozeCard;
