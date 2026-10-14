import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADMIN_SALT,
  ADMIN_HASH,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  SESSION_DURATION_MS,
} from './config.ts';

interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

interface RateLimitStore {
  [ip: string]: RateLimitEntry;
}

interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'rate-limit.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory sessions store
const sessions = new Map<string, AdminSession>();

// Read persistent rate limits
function loadRateLimits(): RateLimitStore {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const raw = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Auth] Error reading rate-limit file:', err);
  }
  return {};
}

// Save persistent rate limits
function saveRateLimits(data: RateLimitStore): void {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Auth] Error saving rate-limit file:', err);
  }
}

/**
 * Timing-safe password verification using PBKDF2 with SHA-512
 */
export function verifyAdminPassword(password: string): boolean {
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }
  try {
    const computedHash = crypto
      .pbkdf2Sync(password, ADMIN_SALT, 100000, 64, 'sha512')
      .toString('hex');

    const expectedBuffer = Buffer.from(ADMIN_HASH, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
  } catch (err) {
    console.error('[Auth] Error during password verification:', err);
    return false;
  }
}

/**
 * Check whether a client IP is currently locked out
 */
export function checkRateLimit(clientIp: string): {
  isLocked: boolean;
  remainingSeconds?: number;
  message?: string;
} {
  const store = loadRateLimits();
  const entry = store[clientIp];
  const now = Date.now();

  if (!entry) {
    return { isLocked: false };
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return {
      isLocked: true,
      remainingSeconds,
      message: `Maximum login attempts reached. Admin access is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
    };
  }

  // If lockout expired, reset attempts
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    delete store[clientIp];
    saveRateLimits(store);
  }

  return { isLocked: false };
}

/**
 * Record a failed attempt and determine lockout status
 */
export function recordFailedAttempt(clientIp: string): {
  attemptsRemaining: number;
  isLocked: boolean;
  message: string;
  remainingSeconds?: number;
} {
  const store = loadRateLimits();
  const now = Date.now();
  const entry: RateLimitEntry = store[clientIp] || {
    failedAttempts: 0,
    lockedUntil: null,
    lastAttemptAt: now,
  };

  // If previous lockout expired, start fresh
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.failedAttempts = 0;
    entry.lockedUntil = null;
  }

  entry.failedAttempts += 1;
  entry.lastAttemptAt = now;

  if (entry.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    store[clientIp] = entry;
    saveRateLimits(store);

    const remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return {
      attemptsRemaining: 0,
      isLocked: true,
      remainingSeconds,
      message:
        'Maximum login attempts reached. Admin access is temporarily locked.',
    };
  }

  const remaining = MAX_LOGIN_ATTEMPTS - entry.failedAttempts;
  store[clientIp] = entry;
  saveRateLimits(store);

  const message =
    remaining === 1
      ? 'Wrong password. 1 attempt remaining.'
      : `Wrong password. ${remaining} attempts remaining.`;

  return {
    attemptsRemaining: remaining,
    isLocked: false,
    message,
  };
}

/**
 * Reset failed attempts on successful login
 */
export function resetRateLimit(clientIp: string): void {
  const store = loadRateLimits();
  if (store[clientIp]) {
    delete store[clientIp];
    saveRateLimits(store);
  }
}

/**
 * Create a cryptographically secure session token
 */
export function createSession(): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  sessions.set(token, {
    token,
    createdAt: now,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Validate an admin session token
 */
export function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Invalidate session on logout
 */
export function destroySession(token: string | undefined): void {
  if (token && sessions.has(token)) {
    sessions.delete(token);
  }
}
