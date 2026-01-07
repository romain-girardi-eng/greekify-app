import { cn } from '../../lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
  showLabel?: boolean;
  label?: string;
}

const colorMap = {
  blue: 'stroke-blue-400',
  green: 'stroke-emerald-400',
  amber: 'stroke-amber-400',
  red: 'stroke-red-400',
};

const bgColorMap = {
  blue: 'stroke-blue-400/20',
  green: 'stroke-emerald-400/20',
  amber: 'stroke-amber-400/20',
  red: 'stroke-red-400/20',
};

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  className,
  color = 'blue',
  showLabel = true,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColorMap[color]}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colorMap[color], 'transition-all duration-500')}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-200">
            {label ?? `${Math.round(progress)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

// Linear progress bar variant
interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const barColorMap = {
  blue: 'bg-blue-400',
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

const barBgColorMap = {
  blue: 'bg-blue-400/20',
  green: 'bg-emerald-400/20',
  amber: 'bg-amber-400/20',
  red: 'bg-red-400/20',
};

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  progress,
  className,
  color = 'blue',
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-slate-200">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          barBgColorMap[color],
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            barColorMap[color]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
