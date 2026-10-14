import fs from 'node:fs';
import path from 'node:path';
import {
  fetchStudentsFromSupabase,
  fetchStallsFromSupabase,
  isSupabaseServerConfigured,
} from './supabaseServer.ts';

export interface StudentRegistration {
  id: string;
  rollNo: string;
  name: string;
  department: 'BBA' | 'BCA';
  semester: string;
  passCode: string;
  createdAt: string;
}

export interface StallRegistrationRecord {
  id: string;
  registration_category: 'BBA' | 'BCA' | 'Others';
  stall_name: string;
  owner_full_name: string;
  stall_type: 'Food' | 'Art' | 'Beverages' | 'Other';
  createdAt: string;
}

export interface DatabaseSchema {
  students: StudentRegistration[];
  stalls: StallRegistrationRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'registrations.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Empty initial database for real registrations
const INITIAL_DB: DatabaseSchema = {
  students: [],
  stalls: [],
};

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[DB] Error reading database:', err);
  }
  // Initialize file
  writeDb(INITIAL_DB);
  return INITIAL_DB;
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing database:', err);
  }
}

/**
 * Returns all student registrations.
 * If Supabase Service Role client is configured, fetches live records directly from Supabase.
 * Otherwise uses the persistent local registry.
 */
export async function getAllStudents(): Promise<StudentRegistration[]> {
  const sbStudents = await fetchStudentsFromSupabase();
  if (sbStudents !== null) {
    return sbStudents;
  }
  return readDb().students;
}

export function addStudent(
  item: Omit<StudentRegistration, 'id' | 'createdAt' | 'passCode'> & {
    passCode?: string;
  }
): StudentRegistration {
  const db = readDb();
  const semNum = item.semester.replace(/[^0-9]/g, '') || '1';
  const cleanRoll = (item.rollNo || '').trim().toUpperCase().slice(0, 8) || 'LJC';
  const deptPrefix = item.department ? `${item.department}-` : '';
  const passCode =
    item.passCode || `RANG-${deptPrefix}${cleanRoll}-${semNum}-2026`;

  // Prevent duplicate roll numbers within the same department
  const existingIndex = db.students.findIndex(
    (s) =>
      s.department === item.department &&
      s.rollNo.trim().toUpperCase() === item.rollNo.trim().toUpperCase()
  );

  const record: StudentRegistration = {
    id: `stud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rollNo: item.rollNo.trim(),
    name: item.name.trim(),
    department: item.department,
    semester: item.semester,
    passCode,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // Update existing record
    db.students[existingIndex] = record;
  } else {
    // Prepend new student registration
    db.students.unshift(record);
  }

  writeDb(db);
  return record;
}

/**
 * Returns all stall registrations.
 * If Supabase Service Role client is configured, fetches live records directly from Supabase.
 * Otherwise uses the persistent local registry.
 */
export async function getAllStalls(): Promise<StallRegistrationRecord[]> {
  const sbStalls = await fetchStallsFromSupabase();
  if (sbStalls !== null) {
    return sbStalls;
  }
  return readDb().stalls;
}

export function addStall(
  item: Omit<StallRegistrationRecord, 'id' | 'createdAt'>
): StallRegistrationRecord {
  const db = readDb();
  const record: StallRegistrationRecord = {
    id: `stall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    registration_category: item.registration_category,
    stall_name: item.stall_name.trim(),
    owner_full_name: item.owner_full_name.trim(),
    stall_type: item.stall_type,
    createdAt: new Date().toISOString(),
  };

  db.stalls.unshift(record);
  writeDb(db);
  return record;
}

/**
 * Calculates dashboard statistics based on actual database records.
 */
export async function getOverviewMetrics() {
  const students = await getAllStudents();
  const stalls = await getAllStalls();

  const totalStudents = students.length;
  const totalStalls = stalls.length;

  const studentByDept = {
    BBA: students.filter((s) => s.department === 'BBA').length,
    BCA: students.filter((s) => s.department === 'BCA').length,
  };

  const studentBySemester: Record<string, number> = {
    'Semester 1': 0,
    'Semester 3': 0,
    'Semester 5': 0,
    'Semester 7': 0,
  };
  for (const s of students) {
    if (studentBySemester[s.semester] !== undefined) {
      studentBySemester[s.semester] += 1;
    }
  }

  const stallByCategory = {
    BBA: stalls.filter((s) => s.registration_category === 'BBA').length,
    BCA: stalls.filter((s) => s.registration_category === 'BCA').length,
    Others: stalls.filter((s) => s.registration_category === 'Others').length,
  };

  const stallByType = {
    Food: stalls.filter((s) => s.stall_type === 'Food').length,
    Art: stalls.filter((s) => s.stall_type === 'Art').length,
    Beverages: stalls.filter((s) => s.stall_type === 'Beverages').length,
    Other: stalls.filter((s) => s.stall_type === 'Other').length,
  };

  // Recent registrations formatted for activity timeline
  const recentStudents = students.slice(0, 5).map((s) => ({
    id: s.id,
    type: 'student' as const,
    title: s.name,
    subtitle: `${s.rollNo} · ${s.department} (${s.semester})`,
    badge: s.department,
    createdAt: s.createdAt,
  }));

  const recentStalls = stalls.slice(0, 5).map((s) => ({
    id: s.id,
    type: 'stall' as const,
    title: s.stall_name,
    subtitle: `${s.owner_full_name} · ${s.registration_category}`,
    badge: s.stall_type,
    createdAt: s.createdAt,
  }));

  const recentRegistrations = [...recentStudents, ...recentStalls]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8);

  return {
    totalStudents,
    totalStalls,
    studentByDept,
    studentBySemester,
    stallByCategory,
    stallByType,
    recentRegistrations,
    supabaseConnected: isSupabaseServerConfigured(),
  };
}
