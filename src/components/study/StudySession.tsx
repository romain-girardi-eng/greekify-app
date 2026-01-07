import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeckStore } from '../../stores/deckStore';
import { useProgressStore } from '../../stores/progressStore';
import { VocabCardComponent } from '../cards/VocabCard';
import { GrammarCardComponent } from '../cards/GrammarCard';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressRing';
import { XpGain, Confetti } from '../ui/Confetti';
import { GlassFilter } from '../ui/LiquidGlass';
import type { ReviewQuality } from '../../lib/types';
import { useI18n } from '../../lib/i18n';
import { X, Flame, Clock, Sparkles } from 'lucide-react';

export function StudySession() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    studyQueue,
    currentCardIndex,
    isLoading,
    buildStudyQueue,
    reviewCard,
    nextCard,
    getCurrentCard,
    getQueueStats,
    checkLearningCards,
    getLearningWaitTime,
  } = useDeckStore();

  const { recordReview, progress, lastXpGain, showConfetti, setShowConfetti } = useProgressStore();

  const [sessionStartTime] = useState(Date.now());
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const [learningWaitTime, setLearningWaitTime] = useState<number | null>(null);

  // Build study queue on mount
  useEffect(() => {
    buildStudyQueue();
  }, [buildStudyQueue]);

  // Check for due learning cards periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkLearningCards();
      const waitTime = getLearningWaitTime();
      setLearningWaitTime(waitTime);
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [checkLearningCards, getLearningWaitTime]);

  const currentCard = getCurrentCard();
  const stats = getQueueStats();

  const handleReview = async (quality: ReviewQuality) => {
    if (!currentCard) return;

    const isNewCard =
      currentCard.type === 'vocab' || currentCard.type === 'grammar'
        ? currentCard.card.reps === 0
        : false;

    // Update SRS
    await reviewCard(quality);

    // Record progress
    await recordReview(quality, isNewCard);

    // Show XP gain animation for correct answers
    if (quality >= 3) {
      setShowXpGain(true);
      setTimeout(() => setShowXpGain(false), 1500);
    }

    // Update local stats
    setCardsReviewed((prev) => prev + 1);
    if (quality >= 3) {
      setCorrectCount((prev) => prev + 1);
    }

    // Move to next card or show completion
    if (currentCardIndex < studyQueue.length - 1) {
      nextCard();
    } else {
      setShowComplete(true);
    }
  };

  const progress_percent =
    stats.total > 0 ? ((stats.total - stats.remaining) / stats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-400/20 rounded-full mx-auto" />
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto absolute inset-0 animate-spin" />
          </div>
          <p className="text-slate-400 mt-6 text-lg">{t('loading_cards')}</p>
        </motion.div>
      </div>
    );
  }

  if (studyQueue.length === 0 && !showComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassFilter />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard variant="elevated" glow="emerald" className="max-w-md text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              {t('all_done')}
            </h2>
            <p className="text-slate-400 mb-6">
              {t('all_done_message')}
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              {t('back_to_dashboard')}
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (showComplete) {
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 60000);
    const accuracy =
      cardsReviewed > 0 ? Math.round((correctCount / cardsReviewed) * 100) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassFilter />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <GlassCard variant="elevated" glow="amber" className="text-center relative overflow-hidden">
            {/* Background gradient animation */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' as const, stiffness: 300 }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-2xl font-bold text-slate-100">
                    {t('session_complete')}
                  </h2>
                </div>
                <p className="text-slate-400 mb-6">{t('great_work')}</p>
              </motion.div>

              {/* Stats grid */}
              <motion.div
                className="grid grid-cols-3 gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center p-3 rounded-xl bg-white/[0.04]">
                  <div className="text-2xl font-bold text-blue-400">
                    {cardsReviewed}
                  </div>
                  <div className="text-xs text-slate-500">{t('cards')}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.04]">
                  <div className="text-2xl font-bold text-emerald-400">
                    {accuracy}%
                  </div>
                  <div className="text-xs text-slate-500">{t('accuracy')}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.04]">
                  <div className="text-2xl font-bold text-amber-400">
                    {sessionDuration}m
                  </div>
                  <div className="text-xs text-slate-500">{t('time')}</div>
                </div>
              </motion.div>

              {/* Streak info */}
              {progress && progress.streak > 0 && (
                <motion.div
                  className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 mx-auto w-fit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Flame className="w-5 h-5" />
                  <span className="font-medium">
                    {progress.streak} {t('day_streak')}
                  </span>
                </motion.div>
              )}

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setShowComplete(false);
                    setCardsReviewed(0);
                    setCorrectCount(0);
                    buildStudyQueue();
                  }}
                >
                  {t('study_more')}
                </Button>
                <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
                  {t('back_to_dashboard')}
                </Button>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* SVG Glass Filter */}
      <GlassFilter />

      {/* XP Gain animation */}
      <XpGain amount={lastXpGain} show={showXpGain && lastXpGain > 0} />

      {/* Confetti for streak milestones */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <header className="sticky top-0 z-10 p-4 bg-slate-900/80 backdrop-blur-lg border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            icon={<X className="w-4 h-4" />}
          >
            {t('exit')}
          </Button>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="text-blue-400">
                {stats.new} {t('new')}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400">
                {stats.review} {t('review')}
              </span>
              {stats.learning > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stats.learning}
                    {learningWaitTime !== null && learningWaitTime > 0 && (
                      <span className="text-xs opacity-70">
                        ({Math.floor(learningWaitTime / 60)}:{String(learningWaitTime % 60).padStart(2, '0')})
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>

            {/* Progress */}
            <div className="w-32">
              <ProgressBar
                progress={progress_percent}
                color="blue"
                size="sm"
              />
            </div>
            <span className="text-sm text-slate-400">
              {stats.total - stats.remaining}/{stats.total}
            </span>
          </div>

          {/* Streak */}
          {progress && progress.streak > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{progress.streak}</span>
            </div>
          )}
        </div>
      </header>

      {/* Card area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              {currentCard.type === 'vocab' && (
                <VocabCardComponent
                  card={currentCard.card}
                  onReview={handleReview}
                />
              )}
              {currentCard.type === 'grammar' && (
                <GrammarCardComponent
                  card={currentCard.card}
                  onReview={handleReview}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Keyboard shortcuts hint */}
      <footer className="p-4 text-center">
        <p className="text-xs text-slate-600">
          {t('press_1_4')}
        </p>
      </footer>
    </div>
  );
}
