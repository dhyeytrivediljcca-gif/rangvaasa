import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import MagneticButton from './MagneticButton';
import './Navbar.css';

const desktopNavLinks = [
  { index: '01', label: 'Experience', href: '#experience' },
  { index: '02', label: 'The Art Adda', href: '#art-adda' },
  { index: '03', label: 'Details', href: '#details' },
  { index: '05', label: 'Stall Reg.', href: '#stall-registration' },
];

const mobileNavLinks = [
  { index: '01', label: 'Experience', href: '#experience' },
  { index: '02', label: 'The Art Adda', href: '#art-adda' },
  { index: '03', label: 'Details', href: '#details' },
  { index: '04', label: 'Get Your Pass', href: '#pass' },
  { index: '05', label: 'Stall Registration', href: '#stall-registration' },
];

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        {/* Left: Brand Group */}
        <a
          href="#"
          className="navbar__brand"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Rangvaasa 2026 - Back to Top"
        >
          <div className="navbar__logos">
            <img
              src="/ljcca-logo.png"
              alt="LJCCA Emblem"
              className="navbar__emblem"
              width="42"
              height="42"
            />
            <span className="navbar__logo-sep" aria-hidden="true">×</span>
            <img
              src="/airalab-logo.png"
              alt="AiRA LAB Emblem"
              className="navbar__aira-img"
              width="34"
              height="34"
            />
          </div>
          <div className="navbar__brand-copy">
            <div className="navbar__title-row">
              <span className="navbar__title font-heading">RANGVAASA</span>
              <span className="navbar__year-pill">2026</span>
            </div>
            <span className="navbar__subtitle">LJCCA × AiRA LAB</span>
          </div>
        </a>

        {/* Right: Nav items with Editorial Index + Theme Toggle + Magnetic CTA */}
        <div className="navbar__right">
          <nav className="navbar__links" aria-label="Primary Navigation">
            {desktopNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="navbar__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
              >
                <span className="navbar__link-idx">{link.index}</span>
                <span className="navbar__link-text">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="navbar__actions">
            <button
              type="button"
              className="navbar__theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'festive red' : 'warm ivory'} theme`}
              title={theme === 'light' ? 'Switch to Festive Red' : 'Switch to Warm Ivory'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={theme}
                  initial={{ rotate: -80, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 80, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="navbar__theme-icon"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <MagneticButton
              className="navbar__cta-btn"
              onClick={() => handleNavClick('#pass')}
            >
              <span>Get Your Pass</span>
              <ArrowUpRight size={14} className="navbar__cta-arrow" aria-hidden="true" />
            </MagneticButton>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="navbar__mobile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer & Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="navbar__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="navbar__drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="navbar__drawer-inner">
                <div className="navbar__drawer-header">
                  <span className="editorial-tag">NAVIGATION // 2026</span>
                </div>
                {mobileNavLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="navbar__drawer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                  >
                    <span className="navbar__drawer-idx">{link.index}</span>
                    <span className="navbar__drawer-label">{link.label}</span>
                  </a>
                ))}
                <button
                  type="button"
                  className="navbar__drawer-cta"
                  onClick={() => handleNavClick('#pass')}
                >
                  <span>Get Your Digital Pass</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
