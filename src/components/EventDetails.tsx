import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Copy, Check, ExternalLink } from 'lucide-react';
import MagneticButton from './MagneticButton';
import './EventDetails.css';

const venueAddress = 'LJ College of Computer Applications Ground, Vastrapur, Ahmedabad, Gujarat 380015';
const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=LJ+College+of+Computer+Applications+Vastrapur+Ahmedabad';

const detailCards = [
  {
    id: 'date',
    num: '01',
    icon: <Calendar size={22} />,
    eyebrow: 'CALENDAR DATE',
    title: 'Friday, 16 October 2026',
    sub: 'Full day of festive Garba celebration & campus community',
  },
  {
    id: 'time',
    num: '02',
    icon: <Clock size={22} />,
    eyebrow: 'SCHEDULE',
    title: '12:00 PM Onwards',
    sub: 'Afternoon festivities extending into the twilight hours',
  },
  {
    id: 'venue',
    num: '03',
    icon: <MapPin size={22} />,
    eyebrow: 'LOCATION & VENUE',
    title: 'LJCCA Ground, Vastrapur',
    sub: 'Ahmedabad, Gujarat 380015 — Near Vastrapur Lake',
  },
];

const EventDetails: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(venueAddress);
      } else {
        const input = document.createElement('textarea');
        input.value = venueAddress;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Copy address failed:', err);
    }
  };

  return (
    <section className="details section" id="details" aria-labelledby="details-title">
      <div className="container">
        {/* Section Index Marker */}
        <div className="details__marker">
          <span className="editorial-num">03 //</span>
          <span className="editorial-tag">ITINERARY & VENUE</span>
          <span className="details__marker-line" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="details__header">
          <motion.div
            className="details__eyebrow"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-eyebrow">ESSENTIAL ITINERARY</span>
          </motion.div>

          <motion.h2
            id="details-title"
            className="details__title text-section-title font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Find Your Way to Rangvaasa
          </motion.h2>

          <motion.p
            className="details__desc font-display"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Mark your calendar. Reach on time. Experience the celebration in full.
          </motion.p>
        </div>

        {/* 3 Main Details Cards */}
        <div className="details__grid">
          {detailCards.map((card, idx) => (
            <motion.div
              key={card.id}
              className="details__card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.1, duration: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="details__card-header">
                <span className="details__card-num font-heading">{card.num}</span>
                <span className="details__card-eye text-eyebrow">{card.eyebrow}</span>
                <div className="details__card-icon" aria-hidden="true">
                  {card.icon}
                </div>
              </div>
              <h3 className="details__card-heading font-display">{card.title}</h3>
              <p className="details__card-sub">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Strip: Maps Link & Copy Address */}
        <motion.div
          className="details__action-bar"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <div className="details__venue-info">
            <MapPin size={18} className="details__pin-icon" aria-hidden="true" />
            <div className="details__venue-lines">
              <span className="details__venue-text">{venueAddress}</span>
              <span className="editorial-tag">[ COORD: 23.0300° N, 72.5178° E ]</span>
            </div>
          </div>

          <div className="details__btns">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="details__btn details__btn--maps"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span>Open in Google Maps</span>
            </a>

            <MagneticButton
              className="details__btn details__btn--copy"
              onClick={handleCopy}
              aria-label={copied ? 'Address copied' : 'Copy address to clipboard'}
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Address'}</span>
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventDetails;
