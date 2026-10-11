import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileText, Edit3, RotateCcw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import MagneticButton from './MagneticButton';
import './PassGenerator.css';

interface PassData {
  name: string;
  semester: string;
}

type Step = 'form' | 'pass';

const semesters = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
];

/* ---- Digital Pass Card Component ---- */
const DigitalPassCard = React.forwardRef<HTMLDivElement, { data: PassData }>(
  ({ data }, ref) => {
    // Generate a consistent pseudo pass ID from name & semester
    const passCode = `RANG-${(data.name.slice(0, 3).toUpperCase() || 'LJC')}-${data.semester.replace(/\D/g, '') || '1'}-2026`;

    return (
      <div className="pass-card" ref={ref} id="downloadable-pass" aria-label={`Digital Pass for ${data.name}`}>
        {/* Subtle decorative background border */}
        <div className="pass-card__inner-border" />

        {/* Top Header: Logos & Organization */}
        <div className="pass-card__header">
          <div className="pass-card__logos">
            <img
              src="/ljcca-logo.png"
              alt="LJCCA Emblem"
              className="pass-card__crest"
              width="44"
              height="44"
              crossOrigin="anonymous"
            />
            <span className="pass-card__logo-sep" aria-hidden="true">×</span>
            <img
              src="/airalab-logo.png"
              alt="AiRA LAB"
              className="pass-card__aira-img"
              width="36"
              height="36"
              crossOrigin="anonymous"
            />
          </div>
          <div className="pass-card__org-info">
            <span className="pass-card__org-super">LJCCA × AiRA LAB</span>
            <span className="pass-card__org-sub">STUDENT CULTURAL PASS</span>
          </div>
        </div>

        {/* Perforated separator */}
        <div className="pass-card__notch-strip" aria-hidden="true">
          <div className="pass-card__notch pass-card__notch--left" />
          <div className="pass-card__dashed-line" />
          <div className="pass-card__notch pass-card__notch--right" />
        </div>

        {/* Event Banner */}
        <div className="pass-card__event-block">
          <span className="pass-card__presents">PRESENTS</span>
          <h2 className="pass-card__event-title font-display">RANGVAASA</h2>
          <div className="pass-card__year-row">
            <span className="pass-card__year-badge">2026</span>
            <span className="pass-card__festival-type">NAVRATRI CELEBRATION</span>
          </div>
        </div>

        {/* Attendee Details */}
        <div className="pass-card__attendee">
          <div className="pass-card__field">
            <span className="pass-card__label">PASS HOLDER</span>
            <p className="pass-card__name font-display">{data.name}</p>
          </div>
          <div className="pass-card__field">
            <span className="pass-card__label">SEMESTER</span>
            <p className="pass-card__sem">{data.semester}</p>
          </div>
        </div>

        {/* Event Schedule Info */}
        <div className="pass-card__schedule">
          <div className="pass-card__meta-item">
            <span className="pass-card__meta-label">DATE</span>
            <span className="pass-card__meta-val">16 OCT 2026</span>
          </div>
          <div className="pass-card__meta-item">
            <span className="pass-card__meta-label">TIME</span>
            <span className="pass-card__meta-val">12:00 PM ONWARDS</span>
          </div>
          <div className="pass-card__meta-item">
            <span className="pass-card__meta-label">VENUE</span>
            <span className="pass-card__meta-val">LJCCA GROUND, VASTRAPUR</span>
          </div>
        </div>

        {/* Perforated separator */}
        <div className="pass-card__notch-strip" aria-hidden="true">
          <div className="pass-card__notch pass-card__notch--left" />
          <div className="pass-card__dashed-line" />
          <div className="pass-card__notch pass-card__notch--right" />
        </div>

        {/* Footer: Serial & Club Launch Note */}
        <div className="pass-card__footer">
          <div className="pass-card__serial">
            <span className="pass-card__serial-code">{passCode}</span>
            <span className="pass-card__serial-sub">THE ART ADDA LAUNCH</span>
          </div>
          <div className="pass-card__stamp font-display">
            ★ PERSONALIZED PASS ★
          </div>
        </div>
      </div>
    );
  }
);
DigitalPassCard.displayName = 'DigitalPassCard';

/* ---- 3D Tilt Wrapper for Desktop ---- */
const PassTiltWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = ((e.clientY - cy) / (rect.height / 2)) * -8;
    const y = ((e.clientX - cx) / (rect.width / 2)) * 8;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={wrapperRef}
      className="pass-tilt-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease' : 'transform 0.1s linear',
      }}
    >
      {children}
    </div>
  );
};

/* ---- Main Pass Generator Component ---- */
const PassGenerator: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [passData, setPassData] = useState<PassData>({ name: '', semester: '' });
  const [errors, setErrors] = useState<Partial<PassData>>({});
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf' | 'png' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const passRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<PassData> = {};
    const trimmed = passData.name.trim();

    if (!trimmed) {
      newErrors.name = 'Please enter your full name.';
    } else if (trimmed.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    } else if (trimmed.length > 60) {
      newErrors.name = 'Name cannot exceed 60 characters.';
    }

    if (!passData.semester) {
      newErrors.semester = 'Please select your semester.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passData]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setPassData((prev) => ({ ...prev, name: prev.name.trim() }));
    setStep('pass');
    setFeedback(null);
  };

  const handleEdit = () => {
    setStep('form');
    setFeedback(null);
  };

  const handleReset = () => {
    setPassData({ name: '', semester: '' });
    setErrors({});
    setStep('form');
    setFeedback(null);
  };

  // Helper to format sanitized filename: e.g. "Dhyey Trivedi" -> "Rangvaasa-2026-Dhyey-Trivedi.pdf"
  const formatFilename = (name: string, ext = 'pdf'): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const formatted = parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join('-')
      .replace(/[^a-zA-Z0-9-_]/g, '');
    return `Rangvaasa-2026-${formatted || 'Pass'}.${ext}`;
  };

  // Generate genuine high-resolution PDF download using jsPDF
  const handleDownloadPDF = async () => {
    if (!passRef.current || downloading) return;
    setDownloading(true);
    setDownloadType('pdf');
    setFeedback(null);

    try {
      // 1. Ensure fonts are loaded if browser supports document.fonts
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 140));

      // 2. High-res rasterization of pass card
      const imgDataUrl = await toPng(passRef.current, {
        quality: 1,
        pixelRatio: 3,
        skipFonts: true,
        cacheBust: true,
        style: {
          transform: 'none',
          boxShadow: 'none',
        },
      });

      // 3. Create genuine PDF (A5 portrait orientation, 148 x 210 mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Soft ivory background
      doc.setFillColor(250, 247, 240);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Top branding text
      doc.setTextColor(184, 32, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LJCCA × AiRA LAB PRESENT', pageWidth / 2, 13, { align: 'center' });

      // Embed high-res pass image
      const imgWidth = 122;
      const imgHeight = 160;
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = 17;
      doc.addImage(imgDataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);

      // Event schedule and footer metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(118, 107, 98);
      doc.text(
        'RANGVAASA 2026 · 16 October 2026 · 12:00 PM Onwards · LJCCA Ground, Vastrapur, Ahmedabad',
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
      doc.setFontSize(7);
      doc.setTextColor(156, 143, 131);
      doc.text(
        'The Art Adda Creative Club Launch · Student Keepsake Souvenir · Not a guaranteed entry entitlement',
        pageWidth / 2,
        pageHeight - 7,
        { align: 'center' }
      );

      // 4. Native Blob URL download compatible with mobile & desktop
      const pdfBlob = doc.output('blob');
      const filename = formatFilename(passData.name, 'pdf');
      const blobUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.rel = 'noopener';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Release generated Blob URL after browser completes dispatch
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 45000);

      // Detect iOS Safari for helpful preview guidance
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        setFeedback({
          type: 'success',
          message: `PDF created (${filename})! If previewed in your browser, tap Share (↑) and choose "Save to Files" to download.`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Your personalized pass (${filename}) has been downloaded!`,
        });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setFeedback({
        type: 'error',
        message: 'Could not generate PDF. Please try again or download as a high-resolution image.',
      });
    } finally {
      setDownloading(false);
      setDownloadType(null);
    }
  };

  // High-res PNG Download with sanitized filename
  const handleDownloadPNG = async () => {
    if (!passRef.current || downloading) return;
    setDownloading(true);
    setDownloadType('png');
    setFeedback(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 140));

      const dataUrl = await toPng(passRef.current, {
        quality: 1,
        pixelRatio: 3,
        skipFonts: true,
        cacheBust: true,
        style: {
          transform: 'none',
          boxShadow: 'none',
        },
      });

      const filename = formatFilename(passData.name, 'png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFeedback({
        type: 'success',
        message: `Your pass image (${filename}) has been saved to your downloads!`,
      });
    } catch (err) {
      console.error('PNG generation error:', err);
      setFeedback({
        type: 'error',
        message: 'Could not export PNG image. Please try again or take a screenshot.',
      });
    } finally {
      setDownloading(false);
      setDownloadType(null);
    }
  };

  return (
    <section className="pass-section section" id="pass" ref={sectionRef} aria-labelledby="pass-title">
      <div className="container">
        {/* Section Index Marker */}
        <div className="pass-section__marker">
          <span className="editorial-num">04 //</span>
          <span className="editorial-tag">YOUR DIGITAL PASS</span>
          <span className="pass-section__marker-line" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="pass-section__header">
          <motion.div
            className="pass-section__eyebrow"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-eyebrow">PERSONALIZED KEEPSAKE</span>
          </motion.div>

          <motion.h2
            id="pass-title"
            className="pass-section__title text-section-title font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Your Rangvaasa Moment Starts Here.
          </motion.h2>

          <motion.p
            className="pass-section__desc font-display"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Enter your details below to generate your personalized RANGVAASA 2026 pass. Download as genuine PDF or image.
          </motion.p>
        </div>

        {/* Content Box */}
        <div className="pass-section__wrapper">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              /* --- Step 1: Form --- */
              <motion.form
                key="form"
                className="pass-form"
                onSubmit={handleGenerate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                noValidate
              >
                <div className="pass-form__field">
                  <label htmlFor="student-name" className="pass-form__label">
                    Full Name <span className="pass-form__req">*</span>
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    className={`pass-form__input ${errors.name ? 'pass-form__input--error' : ''}`}
                    placeholder="e.g. Aarav Patel"
                    value={passData.name}
                    onChange={(e) => {
                      setPassData((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    maxLength={60}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="pass-form__field">
                  <label htmlFor="student-sem" className="pass-form__label">
                    Semester <span className="pass-form__req">*</span>
                  </label>
                  <select
                    id="student-sem"
                    className={`pass-form__select ${errors.semester ? 'pass-form__input--error' : ''}`}
                    value={passData.semester}
                    onChange={(e) => {
                      setPassData((prev) => ({ ...prev, semester: e.target.value }));
                      if (errors.semester) setErrors((prev) => ({ ...prev, semester: undefined }));
                    }}
                  >
                    <option value="">Select your semester</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  {errors.semester && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />
                      {errors.semester}
                    </span>
                  )}
                </div>

                <MagneticButton type="submit" className="pass-form__submit">
                  <Sparkles size={17} aria-hidden="true" />
                  <span>Generate My Pass</span>
                </MagneticButton>

                <p className="pass-form__note">
                  Official student keepsake for RANGVAASA 2026. Free to generate and export as PDF.
                </p>
              </motion.form>
            ) : (
              /* --- Step 2: Generated Pass View --- */
              <motion.div
                key="pass"
                className="pass-display"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                {/* The downloadable pass card with desktop 3D tilt */}
                <div className="pass-display__card-wrap">
                  <PassTiltWrapper>
                    <DigitalPassCard ref={passRef} data={passData} />
                  </PassTiltWrapper>
                </div>

                {/* Controls */}
                <div className="pass-display__actions">
                  <MagneticButton
                    className="pass-btn pass-btn--pdf"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                  >
                    <FileText size={17} aria-hidden="true" />
                    <span>{downloading && downloadType === 'pdf' ? 'Creating PDF…' : 'Download PDF Pass'}</span>
                  </MagneticButton>

                  <MagneticButton
                    className="pass-btn pass-btn--png"
                    onClick={handleDownloadPNG}
                    disabled={downloading}
                  >
                    <Download size={17} aria-hidden="true" />
                    <span>{downloading && downloadType === 'png' ? 'Creating PNG…' : 'Download Image'}</span>
                  </MagneticButton>

                  <button
                    type="button"
                    className="pass-btn pass-btn--edit"
                    onClick={handleEdit}
                  >
                    <Edit3 size={16} aria-hidden="true" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    className="pass-btn pass-btn--reset"
                    onClick={handleReset}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    <span>Create Another</span>
                  </button>
                </div>

                {/* Feedback status */}
                {feedback && (
                  <motion.div
                    className={`pass-status pass-status--${feedback.type}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span>{feedback.message}</span>
                  </motion.div>
                )}

                {/* Keepsake distinction note */}
                <p className="pass-display__disclaimer">
                  ✦ Personalized student keepsake for RANGVAASA 2026. This pass is a celebratory digital souvenir and does not constitute verified admission or a guaranteed entry ticket.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default PassGenerator;
