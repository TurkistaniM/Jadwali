import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course, Attendance, Task, Exam, Scholarship, Notification, AttendanceStatus, ScholarshipStatus } from '../types/database';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Status mappers between UI (Arabic) and Database (English/Arabic)
export const toUiAttendanceStatus = (status?: string): AttendanceStatus => {
  if (!status) return 'حاضر';
  if (status === 'present') return 'حاضر';
  if (status === 'absent') return 'غائب';
  if (status === 'late') return 'متأخر';
  if (status === 'cancelled' || status === 'canceled') return 'تم إلغاء الدرس';
  return status as AttendanceStatus;
};

export const toDbAttendanceStatus = (status: AttendanceStatus): string => {
  if (status === 'حاضر') return 'present';
  if (status === 'غائب') return 'absent';
  if (status === 'متأخر') return 'late';
  if (status === 'تم إلغاء الدرس') return 'cancelled';
  return status;
};

export const toUiScholarshipStatus = (status?: string): ScholarshipStatus => {
  if (!status) return 'تم الصرف';
  if (status === 'paid') return 'تم الصرف';
  if (status === 'pending') return 'مستحقة';
  if (status === 'cancelled') return 'موقوفة';
  return status as ScholarshipStatus;
};

export const toDbScholarshipStatus = (status: ScholarshipStatus): string => {
  if (status === 'تم الصرف') return 'paid';
  if (status === 'مستحقة') return 'pending';
  if (status === 'موقوفة') return 'cancelled';
  return status;
};

interface DataContextType {
  // Courses
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<boolean>;
  deleteCourse: (id: string) => Promise<boolean>;

  // Attendance
  attendance: Attendance[];
  recordAttendance: (courseId: string, sessionDate: string, status: AttendanceStatus) => Promise<boolean>;
  deleteAttendanceRecord: (id: string) => Promise<boolean>;
  getCourseAttendance: (courseId: string) => Attendance[];

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  toggleTaskCompletion: (taskId: string) => Promise<boolean>;
  toggleTaskImportance: (taskId: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  importantTasks: Task[];
  getCourseTasks: (courseId: string) => Task[];

  // Exams
  exams: Exam[];
  addExam: (exam: Omit<Exam, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  deleteExam: (id: string) => Promise<boolean>;

  // Scholarships
  scholarships: Scholarship[];
  monthlyScholarshipAmount: number;
  setMonthlyScholarshipAmount: (amount: number) => void;
  addScholarship: (data: Pick<Scholarship, 'disbursement_date' | 'amount' | 'status'>) => Promise<boolean>;
  updateScholarshipStatus: (id: string, status: Scholarship['status']) => Promise<boolean>;
  deleteScholarship: (id: string) => Promise<boolean>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;

  // General State & Error Handling
  isLoadingData: boolean;
  serverError: string | null;
  retryFetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Generate Valid UUID helper
function getValidUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSessionChecked } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [monthlyScholarshipAmount, setMonthlyScholarshipAmountState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jadwali_monthly_scholarship_amount');
      return saved ? Number(saved) : 990;
    } catch {
      return 990;
    }
  });

  const setMonthlyScholarshipAmount = (amount: number) => {
    setMonthlyScholarshipAmountState(amount);
    try {
      localStorage.setItem('jadwali_monthly_scholarship_amount', String(amount));
    } catch { /* ignore */ }
  };

  // Local storage persistence helper
  const syncLocal = useCallback((key: string, data: any) => {
    if (!user) return;
    try {
      localStorage.setItem(`jadwali_${key}_${user.id}`, JSON.stringify(data));
      localStorage.setItem(`sp_${key}_${user.id}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Local storage sync failed for ${key}:`, e);
    }
  }, [user]);

  const getLocal = useCallback((key: string): any[] | null => {
    if (!user) return null;
    const raw = localStorage.getItem(`jadwali_${key}_${user.id}`) || localStorage.getItem(`sp_${key}_${user.id}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }, [user]);

  // Load Data for authenticated user with robust per-entity loading & fallback
  const fetchData = useCallback(async () => {
    // انتظر حتى يتم التحقق من الجلسة في Supabase أولاً
    if (!isSessionChecked) return;

    if (!user) {
      setCourses([]);
      setAttendance([]);
      setTasks([]);
      setExams([]);
      setScholarships([]);
      setNotifications([]);
      return;
    }

    setIsLoadingData(true);
    setServerError(null);

    const userId = user.id;

    try {
      if (isSupabaseConfigured) {
        // Query each table with individual error handling
        const [crsRes, attRes, tskRes, exmRes, schRes, notRes] = await Promise.allSettled([
          supabase.from('courses').select('*').eq('user_id', userId),
          supabase.from('attendance').select('*').eq('user_id', userId),
          supabase.from('tasks').select('*').eq('user_id', userId),
          supabase.from('exams').select('*').eq('user_id', userId),
          supabase.from('scholarships').select('*').eq('user_id', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        // 1. Courses
        if (crsRes.status === 'fulfilled' && !crsRes.value.error && crsRes.value.data) {
          setCourses(crsRes.value.data);
          syncLocal('courses', crsRes.value.data);
        } else {
          const cached = getLocal('courses');
          if (cached) setCourses(cached);
        }

        // 2. Attendance (map status to UI Arabic)
        if (attRes.status === 'fulfilled' && !attRes.value.error && attRes.value.data) {
          const mapped = attRes.value.data.map((item: any) => ({
            ...item,
            status: toUiAttendanceStatus(item.status)
          }));
          setAttendance(mapped);
          syncLocal('attendance', mapped);
        } else {
          const cached = getLocal('attendance');
          if (cached) setAttendance(cached);
        }

        // 3. Tasks (support date_due and due_date)
        if (tskRes.status === 'fulfilled' && !tskRes.value.error && tskRes.value.data) {
          const mapped = tskRes.value.data.map((item: any) => ({
            ...item,
            due_date: item.due_date || item.date_due || null
          }));
          setTasks(mapped);
          syncLocal('tasks', mapped);
        } else {
          const cached = getLocal('tasks');
          if (cached) setTasks(cached);
        }

        // 4. Exams (support date_exam and exam_date)
        if (exmRes.status === 'fulfilled' && !exmRes.value.error && exmRes.value.data) {
          const mapped = exmRes.value.data.map((item: any) => ({
            ...item,
            exam_date: item.exam_date || item.date_exam || ''
          }));
          setExams(mapped);
          syncLocal('exams', mapped);
        } else {
          const cached = getLocal('exams');
          if (cached) setExams(cached);
        }

        // 5. Scholarships (support month_year and map status)
        if (schRes.status === 'fulfilled' && !schRes.value.error && schRes.value.data) {
          const mapped = schRes.value.data.map((item: any) => ({
            ...item,
            status: toUiScholarshipStatus(item.status)
          }));
          setScholarships(mapped);
          syncLocal('scholarships', mapped);
        } else {
          const cached = getLocal('scholarships');
          if (cached) setScholarships(cached);
        }

        // 6. Notifications
        if (notRes.status === 'fulfilled' && !notRes.value.error && notRes.value.data) {
          setNotifications(notRes.value.data);
          syncLocal('notifications', notRes.value.data);
        } else {
          const cached = getLocal('notifications');
          if (cached) setNotifications(cached);
        }
      } else {
        // Fallback for offline / local-only mode
        const cachedCourses = getLocal('courses');
        const cachedAttendance = getLocal('attendance');
        const cachedTasks = getLocal('tasks');
        const cachedExams = getLocal('exams');
        const cachedScholarships = getLocal('scholarships');
        const cachedNotifications = getLocal('notifications');

        if (cachedCourses) setCourses(cachedCourses);
        if (cachedAttendance) setAttendance(cachedAttendance);
        if (cachedTasks) setTasks(cachedTasks);
        if (cachedExams) setExams(cachedExams);
        if (cachedScholarships) setScholarships(cachedScholarships);
        if (cachedNotifications) setNotifications(cachedNotifications);
      }
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setServerError('تعذر الاتصال بالسيرفر، جاري استخدام البيانات المحلية');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, isSessionChecked, syncLocal, getLocal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Course Actions
  const addCourse = async (courseData: Omit<Course, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    let newCourse: Course = {
      ...courseData,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          id: generatedId,
          user_id: user.id,
          course_name: courseData.course_name,
          instructor_name: courseData.instructor_name || null,
          building: courseData.building || null,
          room: courseData.room || null,
          color_code: courseData.color_code || '#A56F63',
          contact_info: courseData.contact_info || null,
          contact_method: courseData.contact_method || null,
        };

        if (courseData.schedule_days) payload.schedule_days = courseData.schedule_days;
        if (courseData.schedule_time) payload.schedule_time = courseData.schedule_time;
        if (courseData.has_lab !== undefined) payload.has_lab = courseData.has_lab;
        if (courseData.lab_day !== undefined) payload.lab_day = courseData.lab_day;
        if (courseData.lab_time !== undefined) payload.lab_time = courseData.lab_time;
        if (courseData.lab_building !== undefined) payload.lab_building = courseData.lab_building;
        if (courseData.lab_room !== undefined) payload.lab_room = courseData.lab_room;

        const { data, error } = await supabase
          .from('courses')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Supabase addCourse error:', error);
        } else if (data) {
          newCourse = { ...newCourse, ...data };
        }
      } catch (err) {
        console.error('Supabase addCourse catch:', err);
      }
    }

    const updated = [newCourse, ...courses];
    setCourses(updated);
    syncLocal('courses', updated);
    return true;
  };

  const updateCourse = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    if (!user) return false;
    const updated = courses.map(c => c.id === id ? { ...c, ...updates } : c);
    setCourses(updated);
    syncLocal('courses', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').update(updates).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase updateCourse error:', err);
      }
    }
    return true;
  };

  const deleteCourse = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    syncLocal('courses', updated);

    const updatedAtt = attendance.filter(a => a.course_id !== id);
    setAttendance(updatedAtt);
    syncLocal('attendance', updatedAtt);

    const updatedTasks = tasks.filter(t => t.course_id !== id);
    setTasks(updatedTasks);
    syncLocal('tasks', updatedTasks);

    const updatedExams = exams.filter(e => e.course_id !== id);
    setExams(updatedExams);
    syncLocal('exams', updatedExams);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteCourse error:', err);
      }
    }
    return true;
  };

  // Attendance Actions (Bidirectional status support)
  const recordAttendance = async (courseId: string, sessionDate: string, status: AttendanceStatus): Promise<boolean> => {
    if (!user) return false;
    
    const uiStatus = toUiAttendanceStatus(status);
    const existingIndex = attendance.findIndex(a => a.course_id === courseId && a.session_date === sessionDate);
    let updated: Attendance[];

    if (existingIndex >= 0) {
      updated = [...attendance];
      updated[existingIndex] = { ...updated[existingIndex], status: uiStatus };
    } else {
      const newRecord: Attendance = {
        id: getValidUUID(),
        user_id: user.id,
        course_id: courseId,
        session_date: sessionDate,
        status: uiStatus,
        created_at: new Date().toISOString()
      };
      updated = [newRecord, ...attendance];
    }

    setAttendance(updated);
    syncLocal('attendance', updated);

    if (isSupabaseConfigured) {
      try {
        // Try with mapped DB status ('present', 'absent', etc.) first
        const dbStatus = toDbAttendanceStatus(status);
        const { error: upsertErr } = await supabase.from('attendance').upsert(
          {
            user_id: user.id,
            course_id: courseId,
            session_date: sessionDate,
            status: dbStatus
          },
          { onConflict: 'course_id,session_date' }
        );

        if (upsertErr) {
          // Fallback: try raw Arabic status if constraint in DB is in Arabic
          await supabase.from('attendance').upsert(
            {
              user_id: user.id,
              course_id: courseId,
              session_date: sessionDate,
              status: uiStatus
            },
            { onConflict: 'course_id,session_date' }
          );
        }
      } catch (err) {
        console.error('Supabase recordAttendance error:', err);
      }
    }
    return true;
  };

  const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated);
    syncLocal('attendance', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteAttendanceRecord error:', err);
      }
    }
    return true;
  };

  const getCourseAttendance = (courseId: string): Attendance[] => {
    return attendance.filter(a => a.course_id === courseId);
  };

  // Task Actions (Supports both date_due and due_date)
  const addTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newTask: Task = {
      ...taskData,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        // Try with date_due column first
        const payload: any = {
          id: generatedId,
          user_id: user.id,
          course_id: taskData.course_id || null,
          title: taskData.title,
          is_important: Boolean(taskData.is_important),
          is_completed: Boolean(taskData.is_completed)
        };

        if (taskData.due_date) {
          payload.date_due = taskData.due_date;
        }

        const { error: insertErr } = await supabase.from('tasks').insert(payload);

        if (insertErr) {
          // If date_due column does not exist, try with due_date column
          delete payload.date_due;
          if (taskData.due_date) payload.due_date = taskData.due_date;
          const { error: retryErr } = await supabase.from('tasks').insert(payload);
          if (retryErr) {
            // Fallback without date column
            delete payload.due_date;
            await supabase.from('tasks').insert(payload);
          }
        }
      } catch (err) {
        console.error('Supabase addTask error:', err);
      }
    }

    const updated = [newTask, ...tasks];
    setTasks(updated);
    syncLocal('tasks', updated);
    return true;
  };

  const toggleTaskCompletion = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    const updated = tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t);
    setTasks(updated);
    syncLocal('tasks', updated);

    if (isSupabaseConfigured) {
      const task = updated.find(t => t.id === taskId);
      if (task) {
        try {
          await supabase.from('tasks').update({ is_completed: task.is_completed }).eq('id', taskId).eq('user_id', user.id);
        } catch (err) {
          console.error('Supabase toggleTaskCompletion error:', err);
        }
      }
    }
    return true;
  };

  const toggleTaskImportance = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    const updated = tasks.map(t => t.id === taskId ? { ...t, is_important: !t.is_important } : t);
    setTasks(updated);
    syncLocal('tasks', updated);

    if (isSupabaseConfigured) {
      const task = updated.find(t => t.id === taskId);
      if (task) {
        try {
          await supabase.from('tasks').update({ is_important: task.is_important }).eq('id', taskId).eq('user_id', user.id);
        } catch (err) {
          console.error('Supabase toggleTaskImportance error:', err);
        }
      }
    }
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    syncLocal('tasks', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteTask error:', err);
      }
    }
    return true;
  };

  const importantTasks = tasks.filter(t => t.is_important);

  const getCourseTasks = (courseId: string): Task[] => {
    return tasks.filter(t => t.course_id === courseId);
  };

  // Exam Actions (Supports both date_exam and exam_date)
  const addExam = async (examData: Omit<Exam, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    // Optimistic local object (fallback if Supabase fails)
    const newExam: Exam = {
      ...examData,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        // Primary: insert using date_exam (the actual DB column name)
        const payload: any = {
          id: generatedId,
          user_id: user.id,
          course_id: examData.course_id,
          title: examData.title,
          location: examData.location || null,
          date_exam: examData.exam_date
        };

        const { data: insertedRow, error: insertErr } = await supabase
          .from('exams')
          .insert(payload)
          .select()
          .single();

        if (!insertErr && insertedRow) {
          // Map date_exam → exam_date so the UI always reads from exam_date
          const mapped: Exam = {
            ...insertedRow,
            exam_date: insertedRow.exam_date || insertedRow.date_exam || examData.exam_date
          };
          const updated = [mapped, ...exams];
          setExams(updated);
          syncLocal('exams', updated);
          return true;
        }

        if (insertErr) {
          // Fallback: try with exam_date column name instead
          delete payload.date_exam;
          payload.exam_date = examData.exam_date;
          const { data: retryRow, error: retryErr } = await supabase
            .from('exams')
            .insert(payload)
            .select()
            .single();

          if (!retryErr && retryRow) {
            const mapped: Exam = {
              ...retryRow,
              exam_date: retryRow.exam_date || retryRow.date_exam || examData.exam_date
            };
            const updated = [mapped, ...exams];
            setExams(updated);
            syncLocal('exams', updated);
            return true;
          }
          console.error('Supabase addExam both attempts failed:', retryErr);
        }
      } catch (err) {
        console.error('Supabase addExam error:', err);
      }
    }

    // Fallback: use local object if Supabase failed or not configured
    const updated = [newExam, ...exams];
    setExams(updated);
    syncLocal('exams', updated);
    return true;
  };

  const deleteExam = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    syncLocal('exams', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exams').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteExam error:', err);
      }
    }
    return true;
  };

  // Scholarship Actions (Supports month_year & status mapping)
  const updateScholarshipStatus = async (id: string, status: Scholarship['status']): Promise<boolean> => {
    if (!user) return false;
    const uiStatus = toUiScholarshipStatus(status);
    const updated = scholarships.map(s => s.id === id ? { ...s, status: uiStatus } : s);
    setScholarships(updated);
    syncLocal('scholarships', updated);

    if (isSupabaseConfigured) {
      try {
        const dbStatus = toDbScholarshipStatus(status);
        const { error: updateErr } = await supabase.from('scholarships').update({ status: dbStatus }).eq('id', id).eq('user_id', user.id);
        if (updateErr) {
          await supabase.from('scholarships').update({ status: uiStatus }).eq('id', id).eq('user_id', user.id);
        }
      } catch (err) {
        console.error('Supabase updateScholarshipStatus error:', err);
      }
    }
    return true;
  };

  const addScholarship = async (data: Pick<Scholarship, 'disbursement_date' | 'amount' | 'status'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();
    const uiStatus = toUiScholarshipStatus(data.status);
    const newEntry: Scholarship = {
      id: generatedId,
      user_id: user.id,
      month_year: data.disbursement_date || new Date().toISOString().split('T')[0],
      amount: data.amount,
      status: uiStatus,
      disbursement_date: data.disbursement_date,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const dbStatus = toDbScholarshipStatus(uiStatus);
        await supabase.from('scholarships').insert({
          id: generatedId,
          user_id: user.id,
          month_year: newEntry.month_year,
          amount: data.amount,
          status: dbStatus,
          disbursement_date: data.disbursement_date || null
        });
      } catch (err) {
        console.error('Supabase addScholarship error:', err);
      }
    }

    const updated = [newEntry, ...scholarships];
    setScholarships(updated);
    syncLocal('scholarships', updated);
    return true;
  };

  const deleteScholarship = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = scholarships.filter(s => s.id !== id);
    setScholarships(updated);
    syncLocal('scholarships', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('scholarships').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteScholarship error:', err);
      }
    }
    return true;
  };

  // Notification Actions
  const markNotificationAsRead = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updated);
    syncLocal('notifications', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase markNotificationAsRead error:', err);
      }
    }
    return true;
  };

  const markAllNotificationsAsRead = async (): Promise<boolean> => {
    if (!user) return false;
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    syncLocal('notifications', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase markAllNotificationsAsRead error:', err);
      }
    }
    return true;
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    syncLocal('notifications', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase deleteNotification error:', err);
      }
    }
    return true;
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <DataContext.Provider
      value={{
        courses,
        addCourse,
        updateCourse,
        deleteCourse,

        attendance,
        recordAttendance,
        deleteAttendanceRecord,
        getCourseAttendance,

        tasks,
        addTask,
        toggleTaskCompletion,
        toggleTaskImportance,
        deleteTask,
        importantTasks,
        getCourseTasks,

        exams,
        addExam,
        deleteExam,

        scholarships,
        monthlyScholarshipAmount,
        setMonthlyScholarshipAmount,
        addScholarship,
        updateScholarshipStatus,
        deleteScholarship,

        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,

        isLoadingData,
        serverError,
        retryFetchData: fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
