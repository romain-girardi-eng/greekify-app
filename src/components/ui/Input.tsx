import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'large' | 'greek';
  glow?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      glow = true,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'px-4 py-3 text-base rounded-xl',
      large: 'px-5 py-4 text-xl rounded-xl',
      greek: 'px-6 py-5 text-2xl greek-text text-center rounded-2xl',
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-300 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full border backdrop-blur-sm',
              'bg-white/[0.06] border-white/[0.12]',
              'text-slate-100 placeholder-slate-500',
              'focus:outline-none focus:bg-white/[0.1]',
              'transition-all duration-300 focus:scale-[1.01] origin-center',
              glow
                ? 'focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/50 focus:shadow-[0_0_20px_rgba(96,165,250,0.15)]'
                : 'focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40',
              variantStyles[variant],
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-red-400/50 focus:ring-red-400/40 focus:border-red-400/50 focus:shadow-[0_0_20px_rgba(248,113,113,0.15)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-400">
              {rightIcon}
            </div>
          )}

          {/* Subtle inner glow on focus */}
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
            }}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 ml-1 animate-fadeIn">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-slate-500 ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant with built-in search icon
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn('pr-10', className)}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        value={value}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Textarea variant with enhanced styling
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  glow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, glow = true, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-300 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            ref={ref}
            className={cn(
              'w-full rounded-xl border backdrop-blur-sm',
              'bg-white/[0.06] border-white/[0.12]',
              'text-slate-100 placeholder-slate-500',
              'focus:outline-none focus:bg-white/[0.1]',
              'transition-all duration-300 focus:scale-[1.005] origin-center',
              'px-4 py-3 min-h-[120px] resize-y',
              glow
                ? 'focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/50 focus:shadow-[0_0_20px_rgba(96,165,250,0.15)]'
                : 'focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40',
              error && 'border-red-400/50 focus:ring-red-400/40 focus:border-red-400/50',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 ml-1 animate-fadeIn">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-slate-500 ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
