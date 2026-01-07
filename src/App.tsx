import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { DeckBrowser } from './pages/DeckBrowser';
import { GrammarTables } from './pages/GrammarTables';
import { Reader } from './pages/Reader';
import { VerseMemorization } from './pages/VerseMemorization';
import { StudySession } from './components/study/StudySession';
import { Layout } from './components/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeDatabase } from './lib/db';
import { seedDatabase } from './data/seed';
import { I18nProvider, useI18n } from './lib/i18n';

function AppContent() {
  const { t } = useI18n();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        await seedDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-400 mb-2">
            {t('initialization_error')}
          </h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">{t('loading_greek')}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/study" element={<StudySession />} />
          <Route path="/decks" element={<DeckBrowser />} />
          <Route path="/grammar" element={<GrammarTables />} />
          <Route path="/reader" element={<Reader />} />
          <Route path="/verses" element={<VerseMemorization />} />
          <Route path="/study/verses/:collectionId" element={<StudySession />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
