import React from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Users, Heart, Disc3 } from 'lucide-react';
import './Experience.css';

const experiencePillars = [
  {
    num: '01',
    icon: <Music size={22} />,
    title: 'The Folk Rhythm',
    subtitle: 'AUTHENTIC GARBA BEATS',
    description: 'Immerse yourself in traditional dhol beats and Gujarati folk melodies that bring every step alive in rhythmic harmony.',
  },
  {
    num: '02',
    icon: <Sparkles size={22} />,
    title: 'A Thousand Colours',
    subtitle: 'FESTIVE DRESS & EXPRESSION',
    description: 'A canvas of vibrant chaniya cholis, kediyas, mirrored embroidery, and handcrafted dandiyas celebrating our heritage.',
  },
  {
    num: '03',
    icon: <Users size={22} />,
    title: 'College Community',
    subtitle: 'LJCCA & AiRA LAB FAMILY',
    description: 'Students across all semesters unite on the campus ground to celebrate shared culture, friendship, and joy.',
  },
  {
    num: '04',
    icon: <Heart size={22} />,
    title: 'Lasting Memories',
    subtitle: 'TRADITION MEETS YOUTH',
    description: 'An afternoon designed not just as an event, but as an enduring milestone of your college experience.',
  },
];

const Experience: React.FC = () => {
  return (
    <section className="experience section" id="experience" aria-labelledby="exp-title">
      <div className="container">
        {/* Section Index Marker */}
        <div className="experience__marker">
          <span className="editorial-num">01 //</span>
          <span className="editorial-tag">CULTURAL CELEBRATION</span>
          <span className="experience__marker-line" aria-hidden="true" />
        </div>

        {/* Section Header */}
        <div className="experience__header">
          <motion.div
            className="experience__eyebrow"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Disc3 size={15} className="experience__eyebrow-icon" aria-hidden="true" />
            <span className="text-eyebrow">NAVRATRI UTSAV 2026</span>
          </motion.div>

          <motion.h2
            id="exp-title"
            className="experience__title text-section-title font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            One Rhythm.<br />
            <em>A Thousand Colours.</em>
          </motion.h2>

          <motion.p
            className="experience__copy font-display"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Come together for an afternoon of Garba, festive energy, and shared college memories.
          </motion.p>
        </div>

        {/* Editorial Pillars Grid */}
        <div className="experience__grid">
          {experiencePillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              className="experience__card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.6 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <div className="experience__card-top">
                <span className="experience__card-num font-heading">{pillar.num}</span>
                <div className="experience__card-icon" aria-hidden="true">
                  {pillar.icon}
                </div>
              </div>
              <div className="experience__card-body">
                <span className="experience__card-sub">{pillar.subtitle}</span>
                <h3 className="experience__card-title font-display">{pillar.title}</h3>
                <p className="experience__card-desc">{pillar.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlight Cultural Manifesto */}
        <motion.div
          className="experience__quote-banner"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <div className="experience__quote-inner">
            <span className="experience__quote-mark font-display" aria-hidden="true">“</span>
            <p className="experience__quote-text font-display">
              Rangvaasa is more than a dance floor — it is the heartbeat of Navratri brought to life at LJCCA.
            </p>
            <div className="experience__quote-meta">
              <span className="experience__quote-author font-heading">LJCCA × AiRA LAB</span>
              <span className="experience__quote-tag">[ TRADITION × YOUTH ]</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;
