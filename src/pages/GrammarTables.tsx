import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { GlassFilter } from '../components/ui/LiquidGlass';
import { useI18n } from '../lib/i18n';
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

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

type TabType = 'verbs' | 'nouns' | 'articles' | 'pronouns';

// ============================================
// GRAMMAR DATA
// ============================================

// Greek Article Declension
const articleData = {
  masculine: {
    nominative: { singular: 'ὁ', plural: 'οἱ' },
    genitive: { singular: 'τοῦ', plural: 'τῶν' },
    dative: { singular: 'τῷ', plural: 'τοῖς' },
    accusative: { singular: 'τόν', plural: 'τούς' },
  },
  feminine: {
    nominative: { singular: 'ἡ', plural: 'αἱ' },
    genitive: { singular: 'τῆς', plural: 'τῶν' },
    dative: { singular: 'τῇ', plural: 'ταῖς' },
    accusative: { singular: 'τήν', plural: 'τάς' },
  },
  neuter: {
    nominative: { singular: 'τό', plural: 'τά' },
    genitive: { singular: 'τοῦ', plural: 'τῶν' },
    dative: { singular: 'τῷ', plural: 'τοῖς' },
    accusative: { singular: 'τό', plural: 'τά' },
  },
};

// First Declension Nouns (feminine -η type)
const firstDeclensionEta = {
  name: 'Première déclinaison (fém. -η)',
  example: 'φωνή (voix)',
  forms: {
    nominative: { singular: 'φωνή', plural: 'φωναί' },
    genitive: { singular: 'φωνῆς', plural: 'φωνῶν' },
    dative: { singular: 'φωνῇ', plural: 'φωναῖς' },
    accusative: { singular: 'φωνήν', plural: 'φωνάς' },
    vocative: { singular: 'φωνή', plural: 'φωναί' },
  },
};

// First Declension Nouns (feminine -α pure type)
const firstDeclensionAlpha = {
  name: 'Première déclinaison (fém. -α)',
  example: 'ἡμέρα (jour)',
  forms: {
    nominative: { singular: 'ἡμέρα', plural: 'ἡμέραι' },
    genitive: { singular: 'ἡμέρας', plural: 'ἡμερῶν' },
    dative: { singular: 'ἡμέρᾳ', plural: 'ἡμέραις' },
    accusative: { singular: 'ἡμέραν', plural: 'ἡμέρας' },
    vocative: { singular: 'ἡμέρα', plural: 'ἡμέραι' },
  },
};

// Second Declension Nouns (masculine -ος type)
const secondDeclensionMasc = {
  name: 'Deuxième déclinaison (masc. -ος)',
  example: 'λόγος (parole)',
  forms: {
    nominative: { singular: 'λόγος', plural: 'λόγοι' },
    genitive: { singular: 'λόγου', plural: 'λόγων' },
    dative: { singular: 'λόγῳ', plural: 'λόγοις' },
    accusative: { singular: 'λόγον', plural: 'λόγους' },
    vocative: { singular: 'λόγε', plural: 'λόγοι' },
  },
};

// Second Declension Nouns (neuter -ον type)
const secondDeclensionNeut = {
  name: 'Deuxième déclinaison (neutre -ον)',
  example: 'ἔργον (œuvre)',
  forms: {
    nominative: { singular: 'ἔργον', plural: 'ἔργα' },
    genitive: { singular: 'ἔργου', plural: 'ἔργων' },
    dative: { singular: 'ἔργῳ', plural: 'ἔργοις' },
    accusative: { singular: 'ἔργον', plural: 'ἔργα' },
    vocative: { singular: 'ἔργον', plural: 'ἔργα' },
  },
};

// Third Declension Nouns (consonant stem)
const thirdDeclension = {
  name: 'Troisième déclinaison (consonne)',
  example: 'σάρξ (chair)',
  forms: {
    nominative: { singular: 'σάρξ', plural: 'σάρκες' },
    genitive: { singular: 'σαρκός', plural: 'σαρκῶν' },
    dative: { singular: 'σαρκί', plural: 'σαρξί(ν)' },
    accusative: { singular: 'σάρκα', plural: 'σάρκας' },
    vocative: { singular: 'σάρξ', plural: 'σάρκες' },
  },
};

// Verb Conjugation - λύω (Present Active Indicative)
const verbPresentActive = {
  name: 'Présent Actif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'λύω', plural: 'λύομεν' },
    '2nd': { singular: 'λύεις', plural: 'λύετε' },
    '3rd': { singular: 'λύει', plural: 'λύουσι(ν)' },
  },
};

// Verb Conjugation - λύω (Imperfect Active Indicative)
const verbImperfectActive = {
  name: 'Imparfait Actif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'ἔλυον', plural: 'ἐλύομεν' },
    '2nd': { singular: 'ἔλυες', plural: 'ἐλύετε' },
    '3rd': { singular: 'ἔλυε(ν)', plural: 'ἔλυον' },
  },
};

// Verb Conjugation - λύω (Future Active Indicative)
const verbFutureActive = {
  name: 'Futur Actif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'λύσω', plural: 'λύσομεν' },
    '2nd': { singular: 'λύσεις', plural: 'λύσετε' },
    '3rd': { singular: 'λύσει', plural: 'λύσουσι(ν)' },
  },
};

// Verb Conjugation - λύω (Aorist Active Indicative)
const verbAoristActive = {
  name: 'Aoriste Actif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'ἔλυσα', plural: 'ἐλύσαμεν' },
    '2nd': { singular: 'ἔλυσας', plural: 'ἐλύσατε' },
    '3rd': { singular: 'ἔλυσε(ν)', plural: 'ἔλυσαν' },
  },
};

// Verb Conjugation - λύω (Perfect Active Indicative)
const verbPerfectActive = {
  name: 'Parfait Actif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'λέλυκα', plural: 'λελύκαμεν' },
    '2nd': { singular: 'λέλυκας', plural: 'λελύκατε' },
    '3rd': { singular: 'λέλυκε(ν)', plural: 'λελύκασι(ν)' },
  },
};

// Verb Conjugation - λύω (Present Middle/Passive Indicative)
const verbPresentMiddle = {
  name: 'Présent Moyen/Passif Indicatif',
  example: 'λύω (délier)',
  forms: {
    '1st': { singular: 'λύομαι', plural: 'λυόμεθα' },
    '2nd': { singular: 'λύῃ', plural: 'λύεσθε' },
    '3rd': { singular: 'λύεται', plural: 'λύονται' },
  },
};

// Personal Pronouns - 1st Person
const pronoun1st = {
  name: 'Pronom Personnel - 1ère personne',
  forms: {
    nominative: { singular: 'ἐγώ', plural: 'ἡμεῖς' },
    genitive: { singular: 'ἐμοῦ / μου', plural: 'ἡμῶν' },
    dative: { singular: 'ἐμοί / μοι', plural: 'ἡμῖν' },
    accusative: { singular: 'ἐμέ / με', plural: 'ἡμᾶς' },
  },
};

// Personal Pronouns - 2nd Person
const pronoun2nd = {
  name: 'Pronom Personnel - 2ème personne',
  forms: {
    nominative: { singular: 'σύ', plural: 'ὑμεῖς' },
    genitive: { singular: 'σοῦ / σου', plural: 'ὑμῶν' },
    dative: { singular: 'σοί / σοι', plural: 'ὑμῖν' },
    accusative: { singular: 'σέ / σε', plural: 'ὑμᾶς' },
  },
};

// Personal Pronouns - 3rd Person (αὐτός)
const pronoun3rd = {
  name: 'Pronom Personnel - 3ème personne (αὐτός)',
  forms: {
    nominative: { singular: 'αὐτός / αὐτή / αὐτό', plural: 'αὐτοί / αὐταί / αὐτά' },
    genitive: { singular: 'αὐτοῦ / αὐτῆς / αὐτοῦ', plural: 'αὐτῶν' },
    dative: { singular: 'αὐτῷ / αὐτῇ / αὐτῷ', plural: 'αὐτοῖς / αὐταῖς / αὐτοῖς' },
    accusative: { singular: 'αὐτόν / αὐτήν / αὐτό', plural: 'αὐτούς / αὐτάς / αὐτά' },
  },
};

const verbConjugations = [
  verbPresentActive,
  verbImperfectActive,
  verbFutureActive,
  verbAoristActive,
  verbPerfectActive,
  verbPresentMiddle,
];

const pronouns = [pronoun1st, pronoun2nd, pronoun3rd];

// ============================================
// COMPONENTS
// ============================================

interface TableCellProps {
  children: React.ReactNode;
  header?: boolean;
  highlight?: boolean;
}

function TableCell({ children, header, highlight }: TableCellProps) {
  return (
    <motion.td
      className={`
        px-3 py-2.5 text-center border border-white/[0.08] transition-all
        ${header
          ? 'bg-white/[0.08] text-slate-300 font-medium text-sm'
          : 'bg-white/[0.03] hover:bg-white/[0.08]'
        }
        ${highlight ? 'bg-blue-500/10 text-blue-300' : ''}
      `}
      whileHover={!header ? { scale: 1.02, backgroundColor: 'rgba(96, 165, 250, 0.15)' } : undefined}
    >
      <span className={header ? '' : 'greek-text text-slate-100'}>{children}</span>
    </motion.td>
  );
}

interface DeclensionTableProps {
  title: string;
  subtitle?: string;
  data: Record<string, { singular: string; plural: string }>;
  rowLabels?: string[];
}

function DeclensionTable({ title, subtitle, data, rowLabels }: DeclensionTableProps) {
  const cases = rowLabels || ['nominative', 'genitive', 'dative', 'accusative', 'vocative'];
  const caseLabels: Record<string, string> = {
    nominative: 'Nominatif',
    genitive: 'Génitif',
    dative: 'Datif',
    accusative: 'Accusatif',
    vocative: 'Vocatif',
  };

  return (
    <GlassCard glow="blue" className="overflow-hidden">
      <div className="p-4 border-b border-white/[0.08]">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1 greek-text">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <TableCell header>Cas</TableCell>
              <TableCell header>Singulier</TableCell>
              <TableCell header>Pluriel</TableCell>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseKey) => (
              data[caseKey] && (
                <tr key={caseKey}>
                  <TableCell header>{caseLabels[caseKey] || caseKey}</TableCell>
                  <TableCell>{data[caseKey].singular}</TableCell>
                  <TableCell>{data[caseKey].plural}</TableCell>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

interface VerbTableProps {
  title: string;
  subtitle?: string;
  data: Record<string, { singular: string; plural: string }>;
}

function VerbTable({ title, subtitle, data }: VerbTableProps) {
  const persons = ['1st', '2nd', '3rd'];
  const personLabels: Record<string, string> = {
    '1st': '1ère',
    '2nd': '2ème',
    '3rd': '3ème',
  };

  return (
    <GlassCard glow="emerald" className="overflow-hidden">
      <div className="p-4 border-b border-white/[0.08]">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1 greek-text">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <TableCell header>Personne</TableCell>
              <TableCell header>Singulier</TableCell>
              <TableCell header>Pluriel</TableCell>
            </tr>
          </thead>
          <tbody>
            {persons.map((person) => (
              data[person] && (
                <tr key={person}>
                  <TableCell header>{personLabels[person]}</TableCell>
                  <TableCell>{data[person].singular}</TableCell>
                  <TableCell>{data[person].plural}</TableCell>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

interface ArticleTableProps {
  data: typeof articleData;
}

function ArticleTable({ data }: ArticleTableProps) {
  const cases = ['nominative', 'genitive', 'dative', 'accusative'] as const;
  const caseLabels: Record<string, string> = {
    nominative: 'Nom.',
    genitive: 'Gén.',
    dative: 'Dat.',
    accusative: 'Acc.',
  };

  return (
    <GlassCard glow="purple" className="overflow-hidden">
      <div className="p-4 border-b border-white/[0.08]">
        <h3 className="text-lg font-semibold text-slate-100">L'Article Défini</h3>
        <p className="text-sm text-slate-400 mt-1">ὁ, ἡ, τό</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <TableCell header>&nbsp;</TableCell>
              <TableCell header>Masc. Sg.</TableCell>
              <TableCell header>Masc. Pl.</TableCell>
              <TableCell header>Fém. Sg.</TableCell>
              <TableCell header>Fém. Pl.</TableCell>
              <TableCell header>Neut. Sg.</TableCell>
              <TableCell header>Neut. Pl.</TableCell>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseKey) => (
              <tr key={caseKey}>
                <TableCell header>{caseLabels[caseKey]}</TableCell>
                <TableCell>{data.masculine[caseKey].singular}</TableCell>
                <TableCell>{data.masculine[caseKey].plural}</TableCell>
                <TableCell>{data.feminine[caseKey].singular}</TableCell>
                <TableCell>{data.feminine[caseKey].plural}</TableCell>
                <TableCell>{data.neuter[caseKey].singular}</TableCell>
                <TableCell>{data.neuter[caseKey].plural}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2
        ${active
          ? 'bg-white/[0.12] text-slate-100'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      {children}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

// Expandable section
interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function ExpandableSection({ title, children, defaultOpen = false }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div variants={itemVariants}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors mb-2"
      >
        <span className="font-medium text-slate-200">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GrammarTables() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('verbs');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter content based on search
  const filteredVerbConjugations = useMemo(() => {
    if (!searchQuery) return verbConjugations;
    const query = searchQuery.toLowerCase();
    return verbConjugations.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.example.toLowerCase().includes(query)
    );
  }, [searchQuery]);


  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <GlassFilter />

      <motion.div
        className="max-w-5xl mx-auto space-y-6"
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
          <h1 className="text-2xl font-bold text-slate-100">{t('grammar_tables')}</h1>
        </motion.header>

        {/* Search */}
        <motion.div variants={itemVariants}>
          <SearchInput
            placeholder="Rechercher une forme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex flex-wrap gap-2 p-1 rounded-xl bg-white/[0.04]"
          variants={itemVariants}
        >
          <TabButton
            active={activeTab === 'verbs'}
            onClick={() => setActiveTab('verbs')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Verbes
          </TabButton>
          <TabButton
            active={activeTab === 'nouns'}
            onClick={() => setActiveTab('nouns')}
            icon={<BookOpen className="w-4 h-4" />}
          >
            Noms
          </TabButton>
          <TabButton
            active={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
          >
            Articles
          </TabButton>
          <TabButton
            active={activeTab === 'pronouns'}
            onClick={() => setActiveTab('pronouns')}
          >
            Pronoms
          </TabButton>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'verbs' && (
            <motion.div
              key="verbs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Quick reference */}
              <motion.div variants={itemVariants}>
                <GlassCard glow="blue" className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-slate-100">Paradigme: λύω</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Le verbe λύω (délier) est le paradigme standard pour apprendre les conjugaisons grecques.
                    Les terminaisons s'appliquent à la plupart des verbes réguliers.
                  </p>
                </GlassCard>
              </motion.div>

              {filteredVerbConjugations.length === 0 ? (
                <motion.div variants={itemVariants}>
                  <GlassCard className="text-center py-8">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Aucun résultat trouvé</p>
                  </GlassCard>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredVerbConjugations.map((verb, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                      <VerbTable
                        title={verb.name}
                        subtitle={verb.example}
                        data={verb.forms}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'nouns' && (
            <motion.div
              key="nouns"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <ExpandableSection title="Première Déclinaison" defaultOpen>
                <div className="grid md:grid-cols-2 gap-4">
                  <DeclensionTable
                    title={firstDeclensionEta.name}
                    subtitle={firstDeclensionEta.example}
                    data={firstDeclensionEta.forms}
                  />
                  <DeclensionTable
                    title={firstDeclensionAlpha.name}
                    subtitle={firstDeclensionAlpha.example}
                    data={firstDeclensionAlpha.forms}
                  />
                </div>
              </ExpandableSection>

              <ExpandableSection title="Deuxième Déclinaison">
                <div className="grid md:grid-cols-2 gap-4">
                  <DeclensionTable
                    title={secondDeclensionMasc.name}
                    subtitle={secondDeclensionMasc.example}
                    data={secondDeclensionMasc.forms}
                  />
                  <DeclensionTable
                    title={secondDeclensionNeut.name}
                    subtitle={secondDeclensionNeut.example}
                    data={secondDeclensionNeut.forms}
                  />
                </div>
              </ExpandableSection>

              <ExpandableSection title="Troisième Déclinaison">
                <DeclensionTable
                  title={thirdDeclension.name}
                  subtitle={thirdDeclension.example}
                  data={thirdDeclension.forms}
                />
              </ExpandableSection>
            </motion.div>
          )}

          {activeTab === 'articles' && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <ArticleTable data={articleData} />
              </motion.div>

              <motion.div variants={itemVariants}>
                <GlassCard glow="purple" className="p-4">
                  <h3 className="font-semibold text-slate-100 mb-3">À retenir</h3>
                  <ul className="text-sm text-slate-400 space-y-2">
                    <li>• Le génitif pluriel est identique pour les trois genres: <span className="greek-text text-slate-200">τῶν</span></li>
                    <li>• Le datif masculin/neutre singulier utilise le iota souscrit: <span className="greek-text text-slate-200">τῷ</span></li>
                    <li>• Le nominatif/accusatif neutre sont toujours identiques</li>
                  </ul>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'pronouns' && (
            <motion.div
              key="pronouns"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {pronouns.map((pronoun, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <DeclensionTable
                    title={pronoun.name}
                    data={pronoun.forms}
                    rowLabels={['nominative', 'genitive', 'dative', 'accusative']}
                  />
                </motion.div>
              ))}

              <motion.div variants={itemVariants}>
                <GlassCard glow="amber" className="p-4">
                  <h3 className="font-semibold text-slate-100 mb-3">Formes emphatiques vs. enclitiques</h3>
                  <p className="text-sm text-slate-400">
                    Les pronoms de 1ère et 2ème personne ont des formes emphatiques (ἐμοῦ, σοῦ)
                    et enclitiques (μου, σου). Les formes enclitiques sont plus fréquentes et
                    s'attachent au mot précédent.
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
