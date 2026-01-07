/**
 * VerseMemorization Page - Memorize Scripture verses progressively
 *
 * Features:
 * - Browse verse collections (built-in and custom)
 * - Track progress per collection
 * - 5-level memorization system
 * - Add custom verses and collections
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { GlassFilter, GlassButton, GlassModal } from '../components/ui/LiquidGlass';
import { useI18n } from '../lib/i18n';
import { cn } from '../lib/utils';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Plus,
  Trash2,
  Play,
  Star,
  BookMarked,
  Target,
  Trophy,
  Clock,
  Layers,
} from 'lucide-react';
import { BUILT_IN_VERSE_COLLECTIONS } from '../lib/types';
import type { VerseCollection, VerseMemorizationCard, Token } from '../lib/types';
import {
  getAllVerseCollections,
  addVerseCollection,
  deleteVerseCollection,
  getVerseMemorizationCardsByCollection,
  addVerseMemorizationCards,
} from '../lib/db';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Sample verse data for built-in collections (would come from API/data file in production)
const sampleVerseData: Record<string, { greekText: string; tokens: Token[]; translationEn: string; translationFr: string }> = {
  'John.1.1': {
    greekText: 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.',
    tokens: [
      { text: 'Ἐν', lemma: 'ἐν', gloss: 'In', partOfSpeech: 'preposition' },
      { text: 'ἀρχῇ', lemma: 'ἀρχή', gloss: 'beginning', partOfSpeech: 'noun' },
      { text: 'ἦν', lemma: 'εἰμί', gloss: 'was', partOfSpeech: 'verb' },
      { text: 'ὁ', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'λόγος,', lemma: 'λόγος', gloss: 'Word', partOfSpeech: 'noun' },
      { text: 'καὶ', lemma: 'καί', gloss: 'and', partOfSpeech: 'conjunction' },
      { text: 'ὁ', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'λόγος', lemma: 'λόγος', gloss: 'Word', partOfSpeech: 'noun' },
      { text: 'ἦν', lemma: 'εἰμί', gloss: 'was', partOfSpeech: 'verb' },
      { text: 'πρὸς', lemma: 'πρός', gloss: 'with', partOfSpeech: 'preposition' },
      { text: 'τὸν', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'θεόν,', lemma: 'θεός', gloss: 'God', partOfSpeech: 'noun' },
      { text: 'καὶ', lemma: 'καί', gloss: 'and', partOfSpeech: 'conjunction' },
      { text: 'θεὸς', lemma: 'θεός', gloss: 'God', partOfSpeech: 'noun' },
      { text: 'ἦν', lemma: 'εἰμί', gloss: 'was', partOfSpeech: 'verb' },
      { text: 'ὁ', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'λόγος.', lemma: 'λόγος', gloss: 'Word', partOfSpeech: 'noun' },
    ],
    translationEn: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    translationFr: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.',
  },
  'John.3.16': {
    greekText: 'Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν...',
    tokens: [
      { text: 'Οὕτως', lemma: 'οὕτως', gloss: 'For so', partOfSpeech: 'adverb' },
      { text: 'γὰρ', lemma: 'γάρ', gloss: 'for', partOfSpeech: 'conjunction' },
      { text: 'ἠγάπησεν', lemma: 'ἀγαπάω', gloss: 'loved', partOfSpeech: 'verb' },
      { text: 'ὁ', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'θεὸς', lemma: 'θεός', gloss: 'God', partOfSpeech: 'noun' },
      { text: 'τὸν', lemma: 'ὁ', gloss: 'the', partOfSpeech: 'article' },
      { text: 'κόσμον,', lemma: 'κόσμος', gloss: 'world', partOfSpeech: 'noun' },
    ],
    translationEn: 'For God so loved the world that he gave his only Son...',
    translationFr: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique...',
  },
};

// Collection Card Component
interface CollectionCardProps {
  collection: VerseCollection;
  progress?: { total: number; mastered: number; avgLevel: number };
  onSelect: () => void;
  onDelete?: () => void;
}

function CollectionCard({ collection, progress, onSelect, onDelete }: CollectionCardProps) {
  const { language } = useI18n();

  const progressPercent = progress ? Math.round((progress.mastered / progress.total) * 100) : 0;

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]",
        "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
          {collection.isBuiltIn ? (
            <Star className="w-5 h-5" />
          ) : (
            <BookMarked className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-200 truncate">
              {collection.name}
            </h3>
            {!collection.isBuiltIn && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{collection.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-slate-600">
              {collection.verses.length} {language === 'fr' ? 'versets' : 'verses'}
            </span>
            {progress && (
              <>
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300">{progressPercent}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-400">
                    {language === 'fr' ? 'Niv.' : 'Lvl.'} {progress.avgLevel.toFixed(1)}
                  </span>
                </div>
              </>
            )}
          </div>
          {/* Progress bar */}
          {progress && progress.total > 0 && (
            <div className="mt-2 h-1 rounded-full bg-white/[0.1] overflow-hidden">
              <div
                className="h-full bg-purple-500/50 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 self-center" />
      </div>
    </motion.button>
  );
}

// Add Collection Modal
interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, description: string) => void;
}

function AddCollectionModal({ isOpen, onClose, onAdd }: AddCollectionModalProps) {
  const { language } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'fr' ? 'Nouvelle collection' : 'New Collection'}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {language === 'fr' ? 'Nom' : 'Name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === 'fr' ? 'Ma collection' : 'My collection'}
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/30"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {language === 'fr' ? 'Description' : 'Description'}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'fr' ? 'Description optionnelle' : 'Optional description'}
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <GlassButton variant="ghost" size="md" fullWidth onClick={onClose}>
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            {language === 'fr' ? 'Créer' : 'Create'}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

// Main Page Component
export function VerseMemorization() {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const [collections, setCollections] = useState<VerseCollection[]>([]);
  const [collectionProgress, setCollectionProgress] = useState<Record<string, { total: number; mastered: number; avgLevel: number }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<VerseCollection | null>(null);

  // Load collections and progress
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load custom collections from DB
        const customCollections = await getAllVerseCollections();

        // Combine with built-in collections
        const allCollections = [...BUILT_IN_VERSE_COLLECTIONS, ...customCollections.filter(c => !c.isBuiltIn)];
        setCollections(allCollections);

        // Load progress for each collection
        const progress: Record<string, { total: number; mastered: number; avgLevel: number }> = {};

        for (const collection of allCollections) {
          const cards = await getVerseMemorizationCardsByCollection(collection.id);
          if (cards.length > 0) {
            const mastered = cards.filter(c => c.memorizationLevel >= 5).length;
            const avgLevel = cards.reduce((sum, c) => sum + c.memorizationLevel, 0) / cards.length;
            progress[collection.id] = {
              total: cards.length,
              mastered,
              avgLevel,
            };
          }
        }

        setCollectionProgress(progress);
      } catch (error) {
        console.error('Failed to load collections:', error);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Handle adding a new collection
  const handleAddCollection = async (name: string, description: string) => {
    const newCollection: VerseCollection = {
      id: `custom-${Date.now()}`,
      name,
      nameKey: '',
      description,
      verses: [],
      isBuiltIn: false,
    };

    await addVerseCollection(newCollection);
    setCollections(prev => [...prev, newCollection]);
  };

  // Handle deleting a collection
  const handleDeleteCollection = async (id: string) => {
    if (confirm(language === 'fr' ? 'Supprimer cette collection ?' : 'Delete this collection?')) {
      await deleteVerseCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    }
  };

  // Handle starting study session
  const handleStartStudy = async (collection: VerseCollection) => {
    // Check if cards exist for this collection
    const existingCards = await getVerseMemorizationCardsByCollection(collection.id);

    if (existingCards.length === 0) {
      // Create cards from verse data
      const cards: VerseMemorizationCard[] = [];

      for (const verseRef of collection.verses) {
        const verseData = sampleVerseData[verseRef];
        if (verseData) {
          cards.push({
            id: `verse-${collection.id}-${verseRef}`,
            reference: verseRef.replace('.', ' ').replace('.', ':'),
            greekText: verseData.greekText,
            tokens: verseData.tokens,
            translationEn: verseData.translationEn,
            translationFr: verseData.translationFr,
            clozePositions: [],
            memorizationLevel: 1,
            collectionId: collection.id,
            // SRS fields
            due: new Date(),
            interval: 0,
            ease: 2.5,
            reps: 0,
            lapses: 0,
            lastReview: null,
            nextReview: new Date(),
          });
        }
      }

      if (cards.length > 0) {
        await addVerseMemorizationCards(cards);
      }
    }

    // Navigate to study session
    navigate(`/study/verses/${collection.id}`);
  };

  // Separate built-in and custom collections
  const builtInCollections = collections.filter(c => c.isBuiltIn);
  const customCollections = collections.filter(c => !c.isBuiltIn);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const allProgress = Object.values(collectionProgress);
    if (allProgress.length === 0) return { totalVerses: 0, mastered: 0, avgLevel: 0 };

    const totalVerses = allProgress.reduce((sum, p) => sum + p.total, 0);
    const mastered = allProgress.reduce((sum, p) => sum + p.mastered, 0);
    const avgLevel = allProgress.reduce((sum, p) => sum + p.avgLevel, 0) / allProgress.length;

    return { totalVerses, mastered, avgLevel };
  }, [collectionProgress]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <GlassFilter />

      <motion.div
        className="max-w-4xl mx-auto space-y-6"
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
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {language === 'fr' ? 'Mémorisation de Versets' : 'Verse Memorization'}
            </h1>
            <p className="text-sm text-slate-500">
              {language === 'fr'
                ? 'Apprenez les Écritures par coeur progressivement'
                : 'Learn Scripture by heart progressively'}
            </p>
          </div>
        </motion.header>

        {/* Stats Overview */}
        {overallStats.totalVerses > 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-2xl font-bold">{overallStats.totalVerses}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'fr' ? 'Versets en cours' : 'Verses in progress'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                    <Trophy className="w-5 h-5" />
                    <span className="text-2xl font-bold">{overallStats.mastered}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'fr' ? 'Maîtrisés' : 'Mastered'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                    <Target className="w-5 h-5" />
                    <span className="text-2xl font-bold">{overallStats.avgLevel.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'fr' ? 'Niveau moyen' : 'Average level'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Built-in Collections */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            {language === 'fr' ? 'Collections classiques' : 'Classic Collections'}
          </h2>
          <div className="space-y-2">
            {builtInCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                progress={collectionProgress[collection.id]}
                onSelect={() => handleStartStudy(collection)}
              />
            ))}
          </div>
        </motion.div>

        {/* Custom Collections */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {language === 'fr' ? 'Mes collections' : 'My Collections'}
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {language === 'fr' ? 'Ajouter' : 'Add'}
            </button>
          </div>

          {customCollections.length > 0 ? (
            <div className="space-y-2">
              {customCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  progress={collectionProgress[collection.id]}
                  onSelect={() => handleStartStudy(collection)}
                  onDelete={() => handleDeleteCollection(collection.id)}
                />
              ))}
            </div>
          ) : (
            <GlassCard className="p-6 text-center">
              <BookMarked className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">
                {language === 'fr'
                  ? 'Créez votre propre collection de versets à mémoriser'
                  : 'Create your own collection of verses to memorize'}
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                {language === 'fr' ? 'Créer une collection' : 'Create collection'}
              </Button>
            </GlassCard>
          )}
        </motion.div>

        {/* Level explanation */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              {language === 'fr' ? 'Niveaux de mémorisation' : 'Memorization Levels'}
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="space-y-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-medium",
                    level === 1 && "bg-blue-500/20 text-blue-300",
                    level === 2 && "bg-green-500/20 text-green-300",
                    level === 3 && "bg-yellow-500/20 text-yellow-300",
                    level === 4 && "bg-orange-500/20 text-orange-300",
                    level === 5 && "bg-red-500/20 text-red-300"
                  )}>
                    {level}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {level === 1 && (language === 'fr' ? 'Lecture' : 'Read')}
                    {level === 2 && (language === 'fr' ? 'Facile' : 'Easy')}
                    {level === 3 && (language === 'fr' ? 'Moyen' : 'Medium')}
                    {level === 4 && (language === 'fr' ? 'Lettres' : 'Letters')}
                    {level === 5 && (language === 'fr' ? 'Réciter' : 'Recite')}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Add Collection Modal */}
      <AddCollectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCollection}
      />
    </div>
  );
}

export default VerseMemorization;
