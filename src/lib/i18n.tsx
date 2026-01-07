import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'fr' | 'en';

// French translations (default)
const fr = {
  // Common
  app_name: 'Grec Koinè',
  loading: 'Chargement...',
  loading_greek: 'Chargement du grec koinè...',
  back: 'Retour',
  back_to_dashboard: 'Retour au tableau de bord',
  coming_soon: 'Cette fonctionnalité arrive bientôt !',
  error: 'Erreur',
  initialization_error: "Erreur d'initialisation",

  // Greetings
  good_morning: 'Bonjour',
  good_afternoon: 'Bon après-midi',
  good_evening: 'Bonsoir',
  ready_to_study: 'Prêt à étudier le grec koinè ?',

  // Dashboard
  dashboard: 'Tableau de bord',
  todays_study: "Étude du jour",
  due: 'à réviser',
  new_available: 'nouvelles disponibles',
  start_studying: 'Commencer',
  level: 'Niveau',

  // Stats
  streak: 'Série',
  days: 'jours',
  cards_learned: 'Cartes apprises',
  of: 'sur',
  retention: 'Rétention',
  accuracy: 'précision',
  total_reviews: 'Révisions totales',
  all_time: 'au total',
  activity: 'Activité',

  // Card breakdown
  card_breakdown: 'Répartition des cartes',
  vocabulary: 'Vocabulaire',
  grammar: 'Grammaire',
  vocab_due: 'Vocab. à réviser',
  grammar_due: 'Gram. à réviser',
  new_cards: 'Nouvelles cartes',

  // Achievements
  achievements: 'Succès',
  in_progress: 'En cours',
  complete_first_review: 'Complétez votre première révision pour débloquer des succès !',

  // Achievement names
  'achievement.first-card': 'Premiers pas',
  'achievement.first-card.desc': 'Révisez votre première carte',
  'achievement.vocab-10': 'Collectionneur de mots',
  'achievement.vocab-10.desc': 'Apprenez 10 mots de vocabulaire',
  'achievement.vocab-50': 'Bâtisseur de lexique',
  'achievement.vocab-50.desc': 'Apprenez 50 mots de vocabulaire',
  'achievement.vocab-100': 'Érudit grec',
  'achievement.vocab-100.desc': 'Apprenez 100 mots de vocabulaire',
  'achievement.vocab-500': 'Maître des langues',
  'achievement.vocab-500.desc': 'Apprenez 500 mots de vocabulaire',
  'achievement.streak-3': 'Régularité',
  'achievement.streak-3.desc': 'Maintenez une série de 3 jours',
  'achievement.streak-7': 'Guerrier de la semaine',
  'achievement.streak-7.desc': 'Maintenez une série de 7 jours',
  'achievement.streak-30': 'Dévotion mensuelle',
  'achievement.streak-30.desc': 'Maintenez une série de 30 jours',
  'achievement.streak-100': 'Club des 100',
  'achievement.streak-100.desc': 'Maintenez une série de 100 jours',
  'achievement.perfect-10': 'Mémoire vive',
  'achievement.perfect-10.desc': '10 rappels parfaits consécutifs',
  'achievement.session-complete': 'Dévotion quotidienne',
  'achievement.session-complete.desc': 'Complétez une session complète',
  'achievement.reviews-100': 'Réviseur débutant',
  'achievement.reviews-100.desc': 'Complétez 100 révisions',
  'achievement.reviews-1000': 'Réviseur vétéran',
  'achievement.reviews-1000.desc': 'Complétez 1000 révisions',

  // Quick actions
  browse_decks: 'Parcourir les paquets',
  manage_your_vocabulary_decks: 'Gérez vos paquets de vocabulaire',
  grammar_tables: 'Tables de grammaire',
  explore_greek_grammar: 'Explorez la grammaire grecque',
  nt_reader: 'Lecteur NT',
  read_greek_new_testament: 'Lisez le Nouveau Testament en grec',
  statistics: 'Statistiques',
  view_detailed_stats: 'Voir les statistiques détaillées',
  settings: 'Paramètres',

  // Theme
  dark_mode: 'Mode sombre',
  light_mode: 'Mode clair',

  // Study session
  exit: 'Quitter',
  new: 'nouveau',
  review: 'révision',
  loading_cards: 'Chargement des cartes...',
  all_done: 'Tout est fait !',
  all_done_message: "Vous avez terminé toutes vos révisions. Revenez plus tard ou ajoutez d'autres cartes à étudier.",
  session_complete: 'Session terminée !',
  great_work: 'Excellent travail !',
  cards: 'Cartes',
  time: 'Temps',
  day_streak: 'jours de série !',
  study_more: 'Étudier plus',
  press_1_4: 'Appuyez sur 1-4 pour noter après avoir révélé',

  // Card review
  type_meaning: 'Tapez la signification...',
  show_hint: 'Afficher un indice',
  hide_hint: 'Masquer l\'indice',
  reveal: 'Révéler',
  check_answer: 'Vérifier la réponse',
  correct: 'Correct !',
  not_quite: 'Pas tout à fait...',
  how_well: 'Comment le saviez-vous ?',
  again: 'Revoir',
  hard: 'Difficile',
  good: 'Bien',
  easy: 'Facile',
  hint: 'Indice',
  example: 'Exemple',
  in_nt: 'x dans le NT',
  swipe_hint: 'Glissez pour noter ou utilisez les boutons',

  // Grammar
  parse_this: 'Analysez cette forme :',
  parsing: 'Analyse',
  declension: 'Déclinaison',
  conjugation: 'Conjugaison',
  syntax: 'Syntaxe',

  // Morphology
  person: 'Personne',
  number: 'Nombre',
  tense: 'Temps',
  voice: 'Voix',
  mood: 'Mode',
  case: 'Cas',
  gender: 'Genre',

  // Person
  '1st': '1ère',
  '2nd': '2ème',
  '3rd': '3ème',

  // Number
  singular: 'singulier',
  plural: 'pluriel',

  // Tense
  present: 'présent',
  imperfect: 'imparfait',
  future: 'futur',
  aorist: 'aoriste',
  perfect: 'parfait',
  pluperfect: 'plus-que-parfait',

  // Voice
  active: 'actif',
  middle: 'moyen',
  passive: 'passif',

  // Mood
  indicative: 'indicatif',
  subjunctive: 'subjonctif',
  optative: 'optatif',
  imperative: 'impératif',
  infinitive: 'infinitif',
  participle: 'participe',

  // Case
  nominative: 'nominatif',
  genitive: 'génitif',
  dative: 'datif',
  accusative: 'accusatif',
  vocative: 'vocatif',

  // Gender
  masculine: 'masculin',
  feminine: 'féminin',
  neuter: 'neutre',

  // Parts of speech
  noun: 'nom',
  verb: 'verbe',
  adjective: 'adjectif',
  adverb: 'adverbe',
  pronoun: 'pronom',
  preposition: 'préposition',
  conjunction: 'conjonction',
  particle: 'particule',
  interjection: 'interjection',
  article: 'article',

  // Coming soon pages
  deck_browser: 'Explorateur de paquets',
  nt_reader_title: 'Lecteur du Nouveau Testament',
  statistics_title: 'Statistiques',
  settings_title: 'Paramètres',
};

// English translations
const en: typeof fr = {
  // Common
  app_name: 'Koinè Greek',
  loading: 'Loading...',
  loading_greek: 'Loading Koinè Greek...',
  back: 'Back',
  back_to_dashboard: 'Back to Dashboard',
  coming_soon: 'This feature is coming soon!',
  error: 'Error',
  initialization_error: 'Initialization Error',

  // Greetings
  good_morning: 'Good morning',
  good_afternoon: 'Good afternoon',
  good_evening: 'Good evening',
  ready_to_study: 'Ready to study some Koinè Greek?',

  // Dashboard
  dashboard: 'Dashboard',
  todays_study: "Today's Study",
  due: 'due',
  new_available: 'new available',
  start_studying: 'Start Studying',
  level: 'Level',

  // Stats
  streak: 'Streak',
  days: 'days',
  cards_learned: 'Cards Learned',
  of: 'of',
  retention: 'Retention',
  accuracy: 'accuracy',
  total_reviews: 'Total Reviews',
  all_time: 'all time',
  activity: 'Activity',

  // Card breakdown
  card_breakdown: 'Card Breakdown',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  vocab_due: 'Vocab due',
  grammar_due: 'Grammar due',
  new_cards: 'New cards',

  // Achievements
  achievements: 'Achievements',
  in_progress: 'In Progress',
  complete_first_review: 'Complete your first review to earn achievements!',

  // Achievement names
  'achievement.first-card': 'First Steps',
  'achievement.first-card.desc': 'Review your first card',
  'achievement.vocab-10': 'Word Collector',
  'achievement.vocab-10.desc': 'Learn 10 vocabulary words',
  'achievement.vocab-50': 'Lexicon Builder',
  'achievement.vocab-50.desc': 'Learn 50 vocabulary words',
  'achievement.vocab-100': 'Greek Scholar',
  'achievement.vocab-100.desc': 'Learn 100 vocabulary words',
  'achievement.vocab-500': 'Language Master',
  'achievement.vocab-500.desc': 'Learn 500 vocabulary words',
  'achievement.streak-3': 'Getting Consistent',
  'achievement.streak-3.desc': 'Maintain a 3-day streak',
  'achievement.streak-7': 'Week Warrior',
  'achievement.streak-7.desc': 'Maintain a 7-day streak',
  'achievement.streak-30': 'Monthly Devotion',
  'achievement.streak-30.desc': 'Maintain a 30-day streak',
  'achievement.streak-100': 'Century Club',
  'achievement.streak-100.desc': 'Maintain a 100-day streak',
  'achievement.perfect-10': 'Sharp Memory',
  'achievement.perfect-10.desc': '10 perfect recalls in a row',
  'achievement.session-complete': 'Daily Dedication',
  'achievement.session-complete.desc': 'Complete a full study session',
  'achievement.reviews-100': 'Review Rookie',
  'achievement.reviews-100.desc': 'Complete 100 reviews',
  'achievement.reviews-1000': 'Review Veteran',
  'achievement.reviews-1000.desc': 'Complete 1000 reviews',

  // Quick actions
  browse_decks: 'Browse Decks',
  manage_your_vocabulary_decks: 'Manage your vocabulary decks',
  grammar_tables: 'Grammar Tables',
  explore_greek_grammar: 'Explore Greek grammar',
  nt_reader: 'NT Reader',
  read_greek_new_testament: 'Read the Greek New Testament',
  statistics: 'Statistics',
  view_detailed_stats: 'View detailed statistics',
  settings: 'Settings',

  // Theme
  dark_mode: 'Dark mode',
  light_mode: 'Light mode',

  // Study session
  exit: 'Exit',
  new: 'new',
  review: 'review',
  loading_cards: 'Loading cards...',
  all_done: 'All done for now!',
  all_done_message: "You've completed all your reviews. Come back later or add more cards to study.",
  session_complete: 'Session Complete!',
  great_work: 'Great work on your studies!',
  cards: 'Cards',
  time: 'Time',
  day_streak: 'day streak!',
  study_more: 'Study More',
  press_1_4: 'Press 1-4 to rate after revealing',

  // Card review
  type_meaning: 'Type the meaning...',
  show_hint: 'Show hint',
  hide_hint: 'Hide hint',
  reveal: 'Reveal',
  check_answer: 'Check Answer',
  correct: 'Correct!',
  not_quite: 'Not quite...',
  how_well: 'How well did you know this?',
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
  hint: 'Hint',
  example: 'Example',
  in_nt: 'x in NT',
  swipe_hint: 'Swipe to rate or use buttons',

  // Grammar
  parse_this: 'Parse this form:',
  parsing: 'Parsing',
  declension: 'Declension',
  conjugation: 'Conjugation',
  syntax: 'Syntax',

  // Morphology
  person: 'Person',
  number: 'Number',
  tense: 'Tense',
  voice: 'Voice',
  mood: 'Mood',
  case: 'Case',
  gender: 'Gender',

  // Person
  '1st': '1st',
  '2nd': '2nd',
  '3rd': '3rd',

  // Number
  singular: 'singular',
  plural: 'plural',

  // Tense
  present: 'present',
  imperfect: 'imperfect',
  future: 'future',
  aorist: 'aorist',
  perfect: 'perfect',
  pluperfect: 'pluperfect',

  // Voice
  active: 'active',
  middle: 'middle',
  passive: 'passive',

  // Mood
  indicative: 'indicative',
  subjunctive: 'subjunctive',
  optative: 'optative',
  imperative: 'imperative',
  infinitive: 'infinitive',
  participle: 'participle',

  // Case
  nominative: 'nominative',
  genitive: 'genitive',
  dative: 'dative',
  accusative: 'accusative',
  vocative: 'vocative',

  // Gender
  masculine: 'masculine',
  feminine: 'feminine',
  neuter: 'neuter',

  // Parts of speech
  noun: 'noun',
  verb: 'verb',
  adjective: 'adjective',
  adverb: 'adverb',
  pronoun: 'pronoun',
  preposition: 'preposition',
  conjunction: 'conjunction',
  particle: 'particle',
  interjection: 'interjection',
  article: 'article',

  // Coming soon pages
  deck_browser: 'Deck Browser',
  nt_reader_title: 'New Testament Reader',
  statistics_title: 'Statistics',
  settings_title: 'Settings',
};

const translations = { fr, en };

type TranslationKey = keyof typeof fr;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage or default to French
    const saved = localStorage.getItem('koine-language');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('koine-language', lang);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.fr[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Helper to get greeting based on time
export function useGreeting() {
  const { t } = useI18n();
  const hour = new Date().getHours();

  if (hour < 12) return t('good_morning');
  if (hour < 17) return t('good_afternoon');
  return t('good_evening');
}
