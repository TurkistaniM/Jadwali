// ==============================================================================
// منصة الطالب الجامعي الشاملة (Student Portal)
// Database TypeScript Definitions (Matching the 7 Supabase Tables)
// ==============================================================================

export type GpaType = '4' | '5' | '100';

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'تم إلغاء الدرس' | 'present' | 'absent' | 'late' | 'cancelled';

export type ScholarshipStatus = 'مستحقة' | 'تم الصرف' | 'موقوفة' | 'قيد الانتظار' | 'معلقة' | 'paid' | 'pending' | 'cancelled';

// 1. جدول الملف الشخصي (Profiles)
export interface Profile {
  id: string; // UUID references auth.users
  full_name: string;
  academic_id: string; // Unique
  email?: string;      // User email
  university: string;
  major: string;
  gpa_type: GpaType;
  gpa_value: number;
  term_start_date: string; // ISO date string (YYYY-MM-DD)
  term_end_date: string;   // ISO date string (YYYY-MM-DD)
  created_at: string;
}

// 2. جدول المواد الدراسية (Courses)
export interface Course {
  id: string;
  user_id: string;
  course_name: string;
  instructor_name?: string | null;
  building?: string | null;
  room?: string | null;
  color_code: string; // default '#A56F63'
  contact_info?: string | null;
  contact_method?: string | null;
  created_at: string;
  schedule_days?: number[]; // [0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday]
  schedule_time?: string;   // e.g. "09:00 - 10:30"
  has_lab?: boolean;
  lab_day?: number | null;
  lab_time?: string | null;
  lab_building?: string | null;
  lab_room?: string | null;
}

// 3. جدول الحضور والغياب (Attendance)
export interface Attendance {
  id: string;
  user_id: string;
  course_id: string;
  session_date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatus;
  created_at?: string;
}

// 4. جدول المهام (Tasks)
export interface Task {
  id: string;
  user_id: string;
  course_id?: string | null;
  title: string;
  due_date?: string | null; // ISO timestamp or YYYY-MM-DD
  date_due?: string | null; // DB alias
  is_important: boolean;
  is_completed: boolean;
  created_at: string;
}

// 5. جدول الاختبارات (Exams)
export interface Exam {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  exam_date: string; // ISO timestamp or YYYY-MM-DD
  date_exam?: string | null; // DB alias
  location?: string | null;
  created_at: string;
}

// 6. جدول سجل المكافآت (Scholarships)
export interface Scholarship {
  id: string;
  user_id: string;
  month_year: string; // ISO date (e.g. "2026-08-01")
  amount: number;
  status: ScholarshipStatus;
  disbursement_date?: string; // Exact calculated date (e.g. 2026-08-27)
  created_at: string;
}

// 7. جدول الإشعارات والتنبيهات (Notifications)
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: 'exam' | 'absence' | 'scholarship' | 'system' | string;
  created_at: string;
}

// Navigation Tabs
export type ActiveTab = 
  | 'home'
  | 'profile'
  | 'courses'
  | 'attendance'
  | 'schedule'
  | 'tasks'
  | 'exams'
  | 'scholarships';
