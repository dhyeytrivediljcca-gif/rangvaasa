import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown, ArrowRight, Compass } from 'lucide-react';
import MagneticButton from './MagneticButton';
import './Hero.css';

/* Subtle Gujarati Rangoli Mandala — Ornamental Linework */
const FolkMotif: React.FC = () => (
  <svg
    className="hero__folk-motif"
    viewBox="0 0 500 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" opacity="0.15" />
    <circle cx="250" cy="250" r="170" stroke="currentColor" strokeWidth="1" opacity="0.18" />
    <circle cx="250" cy="250" r="100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.22" />
    <circle cx="250" cy="250" r="35" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    
    {/* 8-point subtle petal geometry */}
    {Array.from({ length: 8 }).map((_, i) => (
      <g key={i} transform={`rotate(${i * 45}, 250, 250)`}>
        <path
          d="M250 155 C238 185, 238 215, 250 230 C262 215, 262 185, 250 155 Z"
          fill="currentColor"
          opacity="0.08"
        />
        <line x1="250" y1="95" x2="250" y2="155" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.22" />
        <circle cx="250" cy="90" r="3" fill="currentColor" opacity="0.25" />
      </g>
    ))}
  </svg>
);

/* Multi-Layered Rotating Garba Mandala & Orbit System */
const GarbaMandala: React.FC = () => (
  <svg
    viewBox="0 0 520 520"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="hero__aura-svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="mandalaAuraGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.32" />
        <stop offset="60%" stopColor="var(--accent-vermilion)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient radial halo behind all rings */}
    <circle cx="260" cy="260" r="250" fill="url(#mandalaAuraGlow)" />

    {/* 1. Outer Orbit: 100s clockwise rotation with orbital nodes */}
    <g className="mandala__outer-orbit">
      <circle
        cx="260"
        cy="260"
        r="248"
        stroke="var(--accent-gold)"
        strokeWidth="1"
        strokeDasharray="10 8"
        opacity="0.32"
      />
      {/* Orbital nodes at 4 cardinal positions */}
      <circle cx="260" cy="12" r="3.5" fill="var(--accent-gold)" opacity="0.6" />
      <circle cx="508" cy="260" r="3.5" fill="var(--accent-gold)" opacity="0.6" />
      <circle cx="260" cy="508" r="3.5" fill="var(--accent-gold)" opacity="0.6" />
      <circle cx="12" cy="260" r="3.5" fill="var(--accent-gold)" opacity="0.6" />
      {/* Diamond satellites at 45 degree diagonals */}
      {[45, 135, 225, 315].map((ang) => (
        <g key={ang} transform={`rotate(${ang}, 260, 260)`}>
          <polygon points="260,10 263,14 260,18 257,14" fill="var(--accent-vermilion)" opacity="0.5" />
        </g>
      ))}
    </g>

    {/* 2. Accent Ring: 120s clockwise rotation with subtle saffron dotted pattern */}
    <g className="mandala__accent-ring">
      <circle
        cx="260"
        cy="260"
        r="225"
        stroke="var(--accent-gold-deep)"
        strokeWidth="1.2"
        strokeDasharray="2 8"
        opacity="0.4"
      />
      {/* Small accent beads */}
      {[0, 60, 120, 180, 240, 300].map((ang) => (
        <g key={ang} transform={`rotate(${ang}, 260, 260)`}>
          <circle cx="260" cy="35" r="2" fill="var(--accent-gold)" opacity="0.6" />
        </g>
      ))}
    </g>

    {/* 3. Middle Orbit: 65s counter-clockwise rotation with dashed paths & nodes */}
    <g className="mandala__middle-orbit">
      <circle
        cx="260"
        cy="260"
        r="188"
        stroke="var(--accent-red)"
        strokeWidth="1.2"
        strokeDasharray="6 7"
        opacity="0.36"
      />
      <circle
        cx="260"
        cy="260"
        r="168"
        stroke="var(--accent-gold)"
        strokeWidth="0.8"
        strokeDasharray="3 6"
        opacity="0.25"
      />
      {/* 8 Satellite nodes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
        <g key={ang} transform={`rotate(${ang}, 260, 260)`}>
          <circle cx="260" cy="72" r="2.5" fill="var(--accent-vermilion)" opacity="0.5" />
        </g>
      ))}
    </g>

    {/* 4. Inner Mandala: 85s clockwise rotation with radial spokes & dots */}
    <g className="mandala__inner-mandala">
      <circle
        cx="260"
        cy="260"
        r="144"
        stroke="var(--accent-gold)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        opacity="0.38"
      />
      <circle
        cx="260"
        cy="260"
        r="104"
        stroke="var(--accent-red)"
        strokeWidth="1"
        opacity="0.25"
      />
      {/* 16 Radial folk spokes with pearl nodes */}
      {Array.from({ length: 16 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 22.5}, 260, 260)`}>
          <line
            x1="260"
            y1="104"
            x2="260"
            y2="144"
            stroke="var(--accent-gold)"
            strokeWidth="1"
            opacity="0.38"
          />
          <circle cx="260" cy="142" r="2.5" fill="var(--accent-vermilion)" opacity="0.55" />
        </g>
      ))}
    </g>

    {/* 5. Center Core: 50s counter-clockwise rotation */}
    <g className="mandala__core">
      <circle
        cx="260"
        cy="260"
        r="72"
        stroke="var(--accent-gold)"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.35"
      />
      {/* 8-point subtle petal geometry */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45}, 260, 260)`}>
          <polygon
            points="260,205 263,222 257,222"
            fill="var(--accent-red)"
            opacity="0.3"
          />
        </g>
      ))}
      <circle cx="260" cy="260" r="5" fill="var(--accent-gold)" opacity="0.45" />
    </g>
  </svg>
);

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const normX = (clientX / innerWidth - 0.5) * 2;
    const normY = (clientY / innerHeight - 0.5) * 2;
    setParallaxOffset({
      x: normX * 12,
      y: normY * 12,
    });
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="hero"
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      aria-label="Rangvaasa 2026 Celebration"
    >
      {/* Background folk motif linework */}
      <div className="hero__decor-wrap" aria-hidden="true">
        <FolkMotif />
      </div>

      <div className="container hero__container">
        {/* Block 1: Header (Eyebrow, Title, Tagline) */}
        <div className="hero__header-block">
          {/* Editorial Eyebrow with Gujarati script annotation */}
          <motion.div
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero__gujarati-char" title="રંગ">ર</span>
            <span className="text-eyebrow">LJCCA × AiRA LAB PRESENT</span>
            <span className="hero__eyebrow-sep" aria-hidden="true">/</span>
            <span className="editorial-tag">AHMEDABAD 2026</span>
          </motion.div>

          {/* Heading + Stylized 2026 (Layered & Unclipped) */}
          <div className="hero__title-group">
            <div className="hero__title-wrapper">
              <motion.h1
                className="hero__heading text-hero"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              >
                RANGVAASA
              </motion.h1>
            </div>

            <motion.div
              className="hero__year-badge"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.5 }}
            >
              <span className="hero__year-num font-display">2026</span>
              <span className="hero__year-divider" aria-hidden="true" />
              <span className="hero__year-sub">NAVRATRI UTSAV</span>
              <span className="hero__year-coords">[ 23.03° N, 72.52° E ]</span>
            </motion.div>
          </div>

          {/* Tagline */}
          <motion.p
            className="hero__tagline font-display"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6 }}
          >
            Where Tradition Meets Expression.
          </motion.p>
        </div>

        {/* Block 2: Garba Illustration Centerpiece with Rotating Mandala */}
        <motion.div
          className="hero__illustration-col"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="hero__illustration-stage"
            style={{
              transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
              transition: isTouchDevice ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Background folk art rotating mandala & orbits */}
            <div className="hero__illustration-aura" aria-hidden="true">
              <GarbaMandala />
            </div>

            {/* Delicate floating festive sparkles */}
            <span className="hero__sparkle hero__sparkle--1" aria-hidden="true">✦</span>
            <span className="hero__sparkle hero__sparkle--2" aria-hidden="true">✧</span>
            <span className="hero__sparkle hero__sparkle--3" aria-hidden="true">✦</span>

            {/* Floating character illustration */}
            <motion.div
              className="hero__illustration-float"
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4.8,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/garba-illustration.png"
                alt="Gujarati boy and girl playing Garba with Dandiya sticks at Rangvaasa 2026"
                className="hero__illustration-img"
                width="1310"
                height="1200"
                loading="eager"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Block 3: Action & Schedule Metadata (Date, Time, Venue, CTAs) */}
        <div className="hero__action-block">
          {/* Event Metadata (Date, Time, Location) */}
          <motion.div
            className="hero__meta"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            aria-label="Event Schedule and Location"
          >
            <div className="hero__meta-card">
              <Calendar className="hero__meta-icon" size={17} aria-hidden="true" />
              <div className="hero__meta-text">
                <span className="hero__meta-primary">16 OCTOBER 2026</span>
                <span className="hero__meta-secondary">FRIDAY CELEBRATION</span>
              </div>
            </div>

            <div className="hero__meta-sep" aria-hidden="true" />

            <div className="hero__meta-card">
              <Clock className="hero__meta-icon" size={17} aria-hidden="true" />
              <div className="hero__meta-text">
                <span className="hero__meta-primary">12:00 PM ONWARDS</span>
                <span className="hero__meta-secondary">AFTERNOON TO DUSK</span>
              </div>
            </div>

            <div className="hero__meta-sep" aria-hidden="true" />

            <div className="hero__meta-card">
              <MapPin className="hero__meta-icon" size={17} aria-hidden="true" />
              <div className="hero__meta-text">
                <span className="hero__meta-primary">LJCCA GROUND</span>
                <span className="hero__meta-secondary">VASTRAPUR, AHMEDABAD</span>
              </div>
            </div>
          </motion.div>

          {/* CTAs with Magnetic Motion */}
          <motion.div
            className="hero__ctas"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.6 }}
          >
            <MagneticButton
              className="hero__cta-primary"
              onClick={() => handleScrollTo('experience')}
            >
              <span>Explore the Experience</span>
              <ArrowRight size={15} aria-hidden="true" />
            </MagneticButton>

            <MagneticButton
              className="hero__cta-secondary"
              onClick={() => handleScrollTo('pass')}
            >
              <span>Create Your Pass</span>
              <Compass size={15} aria-hidden="true" />
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      {/* Gentle Scroll Indicator */}
      <motion.button
        type="button"
        className="hero__scroll"
        onClick={() => handleScrollTo('experience')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        aria-label="Scroll down to explore experience"
      >
        <span className="hero__scroll-text">EXPLORE</span>
        <ChevronDown className="hero__scroll-icon" size={16} />
      </motion.button>
    </section>
  );
};

export default Hero;
