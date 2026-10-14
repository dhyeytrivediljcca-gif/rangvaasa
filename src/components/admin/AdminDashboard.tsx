import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  Users,
  Store,
  LayoutDashboard,
  FileSpreadsheet,
  LogOut,
  Search,
  ArrowUpDown,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  PlusCircle,
  Ticket,
  X,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface StudentRecord {
  id: string;
  rollNo: string;
  name: string;
  department: 'BBA' | 'BCA';
  semester: string;
  passCode: string;
  createdAt: string;
}

interface StallRecord {
  id: string;
  registration_category: 'BBA' | 'BCA' | 'Others';
  stall_name: string;
  owner_full_name: string;
  stall_type: 'Food' | 'Art' | 'Beverages' | 'Other';
  createdAt: string;
}

interface OverviewMetrics {
  totalStudents: number;
  totalStalls: number;
  studentByDept: { BBA: number; BCA: number };
  studentBySemester: Record<string, number>;
  stallByCategory: { BBA: number; BCA: number; Others: number };
  stallByType: { Food: number; Art: number; Beverages: number; Other: number };
  recentRegistrations: Array<{
    id: string;
    type: 'student' | 'stall';
    title: string;
    subtitle: string;
    badge: string;
    createdAt: string;
  }>;
}

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onExit: () => void;
}

type TabType = 'overview' | 'students' | 'stalls' | 'exports';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stalls, setStalls] = useState<StallRecord[]>([]);

  // Search & Filter States for Students
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState<'ALL' | 'BBA' | 'BCA'>('ALL');
  const [studentSemFilter, setStudentSemFilter] = useState<string>('ALL');
  const [studentSortBy, setStudentSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'roll-asc'>('date-desc');
  const [studentPage, setStudentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Search & Filter States for Stalls
  const [stallSearch, setStallSearch] = useState('');
  const [stallCategoryFilter, setStallCategoryFilter] = useState<'ALL' | 'BBA' | 'BCA' | 'Others'>('ALL');
  const [stallTypeFilter, setStallTypeFilter] = useState<'ALL' | 'Food' | 'Art' | 'Beverages' | 'Other'>('ALL');
  const [stallSortBy, setStallSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc');
  const [stallPage, setStallPage] = useState(1);

  // Export Feedback Status
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Manual Pass Issuance Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualRoll, setManualRoll] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDept, setManualDept] = useState<'BBA' | 'BCA'>('BCA');
  const [manualSem, setManualSem] = useState('Semester 1');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [createdPass, setCreatedPass] = useState<StudentRecord | null>(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  // Dynamic metrics calculator for direct Supabase fallback (Vercel & offline)
  const computeMetricsFromRecords = useCallback(
    (studentList: StudentRecord[], stallList: StallRecord[]): OverviewMetrics => {
      const studentByDept = { BBA: 0, BCA: 0 };
      const studentBySemester: Record<string, number> = {};
      studentList.forEach((s) => {
        if (s.department === 'BBA' || s.department === 'BCA') {
          studentByDept[s.department] = (studentByDept[s.department] || 0) + 1;
        }
        studentBySemester[s.semester] = (studentBySemester[s.semester] || 0) + 1;
      });

      const stallByCategory = { BBA: 0, BCA: 0, Others: 0 };
      const stallByType = { Food: 0, Art: 0, Beverages: 0, Other: 0 };
      stallList.forEach((s) => {
        if (s.registration_category in stallByCategory) {
          stallByCategory[s.registration_category as keyof typeof stallByCategory]++;
        }
        if (s.stall_type in stallByType) {
          stallByType[s.stall_type as keyof typeof stallByType]++;
        }
      });

      const recent: OverviewMetrics['recentRegistrations'] = [
        ...studentList.map((s) => ({
          id: s.id,
          type: 'student' as const,
          title: `${s.name} (${s.rollNo})`,
          subtitle: `${s.department} · ${s.semester}`,
          badge: s.department,
          createdAt: s.createdAt,
        })),
        ...stallList.map((s) => ({
          id: s.id,
          type: 'stall' as const,
          title: s.stall_name,
          subtitle: `${s.stall_type} Stall · ${s.owner_full_name}`,
          badge: s.stall_type,
          createdAt: s.createdAt,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);

      return {
        totalStudents: studentList.length,
        totalStalls: stallList.length,
        studentByDept,
        studentBySemester,
        stallByCategory,
        stallByType,
        recentRegistrations: recent,
      };
    },
    []
  );

  // Fetch all dashboard data (Primary: LIVE Supabase database, Fallback: server endpoints)
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      try {
        let loadedOverview: OverviewMetrics | null = null;
        let loadedStudents: StudentRecord[] | null = null;
        let loadedStalls: StallRecord[] | null = null;

        // 1. Primary: Direct LIVE Supabase Query (Real-time live database connection)
        if (isSupabaseConfigured && supabase) {
          try {
            const [sbStudents, sbStalls] = await Promise.all([
              supabase
                .from('student_registrations')
                .select('*')
                .order('created_at', { ascending: false }),
              supabase
                .from('stall_registrations')
                .select('*')
                .order('created_at', { ascending: false }),
            ]);

            if (sbStudents.data) {
              loadedStudents = sbStudents.data.map((row: any) => ({
                id: String(row.id),
                rollNo: String(row.roll_number || ''),
                name: String(row.full_name || ''),
                department: (row.department === 'BBA' || row.department === 'BCA'
                  ? row.department
                  : 'BBA') as 'BBA' | 'BCA',
                semester: String(row.semester || ''),
                passCode: String(row.pass_code || ''),
                createdAt: row.created_at || new Date().toISOString(),
              }));
            }

            if (sbStalls.data) {
              loadedStalls = sbStalls.data.map((row: any) => ({
                id: String(row.id),
                registration_category: (row.registration_category || 'BBA') as
                  | 'BBA'
                  | 'BCA'
                  | 'Others',
                stall_name: String(row.stall_name || ''),
                owner_full_name: String(row.owner_full_name || ''),
                stall_type: (row.stall_type || 'Food') as
                  | 'Food'
                  | 'Art'
                  | 'Beverages'
                  | 'Other',
                createdAt: row.created_at || new Date().toISOString(),
              }));
            }

            if (loadedStudents && loadedStalls) {
              loadedOverview = computeMetricsFromRecords(
                loadedStudents,
                loadedStalls
              );
            }
          } catch (sbErr) {
            console.warn(
              '[AdminDashboard] Supabase live query failed, trying server fallback:',
              sbErr
            );
          }
        }

        // 2. Secondary fallback: Server endpoints (used if Supabase direct query fails)
        if (!loadedOverview || !loadedStudents || !loadedStalls) {
          try {
            const [resOverview, resStudents, resStalls] = await Promise.all([
              fetch('/api/admin/overview', { headers: authHeaders }),
              fetch('/api/admin/students', { headers: authHeaders }),
              fetch('/api/admin/stalls', { headers: authHeaders }),
            ]);

            if (
              resOverview.status === 401 ||
              resStudents.status === 401 ||
              resStalls.status === 401
            ) {
              onLogout();
              return;
            }

            if (resOverview.ok && resStudents.ok && resStalls.ok) {
              loadedOverview = await resOverview.json();
              const sData = await resStudents.json();
              const stData = await resStalls.json();
              loadedStudents = sData.students || [];
              loadedStalls = stData.stalls || [];
            }
          } catch (serverErr) {
            console.warn('[AdminDashboard] Server endpoint fallback failed:', serverErr);
          }
        }

        if (loadedOverview && loadedStudents && loadedStalls) {
          setMetrics(loadedOverview);
          setStudents(loadedStudents);
          setStalls(loadedStalls);
        } else if (!metrics) {
          throw new Error('Unable to connect to database or server. Please verify database connection.');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard data.');
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [authHeaders, onLogout, computeMetricsFromRecords, metrics]
  );

  // Live real-time subscription & continuous polling sync
  useEffect(() => {
    fetchData();

    if (isSupabaseConfigured && supabase) {
      // 1. Supabase Postgres Realtime WebSocket Channel
      const channel = supabase
        .channel('admin-live-stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'student_registrations' },
          () => {
            fetchData(false);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stall_registrations' },
          () => {
            fetchData(false);
          }
        )
        .subscribe();

      // 2. Live 4-second auto-sync poll (ensures immediate updates even if WebSockets are closed)
      const intervalId = window.setInterval(() => {
        fetchData(false);
      }, 4000);

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
        window.clearInterval(intervalId);
      };
    }
  }, [fetchData]);

  // Format dates
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  /* ──────────────────────────────────────────────────────────
     FILTERED & SORTED STUDENTS
     ────────────────────────────────────────────────────────── */
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.passCode.toLowerCase().includes(studentSearch.toLowerCase());
        const matchesDept =
          studentDeptFilter === 'ALL' || s.department === studentDeptFilter;
        const matchesSem =
          studentSemFilter === 'ALL' || s.semester === studentSemFilter;
        return matchesSearch && matchesDept && matchesSem;
      })
      .sort((a, b) => {
        if (studentSortBy === 'date-desc')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (studentSortBy === 'date-asc')
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (studentSortBy === 'name-asc')
          return a.name.localeCompare(b.name);
        if (studentSortBy === 'roll-asc')
          return a.rollNo.localeCompare(b.rollNo);
        return 0;
      });
  }, [students, studentSearch, studentDeptFilter, studentSemFilter, studentSortBy]);

  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, studentPage]);

  const totalStudentPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;

  /* ──────────────────────────────────────────────────────────
     FILTERED & SORTED STALLS
     ────────────────────────────────────────────────────────── */
  const filteredStalls = useMemo(() => {
    return stalls
      .filter((s) => {
        const matchesSearch =
          s.stall_name.toLowerCase().includes(stallSearch.toLowerCase()) ||
          s.owner_full_name.toLowerCase().includes(stallSearch.toLowerCase());
        const matchesCat =
          stallCategoryFilter === 'ALL' ||
          s.registration_category === stallCategoryFilter;
        const matchesType =
          stallTypeFilter === 'ALL' || s.stall_type === stallTypeFilter;
        return matchesSearch && matchesCat && matchesType;
      })
      .sort((a, b) => {
        if (stallSortBy === 'date-desc')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (stallSortBy === 'date-asc')
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (stallSortBy === 'name-asc')
          return a.stall_name.localeCompare(b.stall_name);
        return 0;
      });
  }, [stalls, stallSearch, stallCategoryFilter, stallTypeFilter, stallSortBy]);

  const paginatedStalls = useMemo(() => {
    const start = (stallPage - 1) * PAGE_SIZE;
    return filteredStalls.slice(start, start + PAGE_SIZE);
  }, [filteredStalls, stallPage]);

  const totalStallPages = Math.ceil(filteredStalls.length / PAGE_SIZE) || 1;

  /* ──────────────────────────────────────────────────────────
     EXCEL EXPORTS (Reliable Blob Stream + Server Fallback)
     ────────────────────────────────────────────────────────── */
  const notifyExport = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const downloadBlobFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    }, 1500);
  };

  const resetManualForm = () => {
    setManualRoll('');
    setManualName('');
    setManualDept('BCA');
    setManualSem('Semester 1');
    setManualError(null);
    setCreatedPass(null);
    setManualSubmitting(false);
  };

  const previewPassCode = useMemo(() => {
    const cleanRoll = manualRoll.trim().toUpperCase().slice(0, 8) || 'ROLL';
    const semNum = manualSem.replace(/[^0-9]/g, '') || '1';
    return `RANG-${manualDept}-${cleanRoll}-${semNum}-2026`;
  }, [manualRoll, manualDept, manualSem]);

  const generatePassPDF = useCallback((s: StudentRecord) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      // Background
      doc.setFillColor(250, 247, 240);
      doc.rect(0, 0, pw, ph, 'F');

      // Outer Crimson Border
      doc.setDrawColor(184, 32, 45);
      doc.setLineWidth(1.2);
      doc.rect(8, 8, pw - 16, ph - 16);

      // Inner Gold Border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.rect(11, 11, pw - 22, ph - 22);

      // Top Header
      doc.setTextColor(184, 32, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('LJCCA × AiRA LAB', pw / 2, 22, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.setFont('helvetica', 'normal');
      doc.text('PRESENTS', pw / 2, 28, { align: 'center' });

      // Event Title
      doc.setTextColor(184, 32, 45);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('RANGVAASA 2026', pw / 2, 38, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(196, 142, 38);
      doc.text('NAVRATRI CELEBRATION · STUDENT CULTURAL PASS', pw / 2, 45, { align: 'center' });

      // Dashed divider line
      doc.setDrawColor(214, 200, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(16, 52, pw - 16, 52);
      doc.setLineDashPattern([], 0);

      // Attendee Details Card
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(18, 58, pw - 36, 68, 4, 4, 'F');
      doc.setDrawColor(231, 221, 209);
      doc.roundedRect(18, 58, pw - 36, 68, 4, 4, 'D');

      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.setFont('helvetica', 'normal');
      doc.text('PASS HOLDER', 24, 68);
      doc.setFontSize(14);
      doc.setTextColor(48, 34, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(s.name, 24, 75);

      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.setFont('helvetica', 'normal');
      doc.text('COLLEGE ROLL NUMBER', 24, 86);
      doc.setFontSize(11);
      doc.setTextColor(48, 34, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(s.rollNo, 24, 92);

      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.setFont('helvetica', 'normal');
      doc.text('DEPARTMENT', 24, 103);
      doc.text('SEMESTER', pw / 2 + 5, 103);

      doc.setFontSize(11);
      doc.setTextColor(184, 32, 45);
      doc.setFont('helvetica', 'bold');
      doc.text(s.department, 24, 109);
      doc.text(s.semester, pw / 2 + 5, 109);

      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.setFont('helvetica', 'normal');
      doc.text('PASS CODE', 24, 119);
      doc.setFontSize(10);
      doc.setTextColor(48, 34, 30);
      doc.setFont('courier', 'bold');
      doc.text(s.passCode, 24, 124);

      // Event Schedule Card
      doc.setFillColor(243, 236, 225);
      doc.roundedRect(18, 132, pw - 36, 26, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(118, 107, 98);
      doc.text('DATE', 24, 140);
      doc.text('TIME', pw / 2 - 12, 140);
      doc.text('VENUE', pw / 2 + 18, 140);

      doc.setTextColor(48, 34, 30);
      doc.setFontSize(9);
      doc.text('16 OCT 2026', 24, 147);
      doc.text('12:00 PM ONWARDS', pw / 2 - 12, 147);
      doc.text('LJCCA GROUND', pw / 2 + 18, 147);

      // Footer info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 143, 131);
      doc.text(
        'Official Event Pass Issued by Admin · RANGVAASA 2026 · LJCCA Vastrapur, Ahmedabad',
        pw / 2, ph - 16, { align: 'center' }
      );
      doc.text(
        `Issued: ${new Date(s.createdAt).toLocaleDateString('en-IN')}`,
        pw / 2, ph - 12, { align: 'center' }
      );

      const filename = `Rangvaasa_Pass_${s.department}_${s.rollNo.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
      doc.save(filename);
      notifyExport(`Downloaded official pass for ${s.name} (${s.rollNo})`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      notifyExport('Failed to generate PDF pass.');
    }
  }, []);

  const handleIssueManualPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSubmitting) return;

    const cleanRoll = manualRoll.trim();
    const cleanName = manualName.trim();

    if (!cleanRoll) {
      setManualError('Please enter college roll number.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setManualError('Please enter full student name (min 2 characters).');
      return;
    }

    setManualSubmitting(true);
    setManualError(null);

    const semNum = manualSem.replace(/[^0-9]/g, '') || '1';
    const cleanRollUpper = cleanRoll.toUpperCase().slice(0, 8) || 'LJC';
    const passCode = `RANG-${manualDept}-${cleanRollUpper}-${semNum}-2026`;

    try {
      // 1. Direct insert to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        const { error: sbErr } = await supabase
          .from('student_registrations')
          .insert([
            {
              roll_number: cleanRoll,
              full_name: cleanName,
              department: manualDept,
              semester: manualSem,
              pass_code: passCode,
            },
          ]);

        if (sbErr) {
          throw new Error(sbErr.message || 'Failed to save student registration in Supabase.');
        }
      }

      // 2. Also sync to backend so admin dashboard updates immediately
      const res = await fetch('/api/registrations/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNo: cleanRoll,
          name: cleanName,
          department: manualDept,
          semester: manualSem,
          passCode,
        }),
      });

      const resData = await res.json().catch(() => null);

      const newRecord: StudentRecord = {
        id: resData?.record?.id || `stud_${Date.now()}`,
        rollNo: cleanRoll,
        name: cleanName,
        department: manualDept,
        semester: manualSem,
        passCode,
        createdAt: new Date().toISOString(),
      };

      setCreatedPass(newRecord);
      await fetchData(true);
      notifyExport(`Successfully issued pass for ${cleanName}!`);
    } catch (err: any) {
      console.error('Manual pass generation error:', err);
      setManualError(err.message || 'Failed to issue pass. Please check database connection.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const saveExcelWorkbook = (
    wb: XLSX.WorkBook,
    filename: string,
    fallbackEndpoint: string
  ) => {
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      downloadBlobFile(blob, filename);
    } catch (err: any) {
      console.warn('[Export] In-browser generation failed, using server stream:', err);
      // Fallback: direct server stream download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = `${fallbackEndpoint}?token=${encodeURIComponent(token)}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1500);
    }
  };

  const exportStudentsToExcel = () => {
    try {
      if (students.length === 0) {
        notifyExport('No student registrations available to export.');
        return;
      }
      const data = students.map((s, idx) => ({
        'Sr No': idx + 1,
        'Roll Number': s.rollNo,
        'Full Name': s.name,
        'Department': s.department,
        'Semester': s.semester,
        'Pass Code': s.passCode,
        'Registration Date': formatDate(s.createdAt),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Registrations');
      saveExcelWorkbook(wb, 'Rangvaasa_Student_Registrations.xlsx', '/api/admin/export/students');
      notifyExport(`Exported ${students.length} student registrations successfully.`);
    } catch (err: any) {
      // Direct server fallback
      window.location.href = `/api/admin/export/students?token=${encodeURIComponent(token)}`;
      notifyExport('Downloading student registrations report...');
    }
  };

  const exportStallsToExcel = () => {
    try {
      if (stalls.length === 0) {
        notifyExport('No stall registrations available to export.');
        return;
      }
      const data = stalls.map((s, idx) => ({
        'Sr No': idx + 1,
        'Registration Category': s.registration_category,
        'Stall Name': s.stall_name,
        "Owner's Full Name": s.owner_full_name,
        'Stall Type': s.stall_type,
        'Registration Date': formatDate(s.createdAt),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stall Registrations');
      saveExcelWorkbook(wb, 'Rangvaasa_Stall_Registrations.xlsx', '/api/admin/export/stalls');
      notifyExport(`Exported ${stalls.length} stall registrations successfully.`);
    } catch (err: any) {
      window.location.href = `/api/admin/export/stalls?token=${encodeURIComponent(token)}`;
      notifyExport('Downloading stall registrations report...');
    }
  };

  const exportAllToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const studentRows = students.map((s, idx) => ({
        'Sr No': idx + 1,
        'Roll Number': s.rollNo,
        'Full Name': s.name,
        'Department': s.department,
        'Semester': s.semester,
        'Pass Code': s.passCode,
        'Registration Date': formatDate(s.createdAt),
      }));

      const stallRows = stalls.map((s, idx) => ({
        'Sr No': idx + 1,
        'Registration Category': s.registration_category,
        'Stall Name': s.stall_name,
        "Owner's Full Name": s.owner_full_name,
        'Stall Type': s.stall_type,
        'Registration Date': formatDate(s.createdAt),
      }));

      const wsStudents = XLSX.utils.json_to_sheet(
        studentRows.length
          ? studentRows
          : [{ Notice: 'No student registrations recorded yet.' }]
      );
      const wsStalls = XLSX.utils.json_to_sheet(
        stallRows.length
          ? stallRows
          : [{ Notice: 'No stall registrations recorded yet.' }]
      );

      XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Registrations');
      XLSX.utils.book_append_sheet(wb, wsStalls, 'Stall Registrations');

      saveExcelWorkbook(wb, 'Rangvaasa_Full_Report.xlsx', '/api/admin/export/full');
      notifyExport(
        `Full report exported (${students.length} students, ${stalls.length} stalls).`
      );
    } catch (err: any) {
      window.location.href = `/api/admin/export/full?token=${encodeURIComponent(token)}`;
      notifyExport('Downloading full event report...');
    }
  };

  return (
    <div className="admin-dashboard-layout">
      {/* ──────────────── Top Navigation Bar ──────────────── */}
      <header className="admin-topbar">
        <div className="admin-topbar__left">
          <div className="admin-topbar__brand">
            <span className="editorial-num">LJCCA × AiRA //</span>
            <h1 className="admin-topbar__title font-display">
              Rangvaasa Admin Dashboard
            </h1>
          </div>
          <span className="admin-status-pill">
            <span className="admin-status-dot" />
            Live Database
          </span>
        </div>

        <div className="admin-topbar__actions">
          <button
            type="button"
            className="admin-action-btn admin-action-btn--secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh database records"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'admin-spin' : ''}
              aria-hidden="true"
            />
            <span className="admin-btn-label">Refresh</span>
          </button>

          <button
            type="button"
            className="admin-action-btn admin-action-btn--secondary"
            onClick={onExit}
            title="Return to public event website"
          >
            <ExternalLink size={15} aria-hidden="true" />
            <span className="admin-btn-label">Event Site</span>
          </button>

          <button
            type="button"
            className="admin-action-btn admin-action-btn--logout"
            onClick={onLogout}
            title="Logout from admin session"
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ──────────────── Tabs Bar ──────────────── */}
      <nav className="admin-tabs-nav" aria-label="Admin Navigation Tabs">
        <div className="admin-tabs-container">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'students' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={16} />
            <span>Student Registrations</span>
            <span className="admin-tab-count">{students.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'stalls' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('stalls')}
          >
            <Store size={16} />
            <span>Stall Registrations</span>
            <span className="admin-tab-count">{stalls.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'exports' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('exports')}
          >
            <FileSpreadsheet size={16} />
            <span>Export Reports</span>
          </button>
        </div>
      </nav>

      {/* Feedback Alert for Export */}
      <AnimatePresence>
        {exportNotice && (
          <motion.div
            className="admin-notification"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CheckCircle2 size={16} />
            <span>{exportNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────── Main Content Area ──────────────── */}
      <main className="admin-content-area">
        {loading ? (
          <div className="admin-loading-state">
            <RefreshCw size={28} className="admin-spin admin-loading-icon" />
            <p>Loading Rangvaasa records...</p>
          </div>
        ) : error ? (
          <div className="admin-error-card">
            <p>{error}</p>
            <button
              type="button"
              className="admin-action-btn admin-action-btn--primary"
              onClick={() => fetchData(true)}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* ════════════════ TAB 1: OVERVIEW ════════════════ */}
            {activeTab === 'overview' && (
              <div className="admin-overview-view">
                {/* Metric Summary Cards */}
                <div className="admin-metrics-grid">
                  <div className="admin-metric-card">
                    <div className="admin-metric-card__header">
                      <span className="admin-metric-label text-eyebrow">
                        STUDENT PASSES
                      </span>
                      <div className="admin-metric-icon-wrap admin-metric-icon-wrap--students">
                        <Users size={18} />
                      </div>
                    </div>
                    <div className="admin-metric-val">
                      {metrics?.totalStudents ?? 0}
                    </div>
                    <div className="admin-metric-sub">
                      <span>BBA: {metrics?.studentByDept.BBA || 0}</span>
                      <span className="admin-dot-sep">•</span>
                      <span>BCA: {metrics?.studentByDept.BCA || 0}</span>
                    </div>
                  </div>

                  <div className="admin-metric-card">
                    <div className="admin-metric-card__header">
                      <span className="admin-metric-label text-eyebrow">
                        STALL REGISTRATIONS
                      </span>
                      <div className="admin-metric-icon-wrap admin-metric-icon-wrap--stalls">
                        <Store size={18} />
                      </div>
                    </div>
                    <div className="admin-metric-val">
                      {metrics?.totalStalls ?? 0}
                    </div>
                    <div className="admin-metric-sub">
                      <span>Food: {metrics?.stallByType.Food || 0}</span>
                      <span className="admin-dot-sep">•</span>
                      <span>Art: {metrics?.stallByType.Art || 0}</span>
                      <span className="admin-dot-sep">•</span>
                      <span>Beverages: {metrics?.stallByType.Beverages || 0}</span>
                    </div>
                  </div>

                  <div className="admin-metric-card">
                    <div className="admin-metric-card__header">
                      <span className="admin-metric-label text-eyebrow">
                        STALL CATEGORIES
                      </span>
                      <div className="admin-metric-icon-wrap admin-metric-icon-wrap--accent">
                        <Layers size={18} />
                      </div>
                    </div>
                    <div className="admin-metric-category-bars">
                      <div className="admin-cat-bar-item">
                        <span className="admin-cat-bar-label">BCA Stalls</span>
                        <span className="admin-cat-bar-num">
                          {metrics?.stallByCategory.BCA || 0}
                        </span>
                      </div>
                      <div className="admin-cat-bar-item">
                        <span className="admin-cat-bar-label">BBA Stalls</span>
                        <span className="admin-cat-bar-num">
                          {metrics?.stallByCategory.BBA || 0}
                        </span>
                      </div>
                      <div className="admin-cat-bar-item">
                        <span className="admin-cat-bar-label">Others</span>
                        <span className="admin-cat-bar-num">
                          {metrics?.stallByCategory.Others || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-metric-card">
                    <div className="admin-metric-card__header">
                      <span className="admin-metric-label text-eyebrow">
                        QUICK EXPORTS
                      </span>
                      <div className="admin-metric-icon-wrap admin-metric-icon-wrap--export">
                        <FileSpreadsheet size={18} />
                      </div>
                    </div>
                    <p className="admin-quick-export-desc">
                      Download instant reports as formatted Microsoft Excel sheets.
                    </p>
                    <button
                      type="button"
                      className="admin-quick-export-btn"
                      onClick={exportAllToExcel}
                    >
                      <Download size={14} />
                      <span>Download Full Report (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Semester Breakdown & Stall Types Distribution */}
                <div className="admin-breakdown-row">
                  <div className="admin-panel-card">
                    <h3 className="admin-panel-title">
                      Student Registrations by Semester
                    </h3>
                    <div className="admin-sem-grid">
                      {['Semester 1', 'Semester 3', 'Semester 5', 'Semester 7'].map(
                        (sem) => {
                          const count = metrics?.studentBySemester[sem] || 0;
                          const pct = metrics?.totalStudents
                            ? Math.round((count / metrics.totalStudents) * 100)
                            : 0;
                          return (
                            <div key={sem} className="admin-sem-item">
                              <div className="admin-sem-header">
                                <span className="admin-sem-name">{sem}</span>
                                <span className="admin-sem-count">
                                  {count} <small>({pct}%)</small>
                                </span>
                              </div>
                              <div className="admin-progress-bg">
                                <div
                                  className="admin-progress-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="admin-panel-card">
                    <h3 className="admin-panel-title">
                      Stall Breakdown by Type
                    </h3>
                    <div className="admin-stall-types-grid">
                      {[
                        { type: 'Food', count: metrics?.stallByType.Food || 0, color: '#e0533c' },
                        { type: 'Art', count: metrics?.stallByType.Art || 0, color: '#d4af37' },
                        { type: 'Beverages', count: metrics?.stallByType.Beverages || 0, color: '#38a169' },
                        { type: 'Other', count: metrics?.stallByType.Other || 0, color: '#805ad5' },
                      ].map((item) => (
                        <div key={item.type} className="admin-stall-type-badge-card">
                          <span
                            className="admin-stall-color-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="admin-stall-badge-info">
                            <span className="admin-stall-type-name">
                              {item.type}
                            </span>
                            <span className="admin-stall-type-count">
                              {item.count} Registered
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Registrations Timeline */}
                <div className="admin-panel-card admin-recent-card">
                  <div className="admin-panel-header">
                    <div>
                      <h3 className="admin-panel-title">Recent Registrations</h3>
                      <p className="admin-panel-subtitle">
                        Latest student passes and stall sign-ups in real-time
                      </p>
                    </div>
                  </div>

                  {(!metrics?.recentRegistrations ||
                    metrics.recentRegistrations.length === 0) ? (
                    <div className="admin-empty-state">
                      <Sparkles size={28} className="admin-empty-icon" />
                      <p>No registrations recorded yet.</p>
                      <small>New submissions will immediately appear here.</small>
                    </div>
                  ) : (
                    <div className="admin-recent-list">
                      {metrics.recentRegistrations.map((rec) => (
                        <div key={rec.id} className="admin-recent-item">
                          <div
                            className={`admin-recent-avatar ${
                              rec.type === 'student'
                                ? 'admin-avatar--student'
                                : 'admin-avatar--stall'
                            }`}
                          >
                            {rec.type === 'student' ? (
                              <Users size={16} />
                            ) : (
                              <Store size={16} />
                            )}
                          </div>
                          <div className="admin-recent-details">
                            <div className="admin-recent-name-row">
                              <span className="admin-recent-title">
                                {rec.title}
                              </span>
                              <span className="admin-recent-badge">
                                {rec.badge}
                              </span>
                            </div>
                            <span className="admin-recent-sub">
                              {rec.subtitle}
                            </span>
                          </div>
                          <div className="admin-recent-time">
                            <Calendar size={12} />
                            <span>{formatDate(rec.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ TAB 2: STUDENT REGISTRATIONS ════════════════ */}
            {activeTab === 'students' && (
              <div className="admin-table-view">
                {/* Control Bar: Search, Filters, Sort */}
                <div className="admin-controls-card">
                  <div className="admin-search-wrapper">
                    <Search size={16} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Search roll number, name, or pass code..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setStudentPage(1);
                      }}
                    />
                  </div>

                  <div className="admin-filters-row">
                    <div className="admin-select-group">
                      <label htmlFor="dept-filter">
                        <Filter size={13} /> Dept:
                      </label>
                      <select
                        id="dept-filter"
                        value={studentDeptFilter}
                        onChange={(e) => {
                          setStudentDeptFilter(e.target.value as any);
                          setStudentPage(1);
                        }}
                      >
                        <option value="ALL">All Depts</option>
                        <option value="BBA">BBA</option>
                        <option value="BCA">BCA</option>
                      </select>
                    </div>

                    <div className="admin-select-group">
                      <label htmlFor="sem-filter">Sem:</label>
                      <select
                        id="sem-filter"
                        value={studentSemFilter}
                        onChange={(e) => {
                          setStudentSemFilter(e.target.value);
                          setStudentPage(1);
                        }}
                      >
                        <option value="ALL">All Semesters</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 7">Semester 7</option>
                      </select>
                    </div>

                    <div className="admin-select-group">
                      <label htmlFor="sort-student">
                        <ArrowUpDown size={13} /> Sort:
                      </label>
                      <select
                        id="sort-student"
                        value={studentSortBy}
                        onChange={(e) => setStudentSortBy(e.target.value as any)}
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="roll-asc">Roll No (A-Z)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-issue-pass"
                      onClick={() => {
                        resetManualForm();
                        setShowManualModal(true);
                      }}
                      title="Manually issue an official student pass"
                    >
                      <PlusCircle size={15} />
                      <span>+ Issue Pass</span>
                    </button>

                    <button
                      type="button"
                      className="admin-btn-export-table"
                      onClick={exportStudentsToExcel}
                      title="Export filtered student records to Excel"
                    >
                      <Download size={14} />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="admin-table-container">
                  {filteredStudents.length === 0 ? (
                    <div className="admin-empty-state">
                      <Users size={32} className="admin-empty-icon" />
                      <h3>No Student Registrations Found</h3>
                      <p>
                        {studentSearch || studentDeptFilter !== 'ALL' || studentSemFilter !== 'ALL'
                          ? 'No records match your active search or filters.'
                          : 'No students have generated passes yet.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Roll Number</th>
                            <th>Full Name</th>
                            <th>Department</th>
                            <th>Semester</th>
                            <th>Pass Code</th>
                            <th>Registered On</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStudents.map((s, idx) => (
                            <tr key={s.id}>
                              <td className="admin-cell-index">
                                {(studentPage - 1) * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="admin-cell-roll font-display">
                                {s.rollNo}
                              </td>
                              <td className="admin-cell-name">
                                <strong>{s.name}</strong>
                              </td>
                              <td>
                                <span
                                  className={`admin-tag admin-tag--${s.department.toLowerCase()}`}
                                >
                                  {s.department}
                                </span>
                              </td>
                              <td className="admin-cell-sem">{s.semester}</td>
                              <td className="admin-cell-code">
                                <code>{s.passCode}</code>
                              </td>
                              <td className="admin-cell-date">
                                {formatDate(s.createdAt)}
                              </td>
                              <td className="admin-cell-action">
                                <button
                                  type="button"
                                  className="admin-table-icon-btn"
                                  onClick={() => generatePassPDF(s)}
                                  title={`Download pass PDF for ${s.name}`}
                                >
                                  <Ticket size={13} />
                                  <span>Pass</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      <div className="admin-pagination">
                        <span className="admin-pagination-info">
                          Showing {(studentPage - 1) * PAGE_SIZE + 1} to{' '}
                          {Math.min(studentPage * PAGE_SIZE, filteredStudents.length)}{' '}
                          of {filteredStudents.length} students
                        </span>
                        <div className="admin-pagination-btns">
                          <button
                            type="button"
                            onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                            disabled={studentPage === 1}
                            className="admin-page-nav-btn"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="admin-page-indicator">
                            Page {studentPage} of {totalStudentPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setStudentPage((p) => Math.min(totalStudentPages, p + 1))
                            }
                            disabled={studentPage >= totalStudentPages}
                            className="admin-page-nav-btn"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ TAB 3: STALL REGISTRATIONS ════════════════ */}
            {activeTab === 'stalls' && (
              <div className="admin-table-view">
                {/* Control Bar: Search, Filters, Sort */}
                <div className="admin-controls-card">
                  <div className="admin-search-wrapper">
                    <Search size={16} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Search stall name or owner full name..."
                      value={stallSearch}
                      onChange={(e) => {
                        setStallSearch(e.target.value);
                        setStallPage(1);
                      }}
                    />
                  </div>

                  <div className="admin-filters-row">
                    <div className="admin-select-group">
                      <label htmlFor="cat-filter">
                        <Filter size={13} /> Category:
                      </label>
                      <select
                        id="cat-filter"
                        value={stallCategoryFilter}
                        onChange={(e) => {
                          setStallCategoryFilter(e.target.value as any);
                          setStallPage(1);
                        }}
                      >
                        <option value="ALL">All Categories</option>
                        <option value="BBA">BBA</option>
                        <option value="BCA">BCA</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div className="admin-select-group">
                      <label htmlFor="type-filter">Type:</label>
                      <select
                        id="type-filter"
                        value={stallTypeFilter}
                        onChange={(e) => {
                          setStallTypeFilter(e.target.value as any);
                          setStallPage(1);
                        }}
                      >
                        <option value="ALL">All Types</option>
                        <option value="Food">Food</option>
                        <option value="Art">Art</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="admin-select-group">
                      <label htmlFor="sort-stall">
                        <ArrowUpDown size={13} /> Sort:
                      </label>
                      <select
                        id="sort-stall"
                        value={stallSortBy}
                        onChange={(e) => setStallSortBy(e.target.value as any)}
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name-asc">Stall Name (A-Z)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-export-table"
                      onClick={exportStallsToExcel}
                      title="Export stall records to Excel"
                    >
                      <Download size={14} />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="admin-table-container">
                  {filteredStalls.length === 0 ? (
                    <div className="admin-empty-state">
                      <Store size={32} className="admin-empty-icon" />
                      <h3>No Stall Registrations Found</h3>
                      <p>
                        {stallSearch || stallCategoryFilter !== 'ALL' || stallTypeFilter !== 'ALL'
                          ? 'No stalls match your active search or filters.'
                          : 'No stalls registered yet.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Stall Name</th>
                            <th>Owner Full Name</th>
                            <th>Category</th>
                            <th>Stall Type</th>
                            <th>Registered On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStalls.map((s, idx) => (
                            <tr key={s.id}>
                              <td className="admin-cell-index">
                                {(stallPage - 1) * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="admin-cell-name font-display">
                                <strong>{s.stall_name}</strong>
                              </td>
                              <td className="admin-cell-owner">
                                {s.owner_full_name}
                              </td>
                              <td>
                                <span className="admin-tag admin-tag--neutral">
                                  {s.registration_category}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`admin-stall-type-chip admin-chip--${s.stall_type.toLowerCase()}`}
                                >
                                  {s.stall_type}
                                </span>
                              </td>
                              <td className="admin-cell-date">
                                {formatDate(s.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      <div className="admin-pagination">
                        <span className="admin-pagination-info">
                          Showing {(stallPage - 1) * PAGE_SIZE + 1} to{' '}
                          {Math.min(stallPage * PAGE_SIZE, filteredStalls.length)}{' '}
                          of {filteredStalls.length} stalls
                        </span>
                        <div className="admin-pagination-btns">
                          <button
                            type="button"
                            onClick={() => setStallPage((p) => Math.max(1, p - 1))}
                            disabled={stallPage === 1}
                            className="admin-page-nav-btn"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="admin-page-indicator">
                            Page {stallPage} of {totalStallPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setStallPage((p) => Math.min(totalStallPages, p + 1))
                            }
                            disabled={stallPage >= totalStallPages}
                            className="admin-page-nav-btn"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ TAB 4: EXPORT REPORTS ════════════════ */}
            {activeTab === 'exports' && (
              <div className="admin-exports-view">
                <div className="admin-panel-card">
                  <div className="admin-panel-header">
                    <div>
                      <h2 className="admin-panel-title">
                        Export Event Registration Reports
                      </h2>
                      <p className="admin-panel-subtitle">
                        Generate official Microsoft Excel (.xlsx) workbooks containing live database records.
                      </p>
                    </div>
                  </div>

                  <div className="admin-export-cards-grid">
                    {/* Export 1: Student Registrations */}
                    <div className="admin-export-box">
                      <div className="admin-export-box__icon admin-export-box__icon--student">
                        <Users size={24} />
                      </div>
                      <h3 className="admin-export-box__title">
                        Student Registrations
                      </h3>
                      <p className="admin-export-box__desc">
                        Exports all {students.length} student pass registrations including roll number, full name, department, semester, pass code, and registration date.
                      </p>
                      <div className="admin-export-box__meta">
                        <span>Filename: <code>Rangvaasa_Student_Registrations.xlsx</code></span>
                      </div>
                      <button
                        type="button"
                        className="admin-export-btn"
                        onClick={exportStudentsToExcel}
                      >
                        <Download size={15} />
                        <span>Export Student Registrations to Excel</span>
                      </button>
                    </div>

                    {/* Export 2: Stall Registrations */}
                    <div className="admin-export-box">
                      <div className="admin-export-box__icon admin-export-box__icon--stall">
                        <Store size={24} />
                      </div>
                      <h3 className="admin-export-box__title">
                        Stall Registrations
                      </h3>
                      <p className="admin-export-box__desc">
                        Exports all {stalls.length} stall entries including registration category, stall name, owner full name, stall type, and registration date.
                      </p>
                      <div className="admin-export-box__meta">
                        <span>Filename: <code>Rangvaasa_Stall_Registrations.xlsx</code></span>
                      </div>
                      <button
                        type="button"
                        className="admin-export-btn"
                        onClick={exportStallsToExcel}
                      >
                        <Download size={15} />
                        <span>Export Stall Registrations to Excel</span>
                      </button>
                    </div>

                    {/* Export 3: All Reports */}
                    <div className="admin-export-box admin-export-box--featured">
                      <div className="admin-export-box__icon admin-export-box__icon--full">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div className="admin-featured-pill">RECOMMENDED</div>
                      <h3 className="admin-export-box__title">
                        Complete Event Workbook
                      </h3>
                      <p className="admin-export-box__desc">
                        Consolidates both Student Registrations and Stall Registrations into a single Excel workbook with two dedicated sheets.
                      </p>
                      <div className="admin-export-box__meta">
                        <span>Filename: <code>Rangvaasa_Full_Report.xlsx</code></span>
                      </div>
                      <button
                        type="button"
                        className="admin-export-btn admin-export-btn--primary"
                        onClick={exportAllToExcel}
                      >
                        <Download size={15} />
                        <span>Export All Reports</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ──────────────── MANUAL PASS ISSUANCE MODAL ──────────────── */}
      <AnimatePresence>
        {showManualModal && (
          <div
            className="admin-modal-overlay"
            onClick={() => !manualSubmitting && setShowManualModal(false)}
          >
            <motion.div
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="admin-modal-header">
                <div className="admin-modal-header-text">
                  <span className="editorial-tag">ADMIN PRIVILEGE //</span>
                  <h3 className="admin-modal-title font-display">
                    Issue Student Pass
                  </h3>
                  <p className="admin-modal-subtitle">
                    Register an official keepsake pass directly to the database.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => !manualSubmitting && setShowManualModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="admin-modal-body">
                {createdPass ? (
                  <div className="admin-modal-success">
                    <div className="admin-modal-success-icon">
                      <CheckCircle2 size={30} />
                    </div>
                    <h4 className="admin-modal-success-title font-display">
                      Pass Issued Successfully!
                    </h4>
                    <p className="admin-modal-success-subtitle">
                      Record is now saved in Supabase and available in reports.
                    </p>

                    <div className="admin-modal-success-card">
                      <div className="admin-modal-success-row">
                        <span>Student Name:</span>
                        <span>{createdPass.name}</span>
                      </div>
                      <div className="admin-modal-success-row">
                        <span>Roll Number:</span>
                        <span>{createdPass.rollNo}</span>
                      </div>
                      <div className="admin-modal-success-row">
                        <span>Department:</span>
                        <span>{createdPass.department}</span>
                      </div>
                      <div className="admin-modal-success-row">
                        <span>Semester:</span>
                        <span>{createdPass.semester}</span>
                      </div>
                      <div className="admin-modal-success-row">
                        <span>Pass Code:</span>
                        <code>{createdPass.passCode}</code>
                      </div>
                    </div>

                    <div className="admin-modal-success-actions">
                      <button
                        type="button"
                        className="admin-modal-success-btn-download"
                        onClick={() => generatePassPDF(createdPass)}
                      >
                        <Download size={15} />
                        <span>Download PDF Pass</span>
                      </button>
                      <button
                        type="button"
                        className="admin-modal-success-btn-secondary"
                        onClick={resetManualForm}
                      >
                        <span>Issue Another</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="admin-modal-form" onSubmit={handleIssueManualPass}>
                    {manualError && (
                      <div className="admin-modal-error-banner" role="alert">
                        <span>{manualError}</span>
                      </div>
                    )}

                    <div className="admin-modal-field">
                      <label htmlFor="manual-roll">
                        College Roll Number <span>*</span>
                      </label>
                      <input
                        id="manual-roll"
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. LJ2200401 or 191"
                        value={manualRoll}
                        onChange={(e) => setManualRoll(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="admin-modal-field">
                      <label htmlFor="manual-name">
                        Student Full Name <span>*</span>
                      </label>
                      <input
                        id="manual-name"
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. Dhyey Trivedi"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-modal-row-2">
                      <div className="admin-modal-field">
                        <label htmlFor="manual-dept">
                          Department <span>*</span>
                        </label>
                        <select
                          id="manual-dept"
                          className="admin-modal-select"
                          value={manualDept}
                          onChange={(e) => setManualDept(e.target.value as any)}
                        >
                          <option value="BBA">BBA</option>
                          <option value="BCA">BCA</option>
                        </select>
                      </div>

                      <div className="admin-modal-field">
                        <label htmlFor="manual-sem">
                          Semester <span>*</span>
                        </label>
                        <select
                          id="manual-sem"
                          className="admin-modal-select"
                          value={manualSem}
                          onChange={(e) => setManualSem(e.target.value)}
                        >
                          <option value="Semester 1">Semester 1</option>
                          <option value="Semester 3">Semester 3</option>
                          <option value="Semester 5">Semester 5</option>
                          <option value="Semester 7">Semester 7</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-modal-preview-box">
                      <span className="admin-modal-preview-label">
                        Live Pass Code Preview
                      </span>
                      <span className="admin-modal-preview-code">
                        {previewPassCode}
                      </span>
                    </div>

                    <div className="admin-modal-actions">
                      <button
                        type="button"
                        className="admin-modal-btn-cancel"
                        onClick={() => setShowManualModal(false)}
                        disabled={manualSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="admin-modal-btn-submit"
                        disabled={manualSubmitting}
                      >
                        {manualSubmitting ? (
                          <>
                            <Loader2 size={15} className="admin-spin" />
                            <span>Issuing Pass...</span>
                          </>
                        ) : (
                          <>
                            <Ticket size={15} />
                            <span>Issue Pass</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
