'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// SVG Glass Filter - Creates distortion effect
// ============================================
export const GlassFilter: React.FC = () => (
  <svg className="hidden" aria-hidden="true">
    <defs>
      <filter
        id="liquid-glass-distortion"
        x="0"
        y="0"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.003 0.007"
          numOctaves="1"
          result="turbulence"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="turbulence"
          scale="200"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);

// ============================================
// Types
// ============================================
type BlurIntensity = 'sm' | 'md' | 'lg' | 'xl';
type ShadowIntensity = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type GlowIntensity = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type GlowColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'white';

// ============================================
// Style Maps
// ============================================
const blurClasses: Record<BlurIntensity, string> = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

const shadowStyles: Record<ShadowIntensity, string> = {
  none: '',
  xs: 'shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.2),inset_-1px_-1px_1px_0_rgba(255,255,255,0.2)]',
  sm: 'shadow-[inset_2px_2px_2px_0_rgba(255,255,255,0.25),inset_-2px_-2px_2px_0_rgba(255,255,255,0.25)]',
  md: 'shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_3px_0_rgba(255,255,255,0.3)]',
  lg: 'shadow-[inset_4px_4px_4px_0_rgba(255,255,255,0.35),inset_-4px_-4px_4px_0_rgba(255,255,255,0.35)]',
  xl: 'shadow-[inset_6px_6px_6px_0_rgba(255,255,255,0.4),inset_-6px_-6px_6px_0_rgba(255,255,255,0.4)]',
};

const glowColorMap: Record<GlowColor, string> = {
  blue: 'rgba(96, 165, 250, VAR)',
  emerald: 'rgba(52, 211, 153, VAR)',
  amber: 'rgba(251, 191, 36, VAR)',
  purple: 'rgba(168, 85, 247, VAR)',
  white: 'rgba(255, 255, 255, VAR)',
};

const getGlowStyle = (intensity: GlowIntensity, color: GlowColor): React.CSSProperties => {
  if (intensity === 'none') return {};

  const opacityMap: Record<Exclude<GlowIntensity, 'none'>, number> = {
    xs: 0.1,
    sm: 0.15,
    md: 0.2,
    lg: 0.25,
    xl: 0.3,
  };

  const sizeMap: Record<Exclude<GlowIntensity, 'none'>, number> = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };

  const glowColor = glowColorMap[color].replace('VAR', String(opacityMap[intensity]));

  return {
    boxShadow: `0 4px 4px rgba(0, 0, 0, 0.1), 0 0 12px rgba(0, 0, 0, 0.06), 0 0 ${sizeMap[intensity]}px ${glowColor}`,
  };
};

// ============================================
// LiquidGlassCard Component
// ============================================
interface LiquidGlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  blurIntensity?: BlurIntensity;
  shadowIntensity?: ShadowIntensity;
  glowIntensity?: GlowIntensity;
  glowColor?: GlowColor;
  borderRadius?: string;
  expandable?: boolean;
  expandedWidth?: string;
  expandedHeight?: string;
  width?: string;
  height?: string;
  hover?: boolean;
  active?: boolean;
}

export const LiquidGlassCard = forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      children,
      className,
      blurIntensity = 'xl',
      shadowIntensity = 'md',
      glowIntensity = 'sm',
      glowColor = 'blue',
      borderRadius = '1rem',
      expandable = false,
      expandedWidth,
      expandedHeight,
      width,
      height,
      hover = true,
      active = false,
      style,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
      if (!expandable) return;
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, select, textarea')) return;
      setIsExpanded(!isExpanded);
    };

    const containerVariants = expandable
      ? {
          collapsed: {
            width: width || 'auto',
            height: height || 'auto',
            transition: { duration: 0.4, ease: [0.5, 1.5, 0.5, 1] as const },
          },
          expanded: {
            width: expandedWidth || 'auto',
            height: expandedHeight || 'auto',
            transition: { duration: 0.4, ease: [0.5, 1.5, 0.5, 1] as const },
          },
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          hover && 'cursor-pointer',
          className
        )}
        style={{
          borderRadius,
          ...(width && !expandable && { width }),
          ...(height && !expandable && { height }),
          ...style,
        }}
        variants={expandable ? containerVariants : undefined}
        animate={expandable ? (isExpanded ? 'expanded' : 'collapsed') : undefined}
        onClick={expandable ? handleToggle : undefined}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        whileTap={hover ? { scale: 0.99 } : undefined}
        {...props}
      >
        {/* Layer 1: Blur/Distortion Layer */}
        <div
          className={cn('absolute inset-0 z-0', blurClasses[blurIntensity])}
          style={{
            borderRadius,
            filter: 'url(#liquid-glass-distortion)',
          }}
        />

        {/* Layer 2: Glass Background */}
        <div
          className="absolute inset-0 z-10 bg-white/[0.08] dark:bg-white/[0.08]"
          style={{
            borderRadius,
            ...getGlowStyle(active ? 'md' : glowIntensity, glowColor),
          }}
        />

        {/* Layer 3: Edge Highlights (Inner Shadow) */}
        <div
          className={cn('absolute inset-0 z-20', shadowStyles[shadowIntensity])}
          style={{ borderRadius }}
        />

        {/* Layer 4: Border */}
        <div
          className="absolute inset-0 z-30 border border-white/[0.12] pointer-events-none"
          style={{ borderRadius }}
        />

        {/* Content */}
        <div className="relative z-40">{children}</div>
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';

// ============================================
// GlassButton Component
// ============================================
interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowOnHover?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const buttonVariantStyles = {
  default: {
    bg: 'bg-white/[0.08]',
    border: 'border-white/[0.12]',
    text: 'text-slate-100',
    hoverBg: 'hover:bg-white/[0.14]',
    glowColor: 'white' as GlowColor,
  },
  primary: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    hoverBg: 'hover:bg-blue-500/30',
    glowColor: 'blue' as GlowColor,
  },
  success: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400/30',
    text: 'text-emerald-300',
    hoverBg: 'hover:bg-emerald-500/30',
    glowColor: 'emerald' as GlowColor,
  },
  warning: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
    hoverBg: 'hover:bg-amber-500/30',
    glowColor: 'amber' as GlowColor,
  },
  danger: {
    bg: 'bg-red-500/20',
    border: 'border-red-400/30',
    text: 'text-red-300',
    hoverBg: 'hover:bg-red-500/30',
    glowColor: 'amber' as GlowColor,
  },
  ghost: {
    bg: 'bg-transparent',
    border: 'border-transparent',
    text: 'text-slate-300',
    hoverBg: 'hover:bg-white/[0.08]',
    glowColor: 'white' as GlowColor,
  },
};

const buttonSizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-lg rounded-xl gap-2.5',
  xl: 'px-9 py-4.5 text-xl rounded-2xl gap-3',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      glowOnHover = true,
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const styles = buttonVariantStyles[variant];

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium border backdrop-blur-sm overflow-hidden',
          'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50',
          styles.bg,
          styles.border,
          styles.text,
          styles.hoverBg,
          buttonSizeStyles[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        whileHover={
          !disabled && !loading && glowOnHover
            ? {
                scale: 1.02,
                boxShadow: `0 0 24px ${glowColorMap[styles.glowColor].replace('VAR', '0.3')}`,
              }
            : undefined
        }
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        {...props}
      >
        {loading ? (
          <motion.svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

// ============================================
// GlassIconButton Component
// ============================================
interface GlassIconButtonProps extends Omit<GlassButtonProps, 'icon' | 'iconPosition' | 'children'> {
  'aria-label': string;
  children: React.ReactNode;
}

export const GlassIconButton = forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const iconSizeStyles = {
      sm: 'p-2 rounded-lg',
      md: 'p-2.5 rounded-xl',
      lg: 'p-3.5 rounded-xl',
      xl: 'p-4.5 rounded-2xl',
    };

    return (
      <GlassButton
        ref={ref}
        className={cn(iconSizeStyles[size], className)}
        size={size}
        {...props}
      >
        {children}
      </GlassButton>
    );
  }
);

GlassIconButton.displayName = 'GlassIconButton';

// ============================================
// GlassInput Component
// ============================================
interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'greek';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  label?: string;
  hint?: string;
  errorMessage?: string;
}

const inputSizeStyles = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-3 text-base rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      error = false,
      icon,
      iconPosition = 'left',
      label,
      hint,
      errorMessage,
      ...props
    },
    ref
  ) => {
    const isGreek = variant === 'greek';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white/[0.06] border backdrop-blur-sm',
              'transition-all duration-300 focus:scale-[1.01] origin-center',
              'placeholder:text-slate-500 text-slate-100',
              'focus:outline-none focus:bg-white/[0.1]',
              error
                ? 'border-red-400/50 focus:ring-2 focus:ring-red-400/30'
                : 'border-white/[0.1] focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30',
              inputSizeStyles[inputSize],
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              isGreek && 'greek-text text-center text-2xl py-6',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-sm text-slate-400">{hint}</p>
        )}
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

// ============================================
// GlassSelect Component
// ============================================
interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  hint?: string;
  errorMessage?: string;
  options: Array<{ value: string; label: string }>;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  (
    {
      className,
      inputSize = 'md',
      error = false,
      label,
      hint,
      errorMessage,
      options,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-white/[0.06] border backdrop-blur-sm appearance-none cursor-pointer',
            'transition-all duration-300',
            'focus:outline-none focus:bg-white/[0.1]',
            error
              ? 'border-red-400/50 focus:ring-2 focus:ring-red-400/30'
              : 'border-white/[0.1] focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30',
            inputSizeStyles[inputSize],
            'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
            'bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p className="mt-1.5 text-sm text-slate-400">{hint}</p>
        )}
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';

// ============================================
// GlassToggle Component
// ============================================
interface GlassToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const GlassToggle: React.FC<GlassToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
}) => {
  const sizeStyles = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const styles = sizeStyles[size];

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full',
          'transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
          checked
            ? 'bg-blue-500/40 border-blue-400/50'
            : 'bg-white/[0.08] border-white/[0.12]',
          'border backdrop-blur-sm',
          disabled && 'opacity-50 cursor-not-allowed',
          styles.track
        )}
      >
        <motion.span
          className={cn(
            'inline-block rounded-full bg-white shadow-lg',
            styles.thumb
          )}
          animate={{
            x: checked ? parseInt(styles.translate.replace('translate-x-', '')) * 4 : 2,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      {label && (
        <span className="text-sm text-slate-300">{label}</span>
      )}
    </div>
  );
};

// ============================================
// GlassModal Component
// ============================================
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const modalSizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={cn(
                'w-full bg-slate-900/90 border border-white/[0.12] rounded-2xl backdrop-blur-xl',
                'shadow-2xl shadow-black/20',
                modalSizeStyles[size]
              )}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="px-6 py-4 border-b border-white/[0.08]">
                  <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// GlassBadge Component
// ============================================
interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  glow?: boolean;
}

const badgeVariantStyles = {
  default: 'bg-white/[0.1] border-white/[0.15] text-slate-200',
  primary: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  success: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
  warning: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
  danger: 'bg-red-500/20 border-red-400/30 text-red-300',
};

const badgeSizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  glow = false,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border backdrop-blur-sm',
        badgeVariantStyles[variant],
        badgeSizeStyles[size],
        glow && variant !== 'default' && 'shadow-lg'
      )}
      style={glow && variant !== 'default' ? getGlowStyle('xs', buttonVariantStyles[variant]?.glowColor || 'white') : undefined}
    >
      {children}
    </span>
  );
};

// ============================================
// GlassDivider Component
// ============================================
interface GlassDividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const GlassDivider: React.FC<GlassDividerProps> = ({
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'bg-white/[0.08]',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  );
};

// ============================================
// Export all components
// ============================================
export default {
  GlassFilter,
  LiquidGlassCard,
  GlassButton,
  GlassIconButton,
  GlassInput,
  GlassSelect,
  GlassToggle,
  GlassModal,
  GlassBadge,
  GlassDivider,
};
