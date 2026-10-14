import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  verifyAdminPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  createSession,
  validateSession,
  destroySession,
} from './auth.ts';
import {
  getAllStudents,
  addStudent,
  getAllStalls,
  addStall,
  getOverviewMetrics,
} from './db.ts';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly large payloads (max 1MB)
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: Record<string, any>
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(JSON.stringify(data));
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

import * as XLSX from 'xlsx';

function extractBearerToken(req: IncomingMessage): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  // Also check query param ?token=
  const url = req.url || '';
  const qIdx = url.indexOf('?');
  if (qIdx !== -1) {
    const params = new URLSearchParams(url.slice(qIdx));
    const t = params.get('token');
    if (t) return t.trim();
  }
  return undefined;
}

export function apiServerPlugin(): Plugin {
  const handleApiRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => {
    const url = req.url || '';
    if (!url.startsWith('/api')) {
      return next();
    }

    const method = req.method || 'GET';
    const clientIp = getClientIp(req);
    const cleanUrl = url.split('?')[0];

    try {
      /* ──────────────────────────────────────────────────────────
         PUBLIC REGISTRATION ENDPOINTS
         ────────────────────────────────────────────────────────── */
      if (cleanUrl === '/api/registrations/student' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.rollNo || !body.name || !body.department || !body.semester) {
          return sendJson(res, 400, {
            error: 'Missing required student registration fields.',
          });
        }
        const record = addStudent({
          rollNo: String(body.rollNo).trim(),
          name: String(body.name).trim(),
          department: body.department,
          semester: body.semester,
          passCode: body.passCode,
        });
        return sendJson(res, 200, { success: true, record });
      }

      if (cleanUrl === '/api/registrations/stall' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (
          !body.registration_category ||
          !body.stall_name ||
          !body.owner_full_name ||
          !body.stall_type
        ) {
          return sendJson(res, 400, {
            error: 'Missing required stall registration fields.',
          });
        }
        const record = addStall({
          registration_category: body.registration_category,
          stall_name: String(body.stall_name).trim(),
          owner_full_name: String(body.owner_full_name).trim(),
          stall_type: body.stall_type,
        });
        return sendJson(res, 200, { success: true, record });
      }

      /* ──────────────────────────────────────────────────────────
         ADMIN AUTHENTICATION ENDPOINTS
         ────────────────────────────────────────────────────────── */
      if (cleanUrl === '/api/admin/login' && method === 'POST') {
        // Step 1: Check server-side rate limit & IP lockout
        const rateCheck = checkRateLimit(clientIp);
        if (rateCheck.isLocked) {
          return sendJson(res, 429, {
            success: false,
            error:
              rateCheck.message ||
              'Maximum login attempts reached. Admin access is temporarily locked.',
            locked: true,
            remainingSeconds: rateCheck.remainingSeconds,
          });
        }

        const body = await parseJsonBody(req);
        const password = body.password;

        if (typeof password !== 'string' || !password) {
          return sendJson(res, 400, {
            success: false,
            error: 'Password is required.',
          });
        }

        // Step 2: Timing-safe cryptographic password verification
        const isMatch = verifyAdminPassword(password);

        if (isMatch) {
          // Reset failed attempts on success
          resetRateLimit(clientIp);
          const { token, expiresAt } = createSession();
          return sendJson(res, 200, {
            success: true,
            token,
            expiresAt,
            message: 'Authenticated successfully.',
          });
        }

        // Step 3: Record failed attempt and enforce 3-attempt limit
        const failResult = recordFailedAttempt(clientIp);
        if (failResult.isLocked) {
          return sendJson(res, 429, {
            success: false,
            error: failResult.message,
            locked: true,
            remainingSeconds: failResult.remainingSeconds,
          });
        }

        return sendJson(res, 401, {
          success: false,
          error: failResult.message,
          attemptsRemaining: failResult.attemptsRemaining,
        });
      }

      if (cleanUrl === '/api/admin/unlock' && (method === 'POST' || method === 'GET')) {
        resetRateLimit(clientIp);
        return sendJson(res, 200, { success: true, message: 'Admin login unlocked successfully.' });
      }

      if (cleanUrl === '/api/admin/logout' && method === 'POST') {
        const token = extractBearerToken(req);
        destroySession(token);
        return sendJson(res, 200, { success: true, message: 'Logged out.' });
      }

      if (cleanUrl === '/api/admin/session' && method === 'GET') {
        const token = extractBearerToken(req);
        const isValid = validateSession(token);
        if (isValid) {
          return sendJson(res, 200, { valid: true });
        }
        return sendJson(res, 401, {
          valid: false,
          error: 'Unauthorized or expired session.',
        });
      }

      /* ──────────────────────────────────────────────────────────
         PROTECTED ADMIN DATA ENDPOINTS (require valid token)
         ────────────────────────────────────────────────────────── */
      const token = extractBearerToken(req);
      if (!validateSession(token)) {
        return sendJson(res, 401, {
          error: 'Unauthorized: Admin authentication required.',
        });
      }

      if (cleanUrl === '/api/admin/overview' && method === 'GET') {
        const metrics = await getOverviewMetrics();
        return sendJson(res, 200, metrics);
      }

      if (cleanUrl === '/api/admin/students' && method === 'GET') {
        const students = await getAllStudents();
        return sendJson(res, 200, { students });
      }

      if (cleanUrl === '/api/admin/stalls' && method === 'GET') {
        const stalls = await getAllStalls();
        return sendJson(res, 200, { stalls });
      }

      if (cleanUrl === '/api/admin/export/students' && method === 'GET') {
        const students = await getAllStudents();
        const data = students.map((s, idx) => ({
          'Sr No': idx + 1,
          'Roll Number': s.rollNo,
          'Full Name': s.name,
          'Department': s.department,
          'Semester': s.semester,
          'Pass Code': s.passCode,
          'Registration Date': s.createdAt,
        }));
        const ws = XLSX.utils.json_to_sheet(
          data.length ? data : [{ Notice: 'No student registrations recorded yet.' }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Registrations');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="Rangvaasa_Student_Registrations.xlsx"'
        );
        return res.end(buf);
      }

      if (cleanUrl === '/api/admin/export/stalls' && method === 'GET') {
        const stalls = await getAllStalls();
        const data = stalls.map((s, idx) => ({
          'Sr No': idx + 1,
          'Registration Category': s.registration_category,
          'Stall Name': s.stall_name,
          "Owner's Full Name": s.owner_full_name,
          'Stall Type': s.stall_type,
          'Registration Date': s.createdAt,
        }));
        const ws = XLSX.utils.json_to_sheet(
          data.length ? data : [{ Notice: 'No stall registrations recorded yet.' }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stall Registrations');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="Rangvaasa_Stall_Registrations.xlsx"'
        );
        return res.end(buf);
      }

      if (cleanUrl === '/api/admin/export/full' && method === 'GET') {
        const students = await getAllStudents();
        const stalls = await getAllStalls();
        const studentData = students.map((s, idx) => ({
          'Sr No': idx + 1,
          'Roll Number': s.rollNo,
          'Full Name': s.name,
          'Department': s.department,
          'Semester': s.semester,
          'Pass Code': s.passCode,
          'Registration Date': s.createdAt,
        }));
        const stallData = stalls.map((s, idx) => ({
          'Sr No': idx + 1,
          'Registration Category': s.registration_category,
          'Stall Name': s.stall_name,
          "Owner's Full Name": s.owner_full_name,
          'Stall Type': s.stall_type,
          'Registration Date': s.createdAt,
        }));
        const wsStudents = XLSX.utils.json_to_sheet(
          studentData.length
            ? studentData
            : [{ Notice: 'No student registrations recorded yet.' }]
        );
        const wsStalls = XLSX.utils.json_to_sheet(
          stallData.length
            ? stallData
            : [{ Notice: 'No stall registrations recorded yet.' }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Registrations');
        XLSX.utils.book_append_sheet(wb, wsStalls, 'Stall Registrations');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="Rangvaasa_Full_Report.xlsx"'
        );
        return res.end(buf);
      }

      return sendJson(res, 404, { error: 'API endpoint not found.' });
    } catch (err: any) {
      console.error('[API Middleware] Error handling request:', err);
      return sendJson(res, 500, {
        error: 'Internal server error processing request.',
      });
    }
  };

  return {
    name: 'rangvaasa-api-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        handleApiRequest(req, res, next);
      });
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use((req, res, next) => {
        handleApiRequest(req, res, next);
      });
    },
  };
}
