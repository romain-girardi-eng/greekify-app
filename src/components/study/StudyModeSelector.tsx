'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  BookOpen,
  FileText,
  Target,
  TrendingUp,
  Box,
  Zap,
  Clock,
  Bookmark,
  SlidersHorizontal,
  Play,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlassButton, GlassModal } from '../ui/LiquidGlass';
import { FilterPanel } from './FilterPanel';
import { useStudyFiltersStore } from '../../stores/studyFiltersStore';
import { useDeckStore } from '../../stores/deckStore';
import type { StudyPreset } from '../../lib/types';
import { BUILT_IN_PRESETS } from '../../lib/types';

// Icon mapping for presets
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  BookOpen,
  FileText,
  Target,
  TrendingUp,
  Box,
  Zap,
  Clock,
  Bookmark,
};

// ============================================
// PresetCard Component
// ============================================
interface PresetCardProps {
  preset: StudyPreset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  matchingCount?: number;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected,
  onSelect,
  onDelete,
  matchingCount,
}) => {
  const Icon = iconMap[preset.icon] || Bookmark;

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative w-full text-left p-4 rounded-xl border transition-all',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
        isSelected
          ? 'bg-blue-500/20 border-blue-400/40'
          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-white/[0.08] text-slate-400'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={cn(
                'font-medium truncate',
                isSelected ? 'text-blue-200' : 'text-slate-200'
              )}
            >
              {preset.name}
            </h3>
            {!preset.isBuiltIn && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{preset.description}</p>
          {matchingCount !== undefined && (
            <p className="text-xs text-slate-600 mt-1">
              {matchingCount} cartes disponibles
            </p>
          )}
        </div>
      </div>
      {isSelected && (
        <motion.div
          layoutId="preset-indicator"
          className="absolute inset-0 border-2 border-blue-400/50 rounded-xl pointer-events-none"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
};

// ============================================
// SaveConfigModal Component
// ============================================
interface SaveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const SaveConfigModal: React.FC<SaveConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Sauvegarder la configuration" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nom de la configuration
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Révision Aoriste"
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <GlassButton variant="ghost" size="md" fullWidth onClick={onClose}>
            Annuler
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Sauvegarder
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

// ============================================
// Main StudyModeSelector Component
// ============================================
interface StudyModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStudy: () => void;
}

export const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  isOpen,
  onClose,
  onStartStudy,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const {
    activePresetId,
    savedConfigs,
    isCustomMode,
    selectPreset,
    saveCurrentConfig,
    deleteSavedConfig,
    getFilterSummary,
    activeFilters,
  } = useStudyFiltersStore();

  const { vocabCards, grammarCards, buildStudyQueue } = useDeckStore();

  // Calculate matching cards for preview
  const matchingCount = useMemo(() => {
    let count = 0;

    if (activeFilters.cardTypes.vocab) {
      const { min, max } = activeFilters.vocabFilters.frequencyRange;
      count += vocabCards.filter((c) => c.frequency >= min && c.frequency <= max).length;
    }

    if (activeFilters.cardTypes.grammar) {
      count += grammarCards.length;
    }

    return count;
  }, [activeFilters, vocabCards, grammarCards]);

  // Create custom presets from saved configs
  const customPresets: StudyPreset[] = savedConfigs.map((config) => ({
    id: config.id,
    name: config.name,
    nameKey: '',
    description: `Créé le ${new Date(config.createdAt).toLocaleDateString('fr-FR')}`,
    descriptionKey: '',
    icon: 'Bookmark',
    filters: config.filters,
    isBuiltIn: false,
  }));

  const handleStartStudy = async () => {
    await buildStudyQueue(activeFilters);
    onStartStudy();
  };

  const handleSaveConfig = (name: string) => {
    saveCurrentConfig(name);
  };

  const handleDeleteConfig = (configId: string) => {
    if (confirm('Supprimer cette configuration ?')) {
      deleteSavedConfig(configId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="study-mode-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          key="study-mode-panel"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full bg-slate-900/95 border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-xl font-semibold text-slate-100">
                Choisir un mode d'étude
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Sélectionnez un preset ou personnalisez vos filtres
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Built-in Presets */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Presets
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {BUILT_IN_PRESETS.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={activePresetId === preset.id && !isCustomMode}
                      onSelect={() => selectPreset(preset.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Configs */}
              {customPresets.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Mes configurations
                  </h3>
                  <div className="space-y-2">
                    {customPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        isSelected={activePresetId === preset.id && !isCustomMode}
                        onSelect={() => selectPreset(preset.id)}
                        onDelete={() => handleDeleteConfig(preset.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Customize Button */}
              <button
                onClick={() => setShowFilters(true)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                  isCustomMode
                    ? 'bg-purple-500/20 border-purple-400/40'
                    : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isCustomMode ? 'bg-purple-500/30 text-purple-300' : 'bg-white/[0.08] text-slate-400'
                    )}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3
                      className={cn(
                        'font-medium',
                        isCustomMode ? 'text-purple-200' : 'text-slate-200'
                      )}
                    >
                      Personnaliser
                    </h3>
                    <p className="text-sm text-slate-500">
                      {isCustomMode ? getFilterSummary() : 'Configurer les filtres manuellement'}
                    </p>
                  </div>
                </div>
                <span className="text-slate-500">→</span>
              </button>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.08] p-4 space-y-3">
              {/* Preview */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Cartes à étudier:</span>
                <span className="text-slate-200 font-semibold text-lg">
                  {matchingCount}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <GlassButton variant="ghost" size="md" onClick={onClose}>
                  Annuler
                </GlassButton>
                {isCustomMode && (
                  <GlassButton
                    variant="default"
                    size="md"
                    onClick={() => setShowSaveModal(true)}
                  >
                    Sauvegarder
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={<Play className="w-4 h-4" />}
                  onClick={handleStartStudy}
                  disabled={matchingCount === 0}
                >
                  Commencer
                </GlassButton>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onSaveConfig={() => {
          setShowFilters(false);
          setShowSaveModal(true);
        }}
      />

      {/* Save Config Modal */}
      <SaveConfigModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveConfig}
      />
    </>
  );
};

export default StudyModeSelector;
