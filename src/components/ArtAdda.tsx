import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Layers, Scissors, Star, Compass, ArrowUpRight } from 'lucide-react';
import './ArtAdda.css';

interface Discipline {
  id: string;
  num: string;
  title: string;
  category: string;
  materials: string;
  description: string;
  icon: React.ReactNode;
}

const disciplines: Discipline[] = [
  {
    id: 'resin',
    num: '01',
    title: 'Resin Art',
    category: 'FLUID MEDIUMS',
    materials: 'Epoxy, Pigment & Mica',
    description: 'Pour your imagination into crystal-clear creations that capture suspended pigment, light, and botanical geometry.',
    icon: <Palette size={26} />,
  },
  {
    id: 'crochet',
    num: '02',
    title: 'Crochet',
    category: 'TEXTILE & FIBER',
    materials: 'Yarn, Cotton & Hooks',
    description: 'Stitch by stitch, thread by thread — handcrafted wearable art, cozy tapestries, and intricate geometric mandalas.',
    icon: <Layers size={26} />,
  },
  {
    id: 'chocolate',
    num: '03',
    title: 'Chocolate Making',
    category: 'CULINARY ART',
    materials: 'Cacao, Ganache & Molds',
    description: 'Where gourmet gastronomy meets sculptural design — tempered, molded, and artisanally finished edible artistry.',
    icon: <Sparkles size={26} />,
  },
  {
    id: 'crafts',
    num: '04',
    title: 'Handmade Crafts',
    category: 'TACTILE HERITAGE',
    materials: 'Clay, Paper & Wood',
    description: 'Paper quilling, terracotta pottery, festive torans, and original tactile keepsakes celebrating Indian craftsmanship.',
    icon: <Scissors size={26} />,
  },
  {
    id: 'showcases',
    num: '05',
    title: 'Student Art Showcases',
    category: 'CAMPUS GALLERY',
    materials: 'Canvas, Ink & Charcoal',
    description: 'A dedicated platform celebrating raw student talent, sketches, paintings, illustrations, and original student works.',
    icon: <Star size={26} />,
  },
  {
    id: 'other',
    num: '06',
    title: 'Other Creative Expressions',
    category: 'OPEN HORIZONS',
    materials: 'Multidisciplinary Arts',
    description: 'Calligraphy, photography, digital illustration, and experimental design. The Art Adda is limitless.',
    icon: <Compass size={26} />,
  },
];

const ArtAdda: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleScrollToGrid = () => {
    const el = document.getElementById('adda-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="adda section" id="art-adda" aria-labelledby="adda-title">
      <div className="container">
        {/* Section Index Marker */}
        <div className="adda__marker">
          <span className="editorial-num">02 //</span>
          <span className="editorial-tag">CREATIVE CLUB LAUNCH</span>
          <span className="adda__marker-line" aria-hidden="true" />
        </div>

        {/* Editorial Launch Header */}
        <div className="adda__header">
          <motion.div
            className="adda__badge"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="adda__badge-dot" aria-hidden="true" />
            <span className="text-eyebrow">LJCCA CREATIVE INITIATIVE</span>
          </motion.div>

          <motion.h2
            id="adda-title"
            className="adda__title text-section-title font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            THE ART ADDA
          </motion.h2>

          <motion.p
            className="adda__tagline font-display"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            A space where imagination becomes something you can share.
          </motion.p>

          <motion.p
            className="adda__desc"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Launching officially at RANGVAASA 2026, The Art Adda invites creators, craft enthusiasts, and curious minds across all branches to gather, collaborate, and showcase authentic handmade artistry.
          </motion.p>

          <motion.div
            className="adda__cta-wrap"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <button
              type="button"
              className="adda__cta-btn"
              onClick={handleScrollToGrid}
            >
              <span>Explore The 6 Disciplines</span>
              <ArrowUpRight size={15} />
            </button>
          </motion.div>
        </div>

        {/* Disciplines Asymmetric Bento Grid */}
        <div className="adda__grid" id="adda-grid" aria-label="Creative Disciplines">
          {disciplines.map((d, index) => (
            <motion.div
              key={d.id}
              className={`adda__card ${index === 0 || index === 3 ? 'adda__card--accent' : ''} ${activeTab === d.id ? 'adda__card--active' : ''}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.07, duration: 0.6 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => setActiveTab(activeTab === d.id ? null : d.id)}
            >
              <div className="adda__card-top">
                <span className="adda__card-num font-heading">{d.num}</span>
                <span className="adda__card-cat">{d.category}</span>
                <div className="adda__card-icon" aria-hidden="true">
                  {d.icon}
                </div>
              </div>

              <div className="adda__card-mid">
                <h3 className="adda__card-title font-display">{d.title}</h3>
                <span className="adda__card-materials">{d.materials}</span>
              </div>

              <p className="adda__card-desc">{d.description}</p>

              <div className="adda__card-footer">
                <span className="editorial-tag">DISCIPLINE // 2026</span>
                <div className="adda__card-dot" aria-hidden="true" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Community Manifesto */}
        <motion.div
          className="adda__manifesto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <div className="adda__manifesto-content">
            <span className="editorial-tag" style={{ color: 'var(--accent-gold)' }}>[ CLUB MANIFESTO ]</span>
            <p className="adda__manifesto-text font-display">
              “Whether you work with yarn, molten sugar, resin, or ink — your creativity has a home at The Art Adda.”
            </p>
            <span className="adda__manifesto-author font-heading">LJCCA × AiRA LAB 2026</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArtAdda;
