import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard as VocabCardType, ReviewQuality } from '../../lib/types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { checkAnswer } from '../../lib/utils';
import { previewIntervals, isLeech } from '../../lib/srs';
import { useI18n } from '../../lib/i18n';
import { useSwipe } from '../../hooks/useSwipe';
import { Eye, Lightbulb, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import StarBorder from '../StarBorder';
import ShinyText from '../ShinyText';

interface VocabCardProps {
  card: VocabCardType;
  onReview: (quality: ReviewQuality) => void;
  mode?: 'type' | 'flip' | 'multiple-choice';
}

export function VocabCardComponent({
  card,
  onReview,
  mode = 'type',
}: VocabCardProps) {
  const { t, language } = useI18n();

  // Use French gloss when in French, fall back to English
  const displayGloss = language === 'fr' && card.glossFr ? card.glossFr : card.gloss;

  // Calculate interval previews for buttons
  const intervals = useMemo(() => previewIntervals(card), [card]);

  // Check if this is a leech card
  const cardIsLeech = isLeech(card);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Theme detection
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsLightTheme(theme === 'light');
    };
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Swipe handling for mobile
  const handleSwipeReview = useCallback((rating: ReviewQuality) => {
    if (isRevealed) {
      onReview(rating);
    }
  }, [isRevealed, onReview]);

  const { handlers: swipeHandlers, swipeOffset, isSwiping } = useSwipe({
    onSwipeRight: () => handleSwipeReview(3), // Good
    onSwipeLeft: () => handleSwipeReview(1),  // Again
    threshold: 80,
  });

  // Focus input on mount
  useEffect(() => {
    if (mode === 'type' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [card.id, mode]);

  // Reset state when card changes
  useEffect(() => {
    setIsRevealed(false);
    setUserAnswer('');
    setShowHint(false);
    setIsCorrect(null);
  }, [card.id]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userAnswer.trim()) return;

    // Check against both French and English glosses
    const correct = checkAnswer(userAnswer, displayGloss) ||
                   (card.glossFr && checkAnswer(userAnswer, card.glossFr)) ||
                   checkAnswer(userAnswer, card.gloss);
    setIsCorrect(correct);
    setIsRevealed(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRevealed) {
      handleSubmit();
    } else if (isRevealed) {
      // Number keys 1-4 for rating
      if (['1', '2', '3', '4'].includes(e.key)) {
        onReview(parseInt(e.key) as ReviewQuality);
      }
    }
  };

  const getHint = () => {
    const words = displayGloss.split(',')[0].trim();
    if (words.length <= 2) return words;
    return `${words[0]}${'_'.repeat(words.length - 2)}${words[words.length - 1]}`;
  };

  // Get swipe indicator colors
  const getSwipeIndicator = () => {
    if (!isSwiping || !isRevealed) return null;

    if (swipeOffset.x > 50) {
      return { color: 'emerald', label: t('good'), side: 'right' };
    } else if (swipeOffset.x < -50) {
      return { color: 'red', label: t('again'), side: 'left' };
    }
    return null;
  };

  const swipeIndicator = getSwipeIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto relative"
    >
      {/* Swipe indicators */}
      {isRevealed && (
        <>
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${
            swipeIndicator?.side === 'left' ? 'opacity-100' : 'opacity-20'
          }`}>
            <div className="flex items-center gap-2 text-red-400">
              <ArrowLeft className="w-6 h-6" />
              <span className="text-sm font-medium hidden sm:inline">{t('again')}</span>
            </div>
          </div>
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${
            swipeIndicator?.side === 'right' ? 'opacity-100' : 'opacity-20'
          }`}>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="text-sm font-medium hidden sm:inline">{t('good')}</span>
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </>
      )}

      <motion.div
        {...(isRevealed ? swipeHandlers : {})}
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
          glow={swipeIndicator?.side === 'right' ? 'emerald' : swipeIndicator?.side === 'left' ? 'amber' : 'blue'}
          className={`relative transition-shadow duration-200 ${
            swipeIndicator?.side === 'right' ? 'shadow-lg shadow-emerald-500/20' :
            swipeIndicator?.side === 'left' ? 'shadow-lg shadow-red-500/20' : ''
          }`}
        >
        {/* Card type indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {t('vocabulary')}
          </span>
          {card.reps === 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
              {t('new')}
            </span>
          )}
        </div>

        {/* Frequency badge */}
        <div className="absolute top-4 right-4">
          <span className="text-xs text-slate-500">
            {card.frequency}{t('in_nt')}
          </span>
        </div>

        {/* Greek word */}
        <div className="text-center mt-8 mb-6">
          <h2 className="greek-text-large mb-2">
            <ShinyText
              text={card.greek}
              color={isLightTheme ? "#000000" : "#e2e8f0"}
              shineColor={isLightTheme ? "#7c3aed" : "#a78bfa"}
              speed={2}
              className="text-4xl"
            />
          </h2>
          {/* Lexical form: λόγος, -ου, ὁ */}
          {card.lexicalForm && card.lexicalForm !== card.greek && (
            <p className="text-sm text-slate-400 font-medium greek-text mb-1">
              {card.lexicalForm}
            </p>
          )}
          <p className="text-xs text-slate-600 mt-1">
            {card.partOfSpeech}
          </p>
        </div>

        {/* Answer section */}
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {mode === 'type' && (
                <form onSubmit={handleSubmit}>
                  <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('type_meaning')}
                    variant="large"
                    className="text-center"
                  />
                </form>
              )}

              {/* Hint button */}
              <div className="flex justify-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  icon={<Lightbulb className="w-4 h-4" />}
                >
                  {showHint ? t('hide_hint') : t('show_hint')}
                </Button>
                {mode === 'flip' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRevealed(true)}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    {t('reveal')}
                  </Button>
                )}
              </div>

              {/* Hint display */}
              <AnimatePresence>
                {showHint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-slate-500 text-sm"
                  >
                    {t('hint')}: {getHint()}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit button for type mode */}
              {mode === 'type' && userAnswer.trim() && (
                <div className="flex justify-center">
                  <StarBorder
                    as="button"
                    color="rgba(96,165,250,0.8)"
                    speed="4s"
                    className="star-border-vocab w-full"
                    onClick={() => handleSubmit()}
                  >
                    {t('check_answer')}
                  </StarBorder>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Result indicator */}
              {isCorrect !== null && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`text-center p-3 rounded-xl ${
                    isCorrect
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {isCorrect ? t('correct') : t('not_quite')}
                </motion.div>
              )}

              {/* Answer display */}
              <div className="text-center space-y-2">
                <p className="text-2xl font-semibold text-slate-100">
                  {displayGloss}
                </p>
                {/* Show the other language gloss as secondary */}
                {language === 'fr' && card.gloss && card.glossFr !== card.gloss && (
                  <p className="text-sm text-slate-500 italic">
                    EN: {card.gloss}
                  </p>
                )}
                {language === 'en' && card.glossFr && (
                  <p className="text-sm text-slate-500 italic">
                    FR: {card.glossFr}
                  </p>
                )}
                {card.extendedGloss && (
                  <p className="text-sm text-slate-400">
                    {card.extendedGloss}
                  </p>
                )}
                {card.exampleVerse && (
                  <p className="text-xs text-slate-500 mt-2">
                    {t('example')}: {card.exampleVerse}
                  </p>
                )}
              </div>

              {/* Leech warning */}
              {cardIsLeech && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Carte difficile ({card.lapses} échecs)</span>
                </motion.div>
              )}

              {/* Rating buttons with interval preview */}
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
                {/* Mobile swipe hint */}
                <p className="text-center text-xs text-slate-600 sm:hidden">
                  {t('swipe_hint')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
