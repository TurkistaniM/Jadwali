import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  User, 
  MapPin, 
  Mail, 
  CheckSquare, 
  Clock, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Course } from '../../types/database';
import { calculateElapsedAbsenceStats, formatDateArabic } from '../../utils/academicCalculations';
import { EmptyState } from '../common/EmptyState';

const PALETTE_COLORS = [
  '#A56F63', // Muted Rose
  '#D99B7F', // Warm Peach
  '#464858', // Slate Grey
  '#2563EB', // Blue
  '#059669', // Emerald
  '#7C3AED', // Purple
  '#D97706', // Amber
];

const WEEK_DAYS = [
  { id: 0, label: 'الأحد', short: 'أحد' },
  { id: 1, label: 'الاثنين', short: 'اثنين' },
  { id: 2, label: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 3, label: 'الأربعاء', short: 'أربعاء' },
  { id: 4, label: 'الخميس', short: 'خميس' },
];

// Helper to calculate end time given start time and duration in minutes
const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10) || 9;
  let m = parseInt(mStr, 10) || 0;
  m += minutesToAdd;
  h += Math.floor(m / 60);
  m = m % 60;
  if (h >= 24) h = h % 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const CoursesView: React.FC = () => {
  const { profile } = useAuth();
  const { 
    courses, 
    addCourse, 
    updateCourse, 
    deleteCourse, 
    attendance, 
    tasks, 
    addTask, 
    toggleTaskCompletion 
  } = useData();

  // Modals state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [courseName, setCourseName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [colorCode, setColorCode] = useState('#A56F63');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 3]); // Monday, Wednesday default (75 min)
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('10:15'); // Default for 2 days = 1 hr 15 min

  // Course Detail Task quick add
  const [newCourseTaskTitle, setNewCourseTaskTitle] = useState('');
  const [newCourseTaskIsImportant, setNewCourseTaskIsImportant] = useState(false);

  // Auto adjust duration based on selected days
  const adjustEndTimeForDays = (days: number[], startTime: string) => {
    // 3 days (e.g. Sunday/Tuesday/Thursday or Sunday/Monday/Tuesday) -> 50 mins
    if (days.length >= 3) {
      return addMinutesToTime(startTime, 50);
    }
    // 2 days (e.g. Monday/Wednesday or Sunday/Tuesday) -> 1 hr 15 mins (75 mins)
    if (days.length === 2) {
      return addMinutesToTime(startTime, 75);
    }
    // Default 50 mins
    return addMinutesToTime(startTime, 50);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setCourseName('');
    setInstructorName('');
    setBuilding('');
    setRoom('');
    setColorCode('#A56F63');
    setContactInfo('');
    setContactMethod('البريد الإلكتروني');
    
    // Default 2-day schedule: الاثنين والأربعاء (ساعة و15 دقيقة)
    const initialDays = [1, 3];
    const initialStart = '09:00';
    setScheduleDays(initialDays);
    setScheduleStartTime(initialStart);
    setScheduleEndTime(adjustEndTimeForDays(initialDays, initialStart));
    setIsAddCourseModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourse(c);
    setCourseName(c.course_name);
    setInstructorName(c.instructor_name || '');
    setBuilding(c.building || '');
    setRoom(c.room || '');
    setColorCode(c.color_code || '#A56F63');
    setContactInfo(c.contact_info || '');
    setContactMethod(c.contact_method || '');
    
    const days = c.schedule_days && c.schedule_days.length > 0 ? c.schedule_days : [1, 3];
    setScheduleDays(days);
    
    if (c.schedule_time && c.schedule_time.includes('-')) {
      const parts = c.schedule_time.split('-').map(s => s.trim());
      setScheduleStartTime(parts[0] || '09:00');
      setScheduleEndTime(parts[1] || '10:15');
    } else {
      setScheduleStartTime('09:00');
      setScheduleEndTime(adjustEndTimeForDays(days, '09:00'));
    }
    setIsAddCourseModalOpen(true);
  };

  const toggleDay = (dayId: number) => {
    let nextDays: number[];
    if (scheduleDays.includes(dayId)) {
      nextDays = scheduleDays.filter(d => d !== dayId);
    } else {
      nextDays = [...scheduleDays, dayId].sort();
    }
    setScheduleDays(nextDays);
    setScheduleEndTime(adjustEndTimeForDays(nextDays, scheduleStartTime));
  };

  const setPreset = (days: number[]) => {
    setScheduleDays(days);
    setScheduleEndTime(adjustEndTimeForDays(days, scheduleStartTime));
  };

  const handleStartTimeChange = (newStart: string) => {
    setScheduleStartTime(newStart);
    setScheduleEndTime(adjustEndTimeForDays(scheduleDays, newStart));
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    const formattedTime = `${scheduleStartTime} - ${scheduleEndTime}`;

    if (editingCourse) {
      await updateCourse(editingCourse.id, {
        course_name: courseName.trim(),
        instructor_name: instructorName.trim(),
        building: building.trim(),
        room: room.trim(),
        color_code: colorCode,
        contact_info: contactInfo.trim(),
        contact_method: contactMethod.trim(),
        schedule_days: scheduleDays,
        schedule_time: formattedTime,
      });
    } else {
      await addCourse({
        course_name: courseName.trim(),
        instructor_name: instructorName.trim(),
        building: building.trim(),
        room: room.trim(),
        color_code: colorCode,
        contact_info: contactInfo.trim(),
        contact_method: contactMethod.trim(),
        schedule_days: scheduleDays,
        schedule_time: formattedTime,
      });
    }

    setIsAddCourseModalOpen(false);
  };

  const handleAddCourseTask = async (courseId: string) => {
    if (!newCourseTaskTitle.trim()) return;
    await addTask({
      course_id: courseId,
      title: newCourseTaskTitle.trim(),
      is_important: newCourseTaskIsImportant,
      is_completed: false,
      due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    });
    setNewCourseTaskTitle('');
    setNewCourseTaskIsImportant(false);
  };

  const formatDaysArabic = (days?: number[]) => {
    if (!days || days.length === 0) return 'لم تحدد أيام بعد';
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    return days.map(d => dayNames[d]).filter(Boolean).join('، ');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">المواد والمقررات الدراسية</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            إدارة المقررات، ضبط توقيت المحاضرات (50 دقيقة للـ 3 أيام / ساعة و15 دقيقة ليومي الاثنين والأربعاء)، وبيانات المحاضرين.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs sm:text-sm font-bold transition shadow-lg shrink-0 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مقرر دراسي</span>
        </button>
      </div>

      {/* 2. Courses Grid */}
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لا توجد مقررات دراسية حالياً!"
          description="اضغط على زر 'إضافة مقرر دراسي' لإضافة مواد هذا الفصل وتحديد أيامها ومواعيدها."
          actionText="إضافة مادة الآن"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.map((course) => {
            const courseAtt = attendance.filter(a => a.course_id === course.id);
            const stats = calculateElapsedAbsenceStats(
              courseAtt,
              profile?.term_start_date,
              profile?.term_end_date
            );
            const courseTasks = tasks.filter(t => t.course_id === course.id);
            const nonImportantTasks = courseTasks.filter(t => !t.is_important);

            return (
              <div
                key={course.id}
                className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-xl p-6 space-y-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-14 rounded-full shrink-0 shadow"
                        style={{ backgroundColor: course.color_code }}
                      />
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                          {course.course_name}
                        </h2>
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D99B7F]" />
                          <span>{course.instructor_name || 'أستاذ المقرر'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(course)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F3040] transition"
                        title="تعديل المادة ومواعيدها"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 transition"
                        title="حذف المادة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Schedule Days & Time Badges */}
                  <div className="p-3 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <Calendar className="w-4 h-4 text-[#D99B7F] shrink-0" />
                      <span className="font-bold text-white">أيام المحاضرة:</span>
                      <span className="text-[#D99B7F] font-semibold">{formatDaysArabic(course.schedule_days)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <Clock className="w-4 h-4 text-[#D99B7F] shrink-0" />
                      <span className="font-bold text-white">وقت المحاضرة:</span>
                      <span className="text-slate-300 font-mono">{course.schedule_time || '09:00 - 10:15'}</span>
                    </div>
                  </div>

                  {/* Location & Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 bg-[#0F3040]/50 p-2.5 rounded-xl border border-[#A56F63]/20">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D99B7F] shrink-0" />
                      <span className="truncate">{course.building || 'المبنى'} - {course.room || 'القاعة'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#D99B7F] shrink-0" />
                      <span className="truncate">{course.contact_info || 'التواصل الأكاديمي'}</span>
                    </div>
                  </div>
                </div>

                {/* Absence Progress & Tasks Count */}
                <div className="space-y-3 pt-3 border-t border-[#A56F63]/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">نسبة الغياب المنقضي:</span>
                    <span className={`font-black ${
                      stats.effectiveAbsencePercentage >= 15 ? 'text-rose-300' : 'text-[#D99B7F]'
                    }`}>
                      {stats.effectiveAbsencePercentage}% ({stats.absentCount} غيابات)
                    </span>
                  </div>

                  <div className="w-full bg-[#0F3040] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        stats.warningLevel === 'dn_risk'
                          ? 'bg-rose-500'
                          : stats.warningLevel === 'danger'
                          ? 'bg-amber-500'
                          : 'bg-[#D99B7F]'
                      }`}
                      style={{ width: `${Math.min(100, stats.effectiveAbsencePercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>المهام المرتبطة: {courseTasks.length}</span>
                    <span className="text-[#D99B7F] font-semibold">
                      ({nonImportantTasks.length} مهام عادية داخل المادة)
                    </span>
                  </div>
                </div>

                {/* Button to Open Course Details */}
                <button
                  onClick={() => setSelectedCourseForDetail(course)}
                  className="w-full py-2.5 rounded-xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-[#D99B7F] border border-[#A56F63]/40 text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>عرض تفاصيل المادة ومهامها وسجلها</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#A56F63]/30 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-12 rounded-full shadow"
                  style={{ backgroundColor: selectedCourseForDetail.color_code }}
                />
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCourseForDetail.course_name}</h3>
                  <p className="text-xs text-[#D99B7F]">
                    {selectedCourseForDetail.instructor_name} • {selectedCourseForDetail.building} ({selectedCourseForDetail.room})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCourseForDetail(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#0F3040] transition"
              >
                ✕
              </button>
            </div>

            {/* Schedule Summary */}
            <div className="p-3.5 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D99B7F]" />
                <span>أيام المحاضرة: <b>{formatDaysArabic(selectedCourseForDetail.schedule_days)}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D99B7F]" />
                <span>الوقت: <b className="font-mono">{selectedCourseForDetail.schedule_time || '09:00 - 10:15'}</b></span>
              </div>
            </div>

            {/* Attendance Snapshot */}
            {(() => {
              const cAtt = attendance.filter(a => a.course_id === selectedCourseForDetail.id);
              const cStats = calculateElapsedAbsenceStats(cAtt, profile?.term_start_date, profile?.term_end_date);
              return (
                <div className="p-4 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">حالة الحضور والغياب للمقرر:</span>
                    <span className="text-[#D99B7F]">{cStats.effectiveAbsencePercentage}% غياب</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[#464858] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">حاضر</span>
                      <span className="font-bold text-emerald-400">{cStats.presentCount}</span>
                    </div>
                    <div className="bg-[#464858] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">غائب</span>
                      <span className="font-bold text-rose-400">{cStats.absentCount}</span>
                    </div>
                    <div className="bg-[#464858] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">متأخر</span>
                      <span className="font-bold text-amber-400">{cStats.lateCount}</span>
                    </div>
                    <div className="bg-[#464858] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">ملغي</span>
                      <span className="font-bold text-slate-300">{cStats.cancelledCount}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Course Tasks Section */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#D99B7F]" />
                  <span>مهام المقرر الدراسية</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  المهام المصنفة "غير مهمة" تظهر هنا حصرياً لتنظيم المادة بدون ازدحام الرئيسية.
                </p>
              </div>

              {/* Quick Add Task inside this course */}
              <div className="flex items-center gap-2 bg-[#0F3040] p-2.5 rounded-2xl border border-[#A56F63]/30">
                <input
                  type="text"
                  value={newCourseTaskTitle}
                  onChange={(e) => setNewCourseTaskTitle(e.target.value)}
                  placeholder="أدخل عنوان مهمة جديدة للمادة..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white outline-hidden"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCourseTask(selectedCourseForDetail.id);
                  }}
                />

                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer bg-[#464858] px-2.5 py-1.5 rounded-xl border border-[#A56F63]/30">
                  <input
                    type="checkbox"
                    checked={newCourseTaskIsImportant}
                    onChange={(e) => setNewCourseTaskIsImportant(e.target.checked)}
                    className="accent-[#A56F63]"
                  />
                  <span>مهمة عاجلة</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleAddCourseTask(selectedCourseForDetail.id)}
                  className="px-4 py-1.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow"
                >
                  إضافة
                </button>
              </div>

              {/* Course Tasks List */}
              {tasks.filter(t => t.course_id === selectedCourseForDetail.id).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 bg-[#0F3040]/40 rounded-xl">
                  لا توجد مهام مسجلة لهذه المادة حالياً.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {tasks.filter(t => t.course_id === selectedCourseForDetail.id).map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        task.is_completed
                          ? 'bg-[#0F3040]/40 border-emerald-500/20 opacity-70'
                          : 'bg-[#0F3040]/80 border-[#A56F63]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                            task.is_completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-[#A56F63]'
                          }`}
                        >
                          {task.is_completed && '✓'}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${task.is_completed ? 'line-through text-slate-400' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <span className={`text-[10px] font-semibold ${
                            task.is_important ? 'text-[#D99B7F]' : 'text-slate-400'
                          }`}>
                            {task.is_important ? '★ مهمة (تظهر في الرئيسية)' : 'مهمة عادية (داخل المادة)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="text-[11px] text-slate-300 hover:text-white"
                      >
                        {task.is_completed ? 'إلغاء الإكمال' : 'إكمال'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setSelectedCourseForDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0F3040] text-slate-300 hover:text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Course Modal with Smart Day and Time Defaults */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 animate-scale-up">
            <h3 className="text-lg font-bold text-[#D99B7F]">
              {editingCourse ? 'تعديل بيانات ومواعيد المقرر' : 'إضافة مقرر دراسي جديد'}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">اسم المادة / المقرر *</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="مثال: الذكاء الاصطناعي (CPCS-331)"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              {/* NEW: Smart Presets & Days Selector */}
              <div className="p-3.5 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D99B7F]" />
                    <span>أيام المحاضرة الأسبوعية *</span>
                  </label>

                  {/* Smart Academic Presets with Auto Duration */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreset([0, 1, 2])}
                      className="px-2 py-1 rounded-lg bg-[#464858] hover:bg-[#A56F63] text-slate-200 transition font-bold"
                      title="المدة الافتراضية: 50 دقيقة"
                    >
                      أحد/اثنين/ثلاثاء (50 دقيقة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreset([1, 3])}
                      className="px-2 py-1 rounded-lg bg-[#464858] hover:bg-[#A56F63] text-slate-200 transition font-bold"
                      title="المدة الافتراضية: ساعة و15 دقيقة"
                    >
                      اثنين/أربعاء (1:15 س)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = scheduleDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow-md'
                            : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-white'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lecture Time Picker with Auto Calculated End Time */}
              <div className="p-3.5 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D99B7F]" />
                    <span>وقت المحاضرة (تُحسب المدة تلقائياً)</span>
                  </label>
                  <span className="text-[10px] text-[#D99B7F] font-bold">
                    {scheduleDays.length >= 3 ? 'المدة: 50 دقيقة' : scheduleDays.length === 2 ? 'المدة: ساعة و15 دقيقة' : 'المدة: 50 دقيقة'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">وقت البدء:</span>
                    <input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">وقت الانتهاء (محسوب):</span>
                    <input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">اسم المحاضر / الدكتور</label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="د. خالد الأحمدي"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">المبنى والقاعة</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="مبنى 31"
                      className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-2.5 py-2.5 text-xs text-white outline-hidden"
                    />
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="قاعة 104"
                      className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-2.5 py-2.5 text-xs text-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">وسيلة التواصل</label>
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    placeholder="البريد الإلكتروني / الساعات المكتبية"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">معلومات الاتصال</label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="k.ahmadi@kau.edu.sa"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">لون التمييز البصري للمادة</label>
                <div className="flex items-center gap-2">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorCode(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition ${
                        colorCode === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A56F63]/30">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow transition"
                >
                  {editingCourse ? 'حفظ التعديلات' : 'إضافة المقرر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
