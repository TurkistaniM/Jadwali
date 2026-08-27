import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  ChevronLeft, 
  Plus, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { calculateNextScholarshipCountdown, calculateElapsedAbsenceStats, formatGpaDisplay, formatDateArabic } from '../../utils/academicCalculations';
import { ActiveTab, AttendanceStatus } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import confetti from 'canvas-confetti';

interface HomeDashboardProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddCourse: () => void;
  onOpenAddTask: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateTab,
  onOpenAddCourse,
  onOpenAddTask,
}) => {
  const { profile } = useAuth();
  const { 
    courses, 
    attendance, 
    importantTasks, 
    toggleTaskCompletion, 
    exams,
    recordAttendance,
    scholarships,
    monthlyScholarshipAmount
  } = useData();

  // Ticking scholarship timer
  const [scholarshipState, setScholarshipState] = useState(calculateNextScholarshipCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setScholarshipState(calculateNextScholarshipCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Overall Elapsed Absence
  const overallAbsence = calculateElapsedAbsenceStats(
    attendance,
    profile?.term_start_date,
    profile?.term_end_date
  );

  // Overall GPA format
  const gpaInfo = profile ? formatGpaDisplay(profile.gpa_value, profile.gpa_type) : null;

  // Quick Attendance Date
  const todayDateStr = new Date().toISOString().split('T')[0];

  const handleQuickAttendance = async (courseId: string, status: AttendanceStatus) => {
    await recordAttendance(courseId, todayDateStr, status);
    if (status === 'حاضر') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Welcome & Scholarship Countdown Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#464858] via-[#464858]/90 to-[#0F3040] border-2 border-[#A56F63]/50 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#A56F63]/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#D99B7F]/10 rounded-full blur-2xl -z-0 pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Welcome Info */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F3040]/80 border border-[#A56F63]/40 text-xs text-[#D99B7F] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#D99B7F]" />
              <span>الفصل الدراسي الأكاديمي {new Date().getFullYear()}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug">
              مرحباً بك، <span className="text-[#D99B7F]">{profile?.full_name || 'طالبنا العزيز'}</span> 🎓
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {profile?.major} • {profile?.university} • الرقم الجامعي: <span className="font-mono text-[#D99B7F] font-bold">{profile?.academic_id}</span>
            </p>

            {/* Term Start / End indicator */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-[#0F3040]/60 px-3 py-1.5 rounded-xl border border-[#A56F63]/20">
                <Calendar className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span>بداية الفصل الدراسي: <b className="text-white">{profile?.term_start_date || '2026-08-01'}</b></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0F3040]/60 px-3 py-1.5 rounded-xl border border-[#A56F63]/20">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>نهاية الفصل الدراسي: <b className="text-white">{profile?.term_end_date || '2026-12-25'}</b></span>
              </div>
            </div>
          </div>

          {/* Scholarship Countdown Live Widget (PRD 5.1) */}
          <div className="lg:col-span-6 bg-[#0F3040]/90 p-5 sm:p-6 rounded-2xl border border-[#A56F63]/40 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#A56F63] text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">عداد المكافأة الجامعية</h3>
                  <p className="text-[11px] text-[#D99B7F] font-semibold">{scholarshipState.formattedTargetDate}</p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#464858] text-[#D99B7F] border border-[#A56F63]/30">
                {monthlyScholarshipAmount.toLocaleString()} ريال
              </span>
            </div>

            {/* Countdown Tiles */}
            {scholarshipState.isToday ? (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-1 animate-pulse">
                <p className="text-base font-black text-emerald-300">🎉 اليوم هو موعد إيداع المكافأة في الحساب!</p>
                <p className="text-xs text-emerald-200">نتمنى لك فصلاً دراسياً موفقاً وحافلاً بالإنجازات</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#464858] p-2.5 rounded-xl border border-[#A56F63]/30">
                  <span className="text-xl sm:text-2xl font-black text-[#D99B7F] block">{scholarshipState.days}</span>
                  <span className="text-[10px] text-slate-300">يوم</span>
                </div>
                <div className="bg-[#464858] p-2.5 rounded-xl border border-[#A56F63]/30">
                  <span className="text-xl sm:text-2xl font-black text-white block">{scholarshipState.hours}</span>
                  <span className="text-[10px] text-slate-300">ساعة</span>
                </div>
                <div className="bg-[#464858] p-2.5 rounded-xl border border-[#A56F63]/30">
                  <span className="text-xl sm:text-2xl font-black text-white block">{scholarshipState.minutes}</span>
                  <span className="text-[10px] text-slate-300">دقيقة</span>
                </div>
                <div className="bg-[#464858] p-2.5 rounded-xl border border-[#A56F63]/30">
                  <span className="text-xl sm:text-2xl font-black text-[#D99B7F] block">{scholarshipState.seconds}</span>
                  <span className="text-[10px] text-slate-300">ثانية</span>
                </div>
              </div>
            )}

            {/* PRD Financial Adjustment Rule Note */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#464858]/50 p-2.5 rounded-xl border border-[#A56F63]/20">
              <Clock className="w-3.5 h-3.5 text-[#D99B7F] shrink-0" />
              <span>{scholarshipState.adjustmentNote} (الصرف يوم 27 مع تقديم الجمعة وتأخير السبت).</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards: Absence Engine, GPA, Courses, Tasks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Elapsed Absence Ratio (PRD 5.2) */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer bg-[#464858] p-5 rounded-2xl border border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">نسبة الغياب المنقضي</span>
            <div className={`p-2 rounded-xl ${
              overallAbsence.warningLevel === 'dn_risk' 
                ? 'bg-rose-950 text-rose-400' 
                : overallAbsence.warningLevel === 'danger'
                ? 'bg-amber-950 text-amber-400'
                : 'bg-[#0F3040] text-[#D99B7F]'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${
              overallAbsence.effectiveAbsencePercentage >= 15 ? 'text-rose-400' : 'text-[#D99B7F]'
            }`}>
              {overallAbsence.effectiveAbsencePercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({overallAbsence.absentCount} غياب / {overallAbsence.totalElapsedSessions} محاضرة منقضية)
            </span>
          </div>
          <div className="mt-3 w-full bg-[#0F3040] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                overallAbsence.effectiveAbsencePercentage >= 20 
                  ? 'bg-rose-500' 
                  : overallAbsence.effectiveAbsencePercentage >= 15 
                  ? 'bg-amber-500' 
                  : 'bg-[#D99B7F]'
              }`}
              style={{ width: `${Math.min(100, overallAbsence.effectiveAbsencePercentage)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{overallAbsence.warningMessage}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D99B7F] group-hover:translate-x-[-2px] transition" />
          </p>
        </div>

        {/* GPA Metric */}
        <div 
          onClick={() => onNavigateTab('profile')}
          className="cursor-pointer bg-[#464858] p-5 rounded-2xl border border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">المعدل التراكمي</span>
            <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {gpaInfo?.display || '4.82'}
            </span>
            <span className="text-xs text-[#D99B7F] font-semibold">{gpaInfo?.label}</span>
          </div>
          <div className="mt-3 w-full bg-[#0F3040] h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#A56F63] transition-all duration-500"
              style={{ width: `${gpaInfo?.percentage || 96}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>ممتاز مع مرتبة الشرف الأولى</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D99B7F] group-hover:translate-x-[-2px] transition" />
          </p>
        </div>

        {/* Courses Count */}
        <div 
          onClick={() => onNavigateTab('courses')}
          className="cursor-pointer bg-[#464858] p-5 rounded-2xl border border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">المواد المسجلة</span>
            <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {courses.length}
            </span>
            <span className="text-xs text-slate-400">مقررات دراسية</span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            {courses.slice(0, 4).map((c) => (
              <span 
                key={c.id} 
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: c.color_code }}
                title={c.course_name}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>استعراض المقررات والمدرسين</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D99B7F] group-hover:translate-x-[-2px] transition" />
          </p>
        </div>

        {/* Urgent Important Tasks Count (PRD 5.3) */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="cursor-pointer bg-[#464858] p-5 rounded-2xl border border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">المهام العاجلة (المهمة)</span>
            <div className="p-2 rounded-xl bg-[#A56F63] text-white">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#D99B7F]">
              {importantTasks.filter(t => !t.is_completed).length}
            </span>
            <span className="text-xs text-slate-400">
              من أصل {importantTasks.length} مهام
            </span>
          </div>
          <div className="mt-3 w-full bg-[#0F3040] h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ 
                width: `${importantTasks.length > 0 ? (importantTasks.filter(t => t.is_completed).length / importantTasks.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>خاص بالمهام المصنفة "مهمة"</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D99B7F] group-hover:translate-x-[-2px] transition" />
          </p>
        </div>

      </div>

      {/* 3. Main Split Section: (Important Tasks) & (Today Attendance / Courses Quick Check) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Urgent Important Tasks (PRD 5.3: تظهر المهام "المهمة" فقط هنا) */}
        <div className="lg:col-span-7 bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">قائمة المهام المهمة والعاجلة</h2>
                <p className="text-[11px] text-[#D99B7F]">
                  المهام ذات الأولوية القصوى التي تتطلب إنجازاً قريباً
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAddTask}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مهمة</span>
            </button>
          </div>

          {importantTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="لا توجد مهام عاجلة حالياً!"
              description="أحسنت! لا توجد أية مهام مصنفة كـ 'مهمة' معلقة. يمكنك إضافة مهمة جديدة أو تصفح باقي المهام."
              actionText="إضافة مهمة جديدة"
              onAction={onOpenAddTask}
            />
          ) : (
            <div className="space-y-3">
              {importantTasks.map((task) => {
                const course = courses.find(c => c.id === task.course_id);
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      task.is_completed
                        ? 'bg-[#0F3040]/40 border-emerald-500/30 opacity-75'
                        : 'bg-[#0F3040]/80 border-[#A56F63]/40 hover:border-[#D99B7F]/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                          task.is_completed
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-[#A56F63] hover:border-[#D99B7F] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-bold text-white leading-relaxed ${
                          task.is_completed ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-300">
                          {course && (
                            <span 
                              className="px-2 py-0.5 rounded-md font-semibold text-[10px] text-white"
                              style={{ backgroundColor: course.color_code }}
                            >
                              {course.course_name.split('(')[0]}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-[#D99B7F]" />
                              <span>{formatDateArabic(task.due_date)}</span>
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-[#A56F63]/30 text-[#D99B7F] font-bold text-[10px]">
                            مهمة
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition shrink-0 ${
                        task.is_completed
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-[#464858] text-slate-300 hover:text-white'
                      }`}
                    >
                      {task.is_completed ? 'مكتملة' : 'إنجاز'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-[#D99B7F] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>عرض كافة المهام والمواد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: Quick Attendance Check-in & Absence Health per Course */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Attendance per Course Today */}
          <div className="bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">التحضير السريع لمحاضرات اليوم</h3>
                  <p className="text-[11px] text-slate-300">{formatDateArabic(todayDateStr)}</p>
                </div>
              </div>
            </div>

            {courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="لا توجد مواد دراسية مسجلة"
                description="أضف مقرراتك الأكاديمية لتسجيل الحضور والغياب وحساب نسبة الحرمان بدقة."
                actionText="أضف مادة للبدء"
                onAction={onOpenAddCourse}
              />
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 3).map((course) => {
                  const courseAtt = attendance.filter(a => a.course_id === course.id);
                  const stats = calculateElapsedAbsenceStats(
                    courseAtt,
                    profile?.term_start_date,
                    profile?.term_end_date
                  );
                  const todayRecord = courseAtt.find(a => a.session_date === todayDateStr);

                  return (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: course.color_code }}
                          />
                          <span className="text-xs font-bold text-white truncate max-w-[180px]">
                            {course.course_name}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          stats.effectiveAbsencePercentage >= 15 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                            : 'bg-[#464858] text-[#D99B7F]'
                        }`}>
                          غياب: {stats.effectiveAbsencePercentage}%
                        </span>
                      </div>

                      {/* Attendance Action Buttons */}
                      <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                        <button
                          onClick={() => handleQuickAttendance(course.id, 'حاضر')}
                          className={`py-1.5 rounded-lg border transition ${
                            todayRecord?.status === 'حاضر'
                              ? 'bg-emerald-700 border-emerald-500 text-white shadow'
                              : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-emerald-300'
                          }`}
                        >
                          حاضر
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(course.id, 'غائب')}
                          className={`py-1.5 rounded-lg border transition ${
                            todayRecord?.status === 'غائب'
                              ? 'bg-rose-700 border-rose-500 text-white shadow'
                              : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-rose-300'
                          }`}
                        >
                          غائب
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(course.id, 'متأخر')}
                          className={`py-1.5 rounded-lg border transition ${
                            todayRecord?.status === 'متأخر'
                              ? 'bg-amber-700 border-amber-500 text-white shadow'
                              : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-amber-300'
                          }`}
                        >
                          متأخر
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(course.id, 'تم إلغاء الدرس')}
                          className={`py-1.5 rounded-lg border transition text-[10px] ${
                            todayRecord?.status === 'تم إلغاء الدرس'
                              ? 'bg-slate-700 border-slate-500 text-white shadow'
                              : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-slate-100'
                          }`}
                          title="يتم استبعاد الدرس الملغي من إجمالي المحاضرات تلقائياً"
                        >
                          ملغي
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onNavigateTab('attendance')}
              className="w-full py-2.5 rounded-xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-[#D99B7F] border border-[#A56F63]/40 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>سجل الحضور الكامل وحساب الحرمان DN</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Upcoming Exams Card */}
          <div className="bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">الاختبارات القادمة</h3>
                  <p className="text-[11px] text-slate-300">مواعيد الاختبارات النصفية والنهائية</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('exams')}
                className="text-xs text-[#D99B7F] font-bold hover:underline"
              >
                الجدول
              </button>
            </div>

            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                لا توجد اختبارات مسجلة حالياً. استمتع بوقتك!
              </p>
            ) : (
              <div className="space-y-2.5">
                {exams.slice(0, 3).map((exam) => {
                  const course = courses.find(c => c.id === exam.course_id);
                  return (
                    <div 
                      key={exam.id}
                      className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{exam.title}</p>
                        <p className="text-[10px] text-slate-400">{course?.course_name || 'مقرر دراسي'} • {exam.location || 'القاعة'}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#464858] text-[#D99B7F] border border-[#A56F63]/20">
                        {formatDateArabic(exam.exam_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
