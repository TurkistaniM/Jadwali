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
  const { user } = useAuth();

  // 1. Initial State from LocalStorage to guarantee ZERO data loss upon refresh
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_courses_${user.id}`)) ||
        localStorage.getItem('jadwali_courses_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_attendance_${user.id}`)) ||
        localStorage.getItem('jadwali_attendance_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_tasks_${user.id}`)) ||
        localStorage.getItem('jadwali_tasks_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_exams_${user.id}`)) ||
        localStorage.getItem('jadwali_exams_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_scholarships_${user.id}`)) ||
        localStorage.getItem('jadwali_scholarships_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [monthlyScholarshipAmount, setMonthlyScholarshipAmountState] = useState<number>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_sch_amount_${user.id}`)) ||
        localStorage.getItem('jadwali_sch_amount_global');
      return saved ? Number(saved) : 990;
    } catch {
      return 990;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = 
        (user && localStorage.getItem(`jadwali_notifications_${user.id}`)) ||
        localStorage.getItem('jadwali_notifications_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Helper to persist locally with user key and global backup
  const syncLocal = useCallback((key: string, data: any) => {
    if (user) {
      localStorage.setItem(`jadwali_${key}_${user.id}`, JSON.stringify(data));
      localStorage.setItem(`sp_${key}_${user.id}`, JSON.stringify(data));
    }
    localStorage.setItem(`jadwali_${key}_global`, JSON.stringify(data));
  }, [user]);

  const setMonthlyScholarshipAmount = (amount: number) => {
    setMonthlyScholarshipAmountState(amount);
    if (user) {
      localStorage.setItem(`jadwali_sch_amount_${user.id}`, amount.toString());
    }
    localStorage.setItem('jadwali_sch_amount_global', amount.toString());
  };

  // Load Data for authenticated user
  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoadingData(true);
    setServerError(null);

    const userId = user.id;

    // Load monthly amount
    const savedAmount = 
      localStorage.getItem(`jadwali_sch_amount_${userId}`) ||
      localStorage.getItem('jadwali_sch_amount_global');
    if (savedAmount) setMonthlyScholarshipAmountState(Number(savedAmount));

    const localCoursesStr = 
      localStorage.getItem(`jadwali_courses_${userId}`) ||
      localStorage.getItem(`sp_courses_${userId}`) ||
      localStorage.getItem('jadwali_courses_global');
    
    if (localCoursesStr) {
      try {
        const parsed = JSON.parse(localCoursesStr);
        if (parsed.length > 0) setCourses(parsed);
      } catch (e) {
        console.warn('Local courses parse error', e);
      }
    }

    try {
      if (isSupabaseConfigured) {
        const [crsRes, attRes, tskRes, exmRes, schRes, notRes] = await Promise.all([
          supabase.from('courses').select('*').eq('user_id', userId),
          supabase.from('attendance').select('*').eq('user_id', userId),
          supabase.from('tasks').select('*').eq('user_id', userId),
          supabase.from('exams').select('*').eq('user_id', userId),
          supabase.from('scholarships').select('*').eq('user_id', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (!crsRes.error && crsRes.data && crsRes.data.length > 0) {
          const mappedCourses: Course[] = crsRes.data.map((c: any) => ({
            ...c,
            schedule_days: c.schedule_days || [1, 3],
            schedule_time: c.schedule_time || '09:00 - 10:15'
          }));
          setCourses(mappedCourses);
          syncLocal('courses', mappedCourses);
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
      console.warn('Supabase fetch error, maintaining local state:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, syncLocal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Course Actions
  const addCourse = async (courseData: Omit<Course, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newCourse: Course = {
      ...courseData,
      id: generatedId,
      user_id: user.id,
      schedule_days: courseData.schedule_days || [1, 3],
      schedule_time: courseData.schedule_time || '09:00 - 10:15',
      created_at: new Date().toISOString()
    };

    const updated = [newCourse, ...courses];
    setCourses(updated);
    syncLocal('courses', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('courses')
          .upsert({
            id: generatedId,
            user_id: user.id,
            course_name: courseData.course_name,
            instructor_name: courseData.instructor_name || null,
            building: courseData.building || null,
            room: courseData.room || null,
            color_code: courseData.color_code || '#A56F63',
            contact_info: courseData.contact_info || null,
            contact_method: courseData.contact_method || null,
            schedule_days: courseData.schedule_days || [1, 3],
            schedule_time: courseData.schedule_time || '09:00 - 10:15'
          });
      } catch (err) {
        console.warn('Supabase addCourse catch:', err);
      }
    }

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
        console.warn('Supabase updateCourse catch:', err);
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

    const updated = [newTask, ...tasks];
    setTasks(updated);
    syncLocal('tasks', updated);

    if (isSupabaseConfigured) {
      try {
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
    const updated = tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t);
    setTasks(updated);
    syncLocal('tasks', updated);

    if (isSupabaseConfigured) {
      const task = updated.find(t => t.id === taskId);
      if (task) {
        try {
          await supabase.from('tasks').update({ is_completed: task.is_completed }).eq('id', taskId).eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase toggleTaskCompletion error:', err);
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
          console.warn('Supabase toggleTaskImportance error:', err);
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

    const updated = [newExam, ...exams];
    setExams(updated);
    syncLocal('exams', updated);

    if (isSupabaseConfigured) {
      try {
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
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    syncLocal('exams', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exams').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase deleteExam error:', err);
      }
    }
    return true;
  };

  // Scholarship Actions (مع إمكانية الإضافة والتعديل والحذف)
  const addScholarship = async (data: Omit<Scholarship, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const generatedId = getValidUUID();

    const newSch: Scholarship = {
      ...data,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    const updated = [newSch, ...scholarships];
    setScholarships(updated);
    syncLocal('scholarships', updated);

    if (isSupabaseConfigured) {
      try {
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
    const updated = scholarships.map(s => s.id === id ? { ...s, status } : s);
    setScholarships(updated);
    syncLocal('scholarships', updated);

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
    const updated = scholarships.filter(s => s.id !== id);
    setScholarships(updated);
    syncLocal('scholarships', updated);

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
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updated);
    syncLocal('notifications', updated);

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
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    syncLocal('notifications', updated);

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
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    syncLocal('notifications', updated);

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
