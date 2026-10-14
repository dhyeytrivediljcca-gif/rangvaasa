import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (token: string) => void;
  onExit: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onExit }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setErrorMessage('');
          setAttemptsRemaining(null);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  const formatLockoutTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isLocked) return;

    const trimmed = password;
    if (!trimmed) {
      setErrorMessage('Please enter the admin password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear password from local component state immediately
        setPassword('');
        setErrorMessage('');
        onSuccess(data.token);
      } else {
        // Failed attempt handling
        setPassword('');
        if (data.locked || response.status === 429) {
          setIsLocked(true);
          setLockoutSeconds(data.remainingSeconds || 900);
          setErrorMessage(
            data.error ||
              'Maximum login attempts reached. Admin access is temporarily locked.'
          );
          setAttemptsRemaining(0);
        } else {
          setErrorMessage(data.error || 'Authentication failed. Please try again.');
          if (typeof data.attemptsRemaining === 'number') {
            setAttemptsRemaining(data.attemptsRemaining);
          }
        }
      }
    } catch (err) {
      setErrorMessage('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay">
      <motion.div
        className="admin-login-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Back Link */}
        <button
          type="button"
          onClick={onExit}
          className="admin-login-back"
          aria-label="Return to Rangvaasa website"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Website</span>
        </button>

        {/* Header Crest */}
        <div className="admin-login-crest">
          <div className="admin-login-icon-ring">
            {isLocked ? (
              <ShieldAlert className="admin-icon-locked" size={28} />
            ) : (
              <Lock className="admin-icon-normal" size={28} />
            )}
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="admin-login-header">
          <span className="editorial-tag text-eyebrow">RANGVAASA 2026</span>
          <h1 className="admin-login-title font-display">Admin Access</h1>
          <p className="admin-login-subtitle">Authorized personnel only</p>
        </div>

        {/* Lockout Notice if locked */}
        {isLocked && (
          <div className="admin-lockout-alert" role="alert">
            <Clock size={18} className="admin-lockout-clock" />
            <div className="admin-lockout-text">
              <strong>Account Temporarily Locked</strong>
              <p>
                Too many failed attempts. Retry available in{' '}
                <span className="admin-countdown-badge">
                  {formatLockoutTime(lockoutSeconds)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Error message banner */}
        <AnimatePresence>
          {errorMessage && !isLocked && (
            <motion.div
              className="admin-error-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
            >
              <AlertCircle size={16} />
              <span>
                {errorMessage}
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  ` (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining)`
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <div className="admin-input-group">
            <label htmlFor="admin-password-field" className="admin-input-label">
              Admin Password
            </label>
            <div className="admin-input-wrapper">
              <input
                id="admin-password-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading || isLocked}
                autoComplete="current-password"
                className={`admin-password-input ${errorMessage ? 'has-error' : ''}`}
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading || isLocked}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading || isLocked || !password.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="admin-btn-spinner" />
                <span>Verifying...</span>
              </>
            ) : isLocked ? (
              <span>Locked ({formatLockoutTime(lockoutSeconds)})</span>
            ) : (
              <span>Login to Dashboard</span>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="admin-login-footer">
          <p className="admin-security-note">
            Protected by server-side rate limiting and cryptographic session verification.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
