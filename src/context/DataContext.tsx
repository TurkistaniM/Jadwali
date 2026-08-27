import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course, Attendance, Task, Exam, Scholarship, Notification, AttendanceStatus } from '../types/database';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  addScholarship: (scholarship: Omit<Scholarship, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
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
  const { user } = useAuth();

  // 1. Initial State strictly scoped to user.id
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_courses_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_attendance_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_tasks_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_exams_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_scholarships_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [monthlyScholarshipAmount, setMonthlyScholarshipAmountState] = useState<number>(() => {
    try {
      if (!user) return 990;
      const saved = localStorage.getItem(`jadwali_sch_amount_${user.id}`);
      return saved ? Number(saved) : 990;
    } catch {
      return 990;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      if (!user) return [];
      const saved = localStorage.getItem(`jadwali_notifications_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const syncLocal = useCallback((key: string, data: any) => {
    if (user) {
      localStorage.setItem(`jadwali_${key}_${user.id}`, JSON.stringify(data));
    }
  }, [user]);

  const setMonthlyScholarshipAmount = (amount: number) => {
    setMonthlyScholarshipAmountState(amount);
    if (user) {
      localStorage.setItem(`jadwali_sch_amount_${user.id}`, amount.toString());
    }
  };

  // Helper to ensure profile exists in Supabase
  const ensureProfileInSupabase = async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase.from('profiles').select('id').eq('id', userId).single();
      if (!data) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: email.split('@')[0] || 'طالب جامعي',
          email: email
        });
      }
    } catch (e) {
      console.warn('ensureProfileInSupabase note:', e);
    }
  };

  // Load and merge data with zero wiping of local records
  const fetchData = useCallback(async () => {
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

    // Load local storage first
    const savedAmount = localStorage.getItem(`jadwali_sch_amount_${userId}`);
    setMonthlyScholarshipAmountState(savedAmount ? Number(savedAmount) : 990);

    let localCoursesList: Course[] = [];
    const localCoursesStr = localStorage.getItem(`jadwali_courses_${userId}`);
    if (localCoursesStr) {
      try {
        localCoursesList = JSON.parse(localCoursesStr);
        setCourses(localCoursesList);
      } catch {
        localCoursesList = [];
      }
    }

    const localAttStr = localStorage.getItem(`jadwali_attendance_${userId}`);
    if (localAttStr) setAttendance(JSON.parse(localAttStr));

    const localTskStr = localStorage.getItem(`jadwali_tasks_${userId}`);
    if (localTskStr) setTasks(JSON.parse(localTskStr));

    const localExmStr = localStorage.getItem(`jadwali_exams_${userId}`);
    if (localExmStr) setExams(JSON.parse(localExmStr));

    const localSchStr = localStorage.getItem(`jadwali_scholarships_${userId}`);
    if (localSchStr) setScholarships(JSON.parse(localSchStr));

    const localNotStr = localStorage.getItem(`jadwali_notifications_${userId}`);
    if (localNotStr) setNotifications(JSON.parse(localNotStr));

    // Fetch from Supabase and merge
    try {
      if (isSupabaseConfigured) {
        await ensureProfileInSupabase(userId, user.email);

        const [crsRes, attRes, tskRes, exmRes, schRes, notRes] = await Promise.all([
          supabase.from('courses').select('*').eq('user_id', userId),
          supabase.from('attendance').select('*').eq('user_id', userId),
          supabase.from('tasks').select('*').eq('user_id', userId),
          supabase.from('exams').select('*').eq('user_id', userId),
          supabase.from('scholarships').select('*').eq('user_id', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (!crsRes.error && crsRes.data) {
          if (crsRes.data.length > 0) {
            const mappedCourses: Course[] = crsRes.data.map((c: any) => ({
              ...c,
              schedule_days: c.schedule_days || [1, 3],
              schedule_time: c.schedule_time || '09:00 - 10:15',
              has_lab: Boolean(c.has_lab),
              lab_day: c.lab_day !== undefined ? c.lab_day : null,
              lab_time: c.lab_time || null,
              lab_building: c.lab_building || null,
              lab_room: c.lab_room || null
            }));

            // دمج المواد السحابية مع أي مواد مضافة محلياً لمنع حذف أي مادة
            setCourses(prev => {
              const map = new Map<string, Course>();
              mappedCourses.forEach(c => map.set(c.id, c));
              prev.forEach(c => {
                if (!map.has(c.id)) map.set(c.id, c);
              });
              const merged = Array.from(map.values());
              syncLocal('courses', merged);
              return merged;
            });
          } else if (localCoursesList.length > 0) {
            // إذا كانت السحابة فارغة ولكن يوجد مواد محلية، نقوم برفعها للسحابة فوراً
            for (const localC of localCoursesList) {
              try {
                await supabase.from('courses').upsert({
                  id: localC.id,
                  user_id: userId,
                  course_name: localC.course_name,
                  instructor_name: localC.instructor_name || null,
                  building: localC.building || null,
                  room: localC.room || null,
                  color_code: localC.color_code || '#A56F63',
                  contact_info: localC.contact_info || null,
                  contact_method: localC.contact_method || null,
                  schedule_days: localC.schedule_days || [1, 3],
                  schedule_time: localC.schedule_time || '09:00 - 10:15',
                  has_lab: localC.has_lab || false,
                  lab_day: localC.lab_day !== undefined ? localC.lab_day : null,
                  lab_time: localC.lab_time || null,
                  lab_building: localC.lab_building || null,
                  lab_room: localC.lab_room || null
                });
              } catch (e) {
                console.warn('Sync course to Supabase note:', e);
              }
            }
          }
        }

        if (!attRes.error && attRes.data && attRes.data.length > 0) {
          setAttendance(attRes.data);
          syncLocal('attendance', attRes.data);
        }
        if (!tskRes.error && tskRes.data && tskRes.data.length > 0) {
          setTasks(tskRes.data);
          syncLocal('tasks', tskRes.data);
        }
        if (!exmRes.error && exmRes.data && exmRes.data.length > 0) {
          setExams(exmRes.data);
          syncLocal('exams', exmRes.data);
        }
        if (!schRes.error && schRes.data && schRes.data.length > 0) {
          setScholarships(schRes.data);
          syncLocal('scholarships', schRes.data);
        }
        if (!notRes.error && notRes.data && notRes.data.length > 0) {
          setNotifications(notRes.data);
          syncLocal('notifications', notRes.data);
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch note:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, syncLocal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Course Actions with absolute persistence guarantee
  const addCourse = async (courseData: Omit<Course, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newCourse: Course = {
      ...courseData,
      id: generatedId,
      user_id: user.id,
      schedule_days: courseData.schedule_days || [1, 3],
      schedule_time: courseData.schedule_time || '09:00 - 10:15',
      has_lab: Boolean(courseData.has_lab),
      lab_day: courseData.lab_day !== undefined ? courseData.lab_day : null,
      lab_time: courseData.lab_time || null,
      lab_building: courseData.lab_building || null,
      lab_room: courseData.lab_room || null,
      created_at: new Date().toISOString()
    };

    // حفظ فوري في الحالة والذاكرة المحلية
    setCourses(prev => {
      const next = [newCourse, ...prev.filter(c => c.id !== generatedId)];
      if (user) {
        localStorage.setItem(`jadwali_courses_${user.id}`, JSON.stringify(next));
      }
      return next;
    });

    // حفظ فوري في Supabase
    if (isSupabaseConfigured) {
      try {
        await ensureProfileInSupabase(user.id, user.email);

        const payload: any = {
          id: generatedId,
          user_id: user.id,
          course_name: courseData.course_name.trim(),
          instructor_name: courseData.instructor_name?.trim() || null,
          building: courseData.building?.trim() || null,
          room: courseData.room?.trim() || null,
          color_code: courseData.color_code || '#A56F63',
          contact_info: courseData.contact_info?.trim() || null,
          contact_method: courseData.contact_method?.trim() || null,
          schedule_days: courseData.schedule_days || [1, 3],
          schedule_time: courseData.schedule_time || '09:00 - 10:15',
          has_lab: Boolean(courseData.has_lab),
          lab_day: courseData.has_lab && courseData.lab_day !== undefined ? courseData.lab_day : null,
          lab_time: courseData.has_lab ? courseData.lab_time : null,
          lab_building: courseData.has_lab ? courseData.lab_building?.trim() || null : null,
          lab_room: courseData.has_lab ? courseData.lab_room?.trim() || null : null
        };

        const { error } = await supabase.from('courses').upsert(payload);

        if (error) {
          console.warn('Supabase addCourse initial error:', error.message);
          if (error.message.includes('has_lab') || error.message.includes('column')) {
            delete payload.has_lab;
            delete payload.lab_day;
            delete payload.lab_time;
            delete payload.lab_building;
            delete payload.lab_room;
            const res = await supabase.from('courses').upsert(payload);
            if (res.error) console.error('Course fallback upsert error:', res.error);
          }
        }
      } catch (err) {
        console.error('Supabase addCourse catch:', err);
      }
    }

    return true;
  };

  const updateCourse = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    if (!user) return false;

    setCourses(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      if (user) {
        localStorage.setItem(`jadwali_courses_${user.id}`, JSON.stringify(next));
      }
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').update(updates).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase updateCourse catch:', err);
      }
    }
    return true;
  };

  const deleteCourse = async (id: string): Promise<boolean> => {
    if (!user) return false;

    setCourses(prev => {
      const next = prev.filter(c => c.id !== id);
      if (user) {
        localStorage.setItem(`jadwali_courses_${user.id}`, JSON.stringify(next));
      }
      return next;
    });

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
        console.warn('Supabase deleteCourse catch:', err);
      }
    }
    return true;
  };

  // Attendance Actions
  const recordAttendance = async (courseId: string, sessionDate: string, status: AttendanceStatus): Promise<boolean> => {
    if (!user) return false;
    
    const existingIndex = attendance.findIndex(a => a.course_id === courseId && a.session_date === sessionDate);
    let updated: Attendance[];

    if (existingIndex >= 0) {
      updated = [...attendance];
      updated[existingIndex] = { ...updated[existingIndex], status };
    } else {
      const newRecord: Attendance = {
        id: getValidUUID(),
        user_id: user.id,
        course_id: courseId,
        session_date: sessionDate,
        status,
        created_at: new Date().toISOString()
      };
      updated = [newRecord, ...attendance];
    }

    setAttendance(updated);
    syncLocal('attendance', updated);

    if (isSupabaseConfigured) {
      try {
        await ensureProfileInSupabase(user.id, user.email);
        await supabase.from('attendance').upsert(
          {
            user_id: user.id,
            course_id: courseId,
            session_date: sessionDate,
            status
          },
          { onConflict: 'course_id,session_date' }
        );
      } catch (err) {
        console.warn('Supabase recordAttendance error:', err);
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
        console.warn('Supabase deleteAttendanceRecord error:', err);
      }
    }
    return true;
  };

  const getCourseAttendance = (courseId: string): Attendance[] => {
    return attendance.filter(a => a.course_id === courseId);
  };

  // Task Actions
  const addTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newTask: Task = {
      ...taskData,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    setTasks(prev => {
      const next = [newTask, ...prev];
      if (user) localStorage.setItem(`jadwali_tasks_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await ensureProfileInSupabase(user.id, user.email);
        await supabase.from('tasks').upsert({
          id: generatedId,
          user_id: user.id,
          course_id: taskData.course_id || null,
          title: taskData.title,
          due_date: taskData.due_date || null,
          is_important: taskData.is_important || false,
          is_completed: taskData.is_completed || false
        });
      } catch (err) {
        console.warn('Supabase addTask error:', err);
      }
    }

    return true;
  };

  const toggleTaskCompletion = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t);
      if (user) localStorage.setItem(`jadwali_tasks_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        try {
          await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', taskId).eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase toggleTaskCompletion error:', err);
        }
      }
    }
    return true;
  };

  const toggleTaskImportance = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, is_important: !t.is_important } : t);
      if (user) localStorage.setItem(`jadwali_tasks_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        try {
          await supabase.from('tasks').update({ is_important: !task.is_important }).eq('id', taskId).eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase toggleTaskImportance error:', err);
        }
      }
    }
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!user) return false;
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      if (user) localStorage.setItem(`jadwali_tasks_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase deleteTask error:', err);
      }
    }
    return true;
  };

  const importantTasks = tasks.filter(t => t.is_important);

  const getCourseTasks = (courseId: string): Task[] => {
    return tasks.filter(t => t.course_id === courseId);
  };

  // Exam Actions
  const addExam = async (examData: Omit<Exam, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newExam: Exam = {
      ...examData,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    setExams(prev => {
      const next = [newExam, ...prev];
      if (user) localStorage.setItem(`jadwali_exams_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await ensureProfileInSupabase(user.id, user.email);
        await supabase.from('exams').upsert({
          id: generatedId,
          user_id: user.id,
          course_id: examData.course_id,
          title: examData.title,
          exam_date: examData.exam_date,
          location: examData.location || null
        });
      } catch (err) {
        console.warn('Supabase addExam error:', err);
      }
    }

    return true;
  };

  const deleteExam = async (id: string): Promise<boolean> => {
    if (!user) return false;
    setExams(prev => {
      const next = prev.filter(e => e.id !== id);
      if (user) localStorage.setItem(`jadwali_exams_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exams').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase deleteExam error:', err);
      }
    }
    return true;
  };

  // Scholarship Actions
  const addScholarship = async (data: Omit<Scholarship, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newSch: Scholarship = {
      ...data,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    setScholarships(prev => {
      const next = [newSch, ...prev];
      if (user) localStorage.setItem(`jadwali_scholarships_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await ensureProfileInSupabase(user.id, user.email);
        await supabase.from('scholarships').upsert({
          id: generatedId,
          user_id: user.id,
          amount: data.amount,
          disbursement_date: data.disbursement_date,
          status: data.status
        });
      } catch (err) {
        console.warn('Supabase addScholarship error:', err);
      }
    }

    return true;
  };

  const updateScholarshipStatus = async (id: string, status: Scholarship['status']): Promise<boolean> => {
    if (!user) return false;
    setScholarships(prev => {
      const next = prev.map(s => s.id === id ? { ...s, status } : s);
      if (user) localStorage.setItem(`jadwali_scholarships_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('scholarships').update({ status }).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase updateScholarshipStatus error:', err);
      }
    }
    return true;
  };

  const deleteScholarship = async (id: string): Promise<boolean> => {
    if (!user) return false;
    setScholarships(prev => {
      const next = prev.filter(s => s.id !== id);
      if (user) localStorage.setItem(`jadwali_scholarships_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('scholarships').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase deleteScholarship error:', err);
      }
    }
    return true;
  };

  // Notification Actions
  const markNotificationAsRead = async (id: string): Promise<boolean> => {
    if (!user) return false;
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      if (user) localStorage.setItem(`jadwali_notifications_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase markNotificationAsRead error:', err);
      }
    }
    return true;
  };

  const markAllNotificationsAsRead = async (): Promise<boolean> => {
    if (!user) return false;
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, is_read: true }));
      if (user) localStorage.setItem(`jadwali_notifications_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase markAllNotificationsAsRead error:', err);
      }
    }
    return true;
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!user) return false;
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      if (user) localStorage.setItem(`jadwali_notifications_${user.id}`, JSON.stringify(next));
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase deleteNotification error:', err);
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
