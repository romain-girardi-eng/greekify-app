import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}

// Enhanced glass-morphism button styles with glow effects
const variantStyles: Record<ButtonVariant, { base: string; glow: string }> = {
  default: {
    base: 'bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.14] text-slate-100',
    glow: '0 0 20px rgba(255, 255, 255, 0.1)',
  },
  primary: {
    base: 'bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 text-blue-300',
    glow: '0 0 24px rgba(96, 165, 250, 0.3)',
  },
  success: {
    base: 'bg-emerald-500/20 border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-300',
    glow: '0 0 24px rgba(52, 211, 153, 0.3)',
  },
  warning: {
    base: 'bg-amber-500/20 border-amber-400/30 hover:bg-amber-500/30 text-amber-300',
    glow: '0 0 24px rgba(251, 191, 36, 0.3)',
  },
  danger: {
    base: 'bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-red-300',
    glow: '0 0 24px rgba(248, 113, 113, 0.3)',
  },
  ghost: {
    base: 'bg-transparent border-transparent hover:bg-white/[0.08] text-slate-300',
    glow: 'none',
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-lg rounded-xl gap-2.5',
  xl: 'px-9 py-4.5 text-xl rounded-2xl gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      glow = true,
      children,
      ...props
    },
    ref
  ) => {
    const styles = variantStyles[variant];

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium border backdrop-blur-sm overflow-hidden',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1 focus:ring-offset-slate-900/50',
          styles.base,
          sizeStyles[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        whileHover={
          !disabled && !loading
            ? {
                scale: 1.02,
                y: -1,
                boxShadow: glow ? styles.glow : undefined,
              }
            : undefined
        }
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Inner glow layer */}
        <span className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          }}
        />

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
            <span className="relative">{children as React.ReactNode}</span>
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Icon-only button variant with enhanced styling
interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition'> {
  'aria-label': string;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'p-2 rounded-lg',
  md: 'p-2.5 rounded-xl',
  lg: 'p-3.5 rounded-xl',
  xl: 'p-4.5 rounded-2xl',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(iconSizeStyles[size], 'aspect-square', className)}
        size={size}
        {...props}
      >
        {children as React.ReactNode}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Floating Action Button variant
interface FABProps extends Omit<ButtonProps, 'size'> {
  size?: 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ className, size = 'lg', position = 'bottom-right', children, ...props }, ref) => {
    const positionStyles = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
    };

    const fabSizeStyles = {
      md: 'p-3 rounded-xl',
      lg: 'p-4 rounded-2xl',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          positionStyles[position],
          fabSizeStyles[size],
          'z-50 shadow-xl shadow-black/20',
          'aspect-square',
          className
        )}
        variant="primary"
        glow
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FAB.displayName = 'FAB';
