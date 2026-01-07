'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================
// FilterChip Component - Toggle chip for filters
// ============================================
interface FilterChipProps {
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
  disabled?: boolean;
  variant?: 'default' | 'mood' | 'tense' | 'voice' | 'pos' | 'grammar';
  size?: 'sm' | 'md';
  showCheckmark?: boolean;
}

const variantStyles = {
  default: {
    active: 'bg-blue-500/25 border-blue-400/40 text-blue-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(96, 165, 250, 0.2)',
  },
  mood: {
    active: 'bg-purple-500/25 border-purple-400/40 text-purple-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(168, 85, 247, 0.2)',
  },
  tense: {
    active: 'bg-amber-500/25 border-amber-400/40 text-amber-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(251, 191, 36, 0.2)',
  },
  voice: {
    active: 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(52, 211, 153, 0.2)',
  },
  pos: {
    active: 'bg-cyan-500/25 border-cyan-400/40 text-cyan-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(34, 211, 238, 0.2)',
  },
  grammar: {
    active: 'bg-rose-500/25 border-rose-400/40 text-rose-200',
    inactive: 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:border-white/[0.15]',
    glow: 'rgba(251, 113, 133, 0.2)',
  },
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
};

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onChange,
  disabled = false,
  variant = 'default',
  size = 'md',
  showCheckmark = true,
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg border backdrop-blur-sm',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-1 focus:ring-offset-slate-900',
        active ? styles.active : styles.inactive,
        sizeStyles[size],
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      animate={{
        boxShadow: active ? `0 0 12px ${styles.glow}` : '0 0 0 transparent',
      }}
      transition={{ duration: 0.2 }}
    >
      {showCheckmark && active && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className="w-3.5 h-3.5" />
        </motion.span>
      )}
      <span>{label}</span>
    </motion.button>
  );
};

// ============================================
// FilterChipGroup Component - Group of filter chips
// ============================================
interface FilterChipGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onChange: (selected: T[]) => void;
  variant?: FilterChipProps['variant'];
  size?: FilterChipProps['size'];
  allowEmpty?: boolean;
  exclusive?: boolean; // Single select mode
  className?: string;
  label?: string;
  showSelectAll?: boolean;
}

export function FilterChipGroup<T extends string>({
  options,
  selected,
  onChange,
  variant = 'default',
  size = 'md',
  allowEmpty = false,
  exclusive = false,
  className,
  label,
  showSelectAll = false,
}: FilterChipGroupProps<T>) {
  const handleToggle = (value: T) => {
    if (exclusive) {
      // Single select mode
      onChange([value]);
      return;
    }

    const isSelected = selected.includes(value);

    if (isSelected) {
      // Don't allow empty selection if not allowed
      if (!allowEmpty && selected.length === 1) return;
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    const allValues = options.map((o) => o.value);
    if (selected.length === options.length) {
      // Deselect all (if allowed)
      if (allowEmpty) {
        onChange([]);
      }
    } else {
      onChange(allValues);
    }
  };

  const allSelected = selected.length === options.length;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {showSelectAll && !exclusive && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={selected.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            variant={variant}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CardTypeToggle Component - Special toggle for card types
// ============================================
interface CardTypeToggleProps {
  vocabEnabled: boolean;
  grammarEnabled: boolean;
  verseEnabled: boolean;
  onToggleVocab: () => void;
  onToggleGrammar: () => void;
  onToggleVerse: () => void;
}

export const CardTypeToggle: React.FC<CardTypeToggleProps> = ({
  vocabEnabled,
  grammarEnabled,
  verseEnabled,
  onToggleVocab,
  onToggleGrammar,
  onToggleVerse,
}) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
      <motion.button
        onClick={onToggleVocab}
        className={cn(
          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          vocabEnabled
            ? 'bg-blue-500/25 text-blue-200'
            : 'text-slate-400 hover:text-slate-300'
        )}
        whileTap={{ scale: 0.98 }}
      >
        Vocabulaire
      </motion.button>
      <motion.button
        onClick={onToggleGrammar}
        className={cn(
          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          grammarEnabled
            ? 'bg-purple-500/25 text-purple-200'
            : 'text-slate-400 hover:text-slate-300'
        )}
        whileTap={{ scale: 0.98 }}
      >
        Grammaire
      </motion.button>
      <motion.button
        onClick={onToggleVerse}
        className={cn(
          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          verseEnabled
            ? 'bg-emerald-500/25 text-emerald-200'
            : 'text-slate-400 hover:text-slate-300'
        )}
        whileTap={{ scale: 0.98 }}
      >
        Versets
      </motion.button>
    </div>
  );
};

export default FilterChip;
