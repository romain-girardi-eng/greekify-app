'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  RotateCcw,
  Save,
  X,
  BookOpen,
  FileText,
  Layers,
  Filter,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FilterChip, FilterChipGroup, CardTypeToggle } from '../ui/FilterChip';
import { GlassButton } from '../ui/LiquidGlass';
import { useStudyFiltersStore } from '../../stores/studyFiltersStore';
import { useDeckStore } from '../../stores/deckStore';
import type {
  MoodFilter,
  TenseFilter,
  VoiceFilter,
  GrammarTypeFilter,
  PartOfSpeechFilter,
} from '../../lib/types';

// ============================================
// Collapsible Section Component
// ============================================
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'bg-white/[0.02] hover:bg-white/[0.04] transition-colors',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="text-sm font-medium text-slate-200">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded">
              {badge}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-3 border-t border-white/[0.06]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// Frequency Range Slider Component
// ============================================
interface FrequencySliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

const FrequencySlider: React.FC<FrequencySliderProps> = ({ min, max, onChange }) => {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max === Infinity ? 1000 : max);

  const presets = [
    { label: 'Tous', min: 0, max: Infinity },
    { label: '100+', min: 100, max: Infinity },
    { label: '50+', min: 50, max: Infinity },
    { label: '10-50', min: 10, max: 50 },
    { label: '<10', min: 0, max: 10 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((preset) => (
          <FilterChip
            key={preset.label}
            label={preset.label}
            active={min === preset.min && (max === preset.max || (preset.max === Infinity && max === Infinity))}
            onChange={() => {
              setLocalMin(preset.min);
              setLocalMax(preset.max === Infinity ? 1000 : preset.max);
              onChange(preset.min, preset.max);
            }}
            variant="default"
            size="sm"
            showCheckmark={false}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Min</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={localMin}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setLocalMin(val);
              onChange(val, localMax === 1000 ? Infinity : localMax);
            }}
            className="w-full px-3 py-1.5 text-sm bg-white/[0.06] border border-white/[0.1] rounded-lg text-slate-200 focus:outline-none focus:border-blue-400/50"
          />
        </div>
        <span className="text-slate-500 pt-5">—</span>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Max</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={localMax}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1000;
              setLocalMax(val);
              onChange(localMin, val >= 1000 ? Infinity : val);
            }}
            placeholder="∞"
            className="w-full px-3 py-1.5 text-sm bg-white/[0.06] border border-white/[0.1] rounded-lg text-slate-200 focus:outline-none focus:border-blue-400/50"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Mounce Chapter Selector
// ============================================
interface MounceChapterSelectorProps {
  selected: number[];
  onChange: (chapters: number[]) => void;
}

const MounceChapterSelector: React.FC<MounceChapterSelectorProps> = ({
  selected,
  onChange,
}) => {
  const chapters = Array.from({ length: 35 }, (_, i) => i + 1);

  const handleToggle = (chapter: number) => {
    if (selected.includes(chapter)) {
      onChange(selected.filter((c) => c !== chapter));
    } else {
      onChange([...selected, chapter].sort((a, b) => a - b));
    }
  };

  const handleSelectRange = (start: number, end: number) => {
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    onChange(range);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          label="Tous"
          active={selected.length === 0}
          onChange={() => onChange([])}
          size="sm"
          showCheckmark={false}
        />
        <FilterChip
          label="Ch. 1-10"
          active={selected.length === 10 && selected[0] === 1 && selected[9] === 10}
          onChange={() => handleSelectRange(1, 10)}
          size="sm"
          showCheckmark={false}
        />
        <FilterChip
          label="Ch. 11-20"
          active={selected.length === 10 && selected[0] === 11 && selected[9] === 20}
          onChange={() => handleSelectRange(11, 20)}
          size="sm"
          showCheckmark={false}
        />
        <FilterChip
          label="Ch. 21-35"
          active={selected.length === 15 && selected[0] === 21 && selected[14] === 35}
          onChange={() => handleSelectRange(21, 35)}
          size="sm"
          showCheckmark={false}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {chapters.map((chapter) => (
          <button
            key={chapter}
            onClick={() => handleToggle(chapter)}
            className={cn(
              'w-8 h-8 text-xs rounded-lg border transition-colors',
              selected.includes(chapter)
                ? 'bg-blue-500/25 border-blue-400/40 text-blue-200'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:bg-white/[0.08]'
            )}
          >
            {chapter}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Main FilterPanel Component
// ============================================
interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onSaveConfig,
}) => {
  const {
    activeFilters,
    isCustomMode,
    toggleCardType,
    toggleMood,
    toggleTense,
    toggleVoice,
    toggleGrammarType,
    togglePartOfSpeech,
    setFrequencyRange,
    setMounceChapters,
    toggleSRSFilter,
    resetToDefaults,
    getFilterSummary,
  } = useStudyFiltersStore();

  const { vocabCards, grammarCards } = useDeckStore();

  // Calculate matching card count
  const matchingCount = useMemo(() => {
    // This is a simplified count - in production you'd use the actual filter functions
    let vocabCount = vocabCards.length;
    let grammarCount = grammarCards.length;

    if (!activeFilters.cardTypes.vocab) vocabCount = 0;
    if (!activeFilters.cardTypes.grammar) grammarCount = 0;

    // Apply frequency filter to vocab
    if (activeFilters.cardTypes.vocab) {
      const { min, max } = activeFilters.vocabFilters.frequencyRange;
      vocabCount = vocabCards.filter(
        (c) => c.frequency >= min && c.frequency <= max
      ).length;
    }

    return {
      vocab: vocabCount,
      grammar: grammarCount,
      total: vocabCount + grammarCount,
    };
  }, [activeFilters, vocabCards, grammarCards]);

  // Mood options
  const moodOptions: Array<{ value: keyof MoodFilter; label: string }> = [
    { value: 'indicative', label: 'Indicatif' },
    { value: 'subjunctive', label: 'Subjonctif' },
    { value: 'imperative', label: 'Impératif' },
    { value: 'optative', label: 'Optatif' },
    { value: 'infinitive', label: 'Infinitif' },
    { value: 'participle', label: 'Participe' },
  ];

  // Tense options
  const tenseOptions: Array<{ value: keyof TenseFilter; label: string }> = [
    { value: 'present', label: 'Présent' },
    { value: 'imperfect', label: 'Imparfait' },
    { value: 'future', label: 'Futur' },
    { value: 'aorist', label: 'Aoriste' },
    { value: 'perfect', label: 'Parfait' },
    { value: 'pluperfect', label: 'Plus-que-parfait' },
  ];

  // Voice options
  const voiceOptions: Array<{ value: keyof VoiceFilter; label: string }> = [
    { value: 'active', label: 'Actif' },
    { value: 'middle', label: 'Moyen' },
    { value: 'passive', label: 'Passif' },
  ];

  // Grammar type options
  const grammarTypeOptions: Array<{ value: keyof GrammarTypeFilter; label: string }> = [
    { value: 'parsing', label: 'Analyse' },
    { value: 'declension', label: 'Déclinaison' },
    { value: 'conjugation', label: 'Conjugaison' },
    { value: 'syntax', label: 'Syntaxe' },
  ];

  // Part of speech options
  const posOptions: Array<{ value: keyof PartOfSpeechFilter; label: string }> = [
    { value: 'noun', label: 'Nom' },
    { value: 'verb', label: 'Verbe' },
    { value: 'adjective', label: 'Adjectif' },
    { value: 'adverb', label: 'Adverbe' },
    { value: 'pronoun', label: 'Pronom' },
    { value: 'preposition', label: 'Préposition' },
    { value: 'conjunction', label: 'Conjonction' },
    { value: 'particle', label: 'Particule' },
    { value: 'article', label: 'Article' },
    { value: 'other', label: 'Autre' },
  ];

  // Get selected values from filters
  const selectedMoods = Object.entries(activeFilters.grammarFilters.moods)
    .filter(([_, v]) => v)
    .map(([k]) => k as keyof MoodFilter);

  const selectedTenses = Object.entries(activeFilters.grammarFilters.tenses)
    .filter(([_, v]) => v)
    .map(([k]) => k as keyof TenseFilter);

  const selectedVoices = Object.entries(activeFilters.grammarFilters.voices)
    .filter(([_, v]) => v)
    .map(([k]) => k as keyof VoiceFilter);

  const selectedGrammarTypes = Object.entries(activeFilters.grammarFilters.grammarTypes)
    .filter(([_, v]) => v)
    .map(([k]) => k as keyof GrammarTypeFilter);

  const selectedPOS = Object.entries(activeFilters.vocabFilters.partsOfSpeech)
    .filter(([_, v]) => v)
    .map(([k]) => k as keyof PartOfSpeechFilter);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900/95 border-l border-white/[0.08] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Filtres d'étude</h2>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </GlassButton>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Card Types */}
          <CollapsibleSection
            title="Types de cartes"
            icon={<Layers className="w-4 h-4" />}
            defaultOpen={true}
          >
            <CardTypeToggle
              vocabEnabled={activeFilters.cardTypes.vocab}
              grammarEnabled={activeFilters.cardTypes.grammar}
              verseEnabled={activeFilters.cardTypes.verse}
              onToggleVocab={() => toggleCardType('vocab')}
              onToggleGrammar={() => toggleCardType('grammar')}
              onToggleVerse={() => toggleCardType('verse')}
            />
          </CollapsibleSection>

          {/* Grammar Filters - Only show if grammar is enabled */}
          {activeFilters.cardTypes.grammar && (
            <>
              <CollapsibleSection
                title="Modes grammaticaux"
                icon={<FileText className="w-4 h-4" />}
                badge={`${selectedMoods.length}/6`}
                defaultOpen={false}
              >
                <FilterChipGroup
                  options={moodOptions}
                  selected={selectedMoods}
                  onChange={(selected) => {
                    // Update each mood individually
                    moodOptions.forEach((opt) => {
                      const isSelected = selected.includes(opt.value);
                      if (isSelected !== activeFilters.grammarFilters.moods[opt.value]) {
                        toggleMood(opt.value);
                      }
                    });
                  }}
                  variant="mood"
                  showSelectAll
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Temps verbaux"
                badge={`${selectedTenses.length}/6`}
                defaultOpen={false}
              >
                <FilterChipGroup
                  options={tenseOptions}
                  selected={selectedTenses}
                  onChange={(selected) => {
                    tenseOptions.forEach((opt) => {
                      const isSelected = selected.includes(opt.value);
                      if (isSelected !== activeFilters.grammarFilters.tenses[opt.value]) {
                        toggleTense(opt.value);
                      }
                    });
                  }}
                  variant="tense"
                  showSelectAll
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Voix"
                badge={`${selectedVoices.length}/3`}
                defaultOpen={false}
              >
                <FilterChipGroup
                  options={voiceOptions}
                  selected={selectedVoices}
                  onChange={(selected) => {
                    voiceOptions.forEach((opt) => {
                      const isSelected = selected.includes(opt.value);
                      if (isSelected !== activeFilters.grammarFilters.voices[opt.value]) {
                        toggleVoice(opt.value);
                      }
                    });
                  }}
                  variant="voice"
                  showSelectAll
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Types d'exercices"
                badge={`${selectedGrammarTypes.length}/4`}
                defaultOpen={false}
              >
                <FilterChipGroup
                  options={grammarTypeOptions}
                  selected={selectedGrammarTypes}
                  onChange={(selected) => {
                    grammarTypeOptions.forEach((opt) => {
                      const isSelected = selected.includes(opt.value);
                      if (isSelected !== activeFilters.grammarFilters.grammarTypes[opt.value]) {
                        toggleGrammarType(opt.value);
                      }
                    });
                  }}
                  variant="grammar"
                  showSelectAll
                />
              </CollapsibleSection>
            </>
          )}

          {/* Vocabulary Filters - Only show if vocab is enabled */}
          {activeFilters.cardTypes.vocab && (
            <>
              <CollapsibleSection
                title="Parties du discours"
                icon={<BookOpen className="w-4 h-4" />}
                badge={`${selectedPOS.length}/10`}
                defaultOpen={false}
              >
                <FilterChipGroup
                  options={posOptions}
                  selected={selectedPOS}
                  onChange={(selected) => {
                    posOptions.forEach((opt) => {
                      const isSelected = selected.includes(opt.value);
                      if (isSelected !== activeFilters.vocabFilters.partsOfSpeech[opt.value]) {
                        togglePartOfSpeech(opt.value);
                      }
                    });
                  }}
                  variant="pos"
                  showSelectAll
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Fréquence NT"
                defaultOpen={false}
              >
                <FrequencySlider
                  min={activeFilters.vocabFilters.frequencyRange.min}
                  max={activeFilters.vocabFilters.frequencyRange.max}
                  onChange={(min, max) => setFrequencyRange(min, max)}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Chapitres Mounce"
                badge={
                  activeFilters.vocabFilters.mounceChapters.length === 0
                    ? 'Tous'
                    : activeFilters.vocabFilters.mounceChapters.length
                }
                defaultOpen={false}
              >
                <MounceChapterSelector
                  selected={activeFilters.vocabFilters.mounceChapters}
                  onChange={setMounceChapters}
                />
              </CollapsibleSection>
            </>
          )}

          {/* SRS Status Filters */}
          <CollapsibleSection
            title="Statut SRS"
            defaultOpen={false}
          >
            <div className="space-y-2">
              <FilterChip
                label="Nouvelles cartes"
                active={activeFilters.srsFilters.includeNew}
                onChange={() => toggleSRSFilter('includeNew')}
              />
              <FilterChip
                label="En apprentissage"
                active={activeFilters.srsFilters.includeLearning}
                onChange={() => toggleSRSFilter('includeLearning')}
              />
              <FilterChip
                label="À réviser"
                active={activeFilters.srsFilters.includeReview}
                onChange={() => toggleSRSFilter('includeReview')}
              />
              <FilterChip
                label="Sangsues (8+ échecs)"
                active={activeFilters.srsFilters.includeLeeches}
                onChange={() => toggleSRSFilter('includeLeeches')}
                variant="default"
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] p-4 space-y-3">
          {/* Preview count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Cartes correspondantes:</span>
            <span className="text-slate-200 font-medium">
              {matchingCount.total} cartes
              <span className="text-slate-500 text-xs ml-2">
                ({matchingCount.vocab} vocab, {matchingCount.grammar} gram.)
              </span>
            </span>
          </div>

          {/* Filter summary */}
          {isCustomMode && (
            <div className="text-xs text-slate-500 bg-white/[0.04] rounded-lg px-3 py-2">
              {getFilterSummary()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {onSaveConfig && (
              <GlassButton
                variant="default"
                size="md"
                fullWidth
                icon={<Save className="w-4 h-4" />}
                onClick={onSaveConfig}
              >
                Sauvegarder config
              </GlassButton>
            )}
            <GlassButton
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Appliquer
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FilterPanel;
