import { Component, type ReactNode, type ErrorInfo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors
 * Provides graceful error handling with recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info for display
    this.setState({ errorInfo });

    // Log to persistent storage for debugging
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Get existing errors from localStorage
      const existingErrors = JSON.parse(
        localStorage.getItem('koine_error_log') || '[]'
      );

      // Add new error (keep last 10)
      const errorEntry = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      existingErrors.unshift(errorEntry);
      const trimmedErrors = existingErrors.slice(0, 10);

      localStorage.setItem('koine_error_log', JSON.stringify(trimmedErrors));
    } catch (e) {
      // Don't crash if logging fails
      console.error('Failed to log error:', e);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearData = () => {
    if (
      window.confirm(
        'Cela supprimera toutes vos données locales. Êtes-vous sûr ?'
      )
    ) {
      localStorage.clear();
      // Clear IndexedDB
      indexedDB.deleteDatabase('KoineGreekDB');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <motion.div
            className="max-w-md w-full glass-card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-5xl mb-4">😔</div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">
              Une erreur s'est produite
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              L'application a rencontré un problème inattendu. Vos données sont
              sauvegardées localement.
            </p>

            {/* Error details (collapsed) */}
            <details className="text-left mb-6 bg-white/[0.04] rounded-lg overflow-hidden">
              <summary className="px-4 py-2 cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                Détails techniques
              </summary>
              <div className="px-4 py-2 text-xs font-mono text-red-400 overflow-auto max-h-40 border-t border-white/10">
                <p className="font-bold mb-2">{this.state.error?.message}</p>
                <pre className="whitespace-pre-wrap text-slate-500">
                  {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
                </pre>
              </div>
            </details>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors font-medium"
              >
                Recharger l'application
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-white/[0.08] text-slate-300 hover:bg-white/[0.12] transition-colors"
              >
                Essayer de continuer
              </button>

              <button
                onClick={this.handleClearData}
                className="w-full py-2 px-4 rounded-xl text-red-400/70 hover:text-red-400 text-sm transition-colors"
              >
                Réinitialiser les données
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Si le problème persiste, essayez de vider le cache du navigateur ou
              de réinstaller l'application.
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for programmatic error logging
 */
export function logError(error: Error, context?: string) {
  console.error(`[Koine Greek] ${context || 'Error'}:`, error);

  try {
    const existingErrors = JSON.parse(
      localStorage.getItem('koine_error_log') || '[]'
    );

    existingErrors.unshift({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    localStorage.setItem(
      'koine_error_log',
      JSON.stringify(existingErrors.slice(0, 10))
    );
  } catch (e) {
    // Silently fail
  }
}

/**
 * Get logged errors for debugging
 */
export function getErrorLog(): Array<{
  timestamp: string;
  message: string;
  stack?: string;
  context?: string;
}> {
  try {
    return JSON.parse(localStorage.getItem('koine_error_log') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  localStorage.removeItem('koine_error_log');
}

export default ErrorBoundary;
