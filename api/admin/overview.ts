import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      totalStudents: 0,
      totalStalls: 0,
      studentByDept: { BBA: 0, BCA: 0 },
      studentBySemester: { 'Semester 1': 0, 'Semester 3': 0, 'Semester 5': 0, 'Semester 7': 0 },
      stallByCategory: { BBA: 0, BCA: 0, Others: 0 },
      stallByType: { Food: 0, Art: 0, Beverages: 0, Other: 0 },
      recentRegistrations: [],
      supabaseConnected: false,
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [studentsRes, stallsRes] = await Promise.all([
      supabase
        .from('student_registrations')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('stall_registrations')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    const students = studentsRes.data || [];
    const stalls = stallsRes.data || [];

    const totalStudents = students.length;
    const totalStalls = stalls.length;

    const studentByDept = {
      BBA: students.filter((s: any) => s.department === 'BBA').length,
      BCA: students.filter((s: any) => s.department === 'BCA').length,
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
      BBA: stalls.filter((s: any) => s.registration_category === 'BBA').length,
      BCA: stalls.filter((s: any) => s.registration_category === 'BCA').length,
      Others: stalls.filter((s: any) => s.registration_category === 'Others').length,
    };

    const stallByType = {
      Food: stalls.filter((s: any) => s.stall_type === 'Food').length,
      Art: stalls.filter((s: any) => s.stall_type === 'Art').length,
      Beverages: stalls.filter((s: any) => s.stall_type === 'Beverages').length,
      Other: stalls.filter((s: any) => s.stall_type === 'Other').length,
    };

    const recentStudents = students.slice(0, 5).map((s: any) => ({
      id: String(s.id),
      type: 'student' as const,
      title: s.full_name || '',
      subtitle: `${s.roll_number || ''} · ${s.department || ''} (${s.semester || ''})`,
      badge: s.department || 'BBA',
      createdAt: s.created_at || new Date().toISOString(),
    }));

    const recentStalls = stalls.slice(0, 5).map((s: any) => ({
      id: String(s.id),
      type: 'stall' as const,
      title: s.stall_name || '',
      subtitle: `${s.owner_full_name || ''} · ${s.registration_category || ''}`,
      badge: s.stall_type || 'Food',
      createdAt: s.created_at || new Date().toISOString(),
    }));

    const recentRegistrations = [...recentStudents, ...recentStalls]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return res.status(200).json({
      totalStudents,
      totalStalls,
      studentByDept,
      studentBySemester,
      stallByCategory,
      stallByType,
      recentRegistrations,
      supabaseConnected: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
