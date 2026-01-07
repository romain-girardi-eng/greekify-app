import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import StarBorder from "../StarBorder";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
  index: number;
  total: number;
  phase: AnimationPhase;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
  greekLetter: string;
  greekWord: string;
  meaning: string;
  gradient: string;
  isLightTheme: boolean;
}

// --- FlipCard Component ---
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({
  index,
  target,
  greekLetter,
  greekWord,
  meaning,
  gradient,
  isLightTheme,
}: FlipCardProps) {
  // Theme-aware colors
  const glowColor = isLightTheme ? 'rgba(139,92,246,0.25)' : 'rgba(132,0,255,0.3)';
  const borderColor = isLightTheme ? 'rgba(139,92,246,0.3)' : 'rgba(132,0,255,0.2)';
  const hoverGlow = isLightTheme ? 'rgba(139,92,246,0.2)' : 'rgba(132,0,255,0.15)';
  const backBg = isLightTheme
    ? 'linear-gradient(145deg, rgba(245,240,255,0.98) 0%, rgba(235,230,250,0.98) 100%)'
    : 'linear-gradient(145deg, rgba(20,10,40,0.95) 0%, rgba(6,0,16,0.98) 100%)';
  const backBorder = isLightTheme ? 'rgba(139,92,246,0.3)' : 'rgba(132,0,255,0.3)';
  const backShadow = isLightTheme
    ? 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.15), 0 0 20px rgba(139,92,246,0.2)'
    : 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(132,0,255,0.2)';
  const frontShadow = isLightTheme
    ? '0 4px 20px rgba(139,92,246,0.15), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)'
    : 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)';

  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 40,
        damping: 15,
      }}
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front Face - Greek Letter Card - MagicBento style */}
        <div
          className={`absolute inset-0 h-full w-full overflow-hidden rounded-2xl flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300`}
          style={{
            backfaceVisibility: "hidden",
            background: gradient,
            boxShadow: `${frontShadow}, 0 0 0 transparent`,
            border: `1px solid ${borderColor}`,
          }}
        >
          {/* Purple glow overlay on hover */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${hoverGlow} 0%, transparent 70%)`,
              borderRadius: 'inherit',
            }}
          />
          {/* Subtle shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isLightTheme
                ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
              borderRadius: 'inherit',
            }}
          />
          {/* Large Greek letter */}
          <span className={`greek-text text-3xl font-medium drop-shadow-sm relative z-10 transition-colors duration-300 ${
            isLightTheme
              ? 'text-violet-900/90 group-hover:text-violet-700'
              : 'text-white/90 group-hover:text-purple-200'
          }`}>
            {greekLetter}
          </span>
        </div>

        {/* Back Face - Word and meaning - MagicBento style */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl backdrop-blur-md flex flex-col items-center justify-center p-2"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: backBg,
            boxShadow: backShadow,
            border: `1px solid ${backBorder}`,
          }}
        >
          <div className="text-center relative z-10">
            <p className={`greek-text text-sm font-medium mb-1 ${isLightTheme ? 'text-violet-800' : 'text-purple-200'}`}>{greekWord}</p>
            <p className={`text-[8px] leading-tight ${isLightTheme ? 'text-violet-600/70' : 'text-purple-300/70'}`}>{meaning}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Hero Component ---
const TOTAL_CARDS = 20;
const MAX_SCROLL = 3000;

// Greek alphabet cards with vocabulary words - MagicBento inspired gradients (dark and light)
const GREEK_CARDS = [
  { letter: 'Α', word: 'ἀγάπη', meaning: 'amour', darkGradient: 'linear-gradient(145deg, rgba(20,10,40,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(237,233,254,0.98) 100%)' },
  { letter: 'Β', word: 'βασιλεία', meaning: 'royaume', darkGradient: 'linear-gradient(145deg, rgba(25,12,45,0.95) 0%, rgba(8,2,20,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(243,232,255,0.98) 100%)' },
  { letter: 'Γ', word: 'γράφω', meaning: 'écrire', darkGradient: 'linear-gradient(145deg, rgba(18,8,38,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(238,230,252,0.98) 100%)' },
  { letter: 'Δ', word: 'δόξα', meaning: 'gloire', darkGradient: 'linear-gradient(145deg, rgba(22,10,42,0.95) 0%, rgba(10,4,22,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,232,254,0.98) 100%)' },
  { letter: 'Ε', word: 'ἐκκλησία', meaning: 'église', darkGradient: 'linear-gradient(145deg, rgba(16,6,35,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(235,228,250,0.98) 100%)' },
  { letter: 'Ζ', word: 'ζωή', meaning: 'vie', darkGradient: 'linear-gradient(145deg, rgba(24,14,48,0.95) 0%, rgba(8,2,18,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(242,235,255,0.98) 100%)' },
  { letter: 'Η', word: 'ἡμέρα', meaning: 'jour', darkGradient: 'linear-gradient(145deg, rgba(20,10,40,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(237,233,254,0.98) 100%)' },
  { letter: 'Θ', word: 'θεός', meaning: 'Dieu', darkGradient: 'linear-gradient(145deg, rgba(28,16,52,0.95) 0%, rgba(12,4,24,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,238,255,0.98) 100%)' },
  { letter: 'Ι', word: 'Ἰησοῦς', meaning: 'Jésus', darkGradient: 'linear-gradient(145deg, rgba(26,14,50,0.95) 0%, rgba(10,2,22,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(244,236,255,0.98) 100%)' },
  { letter: 'Κ', word: 'κύριος', meaning: 'Seigneur', darkGradient: 'linear-gradient(145deg, rgba(22,12,44,0.95) 0%, rgba(8,0,18,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(239,232,253,0.98) 100%)' },
  { letter: 'Λ', word: 'λόγος', meaning: 'parole', darkGradient: 'linear-gradient(145deg, rgba(18,8,38,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(238,230,252,0.98) 100%)' },
  { letter: 'Μ', word: 'μαθητής', meaning: 'disciple', darkGradient: 'linear-gradient(145deg, rgba(20,10,42,0.95) 0%, rgba(8,2,20,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,233,254,0.98) 100%)' },
  { letter: 'Ν', word: 'νόμος', meaning: 'loi', darkGradient: 'linear-gradient(145deg, rgba(16,8,36,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(236,229,251,0.98) 100%)' },
  { letter: 'Ξ', word: 'ξένος', meaning: 'étranger', darkGradient: 'linear-gradient(145deg, rgba(24,12,46,0.95) 0%, rgba(10,2,22,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(241,234,254,0.98) 100%)' },
  { letter: 'Ο', word: 'οὐρανός', meaning: 'ciel', darkGradient: 'linear-gradient(145deg, rgba(20,10,40,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(237,233,254,0.98) 100%)' },
  { letter: 'Π', word: 'πίστις', meaning: 'foi', darkGradient: 'linear-gradient(145deg, rgba(22,10,44,0.95) 0%, rgba(8,2,18,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,232,254,0.98) 100%)' },
  { letter: 'Ρ', word: 'ῥῆμα', meaning: 'parole', darkGradient: 'linear-gradient(145deg, rgba(18,8,38,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(238,230,252,0.98) 100%)' },
  { letter: 'Σ', word: 'σωτηρία', meaning: 'salut', darkGradient: 'linear-gradient(145deg, rgba(26,14,50,0.95) 0%, rgba(10,4,24,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(244,236,255,0.98) 100%)' },
  { letter: 'Τ', word: 'τέκνον', meaning: 'enfant', darkGradient: 'linear-gradient(145deg, rgba(20,10,40,0.95) 0%, rgba(6,0,16,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(237,233,254,0.98) 100%)' },
  { letter: 'Υ', word: 'υἱός', meaning: 'fils', darkGradient: 'linear-gradient(145deg, rgba(24,12,46,0.95) 0%, rgba(8,2,20,0.98) 100%)', lightGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(241,234,254,0.98) 100%)' },
];

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

interface ScrollMorphHeroProps {
  onScrollComplete?: () => void;
}

export default function ScrollMorphHero({ onScrollComplete }: ScrollMorphHeroProps) {
  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isLightTheme, setIsLightTheme] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme detection
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsLightTheme(theme === 'light');
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // --- Container Size ---
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  // --- Virtual Scroll Logic ---
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);

      // Trigger callback when scroll is complete
      if (newScroll >= MAX_SCROLL - 100 && onScrollComplete) {
        onScrollComplete();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      const newScroll = Math.min(Math.max(scrollRef.current + deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll, onScrollComplete]);

  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

  const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  // --- Mouse Parallax ---
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const normalizedX = (relativeX / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  // --- Intro Sequence ---
  useEffect(() => {
    const timer1 = setTimeout(() => setIntroPhase("line"), 500);
    const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // --- Random Scatter Positions ---
  const scatterPositions = useMemo(() => {
    return GREEK_CARDS.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    }));
  }, []);

  // --- Render Loop ---
  const [morphValue, setMorphValue] = useState(0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
    const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
    const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
    return () => {
      unsubscribeMorph();
      unsubscribeRotate();
      unsubscribeParallax();
    };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

  // --- Content Opacity ---
  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = isLightTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    // Also persist to localStorage if settings store exists
    try {
      const settingsStr = localStorage.getItem('koine-settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        settings.state.darkMode = newTheme === 'dark';
        localStorage.setItem('koine-settings', JSON.stringify(settings));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden transition-colors duration-300 ${
        isLightTheme
          ? 'bg-gradient-to-br from-slate-100 via-violet-50 to-slate-100'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      }`}
    >
      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-30 p-3 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer ${
          isLightTheme
            ? 'bg-white/80 hover:bg-white border border-violet-200 shadow-lg shadow-violet-200/30'
            : 'bg-white/10 hover:bg-white/20 border border-white/20 shadow-lg shadow-purple-500/20'
        }`}
        aria-label={isLightTheme ? 'Activer le mode sombre' : 'Activer le mode clair'}
      >
        {isLightTheme ? (
          // Moon icon for switching to dark mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-violet-600"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          // Sun icon for switching to light mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-yellow-300"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </motion.button>

      {/* Ambient glow effects - MagicBento purple (theme-aware) */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-300 ${
        isLightTheme ? 'bg-violet-300/20' : 'bg-purple-600/10'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-300 ${
        isLightTheme ? 'bg-purple-300/25' : 'bg-violet-500/15'
      }`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-colors duration-300 ${
        isLightTheme ? 'bg-[rgba(139,92,246,0.08)]' : 'bg-[rgba(132,0,255,0.05)]'
      }`} />

      <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

        {/* Intro Text */}
        <div className="absolute z-20 flex flex-col items-center justify-center text-center top-1/2 -translate-y-1/2 px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className={`text-2xl font-medium tracking-tight md:text-4xl greek-text pointer-events-none ${
              isLightTheme ? 'text-slate-800' : 'text-slate-100'
            }`}
          >
            Ἐν ἀρχῇ ἦν ὁ λόγος
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.7 - morphValue } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`mt-2 text-sm pointer-events-none ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}
          >
            Au commencement était la Parole
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <StarBorder
              as="button"
              color={isLightTheme ? 'rgba(139,92,246,0.8)' : 'rgba(168,85,247,0.8)'}
              speed="4s"
              className="star-border-hero"
              onClick={onScrollComplete}
            >
              Commencer à étudier
            </StarBorder>
          </motion.div>
        </div>

        {/* Arc Active Content */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute top-[8%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
        >
          <h2 className={`text-3xl md:text-5xl font-semibold tracking-tight mb-4 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-100'
          }`}>
            Apprenez le Grec Koinè
          </h2>
          <p className={`text-sm md:text-base max-w-lg leading-relaxed ${
            isLightTheme ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Découvrez la langue du Nouveau Testament. <br className="hidden md:block" />
            Une méthode moderne pour maîtriser le grec biblique.
          </p>
        </motion.div>

        {/* Cards Container */}
        <div className="relative flex items-center justify-center w-full h-full">
          {GREEK_CARDS.slice(0, TOTAL_CARDS).map((card, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const lineSpacing = 70;
              const lineTotalWidth = TOTAL_CARDS * lineSpacing;
              const lineX = i * lineSpacing - lineTotalWidth / 2;
              target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              const isMobile = containerSize.width < 768;
              const minDimension = Math.min(containerSize.width, containerSize.height);

              const circleRadius = Math.min(minDimension * 0.35, 350);
              const circleAngle = (i / TOTAL_CARDS) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
              const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY = arcApexY + arcRadius;
              const spreadAngle = isMobile ? 100 : 130;
              const startAngle = -90 - (spreadAngle / 2);
              const step = spreadAngle / (TOTAL_CARDS - 1);

              const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
              const maxRotation = spreadAngle * 0.8;
              const boundedRotation = -scrollProgress * maxRotation;

              const currentArcAngle = startAngle + (i * step) + boundedRotation;
              const arcRad = (currentArcAngle * Math.PI) / 180;

              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: isMobile ? 1.4 : 1.8,
              };

              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return (
              <FlipCard
                key={i}
                index={i}
                total={TOTAL_CARDS}
                phase={introPhase}
                target={target}
                greekLetter={card.letter}
                greekWord={card.word}
                meaning={card.meaning}
                gradient={isLightTheme ? card.lightGradient : card.darkGradient}
                isLightTheme={isLightTheme}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
