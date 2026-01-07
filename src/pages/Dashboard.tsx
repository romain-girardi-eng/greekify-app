import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeckStore } from '../stores/deckStore';
import { useProgressStore, getXpProgress } from '../stores/progressStore';
import { useStudyFiltersStore } from '../stores/studyFiltersStore';
import { MagicBento } from '../components/ui/MagicBento';
import { Button, IconButton } from '../components/ui/Button';
import { ProgressBar, ProgressRing } from '../components/ui/ProgressRing';
import { Heatmap } from '../components/ui/Heatmap';
import { Confetti, StreakCelebration } from '../components/ui/Confetti';
import { GlassFilter } from '../components/ui/LiquidGlass';
import { StudyModeSelector } from '../components/study/StudyModeSelector';
import { useI18n, useGreeting } from '../lib/i18n';
import { useThemeStore } from '../stores/themeStore';
import {
  Play,
  Flame,
  Trophy,
  BookOpen,
  TrendingUp,
  Target,
  Star,
  Globe,
  Calendar,
  Sun,
  Moon,
  ChevronRight,
  GraduationCap,
  BookMarked,
  SlidersHorizontal,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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

export function Dashboard() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const greeting = useGreeting();
  const { theme, toggleTheme } = useThemeStore();
  const { vocabCards, grammarCards, loadCards, isLoading: cardsLoading } = useDeckStore();
  const {
    progress,
    stats,
    heatmapData,
    showConfetti,
    setShowConfetti,
    loadProgress,
    loadStats,
    loadHeatmapData,
    isLoading: progressLoading
  } = useProgressStore();

  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showStudyModeSelector, setShowStudyModeSelector] = useState(false);

  const { getFilterSummary, activePresetId, isCustomMode } = useStudyFiltersStore();

  useEffect(() => {
    loadCards();
    loadProgress();
    loadStats();
    loadHeatmapData();
  }, [loadCards, loadProgress, loadStats, loadHeatmapData]);

  useEffect(() => {
    if (showConfetti) {
      setShowStreakCelebration(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowStreakCelebration(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, setShowConfetti]);

  const isLoading = cardsLoading || progressLoading;

  const now = new Date();
  const dueVocab = vocabCards.filter((c) => new Date(c.due) <= now).length;
  const dueGrammar = grammarCards.filter((c) => new Date(c.due) <= now).length;
  const totalDue = dueVocab + dueGrammar;
  const newVocab = vocabCards.filter((c) => c.reps === 0).length;
  const newGrammar = grammarCards.filter((c) => c.reps === 0).length;

  // Prepare cards data for MagicBento
  const bentoCards = useMemo(() => [
    // Main Study Card
    {
      id: 'study',
      className: 'col-span-2 row-span-2',
      onClick: () => setShowStudyModeSelector(true),
      tint: 'blue' as const,
      children: (
        <div className="flex flex-col h-full justify-between p-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/[0.06]">
                  <Play className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  {t('todays_study')}
                </span>
              </div>
              {/* Filter indicator */}
              {(activePresetId !== 'all' || isCustomMode) && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{getFilterSummary()}</span>
                </div>
              )}
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-slate-100 mb-2">
              {totalDue}
            </h2>
            <p className="text-slate-500 text-sm">
              {t('due')} · {newVocab + newGrammar} {t('new_available')}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-slate-400">{t('start_studying')}</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      ),
    },
    // Streak
    {
      id: 'streak',
      tint: 'amber' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('streak')}</span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-slate-100">{progress?.streak || 0}</div>
            <p className="text-xs text-slate-500">{t('days')}</p>
          </div>
        </div>
      ),
    },
    // Retention
    {
      id: 'retention',
      tint: 'emerald' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('retention')}</span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-slate-100">{stats?.retentionRate || 0}%</div>
            <p className="text-xs text-slate-500">{t('accuracy')}</p>
          </div>
        </div>
      ),
    },
    // Vocabulary
    {
      id: 'vocab',
      onClick: () => navigate('/decks'),
      tint: 'cyan' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('vocabulary')}</span>
          </div>
          <div className="mt-auto space-y-2">
            <div className="text-sm text-slate-400">
              {vocabCards.filter((c) => c.reps >= 2).length} / {vocabCards.length}
            </div>
            <ProgressBar
              progress={vocabCards.length > 0 ? (vocabCards.filter((c) => c.reps >= 2).length / vocabCards.length) * 100 : 0}
              color="blue"
              size="sm"
            />
          </div>
        </div>
      ),
    },
    // Grammar
    {
      id: 'grammar',
      onClick: () => navigate('/grammar'),
      tint: 'emerald' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('grammar')}</span>
          </div>
          <div className="mt-auto space-y-2">
            <div className="text-sm text-slate-400">
              {grammarCards.filter((c) => c.reps >= 2).length} / {grammarCards.length}
            </div>
            <ProgressBar
              progress={grammarCards.length > 0 ? (grammarCards.filter((c) => c.reps >= 2).length / grammarCards.length) * 100 : 0}
              color="green"
              size="sm"
            />
          </div>
        </div>
      ),
    },
    // Achievements
    {
      id: 'achievements',
      className: 'col-span-2',
      tint: 'violet' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('achievements')}</span>
          </div>
          <div className="mt-auto">
            {progress && progress.achievements.filter(a => a.unlockedAt).length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {progress.achievements
                  .filter((a) => a.unlockedAt)
                  .slice(0, 6)
                  .map((achievement) => (
                    <div
                      key={achievement.id}
                      className="text-xl p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                      title={achievement.name}
                    >
                      {achievement.icon}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600">
                <Star className="w-4 h-4" />
                <span className="text-sm">{t('complete_first_review')}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    // Cards Learned
    {
      id: 'learned',
      tint: 'rose' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="w-5 h-5 text-rose-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('cards_learned')}</span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-slate-100">{progress?.totalCardsLearned || 0}</div>
            <p className="text-xs text-slate-500">{t('of')} {vocabCards.length + grammarCards.length}</p>
          </div>
        </div>
      ),
    },
    // Total Reviews
    {
      id: 'reviews',
      onClick: () => navigate('/stats'),
      tint: 'sky' as const,
      children: (
        <div className="flex flex-col h-full p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('total_reviews')}</span>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-slate-100">{progress?.totalReviews || 0}</div>
            <p className="text-xs text-slate-500">{t('all_time')}</p>
          </div>
        </div>
      ),
    },
  ], [t, navigate, totalDue, newVocab, newGrammar, progress, stats, vocabCards, grammarCards, activePresetId, isCustomMode, getFilterSummary]);

  // Quick action cards
  const actionCards = useMemo(() => [
    {
      id: 'action-decks',
      title: t('browse_decks'),
      description: t('manage_your_vocabulary_decks'),
      label: 'Decks',
      onClick: () => navigate('/decks'),
      tint: 'cyan' as const,
    },
    {
      id: 'action-grammar',
      title: t('grammar_tables'),
      description: t('explore_greek_grammar'),
      label: 'Grammar',
      onClick: () => navigate('/grammar'),
      tint: 'emerald' as const,
    },
    {
      id: 'action-reader',
      title: t('nt_reader'),
      description: t('read_greek_new_testament'),
      label: 'Reader',
      onClick: () => navigate('/reader'),
      tint: 'amber' as const,
    },
    {
      id: 'action-verses',
      title: language === 'fr' ? 'Versets' : 'Verses',
      description: language === 'fr' ? 'Mémoriser les Écritures' : 'Memorize Scripture',
      label: 'Verses',
      onClick: () => navigate('/verses'),
      tint: 'purple' as const,
    },
    {
      id: 'action-stats',
      title: t('statistics'),
      description: t('view_detailed_stats'),
      label: 'Stats',
      onClick: () => navigate('/stats'),
      tint: 'violet' as const,
    },
  ], [t, navigate, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 rounded-full mx-auto" />
            <div className="w-16 h-16 border-4 border-slate-400 border-t-transparent rounded-full mx-auto absolute inset-0 animate-spin" />
          </div>
          <p className="text-slate-400 mt-6 text-lg">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <GlassFilter />
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <StreakCelebration streak={progress?.streak || 0} show={showStreakCelebration} />

      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">
              {greeting}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {t('ready_to_study')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IconButton
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              aria-label={theme === 'dark' ? t('light_mode') : t('dark_mode')}
              glow={false}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-slate-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
            </IconButton>

            <Button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              variant="ghost"
              size="sm"
              icon={<Globe className="w-4 h-4 text-slate-500" />}
              glow={false}
            >
              <span className="uppercase font-medium text-slate-400">{language}</span>
            </Button>

            {progress && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-white/[0.06]">
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">{t('level')}</div>
                  <div className="text-lg font-semibold text-slate-300">
                    {progress.level}
                  </div>
                </div>
                <ProgressRing
                  progress={getXpProgress(progress.xp, progress.level)}
                  size={44}
                  strokeWidth={3}
                  color="blue"
                  label={`${progress.xp}`}
                />
              </div>
            )}
          </div>
        </motion.header>

        {/* Magic Bento Grid */}
        <motion.div variants={itemVariants}>
          <MagicBento
            cards={bentoCards}
            glowColor="186, 230, 253"
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            particleCount={6}
          />
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={itemVariants}>
          <div
            className="p-5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(200,220,255,0.08) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-slate-200">{t('activity')}</span>
            </div>
            <Heatmap data={heatmapData} weeks={20} />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <MagicBento
            cards={actionCards}
            glowColor="186, 230, 253"
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            particleCount={4}
          />
        </motion.div>
      </motion.div>

      {/* Study Mode Selector Modal */}
      <StudyModeSelector
        isOpen={showStudyModeSelector}
        onClose={() => setShowStudyModeSelector(false)}
        onStartStudy={() => {
          setShowStudyModeSelector(false);
          navigate('/study');
        }}
      />
    </div>
  );
}
