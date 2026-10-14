import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileText, Edit3, RotateCcw, AlertCircle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import MagneticButton from './MagneticButton';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './PassGenerator.css';

/* ---- Types ---- */
interface PassData {
  rollNo: string;
  name: string;
  department: 'BBA' | 'BCA' | '';
  semester: 'Semester 1' | 'Semester 3' | 'Semester 5' | 'Semester 7' | '';
}

interface FormErrors {
  rollNo?: string;
  name?: string;
  department?: string;
  semester?: string;
}

type Step = 'form' | 'pass';

const DEPARTMENTS = ['BBA', 'BCA'] as const;
const SEMESTERS = ['Semester 1', 'Semester 3', 'Semester 5', 'Semester 7'] as const;

/* ---- Helpers ---- */
/** Strip semester label → numeric digit only, e.g. "Semester 5" → "5" */
const semesterNum = (sem: string) => sem.replace(/[^0-9]/g, '');

/** Safe filename segment — keeps alphanumeric, hyphens, underscores */
const safeStr = (s: string) => s.replace(/[^a-zA-Z0-9\-_]/g, '');

/**
 * Build personalized filename.
 * e.g.  rollNo = "LJ0123"  → "Rangvaasa-2026-LJ0123.png"
 */
const buildFilename = (rollNo: string, ext: 'png' | 'pdf'): string => {
  const safePart = safeStr(rollNo.trim()) || 'Pass';
  return `Rangvaasa-2026-${safePart}.${ext}`;
};

/* ---- Wait for all <img> inside an element to be fully decoded ---- */
async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.addEventListener('load', () => res(), { once: true });
              img.addEventListener('error', () => res(), { once: true });
            })
    )
  );
}

/* ================================================================
   DigitalPassCard – the visual ticket
   Used for both on-screen preview and off-screen export clone.
   ================================================================ */
interface PassCardProps {
  data: PassData;
  exportMode?: boolean;
}

const DigitalPassCard = React.forwardRef<HTMLDivElement, PassCardProps>(
  ({ data, exportMode = false }, ref) => {
    const semNum = data.semester.replace(/[^0-9]/g, '');
    const deptPrefix = data.department ? `${data.department}-` : '';
    const passCode = `RANG-${deptPrefix}${(data.rollNo.trim().toUpperCase() || 'LJC').slice(0, 8)}-${semNum || '1'}-2026`;

    return (
      <div
        className={`pass-card${exportMode ? ' pass-card--export' : ''}`}
        ref={ref}
        id={exportMode ? 'downloadable-pass-export' : 'downloadable-pass'}
        aria-label={`Digital Pass for ${data.name}`}
      >
        {/* Decorative inner border */}
        <div className="pass-card__inner-border" />

        {/* ─ HEADER: Logos + Org ─ */}
        <div className="pass-card__header">
          <div className="pass-card__logos">
            <img
              src="/ljcca-logo.png"
              alt="LJCCA Emblem"
              className="pass-card__crest"
              crossOrigin="anonymous"
            />
            <span className="pass-card__logo-sep" aria-hidden="true">×</span>
            <img
              src="/airalab-logo.png"
              alt="AiRA LAB"
              className="pass-card__aira-img"
              crossOrigin="anonymous"
            />
          </div>
          <div className="pass-card__org-info">
            <span className="pass-card__org-super">LJCCA × AiRA LAB</span>
            <span className="pass-card__org-sub">STUDENT CULTURAL PASS</span>
          </div>
        </div>

        {/* ─ PERFORATION ─ */}
        <div className="pass-card__notch-strip" aria-hidden="true">
          <div className="pass-card__notch pass-card__notch--left" />
          <div className="pass-card__dashed-line" />
          <div className="pass-card__notch pass-card__notch--right" />
        </div>

        {/* ─ EVENT BANNER ─ */}
        <div className="pass-card__event-block">
          <span className="pass-card__presents">PRESENTS</span>
          <h2 className="pass-card__event-title font-display">RANGVAASA</h2>
          <div className="pass-card__year-row">
            <span className="pass-card__year-badge">2026</span>
            <span className="pass-card__year-dot" aria-hidden="true">·</span>
            <span className="pass-card__festival-type">NAVRATRI CELEBRATION</span>
          </div>
        </div>

        {/* ─ ATTENDEE DETAILS ─ */}
        <div className="pass-card__attendee">
          {/* Full Name */}
          <div className="pass-card__field pass-card__field--name">
            <span className="pass-card__label">PASS HOLDER</span>
            <p className="pass-card__name font-display">{data.name || '—'}</p>
          </div>

          {/* Roll Number */}
          <div className="pass-card__field pass-card__field--roll">
            <span className="pass-card__label">COLLEGE ROLL NO.</span>
            <p className="pass-card__rollno">{data.rollNo || '—'}</p>
          </div>

          {/* Department + Semester side-by-side */}
          <div className="pass-card__info-row">
            <div className="pass-card__field">
              <span className="pass-card__label">DEPARTMENT</span>
              <p className="pass-card__dept">{data.department || '—'}</p>
            </div>
            <div className="pass-card__field pass-card__field--sem-align">
              <span className="pass-card__label">SEMESTER</span>
              <p className="pass-card__sem">Sem {semNum || '—'}</p>
            </div>
          </div>
        </div>

        {/* ─ SCHEDULE ─ */}
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

        {/* ─ PERFORATION ─ */}
        <div className="pass-card__notch-strip" aria-hidden="true">
          <div className="pass-card__notch pass-card__notch--left" />
          <div className="pass-card__dashed-line" />
          <div className="pass-card__notch pass-card__notch--right" />
        </div>

        {/* ─ FOOTER ─ */}
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
  const [passData, setPassData] = useState<PassData>({
    rollNo: '',
    name: '',
    department: '',
    semester: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf' | 'png' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  /* On-screen preview ref (subject to 3D tilt — NOT used for export) */
  const passRef = useRef<HTMLDivElement>(null);
  /* Off-screen export clone ref — stable layout, no CSS transforms */
  const exportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  /* Preload logos on mount */
  useEffect(() => {
    ['/ljcca-logo.png', '/airalab-logo.png'].forEach((src) => {
      const img = new Image(); img.src = src;
    });
  }, []);

  /* Field change helper */
  const setField = <K extends keyof PassData>(key: K, value: PassData[K]) => {
    setPassData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (dbError) setDbError(null);
  };

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const trimmedRoll = passData.rollNo.trim();
    if (!trimmedRoll) {
      newErrors.rollNo = 'Please enter your college roll number.';
    } else if (trimmedRoll.length > 30) {
      newErrors.rollNo = 'Roll number cannot exceed 30 characters.';
    }

    const trimmedName = passData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Please enter your full name.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 60) {
      newErrors.name = 'Name cannot exceed 60 characters.';
    }

    if (!passData.department) {
      newErrors.department = 'Please select your department.';
    }

    if (!passData.semester) {
      newErrors.semester = 'Please select your semester.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const cleanRoll = passData.rollNo.trim();
    setIsSubmitting(true);
    setDbError(null);

    const cleanName = passData.name.trim();
    const semNum = passData.semester.replace(/[^0-9]/g, '') || '1';
    const cleanRollUpper = cleanRoll.toUpperCase().slice(0, 8) || 'LJC';
    const deptPrefix = passData.department ? `${passData.department}-` : '';
    const passCode = `RANG-${deptPrefix}${cleanRollUpper}-${semNum}-2026`;

    try {
      // 1. Verify Supabase client configuration
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase configuration error: Database client is not ready. Please verify VITE_SUPABASE_URL and key in .env.local.');
      }

      // 2. Save directly into Supabase table: student_registrations
      // Note: we do not chain .select() to respect anon RLS policy
      const { error: sbError } = await supabase
        .from('student_registrations')
        .insert([
          {
            roll_number: cleanRoll,
            full_name: cleanName,
            department: passData.department,
            semester: passData.semester,
            pass_code: passCode,
          },
        ]);

      if (sbError) {
        throw new Error(sbError.message || 'Failed to save student registration in Supabase.');
      }

      // 3. Also sync to local backend so admin dashboard has real-time record
      await fetch('/api/registrations/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNo: cleanRoll,
          name: cleanName,
          department: passData.department,
          semester: passData.semester,
          passCode,
        }),
      }).catch((err) => {
        console.warn('[PassGenerator] Sync note:', err);
      });

      // Show success and move to digital pass card view only after database confirms insert
      setPassData((prev) => ({ ...prev, rollNo: cleanRoll, name: cleanName }));
      setStep('pass');
      setFeedback(null);
    } catch (err: any) {
      console.error('[PassGenerator] Database insert error:', err);
      setDbError(err.message || 'Database registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setStep('form');
    setFeedback(null);
    setDbError(null);
  };

  const handleReset = () => {
    setPassData({ rollNo: '', name: '', department: '', semester: '' });
    setErrors({});
    setStep('form');
    setFeedback(null);
    setDbError(null);
  };

  /* Capture the off-screen export card as a high-res PNG data URL */
  const captureExportPng = async (): Promise<string> => {
    const el = exportRef.current;
    if (!el) throw new Error('Export element not found.');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    // Wait for images inside the export clone
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'));
    await Promise.all(imgs.map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((res) => {
        img.addEventListener('load', () => res(), { once: true });
        img.addEventListener('error', () => res(), { once: true });
      })
    ));
    await new Promise((r) => setTimeout(r, 200));
    return toPng(el, {
      quality: 1,
      pixelRatio: 3,
      cacheBust: true,
      skipFonts: false,
      style: { transform: 'none', boxShadow: 'none' },
    });
  };

  /* ─ PDF DOWNLOAD ─ */
  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadType('pdf');
    setFeedback(null);

    try {
      const imgDataUrl = await captureExportPng();

      /* A5 portrait: 148 × 210 mm */
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      /* Ivory background */
      doc.setFillColor(250, 247, 240);
      doc.rect(0, 0, pw, ph, 'F');

      /* Top branding text */
      doc.setTextColor(184, 32, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('LJCCA × AiRA LAB PRESENT', pw / 2, 12, { align: 'center' });

      /* Centred pass image */
      const imgW = 124;
      const imgH = 178;
      const imgX = (pw - imgW) / 2;
      const imgY = 16;
      doc.addImage(imgDataUrl, 'PNG', imgX, imgY, imgW, imgH);

      /* Footer metadata */
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(118, 107, 98);
      doc.text(
        'RANGVAASA 2026 · 16 October 2026 · 12:00 PM Onwards · LJCCA Ground, Vastrapur, Ahmedabad',
        pw / 2, ph - 11, { align: 'center' }
      );
      doc.setFontSize(6.5);
      doc.setTextColor(156, 143, 131);
      doc.text(
        'The Art Adda Creative Club Launch · Student Keepsake · Not a guaranteed entry entitlement',
        pw / 2, ph - 6.5, { align: 'center' }
      );

      const pdfBlob = doc.output('blob');
      const filename = buildFilename(passData.rollNo, 'pdf');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setFeedback({
        type: 'success',
        message: isIOS
          ? `PDF ready (${filename}). Tap Share → "Save to Files" to keep it.`
          : `Your personalized PDF pass (${filename}) has been downloaded!`,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      setFeedback({ type: 'error', message: 'Could not generate PDF. Please try the Image download instead.' });
    } finally {
      setDownloading(false);
      setDownloadType(null);
    }
  };

  /* ─ PNG DOWNLOAD ─ */
  const handleDownloadPNG = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadType('png');
    setFeedback(null);

    try {
      const dataUrl = await captureExportPng();
      const filename = buildFilename(passData.rollNo, 'png');
      const a = document.createElement('a');
      a.download = filename; a.href = dataUrl; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setFeedback({ type: 'success', message: `Pass image (${filename}) saved to your downloads!` });
    } catch (err) {
      console.error('PNG generation error:', err);
      setFeedback({ type: 'error', message: 'Could not export image. Please try again or take a screenshot.' });
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
                {/* A — Roll Number */}
                <div className="pass-form__field">
                  <label htmlFor="student-roll" className="pass-form__label">
                    College Roll Number <span className="pass-form__req">*</span>
                  </label>
                  <input
                    id="student-roll"
                    type="text"
                    className={`pass-form__input${errors.rollNo ? ' pass-form__input--error' : ''}`}
                    placeholder="Enter your roll number"
                    value={passData.rollNo}
                    onChange={(e) => setField('rollNo', e.target.value)}
                    maxLength={30}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {errors.rollNo && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />{errors.rollNo}
                    </span>
                  )}
                </div>

                {/* B — Full Name */}
                <div className="pass-form__field">
                  <label htmlFor="student-name" className="pass-form__label">
                    Full Name <span className="pass-form__req">*</span>
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    className={`pass-form__input${errors.name ? ' pass-form__input--error' : ''}`}
                    placeholder="Enter your full name"
                    value={passData.name}
                    onChange={(e) => setField('name', e.target.value)}
                    maxLength={60}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />{errors.name}
                    </span>
                  )}
                </div>

                {/* C — Department */}
                <div className="pass-form__field">
                  <label htmlFor="student-dept" className="pass-form__label">
                    Department <span className="pass-form__req">*</span>
                  </label>
                  <select
                    id="student-dept"
                    className={`pass-form__select${errors.department ? ' pass-form__input--error' : ''}`}
                    value={passData.department}
                    onChange={(e) => setField('department', e.target.value as PassData['department'])}
                  >
                    <option value="">Select your department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />{errors.department}
                    </span>
                  )}
                </div>

                {/* D — Semester */}
                <div className="pass-form__field">
                  <label htmlFor="student-sem" className="pass-form__label">
                    Semester <span className="pass-form__req">*</span>
                  </label>
                  <select
                    id="student-sem"
                    className={`pass-form__select${errors.semester ? ' pass-form__input--error' : ''}`}
                    value={passData.semester}
                    onChange={(e) => setField('semester', e.target.value as PassData['semester'])}
                  >
                    <option value="">Select your semester</option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  {errors.semester && (
                    <span className="pass-form__error" role="alert">
                      <AlertCircle size={14} />{errors.semester}
                    </span>
                  )}
                </div>

                {dbError && (
                  <div
                    className="pass-form__error-banner"
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#FEE2E2',
                      border: '1px solid #F87171',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#991B1B',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{dbError}</span>
                  </div>
                )}

                <MagneticButton
                  type="submit"
                  className="pass-form__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={17} className="admin-spin" aria-hidden="true" />
                      <span>Confirming Registration...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} aria-hidden="true" />
                      <span>Generate My Pass</span>
                    </>
                  )}
                </MagneticButton>

                <p className="pass-form__note">
                  Official student keepsake for RANGVAASA 2026. Free to generate and export as PDF or image.
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
                {/* On-screen preview with 3D tilt */}
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

      {/*
        OFF-SCREEN EXPORT CLONE
        Always rendered but visually hidden (positioned off-viewport).
        html-to-image can still measure layout and capture images correctly.
        Uses .pass-card--export for fixed pixel dimensions.
      */}
      <div
        className="pass-export-offscreen"
        aria-hidden="true"
        tabIndex={-1}
      >
        <DigitalPassCard ref={exportRef} data={passData} exportMode />
      </div>
    </section>
  );
};

export default PassGenerator;
