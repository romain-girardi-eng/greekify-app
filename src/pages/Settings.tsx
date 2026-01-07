import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassCardHeader, GlassCardContent } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { GlassFilter, GlassToggle, GlassSelect, GlassModal } from '../components/ui/LiquidGlass';
import { useI18n } from '../lib/i18n';
import { useThemeStore } from '../stores/themeStore';
import { useDeckStore } from '../stores/deckStore';
import { useProgressStore } from '../stores/progressStore';
import {
  exportAllData,
  downloadAsJson,
  downloadVocabAsCsv,
  parseJsonFile,
  importData,
  getStorageStats,
} from '../lib/dataExport';
import { clearAllData } from '../lib/db';
import {
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  BookOpen,
  Database,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Bell,
  Info,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.08] last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/[0.06] text-slate-400">
          {icon}
        </div>
        <div>
          <div className="text-slate-200 font-medium">{title}</div>
          {description && (
            <div className="text-sm text-slate-500">{description}</div>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useThemeStore();
  const { vocabCards, grammarCards, loadCards } = useDeckStore();
  const { progress, stats } = useProgressStore();

  // Local state for settings
  const [newCardsPerDay, setNewCardsPerDay] = useState(20);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Export/Import state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [storageStats, setStorageStats] = useState<{ estimatedSize: string; vocabCards: number; grammarCards: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCards = vocabCards.length + grammarCards.length;
  const learnedCards = vocabCards.filter(c => c.reps > 0).length + grammarCards.filter(c => c.reps > 0).length;

  // Load storage stats
  useEffect(() => {
    getStorageStats().then(setStorageStats);
  }, []);

  // Handle JSON export
  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      downloadAsJson(data);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
    setShowExportModal(false);
  };

  // Handle CSV export
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await downloadVocabAsCsv();
    } catch (error) {
      console.error('CSV export failed:', error);
    }
    setIsExporting(false);
    setShowExportModal(false);
  };

  // Handle file import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await parseJsonFile(file);
      const result = await importData(data, { mergeMode: 'merge' });

      if (result.success) {
        setImportResult({
          success: true,
          message: language === 'fr'
            ? `Import\u00e9: ${result.imported.vocabCards} vocab, ${result.imported.grammarCards} grammaire`
            : `Imported: ${result.imported.vocabCards} vocab, ${result.imported.grammarCards} grammar`,
        });
        // Reload cards
        loadCards();
        getStorageStats().then(setStorageStats);
      } else {
        setImportResult({
          success: false,
          message: result.errors[0] || (language === 'fr' ? 'Erreur d\'import' : 'Import error'),
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : (language === 'fr' ? 'Fichier invalide' : 'Invalid file'),
      });
    }

    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle reset
  const handleReset = async () => {
    try {
      await clearAllData();
      loadCards();
      getStorageStats().then(setStorageStats);
      setShowResetModal(false);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* SVG Glass Filter */}
      <GlassFilter />

      <motion.div
        className="max-w-2xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header className="flex items-center gap-4" variants={itemVariants}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('back')}
          </Button>
          <h1 className="text-2xl font-bold text-slate-100">{t('settings')}</h1>
        </motion.header>

        {/* Appearance */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="blue">
            <GlassCardHeader title="Apparence" />
            <GlassCardContent>
              <SettingRow
                icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                title={theme === 'dark' ? t('dark_mode') : t('light_mode')}
                description="Changer le thème de l'application"
              >
                <GlassToggle
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
              </SettingRow>
              <SettingRow
                icon={<Globe className="w-5 h-5" />}
                title="Langue"
                description="Changer la langue de l'interface"
              >
                <GlassSelect
                  inputSize="sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                  options={[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </SettingRow>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Study Settings */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="emerald">
            <GlassCardHeader title="Étude" />
            <GlassCardContent>
              <SettingRow
                icon={<BookOpen className="w-5 h-5" />}
                title="Nouvelles cartes par jour"
                description={`${newCardsPerDay} cartes`}
              >
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={newCardsPerDay}
                  onChange={(e) => setNewCardsPerDay(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
              </SettingRow>
              <SettingRow
                icon={<Volume2 className="w-5 h-5" />}
                title="Sons"
                description="Activer les effets sonores"
              >
                <GlassToggle
                  checked={soundEnabled}
                  onChange={setSoundEnabled}
                />
              </SettingRow>
              <SettingRow
                icon={<Bell className="w-5 h-5" />}
                title="Notifications"
                description="Rappels quotidiens"
              >
                <GlassToggle
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
              </SettingRow>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Data & Storage */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="purple">
            <GlassCardHeader title="Données" />
            <GlassCardContent>
              <SettingRow
                icon={<Database className="w-5 h-5" />}
                title={language === 'fr' ? 'Cartes totales' : 'Total cards'}
                description={language === 'fr'
                  ? `${learnedCards} apprises sur ${totalCards}`
                  : `${learnedCards} learned of ${totalCards}`}
              >
                <span className="text-slate-400 text-sm">
                  {storageStats?.estimatedSize || `${totalCards} ${language === 'fr' ? 'cartes' : 'cards'}`}
                </span>
              </SettingRow>
              <SettingRow
                icon={<Download className="w-5 h-5" />}
                title={language === 'fr' ? 'Exporter les données' : 'Export data'}
                description={language === 'fr' ? 'Télécharger une sauvegarde' : 'Download a backup'}
              >
                <Button variant="ghost" size="sm" onClick={() => setShowExportModal(true)}>
                  {language === 'fr' ? 'Exporter' : 'Export'}
                </Button>
              </SettingRow>
              <SettingRow
                icon={<Upload className="w-5 h-5" />}
                title={language === 'fr' ? 'Importer les données' : 'Import data'}
                description={language === 'fr' ? 'Restaurer une sauvegarde' : 'Restore a backup'}
              >
                <Button variant="ghost" size="sm" onClick={() => setShowImportModal(true)}>
                  {language === 'fr' ? 'Importer' : 'Import'}
                </Button>
              </SettingRow>
              <SettingRow
                icon={<RotateCcw className="w-5 h-5" />}
                title={language === 'fr' ? 'Réinitialiser la progression' : 'Reset progress'}
                description={language === 'fr' ? 'Attention : action irréversible' : 'Warning: irreversible action'}
              >
                <Button variant="danger" size="sm" onClick={() => setShowResetModal(true)}>
                  {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                </Button>
              </SettingRow>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="white">
            <GlassCardHeader title="À propos" />
            <GlassCardContent>
              <SettingRow
                icon={<Info className="w-5 h-5" />}
                title="Koinè Greek App"
                description="Version 1.0.0"
              >
                <span className="greek-text text-slate-400">κοινή</span>
              </SettingRow>
              <div className="text-center pt-4">
                <p className="text-sm text-slate-500">
                  Application d'apprentissage du grec koinè biblique
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  © 2024 - Tous droits réservés
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Stats summary */}
        {progress && stats && (
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-2xl font-bold text-blue-400">{progress.streak}</div>
                <div className="text-xs text-slate-500">{t('streak')}</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-2xl font-bold text-emerald-400">{progress.totalReviews}</div>
                <div className="text-xs text-slate-500">{t('total_reviews')}</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-2xl font-bold text-purple-400">{stats.retentionRate}%</div>
                <div className="text-xs text-slate-500">{t('retention')}</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Export Modal */}
      <GlassModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={language === 'fr' ? 'Exporter les données' : 'Export Data'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {language === 'fr'
              ? 'Choisissez le format d\'export:'
              : 'Choose export format:'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all"
            >
              <FileJson className="w-8 h-8 text-blue-400" />
              <div className="text-left flex-1">
                <div className="font-medium text-slate-200">JSON (complet)</div>
                <div className="text-xs text-slate-500">
                  {language === 'fr' ? 'Toutes les données avec progression' : 'All data with progress'}
                </div>
              </div>
              {isExporting && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
            </button>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
              <div className="text-left flex-1">
                <div className="font-medium text-slate-200">CSV (vocabulaire)</div>
                <div className="text-xs text-slate-500">
                  {language === 'fr' ? 'Liste de vocabulaire simple' : 'Simple vocabulary list'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Import Modal */}
      <GlassModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportResult(null);
        }}
        title={language === 'fr' ? 'Importer les données' : 'Import Data'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {language === 'fr'
              ? 'Sélectionnez un fichier de sauvegarde JSON:'
              : 'Select a JSON backup file:'}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
          >
            {isImporting ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
            <span className="text-slate-300">
              {isImporting
                ? (language === 'fr' ? 'Importation...' : 'Importing...')
                : (language === 'fr' ? 'Choisir un fichier' : 'Choose file')}
            </span>
          </button>

          {importResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              importResult.success
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="text-sm">{importResult.message}</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            {language === 'fr'
              ? 'Les données existantes seront fusionnées avec l\'import.'
              : 'Existing data will be merged with the import.'}
          </p>
        </div>
      </GlassModal>

      {/* Reset Confirmation Modal */}
      <GlassModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={language === 'fr' ? 'Confirmer la réinitialisation' : 'Confirm Reset'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-200">
              {language === 'fr'
                ? 'Cette action supprimera toute votre progression et ne peut pas être annulée.'
                : 'This will delete all your progress and cannot be undone.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowResetModal(false)}>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button variant="danger" fullWidth onClick={handleReset}>
              {language === 'fr' ? 'Réinitialiser' : 'Reset'}
            </Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
