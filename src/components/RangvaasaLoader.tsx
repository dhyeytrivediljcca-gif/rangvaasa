import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RangvaasaLoader.css';

interface RangvaasaLoaderProps {
  onComplete?: () => void;
  minDuration?: number; // Minimum display time in ms (default ~1600ms)
  maxTimeout?: number;  // Safety fallback timeout in ms (default ~2800ms)
}

/* ---- Beautiful Traditional Gujarati Dholak / Dhol SVG Illustration ---- */
const GujaratiDhol: React.FC<{ isRhythmic: boolean; reducedMotion: boolean }> = ({
  isRhythmic,
  reducedMotion,
}) => {
  return (
    <div className={`loader__dhol-container ${isRhythmic && !reducedMotion ? 'loader__dhol--dancing' : ''}`}>
      {/* Sonic Garba Rhythm Accents (Left Bass & Right Treble Beats) */}
      {!reducedMotion && (
        <>
          <div className="loader__beat-accent loader__beat-accent--left" aria-hidden="true">
            <span className="loader__beat-pulse" />
            <span className="loader__beat-sparkle">✦</span>
          </div>
          <div className="loader__beat-accent loader__beat-accent--right" aria-hidden="true">
            <span className="loader__beat-pulse" />
            <span className="loader__beat-sparkle">✦</span>
          </div>
        </>
      )}

      <svg
        viewBox="0 0 380 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="loader__dhol-svg"
        role="img"
        aria-label="Traditional Gujarati Dholak"
      >
        <defs>
          {/* Rich mahogany & polished rosewood barrel gradient */}
          <linearGradient id="dholBarrelGrad" x1="40" y1="30" x2="40" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7E2416" />
            <stop offset="28%" stopColor="#A43322" />
            <stop offset="55%" stopColor="#721F13" />
            <stop offset="85%" stopColor="#4A130B" />
            <stop offset="100%" stopColor="#2E0A05" />
          </linearGradient>

          {/* Golden barrel highlight reflection */}
          <linearGradient id="dholBarrelShine" x1="40" y1="70" x2="40" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5B842" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F5B842" stopOpacity="0" />
          </linearGradient>

          {/* Left Bass Drumhead (Dhama) Leather Parchment */}
          <radialGradient id="dholHeadBass" cx="48" cy="110" r="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F7EEDD" />
            <stop offset="68%" stopColor="#E2CEA8" />
            <stop offset="92%" stopColor="#B69A72" />
            <stop offset="100%" stopColor="#6C492B" />
          </radialGradient>

          {/* Right Treble Drumhead (Chanti) Leather Parchment */}
          <radialGradient id="dholHeadTreble" cx="332" cy="110" r="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF4E8" />
            <stop offset="58%" stopColor="#EADEC6" />
            <stop offset="88%" stopColor="#C8AC82" />
            <stop offset="100%" stopColor="#6C492B" />
          </radialGradient>

          {/* Treble Syahi / Tuning Paste Disc */}
          <radialGradient id="dholSyahi" cx="332" cy="110" r="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E120E" />
            <stop offset="80%" stopColor="#2E1C15" />
            <stop offset="100%" stopColor="#4A2F24" />
          </radialGradient>

          {/* Festive Waist Band / Patta Gradient */}
          <linearGradient id="dholBandGrad" x1="175" y1="20" x2="205" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B8202D" />
            <stop offset="45%" stopColor="#E84A35" />
            <stop offset="50%" stopColor="#F3B844" />
            <stop offset="55%" stopColor="#E84A35" />
            <stop offset="100%" stopColor="#B8202D" />
          </linearGradient>

          {/* Drop shadow filter for realism */}
          <filter id="dholShadow" x="-10%" y="10%" width="120%" height="150%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.18   0 0 0 0 0.08   0 0 0 0 0.05  0 0 0 0.28 0" />
            <feBlend in="SourceGraphic" in2="blur" mode="normal" />
          </filter>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="190" cy="198" rx="145" ry="16" fill="rgba(60, 24, 18, 0.18)" />

        {/* --- 1. Dhol Wooden Barrel Body --- */}
        <path
          d="M 48,68 
             C 120,44 260,44 332,68 
             C 342,95 342,125 332,152 
             C 260,176 120,176 48,152 
             C 38,125 38,95 48,68 Z"
          fill="url(#dholBarrelGrad)"
          stroke="#42120C"
          strokeWidth="1.5"
        />

        {/* Barrel cylindrical gloss highlight */}
        <path
          d="M 52,78 
             C 125,58 255,58 328,78 
             C 324,88 324,96 328,104 
             C 255,84 125,84 52,104 
             C 56,96 56,88 52,78 Z"
          fill="url(#dholBarrelShine)"
        />

        {/* Subtle woodgrain curvature grooves */}
        <path d="M 68,90 C 130,76 250,76 312,90" stroke="rgba(245, 184, 66, 0.18)" strokeWidth="1" strokeDasharray="30 15 45 10" />
        <path d="M 62,130 C 130,144 250,144 318,130" stroke="rgba(0, 0, 0, 0.22)" strokeWidth="1.2" strokeDasharray="20 18 35 12" />

        {/* --- 2. Traditional Cotton Rope Lacing (Badd) in Zigzag Pattern --- */}
        <g className="loader__dhol-ropes" stroke="#FBF4E8" strokeWidth="2.2" strokeLinecap="round" opacity="0.94">
          <line x1="48" y1="74" x2="332" y2="92" />
          <line x1="48" y1="92" x2="332" y2="74" />
          <line x1="48" y1="92" x2="332" y2="128" />
          <line x1="48" y1="128" x2="332" y2="92" />
          <line x1="48" y1="128" x2="332" y2="146" />
          <line x1="48" y1="146" x2="332" y2="128" />
          {/* Subtle rope shadow underneath */}
          <line x1="49" y1="76" x2="333" y2="94" stroke="rgba(40, 10, 5, 0.35)" strokeWidth="1.5" />
          <line x1="49" y1="94" x2="333" y2="76" stroke="rgba(40, 10, 5, 0.35)" strokeWidth="1.5" />
        </g>

        {/* --- 3. Antique Brass Tuning Rings (Challas) --- */}
        <g className="loader__dhol-challas" fill="#F3B844" stroke="#8E5F12" strokeWidth="1">
          <ellipse cx="140" cy="85" rx="4.5" ry="7" transform="rotate(-15 140 85)" />
          <ellipse cx="230" cy="83" rx="4.5" ry="7" transform="rotate(15 230 83)" />
          <ellipse cx="145" cy="135" rx="4.5" ry="7" transform="rotate(18 145 135)" />
          <ellipse cx="235" cy="137" rx="4.5" ry="7" transform="rotate(-18 235 137)" />
          <ellipse cx="188" cy="110" rx="5" ry="7.5" />
        </g>

        {/* --- 4. Central Festive Belt / Patta (Gujarati Mirrored Band) --- */}
        <rect x="176" y="52" width="28" height="116" rx="2" fill="url(#dholBandGrad)" stroke="#F3B844" strokeWidth="1.2" />
        {/* Diamond folk embroidery pattern */}
        {[64, 82, 100, 118, 136, 154].map((y) => (
          <g key={y}>
            <polygon
              points={`190,${y - 5} 195,${y} 190,${y + 5} 185,${y}`}
              fill="#FAF7F0"
              stroke="#D49B2E"
              strokeWidth="0.8"
            />
            <circle cx="190" cy={y} r="1.5" fill="#B8202D" />
          </g>
        ))}

        {/* Auspicious Central Chandlo / Vermilion Tilak Bindu */}
        <circle cx="190" cy="110" r="6" fill="#B8202D" stroke="#F3B844" strokeWidth="1.5" />
        <circle cx="190" cy="110" r="2.2" fill="#FAF7F0" />

        {/* --- 5. Left Bass Drumhead (Dhama) --- */}
        {/* Leather hoop / Gajra rim */}
        <ellipse cx="48" cy="110" rx="14" ry="43" fill="#582618" stroke="#32120A" strokeWidth="2" />
        {/* Playing skin surface */}
        <ellipse cx="46" cy="110" rx="12" ry="40" fill="url(#dholHeadBass)" />
        {/* Inner acoustic boundary line */}
        <ellipse cx="46" cy="110" rx="8" ry="28" fill="none" stroke="rgba(108, 73, 43, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
        {/* Metal tuning rim edge */}
        <ellipse cx="43" cy="110" rx="2" ry="38" fill="#F3B844" opacity="0.75" />

        {/* --- 6. Right Treble Drumhead (Chanti) --- */}
        {/* Leather hoop / Gajra rim */}
        <ellipse cx="332" cy="110" rx="14" ry="43" fill="#582618" stroke="#32120A" strokeWidth="2" />
        {/* Playing skin surface */}
        <ellipse cx="334" cy="110" rx="12" ry="40" fill="url(#dholHeadTreble)" />
        {/* Black Syahi tuning circle */}
        <ellipse cx="334" cy="110" rx="7" ry="19" fill="url(#dholSyahi)" />
        <ellipse cx="334" cy="110" rx="3.5" ry="9" fill="#150B08" />
        {/* Metal tuning rim edge */}
        <ellipse cx="337" cy="110" rx="2" ry="38" fill="#F3B844" opacity="0.75" />
      </svg>
    </div>
  );
};

/* ---- Main Rangvaasa Cultural Loader Component ---- */
export const RangvaasaLoader: React.FC<RangvaasaLoaderProps> = ({
  onComplete,
  minDuration = 5000, // Minimum 5 seconds loading animation runtime as requested
  maxTimeout = 6500,  // Safety fallback
}) => {
  const [phase, setPhase] = useState<'enter' | 'rhythm' | 'exit'>('enter');
  const [isDone, setIsDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener?.('change', handleMotionChange);

    // Prevent body scrolling while loader is visible
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Transition from arrival to rhythm
    const rhythmTimer = window.setTimeout(() => {
      setPhase('rhythm');
    }, reducedMotion ? 200 : 450);

    // Function to trigger exit sequence cleanly after minimum 5 seconds
    const triggerExit = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const effectiveMin = reducedMotion ? 2000 : minDuration;
      const remaining = Math.max(0, effectiveMin - elapsed);

      timerRef.current = window.setTimeout(() => {
        setPhase('exit');
        // Allow exit animation to complete before unmounting
        window.setTimeout(() => {
          setIsDone(true);
          document.body.style.overflow = originalOverflow;
          onComplete?.();
        }, 600);
      }, remaining);
    };

    // Await essential readiness: document.fonts.ready & garba character image preload
    const checkReadiness = async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch (err) {
        // Fallback gracefully on font errors
      }

      // Preload the hero's primary transparent illustration so the hero is crisp upon reveal
      const preloadImg = new Image();
      preloadImg.src = '/garba-illustration.png';
      if (preloadImg.complete) {
        triggerExit();
      } else {
        preloadImg.onload = () => triggerExit();
        preloadImg.onerror = () => triggerExit();
      }
    };

    checkReadiness();

    // Absolute upper ceiling timeout so user is NEVER stuck
    maxTimerRef.current = window.setTimeout(() => {
      triggerExit();
    }, maxTimeout);

    return () => {
      clearTimeout(rhythmTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      motionQuery.removeEventListener?.('change', handleMotionChange);
      document.body.style.overflow = originalOverflow;
    };
  }, [minDuration, maxTimeout, reducedMotion, onComplete]);

  if (isDone) return null;

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="loader-overlay"
          className="loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.025,
            transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading RANGVAASA 2026 celebration"
        >
          {/* Subtle Khadi Paper Grain Texture & Ambient Halos */}
          <div className="loader__backdrop-aura" aria-hidden="true" />

          {/* Decorative Gujarati Corner Torans */}
          <div className="loader__toran loader__toran--tl" aria-hidden="true">
            <span className="loader__toran-bead">✦</span>
            <div className="loader__toran-line" />
          </div>
          <div className="loader__toran loader__toran--tr" aria-hidden="true">
            <div className="loader__toran-line" />
            <span className="loader__toran-bead">✦</span>
          </div>
          <div className="loader__toran loader__toran--bl" aria-hidden="true">
            <span className="loader__toran-bead">✧</span>
            <div className="loader__toran-line" />
          </div>
          <div className="loader__toran loader__toran--br" aria-hidden="true">
            <div className="loader__toran-line" />
            <span className="loader__toran-bead">✧</span>
          </div>

          {/* Centerpiece Stage */}
          <div className="loader__stage">
            {/* Fine Rotating Folk Mandala Rings in Background */}
            <div className="loader__mandala-wrap" aria-hidden="true">
              <svg viewBox="0 0 400 400" className="loader__mandala-svg">
                <circle cx="200" cy="200" r="190" stroke="var(--accent-gold)" strokeWidth="1" strokeDasharray="8 8" opacity="0.35" />
                <circle cx="200" cy="200" r="160" stroke="var(--accent-red)" strokeWidth="1" strokeDasharray="4 6" opacity="0.25" />
                <circle cx="200" cy="200" r="120" stroke="var(--accent-gold-deep)" strokeWidth="1.2" strokeDasharray="2 7" opacity="0.3" />
                {/* 8 Satellite folk nodes */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                  <g key={ang} transform={`rotate(${ang}, 200, 200)`}>
                    <circle cx="200" cy="40" r="2.5" fill="var(--accent-gold)" opacity="0.6" />
                  </g>
                ))}
              </svg>
            </div>

            {/* The Traditional Gujarati Dhol / Dholak */}
            <motion.div
              className="loader__dhol-wrap"
              initial={{ scale: 0.88, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <GujaratiDhol isRhythmic={phase === 'rhythm'} reducedMotion={reducedMotion} />
            </motion.div>

            {/* Typography Choreography: “એ હાલો…” */}
            <div className="loader__content">
              {/* Event Eyebrow annotation */}
              <motion.div
                className="loader__eyebrow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.55 }}
              >
                <span className="loader__gujarati-badge" title="રંગ">ર</span>
                <span className="text-eyebrow">LJCCA × AiRA LAB PRESENT</span>
              </motion.div>

              {/* The Call to Garba: “એ હાલો…” */}
              <h1 className="loader__phrase" aria-label="એ હાલો… (Come on, let's go!)">
                {/* Word 1: “એ” */}
                <motion.span
                  className="loader__word loader__word--first"
                  initial={{ opacity: 0, y: 22, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  એ
                </motion.span>

                <span className="loader__word-spacer">&nbsp;</span>

                {/* Word 2: “હાલો” */}
                <motion.span
                  className="loader__word loader__word--second"
                  initial={{ opacity: 0, y: 22, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.8, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  હાલો
                </motion.span>

                {/* Ellipsis: “…” with rhythmic dot stagger */}
                <span className="loader__ellipsis" aria-hidden="true">
                  <motion.span
                    className="loader__dot"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5, duration: 0.35 }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    className="loader__dot"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.8, duration: 0.35 }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    className="loader__dot"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.1, duration: 0.35 }}
                  >
                    .
                  </motion.span>
                </span>
              </h1>

              {/* Fine Vermilion-to-Gold Ornamental Divider Line */}
              <motion.div
                className="loader__line"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 3.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Meaning & Festival Tagline */}
              <motion.div
                className="loader__meta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.7, duration: 0.6 }}
              >
                <p className="loader__meaning font-display">
                  “Come on, let’s go!”
                </p>
                <span className="loader__festival-tag">
                  RANGVAASA 2026 · NAVRATRI UTSAV
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RangvaasaLoader;
