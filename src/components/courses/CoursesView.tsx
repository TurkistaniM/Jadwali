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
  Sparkles,
  FlaskConical
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
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 3]);
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('10:15');

  // Lab Form State
  const [hasLab, setHasLab] = useState(false);
  const [labDay, setLabDay] = useState<number>(1);
  const [labStartTime, setLabStartTime] = useState('13:00');
  const [labEndTime, setLabEndTime] = useState('14:50');
  const [labBuilding, setLabBuilding] = useState('');
  const [labRoom, setLabRoom] = useState('');

  // Course Detail Task quick add
  const [newCourseTaskTitle, setNewCourseTaskTitle] = useState('');
  const [newCourseTaskIsImportant, setNewCourseTaskIsImportant] = useState(false);

  const adjustEndTimeForDays = (days: number[], startTime: string) => {
    if (days.length >= 3) {
      return addMinutesToTime(startTime, 50);
    }
    if (days.length === 2) {
      return addMinutesToTime(startTime, 75);
    }
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
    setContactMethod('');
    
    setHasLab(false);
    setLabDay(1);
    setLabStartTime('13:00');
    setLabEndTime('14:50');
    setLabBuilding('');
    setLabRoom('');

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
    
    setHasLab(Boolean(c.has_lab));
    setLabDay(c.lab_day !== undefined && c.lab_day !== null ? c.lab_day : 1);
    if (c.lab_time && c.lab_time.includes('-')) {
      const parts = c.lab_time.split('-').map(s => s.trim());
      setLabStartTime(parts[0] || '13:00');
      setLabEndTime(parts[1] || '14:50');
    } else {
      setLabStartTime('13:00');
      setLabEndTime('14:50');
    }
    setLabBuilding(c.lab_building || '');
    setLabRoom(c.lab_room || '');

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
    const labFormattedTime = hasLab ? `${labStartTime} - ${labEndTime}` : null;

    if (editingCourse) {
      await updateCourse(editingCourse.id, {
        course_name: courseName.trim(),
        instructor_name: instructorName.trim() || undefined,
        building: building.trim() || undefined,
        room: room.trim() || undefined,
        color_code: colorCode,
        contact_info: contactInfo.trim() || undefined,
        contact_method: contactMethod.trim() || undefined,
        schedule_days: scheduleDays,
        schedule_time: formattedTime,
        has_lab: hasLab,
        lab_day: hasLab ? labDay : null,
        lab_time: labFormattedTime,
        lab_building: hasLab ? labBuilding.trim() : null,
        lab_room: hasLab ? labRoom.trim() : null,
      });
    } else {
      await addCourse({
        course_name: courseName.trim(),
        instructor_name: instructorName.trim() || undefined,
        building: building.trim() || undefined,
        room: room.trim() || undefined,
        color_code: colorCode,
        contact_info: contactInfo.trim() || undefined,
        contact_method: contactMethod.trim() || undefined,
        schedule_days: scheduleDays,
        schedule_time: formattedTime,
        has_lab: hasLab,
        lab_day: hasLab ? labDay : null,
        lab_time: labFormattedTime,
        lab_building: hasLab ? labBuilding.trim() : null,
        lab_room: hasLab ? labRoom.trim() : null,
      });
    }

    setIsAddCourseModalOpen(false);
  };

  const handleAddCourseTask = async (courseId: string) => {
    if (!newCourseTaskTitle.trim()) return;
    await addTask({
      title: newCourseTaskTitle.trim(),
      course_id: courseId,
      is_important: newCourseTaskIsImportant,
      is_completed: false,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    setNewCourseTaskTitle('');
    setNewCourseTaskIsImportant(false);
  };

  const getDaysLabel = (days?: number[]) => {
    if (!days || days.length === 0) return 'اثنين - أربعاء';
    if (days.length === 3 && days.includes(0) && days.includes(2) && days.includes(4)) {
      return 'أحد - ثلاثاء - خميس';
    }
    if (days.length === 2 && days.includes(1) && days.includes(3)) {
      return 'اثنين - أربعاء';
    }
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    return days.map(d => dayNames[d] || '').filter(Boolean).join('، ');
  };

  const getDayNameSingle = (dayId?: number | null) => {
    if (dayId === undefined || dayId === null) return '';
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    return dayNames[dayId] || '';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">المقررات الدراسية</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            إدارة كافة المواد، السكاشن، أوقات المحاضرات، المعامل، ومتابعة المهام الخاصة بكل مقرر.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-xs sm:text-sm transition shadow-lg active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مقرر دراسي جديد</span>
        </button>
      </div>

      {/* Courses Cards Grid */}
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لم تقم بإضافة أي مقرر دراسي بعد"
          description="أضف مقرراتك الأسبوعية الآن لضبط الحضور والغياب، المعامل، والمهام والجدول الأسبوعي."
          actionText="إضافة أول مقرر"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const stats = calculateElapsedAbsenceStats(
              attendance.filter(a => a.course_id === course.id),
              profile?.term_start_date,
              profile?.term_end_date
            );

            const courseTasks = tasks.filter(t => t.course_id === course.id);
            const pendingTasks = courseTasks.filter(t => !t.is_completed);

            return (
              <div
                key={course.id}
                className="bg-[#464858] rounded-3xl border-2 transition hover:shadow-2xl flex flex-col justify-between overflow-hidden group"
                style={{ borderColor: `${course.color_code || '#A56F63'}60` }}
              >
                {/* Top Color Accent Banner */}
                <div 
                  className="h-3 w-full"
                  style={{ backgroundColor: course.color_code || '#A56F63' }}
                />

                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-[#D99B7F] transition">
                        {course.course_name}
                      </h3>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#D99B7F]" />
                        <span>{course.instructor_name || 'لم يحدد المحاضر'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(course)}
                        className="p-1.5 rounded-lg bg-[#0F3040] text-slate-300 hover:text-white transition"
                        title="تعديل المقرر"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من رغبتك في حذف مقرر "${course.course_name}"؟`)) {
                            deleteCourse(course.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#0F3040] text-rose-300 hover:text-rose-200 transition"
                        title="حذف المقرر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Schedule & Room Info */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/20 text-xs">
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D99B7F]" />
                        <span className="font-semibold">{getDaysLabel(course.schedule_days)}</span>
                      </span>
                      <span className="font-mono text-[11px] text-white">
                        {course.schedule_time || '09:00 - 10:15'}
                      </span>
                    </div>

                    {(course.building || course.room) && (
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#A56F63]" />
                        <span>{course.building || ''} {course.room ? `(${course.room})` : ''}</span>
                      </div>
                    )}

                    {/* Lab Badge if exists */}
                    {course.has_lab && (
                      <div className="mt-2 pt-1.5 border-t border-[#A56F63]/30 flex items-center justify-between text-[11px] text-[#D99B7F] font-bold">
                        <span className="flex items-center gap-1">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>معمل: {getDayNameSingle(course.lab_day)}</span>
                        </span>
                        <span className="font-mono">{course.lab_time || '13:00 - 14:50'}</span>
                      </div>
                    )}
                  </div>

                  {/* Absence Mini Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">نسبة الغياب المنقضية:</span>
                      <span className={`font-bold font-mono ${
                        stats.warningLevel === 'dn_risk' ? 'text-rose-400 font-black' :
                        stats.warningLevel === 'danger' ? 'text-amber-400' :
                        stats.warningLevel === 'warning' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {stats.effectiveAbsencePercentage}% ({stats.absentCount} غياب)
                      </span>
                    </div>

                    <div className="w-full bg-[#0F3040] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          stats.warningLevel === 'dn_risk' ? 'bg-rose-500' :
                          stats.warningLevel === 'danger' ? 'bg-amber-500' :
                          stats.warningLevel === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (stats.effectiveAbsencePercentage / 25) * 100)}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Card Footer: Tasks & Open Details */}
                <div className="p-4 bg-[#0F3040]/40 border-t border-[#A56F63]/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckSquare className="w-4 h-4 text-[#D99B7F]" />
                    <span>{pendingTasks.length} مهام معلقة</span>
                  </div>

                  <button
                    onClick={() => setSelectedCourseForDetail(course)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D99B7F] hover:text-white transition"
                  >
                    <span>تفاصيل المقرر</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-lg w-full shadow-2xl space-y-6 animate-scale-up">
            
            <div className="flex items-start justify-between border-b border-[#A56F63]/30 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCourseForDetail.course_name}</h3>
                <p className="text-xs text-[#D99B7F] font-semibold mt-0.5">
                  المحاضر: {selectedCourseForDetail.instructor_name || 'غير محدد'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseForDetail(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0F3040] border border-[#A56F63]/30">
                <span className="text-slate-400 block text-[10px] mb-0.5">أيام ومواعيد المحاضرة</span>
                <b className="text-white block">{getDaysLabel(selectedCourseForDetail.schedule_days)}</b>
                <span className="text-[#D99B7F] font-mono text-[11px]">{selectedCourseForDetail.schedule_time || '09:00 - 10:15'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0F3040] border border-[#A56F63]/30">
                <span className="text-slate-400 block text-[10px] mb-0.5">الموقع والمبنى</span>
                <b className="text-white block">{selectedCourseForDetail.building || 'غير محدد'}</b>
                <span className="text-slate-300 text-[11px]">قاعة: {selectedCourseForDetail.room || '---'}</span>
              </div>
            </div>

            {/* Lab details in detail modal */}
            {selectedCourseForDetail.has_lab && (
              <div className="p-3.5 rounded-2xl bg-[#0F3040] border border-[#D99B7F]/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white">
                  <FlaskConical className="w-5 h-5 text-[#D99B7F]" />
                  <div>
                    <p className="font-bold text-white">المعمل / السكشن العملي</p>
                    <p className="text-[11px] text-slate-300">
                      يوم: {getDayNameSingle(selectedCourseForDetail.lab_day)} • {selectedCourseForDetail.lab_building || ''} {selectedCourseForDetail.lab_room ? `(${selectedCourseForDetail.lab_room})` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-[#D99B7F] font-bold bg-[#464858] px-2.5 py-1 rounded-xl">
                  {selectedCourseForDetail.lab_time || '13:00 - 14:50'}
                </span>
              </div>
            )}

            {/* Contact Info */}
            {(selectedCourseForDetail.contact_method || selectedCourseForDetail.contact_info) && (
              <div className="p-3 rounded-2xl bg-[#0F3040] border border-[#A56F63]/30 text-xs">
                <span className="text-slate-400 block text-[10px]">وسيلة التواصل:</span>
                <span className="font-semibold text-white">{selectedCourseForDetail.contact_method || 'معلومات التواصل'}: </span>
                <span className="font-mono text-[#D99B7F]">{selectedCourseForDetail.contact_info}</span>
              </div>
            )}

            {/* In-Course Tasks List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#D99B7F]" />
                <span>مهام وواجبات هذا المقرر</span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCourseTaskTitle}
                  onChange={(e) => setNewCourseTaskTitle(e.target.value)}
                  placeholder="أضف واجباً أو تقريراً جديداً لهذا المقرر..."
                  className="flex-1 bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
                <button
                  onClick={() => handleAddCourseTask(selectedCourseForDetail.id)}
                  className="px-3.5 py-2 rounded-xl bg-[#A56F63] text-white text-xs font-bold shrink-0"
                >
                  إضافة
                </button>
              </div>

              {tasks.filter(t => t.course_id === selectedCourseForDetail.id).length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">لا توجد مهام مضافة لهذا المقرر بعد</p>
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
                className="px-5 py-2.5 rounded-xl bg-[#0F3040] text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
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

              {/* خيارات الأيام الأكاديمية المعتمدة للمحاضرة */}
              <div className="p-4 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/40 space-y-3">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D99B7F]" />
                    <span>أيام المحاضرة الأسبوعية *</span>
                  </span>
                  <span className="text-[10px] text-[#D99B7F] font-bold">
                    {scheduleDays.length >= 3 ? 'مدة المحاضرة: 50 دقيقة' : 'مدة المحاضرة: ساعة و15 دقيقة'}
                  </span>
                </label>

                {/* خياري التوزيع الأسبوعي المعتمد */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreset([0, 2, 4])}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      scheduleDays.length === 3 && scheduleDays.includes(0) && scheduleDays.includes(2) && scheduleDays.includes(4)
                        ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow-lg ring-2 ring-[#D99B7F]/50'
                        : 'bg-[#464858] border-[#A56F63]/30 text-slate-200 hover:bg-[#464858]/80'
                    }`}
                  >
                    <div className="text-right">
                      <p className="font-bold text-sm text-white">أحد - ثلاثاء - خميس</p>
                      <p className="text-[10px] text-slate-300 font-normal">3 أيام في الأسبوع (50 دقيقة)</p>
                    </div>
                    {scheduleDays.length === 3 && scheduleDays.includes(0) && scheduleDays.includes(2) && scheduleDays.includes(4) && (
                      <span className="text-sm font-black">✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreset([1, 3])}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      scheduleDays.length === 2 && scheduleDays.includes(1) && scheduleDays.includes(3)
                        ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow-lg ring-2 ring-[#D99B7F]/50'
                        : 'bg-[#464858] border-[#A56F63]/30 text-slate-200 hover:bg-[#464858]/80'
                    }`}
                  >
                    <div className="text-right">
                      <p className="font-bold text-sm text-white">اثنين - أربعاء</p>
                      <p className="text-[10px] text-slate-300 font-normal">يومان في الأسبوع (ساعة و15 د)</p>
                    </div>
                    {scheduleDays.length === 2 && scheduleDays.includes(1) && scheduleDays.includes(3) && (
                      <span className="text-sm font-black">✓</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Lecture Time Picker */}
              <div className="p-3.5 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D99B7F]" />
                    <span>وقت المحاضرة (تُحسب المدة تلقائياً)</span>
                  </label>
                  <span className="text-[10px] text-[#D99B7F] font-bold">
                    {scheduleDays.length >= 3 ? 'المدة: 50 دقيقة' : 'المدة: ساعة و15 دقيقة'}
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

              {/* NEW: Lab (المعمل) Option */}
              <div className="p-4 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="checkbox"
                      checked={hasLab}
                      onChange={(e) => setHasLab(e.target.checked)}
                      className="w-4 h-4 rounded border-[#A56F63] text-[#A56F63] accent-[#A56F63] cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-[#D99B7F]" />
                      <span>إضافة معمل / سكشن عملي للمادة (اختياري)</span>
                    </span>
                  </label>
                  {hasLab && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#A56F63]/40 text-[#D99B7F] font-bold">
                      مفعل 🧪
                    </span>
                  )}
                </div>

                {hasLab && (
                  <div className="pt-3 border-t border-[#A56F63]/20 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        يوم المعمل الأسبوعي *
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => setLabDay(day.id)}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              labDay === day.id
                                ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow-md'
                                : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-white'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">وقت بدء المعمل:</span>
                        <input
                          type="time"
                          value={labStartTime}
                          onChange={(e) => setLabStartTime(e.target.value)}
                          className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">وقت انتهاء المعمل:</span>
                        <input
                          type="time"
                          value={labEndTime}
                          onChange={(e) => setLabEndTime(e.target.value)}
                          className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">مبنى المعمل:</span>
                        <input
                          type="text"
                          value={labBuilding}
                          onChange={(e) => setLabBuilding(e.target.value)}
                          placeholder="مثال: مبنى 31"
                          className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">قاعة / معمل:</span>
                        <input
                          type="text"
                          value={labRoom}
                          onChange={(e) => setLabRoom(e.target.value)}
                          placeholder="معمل 204"
                          className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructor & Location */}
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
                  <label className="block text-xs font-bold text-slate-200 mb-1">المبنى والقاعة (للمحاضرة)</label>
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

              {/* Contact Method & Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">وسيلة التواصل</label>
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    placeholder="مثال: واتساب، الساعات المكتبية، بلاك بورد"
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

              {/* Color Code */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">لون التمييز البصري للمادة</label>
                <div className="flex items-center gap-2">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorCode(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition cursor-pointer ${
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
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow transition cursor-pointer"
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
