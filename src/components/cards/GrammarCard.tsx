import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GrammarCard as GrammarCardType, ReviewQuality, MorphologyComponents } from '../../lib/types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import { previewIntervals, isLeech } from '../../lib/srs';
import { Lightbulb, AlertTriangle } from 'lucide-react';

interface GrammarCardProps {
  card: GrammarCardType;
  onReview: (quality: ReviewQuality) => void;
}

// Parsing component options
const PARSING_OPTIONS: Record<keyof MorphologyComponents, string[]> = {
  person: ['1st', '2nd', '3rd'],
  number: ['singular', 'plural'],
  tense: ['present', 'imperfect', 'future', 'aorist', 'perfect', 'pluperfect'],
  voice: ['active', 'middle', 'passive'],
  mood: ['indicative', 'subjunctive', 'optative', 'imperative', 'infinitive', 'participle'],
  case: ['nominative', 'genitive', 'dative', 'accusative', 'vocative'],
  gender: ['masculine', 'feminine', 'neuter'],
};

export function GrammarCardComponent({ card, onReview }: GrammarCardProps) {
  const { t } = useI18n();
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Partial<MorphologyComponents>>({});
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Calculate interval previews for buttons
  const intervals = useMemo(() => previewIntervals(card), [card]);

  // Check if this is a leech card
  const cardIsLeech = isLeech(card);

  // Reset state when card changes
  useEffect(() => {
    setIsRevealed(false);
    setSelectedComponents({});
    setShowHint(false);
    setIsCorrect(null);
  }, [card.id]);

  // Determine which components to show based on card type
  const getRelevantComponents = (): (keyof MorphologyComponents)[] => {
    switch (card.type) {
      case 'parsing':
        // Show all components that have values in the answer
        return Object.keys(card.components).filter(
          (key) => card.components[key as keyof MorphologyComponents]
        ) as (keyof MorphologyComponents)[];
      case 'declension':
        return ['case', 'number', 'gender'];
      case 'conjugation':
        return ['person', 'number', 'tense', 'voice', 'mood'];
      default:
        return [];
    }
  };

  const relevantComponents = getRelevantComponents();

  const handleSelectComponent = (
    component: keyof MorphologyComponents,
    value: string
  ) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [component]: value,
    }));
  };

  const checkAnswer = () => {
    const correct = relevantComponents.every(
      (comp) => selectedComponents[comp] === card.components[comp]
    );
    setIsCorrect(correct);
    setIsRevealed(true);
  };

  const allSelected = relevantComponents.every(
    (comp) => selectedComponents[comp]
  );

  const formatComponentLabel = (key: string): string => {
    // Use translations for component labels
    const translationKey = key as keyof typeof PARSING_OPTIONS;
    return t(translationKey as any) || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const formatOptionLabel = (option: string): string => {
    // Use translations for option values
    return t(option as any) || option;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <GlassCard variant="elevated" padding="lg" glow="emerald" className="relative">
        {/* Card type indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {t(card.type as any) || card.type}
          </span>
          {card.reps === 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full">
              {t('new')}
            </span>
          )}
        </div>

        {/* Difficulty indicator */}
        <div className="absolute top-4 right-4">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-1.5 h-3 rounded-full ${
                  level <= card.difficulty / 2
                    ? 'bg-amber-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="text-center mt-8 mb-6">
          <p className="text-sm text-slate-500 mb-2">{t('parse_this')}</p>
          <h2 className="greek-text-large text-slate-100">
            {card.prompt.replace('Parse: ', '')}
          </h2>
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
              {/* Component selectors */}
              <div className="space-y-3">
                {relevantComponents.map((component) => (
                  <div key={component} className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-400">
                      {formatComponentLabel(component)}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PARSING_OPTIONS[component].map((option) => (
                        <motion.button
                          key={option}
                          onClick={() => handleSelectComponent(component, option)}
                          className={`px-3 py-1.5 text-sm rounded-lg border backdrop-blur-sm transition-all ${
                            selectedComponents[component] === option
                              ? 'bg-blue-500/30 border-blue-400/50 text-blue-200 shadow-[0_0_12px_rgba(96,165,250,0.2)]'
                              : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.12]'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {formatOptionLabel(option)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hint button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  icon={<Lightbulb className="w-4 h-4" />}
                >
                  {showHint ? t('hide_hint') : t('show_hint')}
                </Button>
              </div>

              {/* Hint display */}
              <AnimatePresence>
                {showHint && card.hint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-slate-500 text-sm"
                  >
                    {card.hint}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Check button */}
              <Button
                fullWidth
                variant="primary"
                onClick={checkAnswer}
                disabled={!allSelected}
              >
                {t('check_answer')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Result indicator */}
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

              {/* Answer comparison */}
              <div className="space-y-2">
                {relevantComponents.map((comp) => {
                  const isCompCorrect =
                    selectedComponents[comp] === card.components[comp];
                  return (
                    <div
                      key={comp}
                      className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.04]"
                    >
                      <span className="text-sm text-slate-400">
                        {formatComponentLabel(comp)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isCompCorrect && selectedComponents[comp] && (
                          <span className="text-sm text-red-400 line-through">
                            {formatOptionLabel(selectedComponents[comp]!)}
                          </span>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isCompCorrect ? 'text-emerald-400' : 'text-blue-400'
                          }`}
                        >
                          {formatOptionLabel(card.components[comp]!)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full answer */}
              <div className="text-center">
                <p className="text-lg font-medium text-slate-200">
                  {card.answer}
                </p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
