/**
 * Server-Side Security Configuration
 * NOTE: This file runs strictly on the Node.js server (Vite dev/preview middleware).
 * It is NEVER included in client-side bundles.
 */

// Cryptographically salted PBKDF2 hash of initial credential 'ljadmin2020@'
// Hash: PBKDF2 with SHA-512, 100,000 iterations
export const ADMIN_SALT =
  process.env.ADMIN_PASSWORD_SALT || '304151f6704aeb5247334dc2656fc419';

export const ADMIN_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  'ab334119b3c605c6b2f0a015fa798cbbf713d0f02e1865a6ecb76669ef27bb3fd69aedb04bf27fb63d20e501aec3f1f44e4323c151f98fea145f21461bf88ecb';

// Maximum failed login attempts allowed before IP lockout
export const MAX_LOGIN_ATTEMPTS = 3;

// Lockout duration in milliseconds (3 minutes temporary lockout, configurable)
export const LOCKOUT_DURATION_MS =
  Number(process.env.ADMIN_LOCKOUT_MS) || 3 * 60 * 1000;

// Admin session duration in milliseconds (8 hours)
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
