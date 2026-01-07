import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// Types
// ============================================
type CardVariant = 'default' | 'elevated' | 'subtle' | 'solid';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type GlowColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'white' | 'none';

// ============================================
// Style Maps
// ============================================
const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white/[0.08] border-white/[0.12]',
  elevated: 'bg-white/[0.12] border-white/[0.16] shadow-xl shadow-black/20',
  subtle: 'bg-white/[0.04] border-white/[0.08]',
  solid: 'bg-slate-800/90 border-slate-700/50',
};

const glowStyles: Record<GlowColor, string> = {
  blue: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]',
  emerald: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
  amber: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
  purple: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
  white: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]',
  none: '',
};

// ============================================
// GlassCard Component (with Framer Motion)
// ============================================
interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: CardPadding;
  glow?: GlowColor;
  active?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      hover = false,
      padding = 'md',
      glow = 'blue',
      active = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl border backdrop-blur-xl overflow-hidden',
          variantStyles[variant],
          paddingMap[padding],
          hover && 'transition-all duration-300 cursor-pointer',
          hover && 'hover:bg-white/[0.12] hover:border-white/[0.16]',
          hover && glow !== 'none' && glowStyles[glow],
          active && 'ring-2 ring-blue-400/50 border-blue-400/30',
          className
        )}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        whileTap={hover ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Inner highlight layer */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children as React.ReactNode}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ============================================
// GlassPanel Component (Static, no motion)
// ============================================
interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

export function GlassPanel({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border backdrop-blur-xl overflow-hidden',
        variantStyles[variant],
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {/* Inner highlight */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================
// GlassCardHeader Component
// ============================================
interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function GlassCardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: GlassCardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]',
        className
      )}
      {...props}
    >
      {(title || subtitle || children) && (
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
          {children}
        </div>
      )}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ============================================
// GlassCardContent Component
// ============================================
interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function GlassCardContent({
  className,
  children,
  ...props
}: GlassCardContentProps) {
  return (
    <div className={cn('py-4', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================
// GlassCardFooter Component
// ============================================
interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function GlassCardFooter({
  className,
  children,
  ...props
}: GlassCardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// StatCard Component (for Dashboard stats)
// ============================================
interface StatCardProps extends HTMLMotionProps<'div'> {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      changeType = 'neutral',
      icon,
      trend,
      ...props
    },
    ref
  ) => {
    const changeColors = {
      positive: 'text-emerald-400',
      negative: 'text-red-400',
      neutral: 'text-slate-400',
    };

    return (
      <GlassCard
        ref={ref}
        className={cn('', className)}
        hover
        glow="blue"
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
            {change && (
              <p className={cn('text-sm mt-1', changeColors[changeType])}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-xl bg-white/[0.08] text-slate-300">
              {icon}
            </div>
          )}
        </div>
        {trend && <div className="mt-3">{trend}</div>}
      </GlassCard>
    );
  }
);

StatCard.displayName = 'StatCard';

// ============================================
// FeatureCard Component (for feature highlights)
// ============================================
interface FeatureCardProps extends HTMLMotionProps<'div'> {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, title, description, href, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (href) {
        window.location.href = href;
      }
      onClick?.(e);
    };

    return (
      <GlassCard
        ref={ref}
        className={cn('group', className)}
        hover
        glow="blue"
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30 transition-colors">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';
