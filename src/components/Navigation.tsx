import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useI18n } from '../lib/i18n';
import {
  Home,
  BookOpen,
  GraduationCap,
  BookMarked,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'dashboard', path: '/home' },
  { icon: BookOpen, label: 'browse_decks', path: '/decks' },
  { icon: GraduationCap, label: 'grammar_tables', path: '/grammar' },
  { icon: BookMarked, label: 'nt_reader', path: '/reader' },
  { icon: BarChart3, label: 'statistics', path: '/stats' },
  { icon: Settings, label: 'settings', path: '/settings' },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Hide navigation on landing and study pages
  if (location.pathname === '/' || location.pathname === '/study') return null;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 bg-slate-900/80 backdrop-blur-xl border-r border-white/[0.08] z-40">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/[0.12] flex items-center justify-center">
            <span className="greek-text text-xl text-blue-300">Κ</span>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                  'hover:bg-white/[0.08]',
                  isActive && 'bg-white/[0.08]'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t(item.label as any)}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  )}
                />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-desktop"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom navigation - dock style */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <motion.div
          className="flex items-center justify-around gap-1 px-2 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/[0.12] shadow-xl shadow-black/20"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'relative flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all',
                  isActive && 'bg-white/[0.08]'
                )}
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  )}
                />
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] text-blue-400 mt-1"
                    >
                      {t(item.label as any)}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-mobile"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
}

// Layout wrapper that includes navigation
interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isFullScreen = location.pathname === '/study' || location.pathname === '/';

  return (
    <div className={cn('min-h-screen', !isFullScreen && 'lg:pl-20 pb-24 lg:pb-0')}>
      <Navigation />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
