import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer" aria-label="Rangvaasa Footer">
      {/* Decorative festive accent line */}
      <div className="footer__festive-bar" aria-hidden="true" />

      <div className="container footer__container">
        <div className="footer__grid">
          {/* Col 1: Identity & Logos */}
          <div className="footer__brand">
            <div className="footer__logos">
              <img
                src="/ljcca-logo.png"
                alt="LJCCA Emblem"
                className="footer__crest"
                width="42"
                height="42"
              />
              <span className="footer__logo-sep" aria-hidden="true">×</span>
              <img
                src="/airalab-logo.png"
                alt="AiRA LAB Emblem"
                className="footer__aira-img"
                width="34"
                height="34"
              />
            </div>

            <div className="footer__title-wrap">
              <h2 className="footer__title font-display">RANGVAASA</h2>
              <span className="footer__year">2026</span>
            </div>

            <p className="footer__tagline font-display">
              Where Tradition Meets Expression.
            </p>

            <span className="footer__collab">
              LJ College of Computer Applications × AiRA LAB
            </span>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="footer__col">
            <span className="footer__col-head text-eyebrow">EXPLORE</span>
            <ul className="footer__nav-list">
              <li>
                <button
                  type="button"
                  className="footer__nav-link"
                  onClick={() => handleScrollTo('hero')}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__nav-link"
                  onClick={() => handleScrollTo('experience')}
                >
                  Cultural Experience
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__nav-link"
                  onClick={() => handleScrollTo('art-adda')}
                >
                  The Art Adda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__nav-link"
                  onClick={() => handleScrollTo('details')}
                >
                  Event Details & Map
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__nav-link footer__nav-link--accent"
                  onClick={() => handleScrollTo('pass')}
                >
                  Grab Your Pass →
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__nav-link"
                  onClick={() => handleScrollTo('stall-registration')}
                >
                  Register Your Stall
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Schedule Info */}
          <div className="footer__col">
            <span className="footer__col-head text-eyebrow">AT A GLANCE</span>
            <div className="footer__info-group">
              <div className="footer__info-item">
                <span className="footer__info-label">DATE</span>
                <span className="footer__info-val">Friday, 16 October 2026</span>
              </div>
              <div className="footer__info-item">
                <span className="footer__info-label">TIME</span>
                <span className="footer__info-val">12:00 PM Onwards</span>
              </div>
              <div className="footer__info-item">
                <span className="footer__info-label">VENUE</span>
                <span className="footer__info-val">LJCCA Ground, Vastrapur, Ahmedabad</span>
              </div>
            </div>
          </div>

          {/* Col 4: The Art Adda Club */}
          <div className="footer__col">
            <span className="footer__col-head text-eyebrow">THE ART ADDA</span>
            <p className="footer__adda-copy">
              A student creative space launching at RANGVAASA 2026. Explore hands-on disciplines:
            </p>
            <div className="footer__tags">
              <span className="footer__tag">Resin Art</span>
              <span className="footer__tag">Crochet</span>
              <span className="footer__tag">Chocolate Making</span>
              <span className="footer__tag">Handmade Crafts</span>
              <span className="footer__tag">Student Showcases</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__bottom-copy">
            © 2026 RANGVAASA. Organized with pride by LJCCA & AiRA LAB.
          </p>
          <p className="footer__bottom-motto font-display">
            Crafted for community, culture & creativity.
          </p>
        </div>

        {/* Creator Signature Credit */}
        <div className="footer__creator" aria-label="Creator Credit">
          <div className="footer__creator-divider" aria-hidden="true" />
          <p className="footer__creator-text">
            Made by Dhyey Trivedi · Sem-5 · LJCCA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
