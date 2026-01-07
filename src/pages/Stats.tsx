import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeckStore } from '../stores/deckStore';
import { useProgressStore } from '../stores/progressStore';
import { GlassCard, StatCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ProgressBar, ProgressRing } from '../components/ui/ProgressRing';
import { Heatmap } from '../components/ui/Heatmap';
import { GlassFilter } from '../components/ui/LiquidGlass';
import { useI18n } from '../lib/i18n';
import {
  getLearningCurve,
  getRetentionPredictions,
  getWeakPoints,
  getStudyPatterns,
  getOverallProgress,
  getOptimalReviewCards,
  type LearningCurvePoint,
  type RetentionPrediction,
  type WeakPoint,
  type StudyPatternInsight,
  type OverallProgress,
} from '../lib/analytics';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Zap,
  AlertTriangle,
  Brain,
  Flame,
  Award,
  AlertCircle,
  ChevronRight,
  Activity,
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

// Simple bar chart component
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}

function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-12 text-right">{item.label}</span>
          <div className="flex-1 h-6 bg-white/[0.04] rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`h-full ${item.color || 'bg-blue-500/60'}`}
            />
          </div>
          <span className="text-xs text-slate-400 w-8">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Learning curve chart
function LearningCurveChart({ data }: { data: LearningCurvePoint[] }) {
  if (data.length === 0) return <p className="text-slate-500 text-sm">Pas assez de données</p>;

  const maxCards = Math.max(...data.map(d => d.totalCards), 1);
  const chartHeight = 150;
  const chartWidth = data.length * 20;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="min-w-full" style={{ minWidth: chartWidth }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line
            key={pct}
            x1="0"
            y1={chartHeight - (pct / 100) * chartHeight}
            x2={chartWidth}
            y2={chartHeight - (pct / 100) * chartHeight}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Mastered area */}
        <motion.path
          d={`
            M 0 ${chartHeight}
            ${data.map((d, i) => `L ${i * 20 + 10} ${chartHeight - (d.masteredCards / maxCards) * chartHeight}`).join(' ')}
            L ${(data.length - 1) * 20 + 10} ${chartHeight}
            Z
          `}
          fill="url(#masteredGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Learning area */}
        <motion.path
          d={`
            M 0 ${chartHeight}
            ${data.map((d, i) => {
              const masteredY = chartHeight - (d.masteredCards / maxCards) * chartHeight;
              const learningY = masteredY - (d.learningCards / maxCards) * chartHeight;
              return `L ${i * 20 + 10} ${learningY}`;
            }).join(' ')}
            L ${(data.length - 1) * 20 + 10} ${chartHeight - (data[data.length - 1].masteredCards / maxCards) * chartHeight}
            ${data.slice().reverse().map((d, i) => {
              const idx = data.length - 1 - i;
              return `L ${idx * 20 + 10} ${chartHeight - (d.masteredCards / maxCards) * chartHeight}`;
            }).join(' ')}
            Z
          `}
          fill="url(#learningGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="masteredGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </linearGradient>
          <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.3)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.05)" />
          </linearGradient>
        </defs>

        {/* X-axis labels (every 7 days) */}
        {data.filter((_, i) => i % 7 === 0 || i === data.length - 1).map((d, i, arr) => {
          const originalIndex = data.indexOf(d);
          return (
            <text
              key={i}
              x={originalIndex * 20 + 10}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-[10px] fill-slate-500"
            >
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-slate-400">Maîtrisées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-400">En apprentissage</span>
        </div>
      </div>
    </div>
  );
}

// Card maturity distribution
interface MaturityData {
  new: number;
  learning: number;
  young: number;
  mature: number;
}

function MaturityChart({ data }: { data: MaturityData }) {
  const total = data.new + data.learning + data.young + data.mature;
  if (total === 0) return null;

  const segments = [
    { label: 'Nouvelles', value: data.new, color: 'bg-blue-500' },
    { label: 'Apprentissage', value: data.learning, color: 'bg-amber-500' },
    { label: 'Jeunes', value: data.young, color: 'bg-emerald-500' },
    { label: 'Matures', value: data.mature, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-4 flex rounded-full overflow-hidden bg-white/[0.04]">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.value / total) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`${seg.color} h-full`}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${seg.color}`} />
            <span className="text-xs text-slate-400">
              {seg.label} ({seg.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Retention prediction card
function RetentionCard({ prediction }: { prediction: RetentionPrediction }) {
  const getRetentionColor = (retention: number) => {
    if (retention < 30) return 'text-red-400';
    if (retention < 60) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getRetentionBg = (retention: number) => {
    if (retention < 30) return 'bg-red-500/20';
    if (retention < 60) return 'bg-amber-500/20';
    return 'bg-emerald-500/20';
  };

  return (
    <motion.div
      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${getRetentionBg(prediction.currentRetention)} flex items-center justify-center`}>
          <span className={`text-sm font-bold ${getRetentionColor(prediction.currentRetention)}`}>
            {prediction.currentRetention}%
          </span>
        </div>
        <div>
          <span className="greek-text text-slate-200 block">{prediction.greek}</span>
          <span className="text-xs text-slate-500">
            {prediction.daysUntilForgotten === 0
              ? 'Révision urgente'
              : `${prediction.daysUntilForgotten}j avant oubli`}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500" />
    </motion.div>
  );
}

// Weak point card
function WeakPointCard({ weakPoint }: { weakPoint: WeakPoint }) {
  return (
    <motion.div
      className={`p-4 rounded-xl ${weakPoint.needsWork ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.04]'}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-slate-200">{weakPoint.category}</span>
        {weakPoint.needsWork && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            Attention
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-slate-200">{weakPoint.accuracy}%</div>
          <div className="text-xs text-slate-500">Précision</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-200">{weakPoint.avgLapses}</div>
          <div className="text-xs text-slate-500">Échecs moy.</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-200">{weakPoint.totalCards}</div>
          <div className="text-xs text-slate-500">Cartes</div>
        </div>
      </div>
    </motion.div>
  );
}

// Study insights panel
function StudyInsightsPanel({ patterns, optimalReview }: {
  patterns: StudyPatternInsight;
  optimalReview: { urgent: number; recommended: number; optional: number };
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="text-center p-3 rounded-xl bg-white/[0.04]">
        <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-slate-200">{patterns.currentStreak}</div>
        <div className="text-xs text-slate-500">Série actuelle</div>
      </div>
      <div className="text-center p-3 rounded-xl bg-white/[0.04]">
        <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-slate-200">{patterns.longestStreak}</div>
        <div className="text-xs text-slate-500">Record</div>
      </div>
      <div className="text-center p-3 rounded-xl bg-white/[0.04]">
        <Activity className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-slate-200">{patterns.consistency}%</div>
        <div className="text-xs text-slate-500">Régularité (30j)</div>
      </div>
      <div className="text-center p-3 rounded-xl bg-white/[0.04]">
        <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-slate-200">{patterns.avgSessionLength}m</div>
        <div className="text-xs text-slate-500">Session moy.</div>
      </div>
    </div>
  );
}

// Overall progress panel
function OverallProgressPanel({ progress }: { progress: OverallProgress }) {
  const levelLabels = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    fluent: 'Fluide',
  };

  const levelColors = {
    beginner: 'text-blue-400',
    intermediate: 'text-emerald-400',
    advanced: 'text-purple-400',
    fluent: 'text-amber-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-200">Niveau estimé</h4>
          <p className={`text-2xl font-bold ${levelColors[progress.estimatedReadingLevel]}`}>
            {levelLabels[progress.estimatedReadingLevel]}
          </p>
        </div>
        <ProgressRing
          progress={progress.retentionRate}
          size={80}
          strokeWidth={6}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Vocabulaire</span>
            <span className="text-xs text-slate-400">
              {progress.masteredVocab}/{progress.totalVocab}
            </span>
          </div>
          <ProgressBar
            progress={(progress.masteredVocab / Math.max(progress.totalVocab, 1)) * 100}
            color="blue"
            size="sm"
          />
        </div>
        <div className="p-3 rounded-xl bg-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Grammaire</span>
            <span className="text-xs text-slate-400">
              {progress.masteredGrammar}/{progress.totalGrammar}
            </span>
          </div>
          <ProgressBar
            progress={(progress.masteredGrammar / Math.max(progress.totalGrammar, 1)) * 100}
            color="purple"
            size="sm"
          />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Couverture du NT</span>
          <span className="text-xs text-slate-400">{progress.vocabularyCoverage}%</span>
        </div>
        <ProgressBar progress={progress.vocabularyCoverage} color="amber" size="sm" />
        <p className="text-xs text-slate-500 mt-2">
          Pourcentage du vocabulaire haute fréquence maîtrisé
        </p>
      </div>
    </div>
  );
}

export function Stats() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { vocabCards, grammarCards, loadCards, isLoading: cardsLoading } = useDeckStore();
  const {
    progress,
    stats,
    heatmapData,
    loadProgress,
    loadStats,
    loadHeatmapData,
    isLoading: progressLoading,
  } = useProgressStore();

  // Advanced analytics state
  const [learningCurve, setLearningCurve] = useState<LearningCurvePoint[]>([]);
  const [retentionPredictions, setRetentionPredictions] = useState<RetentionPrediction[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [studyPatterns, setStudyPatterns] = useState<StudyPatternInsight | null>(null);
  const [overallProgress, setOverallProgress] = useState<OverallProgress | null>(null);
  const [optimalReview, setOptimalReview] = useState({ urgent: 0, recommended: 0, optional: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadCards();
    loadProgress();
    loadStats();
    loadHeatmapData();
  }, [loadCards, loadProgress, loadStats, loadHeatmapData]);

  // Load advanced analytics
  useEffect(() => {
    async function loadAnalytics() {
      setAnalyticsLoading(true);
      try {
        const [curve, predictions, weak, patterns, overall, optimal] = await Promise.all([
          getLearningCurve(30),
          getRetentionPredictions(10),
          getWeakPoints(),
          getStudyPatterns(),
          getOverallProgress(),
          getOptimalReviewCards(),
        ]);

        setLearningCurve(curve);
        setRetentionPredictions(predictions);
        setWeakPoints(weak.slice(0, 6)); // Top 6 weak points
        setStudyPatterns(patterns);
        setOverallProgress(overall);
        setOptimalReview(optimal);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const allCards = useMemo(() => [...vocabCards, ...grammarCards], [vocabCards, grammarCards]);

  // Calculate card maturity distribution
  const maturityData = useMemo((): MaturityData => {
    const data = { new: 0, learning: 0, young: 0, mature: 0 };

    allCards.forEach(card => {
      if (card.reps === 0) {
        data.new++;
      } else if (card.reps < 3) {
        data.learning++;
      } else if (card.interval < 21) {
        data.young++;
      } else {
        data.mature++;
      }
    });

    return data;
  }, [allCards]);

  // Calculate forecast (cards due per day for next 7 days)
  const forecastData = useMemo(() => {
    const forecast: { label: string; value: number; color: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);

      const dueCount = allCards.filter(card => {
        const dueDate = new Date(card.due);
        return dueDate >= targetDate && dueDate < nextDate;
      }).length;

      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const label = i === 0 ? 'Auj.' : dayNames[targetDate.getDay()];

      forecast.push({
        label,
        value: dueCount,
        color: i === 0 ? 'bg-blue-500/60' : 'bg-slate-500/40',
      });
    }

    return forecast;
  }, [allCards]);

  // Calculate leech cards
  const leechCards = useMemo(() =>
    allCards.filter(card => card.lapses >= 8),
    [allCards]
  );

  const isLoading = cardsLoading || progressLoading;

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
      {/* SVG Glass Filter */}
      <GlassFilter />

      <motion.div
        className="max-w-6xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header className="flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              {t('back')}
            </Button>
            <h1 className="text-2xl font-bold text-slate-100">{t('statistics_title')}</h1>
          </div>
        </motion.header>

        {/* Overview stats */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
          <StatCard
            title={t('total_reviews')}
            value={progress?.totalReviews || 0}
            icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
          />
          <StatCard
            title={t('retention')}
            value={`${overallProgress?.retentionRate || stats?.retentionRate || 0}%`}
            icon={<Target className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Temps moyen"
            value={`${studyPatterns?.avgSessionLength || stats?.avgSessionTime || 0}m`}
            icon={<Clock className="w-5 h-5 text-amber-400" />}
          />
          <StatCard
            title="Sessions"
            value={stats?.totalSessions || 0}
            icon={<Zap className="w-5 h-5 text-purple-400" />}
          />
        </motion.div>

        {/* Study insights */}
        {studyPatterns && (
          <motion.div variants={itemVariants}>
            <GlassCard glow="purple">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Habitudes d'étude
              </h3>
              <StudyInsightsPanel patterns={studyPatterns} optimalReview={optimalReview} />
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Meilleur jour:</span>
                  <span className="text-slate-300">{studyPatterns.bestDayOfWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Meilleur moment:</span>
                  <span className="text-slate-300">{studyPatterns.bestTimeOfDay}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Overall progress */}
        {overallProgress && (
          <motion.div className="grid lg:grid-cols-2 gap-6" variants={itemVariants}>
            <GlassCard glow="emerald">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Progression globale
              </h3>
              <OverallProgressPanel progress={overallProgress} />
            </GlassCard>

            {/* Card maturity */}
            <GlassCard glow="blue">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Maturité des cartes
              </h3>
              <MaturityChart data={maturityData} />
            </GlassCard>
          </motion.div>
        )}

        {/* Learning curve */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="purple">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Courbe d'apprentissage (30 jours)
            </h3>
            {analyticsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <LearningCurveChart data={learningCurve} />
            )}
          </GlassCard>
        </motion.div>

        {/* Two column: Forecast + Retention */}
        <motion.div className="grid lg:grid-cols-2 gap-6" variants={itemVariants}>
          {/* Forecast */}
          <GlassCard glow="blue">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Prévision (7 jours)
            </h3>
            <BarChart data={forecastData} />

            {/* Optimal review summary */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-red-500/10">
                <div className="text-lg font-bold text-red-400">{optimalReview.urgent}</div>
                <div className="text-xs text-slate-500">Urgent</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <div className="text-lg font-bold text-amber-400">{optimalReview.recommended}</div>
                <div className="text-xs text-slate-500">Recommandé</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <div className="text-lg font-bold text-emerald-400">{optimalReview.optional}</div>
                <div className="text-xs text-slate-500">Optionnel</div>
              </div>
            </div>
          </GlassCard>

          {/* Retention predictions */}
          <GlassCard glow="amber">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Cartes à risque
            </h3>
            {analyticsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : retentionPredictions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {retentionPredictions.map((pred, i) => (
                  <RetentionCard key={i} prediction={pred} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">
                Aucune carte à risque pour le moment
              </p>
            )}
          </GlassCard>
        </motion.div>

        {/* Weak points */}
        {weakPoints.length > 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard glow="blue">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Points faibles par catégorie
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weakPoints.map((wp, i) => (
                  <WeakPointCard key={i} weakPoint={wp} />
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Activity heatmap */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="emerald">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              {t('activity')}
            </h3>
            <Heatmap data={heatmapData} weeks={20} />
          </GlassCard>
        </motion.div>

        {/* Leech cards warning */}
        {leechCards.length > 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard glow="amber" className="border-amber-500/30">
              <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cartes problématiques ({leechCards.length})
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Ces cartes ont été échouées 8+ fois et nécessitent une attention particulière.
              </p>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {leechCards.slice(0, 10).map((card, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <span className="greek-text text-slate-200">
                      {'greek' in card ? card.greek : card.prompt}
                    </span>
                    <span className="text-xs text-amber-400 font-medium">{card.lapses} échecs</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
