import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  name?: string;
  className?: string;
  background?: ReactNode;
  icon?: ReactNode;
  description?: string;
  children?: ReactNode;
  onClick?: () => void;
  gradient?: 'slate' | 'stone' | 'zinc' | 'neutral' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
}

const gradientStyles = {
  slate: 'from-slate-800/50 via-slate-800/60 to-slate-900/70',
  stone: 'from-stone-800/50 via-amber-900/20 to-stone-900/70',
  zinc: 'from-zinc-800/50 via-sky-900/20 to-zinc-900/70',
  neutral: 'from-neutral-800/50 via-violet-900/20 to-neutral-900/70',
  blue: 'from-sky-900/40 via-blue-900/50 to-slate-900/70',
  emerald: 'from-emerald-900/40 via-teal-900/50 to-slate-900/70',
  amber: 'from-amber-900/40 via-orange-900/50 to-slate-900/70',
  rose: 'from-rose-900/40 via-pink-900/50 to-slate-900/70',
  violet: 'from-violet-900/40 via-purple-900/50 to-slate-900/70',
  cyan: 'from-cyan-900/40 via-sky-900/50 to-slate-900/70',
};

const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[11rem] md:auto-rows-[14rem] grid-cols-2 md:grid-cols-3 gap-3 md:gap-4',
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  icon,
  description,
  children,
  onClick,
  gradient = 'slate',
}: BentoCardProps) => (
  <motion.div
    whileHover={{ scale: 1.01, y: -2 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={cn(
      'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer',
      // Glass morphism base
      `bg-gradient-to-br ${gradientStyles[gradient]}`,
      'backdrop-blur-xl',
      // Border and shadow
      'border border-white/[0.08]',
      '[box-shadow:0_0_0_1px_rgba(255,255,255,0.02),0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]',
      className
    )}
  >
    {/* Background element */}
    {background && (
      <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
        {background}
      </div>
    )}

    {/* Subtle shine overlay */}
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)',
      }}
    />

    {/* Content */}
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-4 md:p-5 transition-all duration-300">
      {icon && (
        <div className="mb-2 text-slate-400 group-hover:text-slate-300 transition-colors">
          {icon}
        </div>
      )}
      {name && (
        <h3 className="text-sm md:text-base font-medium text-slate-200 group-hover:text-white transition-colors">
          {name}
        </h3>
      )}
      {description && (
        <p className="text-xs md:text-sm text-slate-500 group-hover:text-slate-400 transition-colors line-clamp-2">
          {description}
        </p>
      )}
    </div>

    {/* Custom children content */}
    {children && (
      <div className="relative z-10 px-4 md:px-5 pb-4 md:pb-5">
        {children}
      </div>
    )}

    {/* Hover overlay */}
    <div className="pointer-events-none absolute inset-0 z-[2] transform-gpu transition-all duration-300 group-hover:bg-white/[0.02]" />
  </motion.div>
);

export { BentoCard, BentoGrid };
