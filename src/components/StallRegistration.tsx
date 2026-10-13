import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Store, CheckCircle2, Loader2, Info } from 'lucide-react';
import MagneticButton from './MagneticButton';
import './StallRegistration.css';

/* ================================================================
   SUPABASE INTEGRATION
   ----------------------------------------------------------------
   This component is ready for Supabase. To enable permanent storage:

   1. Install:  npm install @supabase/supabase-js
   2. Create a .env file in the project root:
        VITE_SUPABASE_URL=https://your-project.supabase.co
        VITE_SUPABASE_ANON_KEY=your-anon-key-here
   3. Create the table in Supabase SQL editor:

        CREATE TABLE stall_registrations (
          id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          registration_category TEXT NOT NULL,
          stall_name      TEXT NOT NULL,
          owner_full_name TEXT NOT NULL,
          stall_type      TEXT NOT NULL,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Enable Row Level Security
        ALTER TABLE stall_registrations ENABLE ROW LEVEL SECURITY;

        -- Allow anyone to INSERT (public form)
        CREATE POLICY "allow_public_insert"
          ON stall_registrations FOR INSERT
          WITH CHECK (true);

        -- Only authenticated roles can SELECT
        CREATE POLICY "allow_admin_select"
          ON stall_registrations FOR SELECT
          USING (auth.role() = 'authenticated');

   4. Uncomment the Supabase block below and remove the demo mode.
   ================================================================ */

// -- Uncomment to enable Supabase: --
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY,
// );

const SUPABASE_CONFIGURED =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.startsWith('https://');

/* ---- Types ---- */
interface StallFormData {
  registration_category: 'BBA' | 'BCA' | 'Others' | '';
  stall_name: string;
  owner_full_name: string;
  stall_type: 'Food' | 'Art' | 'Beverages' | 'Other' | '';
}

interface StallFormErrors {
  registration_category?: string;
  stall_name?: string;
  owner_full_name?: string;
  stall_type?: string;
}

const CATEGORIES = ['BBA', 'BCA', 'Others'] as const;
const STALL_TYPES = ['Food', 'Art', 'Beverages', 'Other'] as const;

const EMPTY_FORM: StallFormData = {
  registration_category: '',
  stall_name: '',
  owner_full_name: '',
  stall_type: '',
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
const StallRegistration: React.FC = () => {
  const [formData, setFormData] = useState<StallFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<StallFormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submittedName, setSubmittedName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const setField = <K extends keyof StallFormData>(key: K, value: StallFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof StallFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = useCallback((): boolean => {
    const e: StallFormErrors = {};

    if (!formData.registration_category) {
      e.registration_category = 'Please select a registration category.';
    }
    const stallNameTrimmed = formData.stall_name.trim();
    if (!stallNameTrimmed) {
      e.stall_name = 'Please enter a stall name.';
    } else if (stallNameTrimmed.length < 2) {
      e.stall_name = 'Stall name must be at least 2 characters.';
    } else if (stallNameTrimmed.length > 80) {
      e.stall_name = 'Stall name cannot exceed 80 characters.';
    }
    const ownerTrimmed = formData.owner_full_name.trim();
    if (!ownerTrimmed) {
      e.owner_full_name = "Please enter the owner's full name.";
    } else if (ownerTrimmed.length < 2) {
      e.owner_full_name = 'Name must be at least 2 characters.';
    } else if (ownerTrimmed.length > 80) {
      e.owner_full_name = 'Name cannot exceed 80 characters.';
    }
    if (!formData.stall_type) {
      e.stall_type = 'Please select a stall type.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    setErrorMsg('');

    const payload = {
      registration_category: formData.registration_category,
      stall_name: formData.stall_name.trim(),
      owner_full_name: formData.owner_full_name.trim(),
      stall_type: formData.stall_type,
      created_at: new Date().toISOString(),
    };

    try {
      if (SUPABASE_CONFIGURED) {
        // -- Uncomment when Supabase is set up: --
        // const { error } = await supabase
        //   .from('stall_registrations')
        //   .insert([payload]);
        // if (error) throw error;
        throw new Error('Supabase client not yet instantiated. Follow setup instructions.');
      } else {
        // Demo mode: simulate network delay, log to console
        await new Promise((r) => setTimeout(r, 1200));
        console.info('[StallRegistration] Demo mode — registration payload:', payload);
        // In production this would be a real DB insert.
        // Data is NOT permanently stored in demo mode.
      }

      setSubmittedName(payload.stall_name);
      setStatus('success');
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error('[StallRegistration] Submission error:', err);
      setErrorMsg('Registration could not be saved. Please try again.');
      setStatus('error');
    }
  };

  const handleRegisterAnother = () => {
    setStatus('idle');
    setSubmittedName('');
    setErrorMsg('');
  };

  return (
    <section
      className="stall-section section"
      id="stall-registration"
      aria-labelledby="stall-title"
    >
      <div className="container">
        {/* Section Index Marker */}
        <div className="stall-section__marker">
          <span className="editorial-num">05 //</span>
          <span className="editorial-tag">STALL REGISTRATION</span>
          <span className="stall-section__marker-line" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="stall-section__header">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-eyebrow stall-section__eyebrow">
              SET UP YOUR STALL
            </span>
          </motion.div>

          <motion.h2
            id="stall-title"
            className="stall-section__title text-section-title font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Register Your Stall.
          </motion.h2>

          <motion.p
            className="stall-section__desc font-display"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Bring your creativity, food, and ideas to Rangvaasa 2026. Register
            your stall below and be part of the celebration.
          </motion.p>
        </div>

        {/* Demo banner — shown when Supabase is not configured */}
        {!SUPABASE_CONFIGURED && (
          <motion.div
            className="stall-demo-banner"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            role="note"
          >
            <Info size={15} aria-hidden="true" />
            <span>
              <strong>Demo mode:</strong> Submissions are not permanently stored
              yet. Connect Supabase to enable live registrations — see{' '}
              <code>StallRegistration.tsx</code> for setup instructions.
            </span>
          </motion.div>
        )}

        {/* Content wrapper */}
        <div className="stall-section__wrapper">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              /* ── SUCCESS STATE ── */
              <motion.div
                key="success"
                className="stall-success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45 }}
                role="alert"
                aria-live="polite"
              >
                <div className="stall-success__icon-wrap" aria-hidden="true">
                  <CheckCircle2 size={48} className="stall-success__icon" />
                </div>
                <h3 className="stall-success__title font-display">
                  You're Registered!
                </h3>
                <p className="stall-success__body">
                  <span className="stall-success__name">"{submittedName}"</span>{' '}
                  has been successfully registered for{' '}
                  <strong>Rangvaasa 2026</strong>. See you at the ground!
                </p>
                {!SUPABASE_CONFIGURED && (
                  <p className="stall-success__demo-note">
                    ⚠ Demo mode: this registration was not permanently saved.
                  </p>
                )}
                <button
                  type="button"
                  className="stall-success__another"
                  onClick={handleRegisterAnother}
                >
                  Register Another Stall
                </button>
              </motion.div>
            ) : (
              /* ── FORM STATE ── */
              <motion.form
                key="form"
                className="stall-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                noValidate
              >
                {/* Decorative top-bar */}
                <div className="stall-form__top-bar" aria-hidden="true">
                  <span className="stall-form__top-bar-text">
                    ✦ RANGVAASA 2026 · STALL ENTRY ✦
                  </span>
                </div>

                {/* 1 — Registration Category */}
                <div className="stall-form__field">
                  <label htmlFor="stall-category" className="stall-form__label">
                    Registration Category{' '}
                    <span className="stall-form__req" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="stall-category"
                    className={`stall-form__select${errors.registration_category ? ' stall-form__input--error' : ''}`}
                    value={formData.registration_category}
                    onChange={(e) =>
                      setField(
                        'registration_category',
                        e.target.value as StallFormData['registration_category']
                      )
                    }
                    disabled={status === 'submitting'}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.registration_category && (
                    <span className="stall-form__error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />
                      {errors.registration_category}
                    </span>
                  )}
                </div>

                {/* 2 — Stall Name */}
                <div className="stall-form__field">
                  <label htmlFor="stall-name" className="stall-form__label">
                    Stall Name{' '}
                    <span className="stall-form__req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="stall-name"
                    type="text"
                    className={`stall-form__input${errors.stall_name ? ' stall-form__input--error' : ''}`}
                    placeholder="Enter your stall name"
                    value={formData.stall_name}
                    onChange={(e) => setField('stall_name', e.target.value)}
                    maxLength={80}
                    disabled={status === 'submitting'}
                    autoComplete="off"
                  />
                  {errors.stall_name && (
                    <span className="stall-form__error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />
                      {errors.stall_name}
                    </span>
                  )}
                </div>

                {/* 3 — Owner's Full Name */}
                <div className="stall-form__field">
                  <label htmlFor="stall-owner" className="stall-form__label">
                    Owner's Full Name{' '}
                    <span className="stall-form__req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="stall-owner"
                    type="text"
                    className={`stall-form__input${errors.owner_full_name ? ' stall-form__input--error' : ''}`}
                    placeholder="Enter the owner's full name"
                    value={formData.owner_full_name}
                    onChange={(e) => setField('owner_full_name', e.target.value)}
                    maxLength={80}
                    disabled={status === 'submitting'}
                    autoComplete="name"
                  />
                  {errors.owner_full_name && (
                    <span className="stall-form__error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />
                      {errors.owner_full_name}
                    </span>
                  )}
                </div>

                {/* 4 — Stall Type */}
                <div className="stall-form__field">
                  <label htmlFor="stall-type" className="stall-form__label">
                    Stall Type{' '}
                    <span className="stall-form__req" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="stall-type"
                    className={`stall-form__select${errors.stall_type ? ' stall-form__input--error' : ''}`}
                    value={formData.stall_type}
                    onChange={(e) =>
                      setField('stall_type', e.target.value as StallFormData['stall_type'])
                    }
                    disabled={status === 'submitting'}
                  >
                    <option value="">Select stall type</option>
                    {STALL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.stall_type && (
                    <span className="stall-form__error" role="alert">
                      <AlertCircle size={13} aria-hidden="true" />
                      {errors.stall_type}
                    </span>
                  )}
                </div>

                {/* Submit */}
                <MagneticButton
                  type="submit"
                  className="stall-form__submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={17} className="stall-form__spinner" aria-hidden="true" />
                      <span>Registering…</span>
                    </>
                  ) : (
                    <>
                      <Store size={17} aria-hidden="true" />
                      <span>Register Stall</span>
                    </>
                  )}
                </MagneticButton>

                {/* Error feedback */}
                {status === 'error' && errorMsg && (
                  <motion.div
                    className="stall-status stall-status--error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle size={15} aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                <p className="stall-form__note">
                  All stall registrations are subject to availability and organiser
                  approval. Rangvaasa 2026 · 16 October 2026 · LJCCA Ground, Ahmedabad.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default StallRegistration;
