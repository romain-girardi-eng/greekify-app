import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, StatCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressRing';
import { GlassFilter } from '../components/ui/LiquidGlass';
import { useDeckStore } from '../stores/deckStore';
import { useI18n } from '../lib/i18n';
import type { VocabCard, GrammarCard } from '../lib/types';
import {
  ArrowLeft,
  Search,
  BookOpen,
  GraduationCap,
  Clock,
  Star,
  AlertTriangle,
  ChevronRight,
  Layers,
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

type FilterType = 'all' | 'vocab' | 'grammar';
type SortType = 'frequency' | 'due' | 'progress' | 'difficulty';

interface CardItemProps {
  card: VocabCard | GrammarCard;
  type: 'vocab' | 'grammar';
  onClick: () => void;
}

function CardItem({ card, type, onClick }: CardItemProps) {
  const { t } = useI18n();
  const isDue = new Date(card.due) <= new Date();
  const isNew = card.reps === 0;
  const isLeech = card.lapses >= 8;
  const progress = Math.min(card.reps / 10, 1) * 100;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard hover glow={isDue ? 'blue' : 'none'} padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${type === 'vocab' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
              {type === 'vocab' ? (
                <BookOpen className={`w-4 h-4 ${type === 'vocab' ? 'text-blue-400' : 'text-emerald-400'}`} />
              ) : (
                <GraduationCap className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="greek-text text-slate-100 truncate">
                  {type === 'vocab' ? (card as VocabCard).greek : (card as GrammarCard).prompt.replace('Parse: ', '')}
                </span>
                {isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-300 rounded">
                    {t('new')}
                  </span>
                )}
                {isLeech && (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {type === 'vocab' ? (card as VocabCard).gloss : (card as GrammarCard).answer}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-3">
            {isDue && (
              <Clock className="w-4 h-4 text-blue-400" />
            )}
            <div className="w-16">
              <ProgressBar progress={progress} size="sm" color={progress > 80 ? 'green' : progress > 40 ? 'blue' : 'amber'} />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function DeckBrowser() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { vocabCards, grammarCards, loadCards, isLoading } = useDeckStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('frequency');

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let cards: Array<{ card: VocabCard | GrammarCard; type: 'vocab' | 'grammar' }> = [];

    // Add cards based on filter
    if (filter === 'all' || filter === 'vocab') {
      cards.push(...vocabCards.map(card => ({ card, type: 'vocab' as const })));
    }
    if (filter === 'all' || filter === 'grammar') {
      cards.push(...grammarCards.map(card => ({ card, type: 'grammar' as const })));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(({ card, type }) => {
        if (type === 'vocab') {
          const v = card as VocabCard;
          return v.greek.toLowerCase().includes(query) ||
                 v.gloss.toLowerCase().includes(query) ||
                 (v.glossFr && v.glossFr.toLowerCase().includes(query));
        } else {
          const g = card as GrammarCard;
          return g.prompt.toLowerCase().includes(query) ||
                 g.answer.toLowerCase().includes(query);
        }
      });
    }

    // Sort
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          if (a.type === 'vocab' && b.type === 'vocab') {
            return (b.card as VocabCard).frequency - (a.card as VocabCard).frequency;
          }
          return 0;
        case 'due':
          return new Date(a.card.due).getTime() - new Date(b.card.due).getTime();
        case 'progress':
          return b.card.reps - a.card.reps;
        case 'difficulty':
          return b.card.easeFactor - a.card.easeFactor;
        default:
          return 0;
      }
    });

    return cards;
  }, [vocabCards, grammarCards, filter, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = vocabCards.length + grammarCards.length;
    const due = [...vocabCards, ...grammarCards].filter(c => new Date(c.due) <= new Date()).length;
    const learned = [...vocabCards, ...grammarCards].filter(c => c.reps > 0).length;
    const leeches = [...vocabCards, ...grammarCards].filter(c => c.lapses >= 8).length;
    return { total, due, learned, leeches };
  }, [vocabCards, grammarCards]);

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
          <p className="text-slate-400 mt-6 text-lg">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-100">{t('browse_decks')}</h1>
        </motion.header>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={itemVariants}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={<Layers className="w-5 h-5 text-blue-400" />}
          />
          <StatCard
            title={t('due')}
            value={stats.due}
            icon={<Clock className="w-5 h-5 text-amber-400" />}
          />
          <StatCard
            title="Apprises"
            value={stats.learned}
            icon={<Star className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Difficiles"
            value={stats.leeches}
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
          <div className="flex-1">
            <SearchInput
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            >
              <option value="all">Tous</option>
              <option value="vocab">Vocabulaire</option>
              <option value="grammar">Grammaire</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            >
              <option value="frequency">Fréquence</option>
              <option value="due">Échéance</option>
              <option value="progress">Progression</option>
              <option value="difficulty">Difficulté</option>
            </select>
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div variants={itemVariants}>
          <p className="text-sm text-slate-500">
            {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} trouvée{filteredCards.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Cards list */}
        <motion.div className="space-y-2" variants={containerVariants}>
          <AnimatePresence mode="popLayout">
            {filteredCards.slice(0, 50).map(({ card, type }) => (
              <CardItem
                key={card.id}
                card={card}
                type={type}
                onClick={() => {/* TODO: Open card detail modal */}}
              />
            ))}
          </AnimatePresence>

          {filteredCards.length > 50 && (
            <motion.div variants={itemVariants} className="text-center py-4">
              <p className="text-sm text-slate-500">
                Affichage des 50 premières cartes sur {filteredCards.length}
              </p>
            </motion.div>
          )}

          {filteredCards.length === 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard className="text-center py-8">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Aucune carte trouvée</p>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
