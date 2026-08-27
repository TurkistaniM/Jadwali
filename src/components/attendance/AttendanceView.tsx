import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Filter, 
  Info,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { calculateElapsedAbsenceStats, formatDateArabic } from '../../utils/academicCalculations';
import { AttendanceStatus, Course } from '../../types/database';
import { EmptyState } from '../common/EmptyState';

export const AttendanceView: React.FC = () => {
  const { profile } = useAuth();
  const { 
    courses, 
    attendance, 
    recordAttendance, 
    deleteAttendanceRecord 
  } = useData();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Past Lectures Browser State
  const [selectedPastCourseId, setSelectedPastCourseId] = useState<string>(courses[0]?.id || '');

  // Form modal state for adding/editing specific date
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [targetCourseId, setTargetCourseId] = useState<string>(courses[0]?.id || '');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('حاضر');

  // Filtered Attendance List
  const filteredAttendance = attendance.filter((item) => {
    if (selectedCourseFilter !== 'all' && item.course_id !== selectedCourseFilter) return false;
    if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

  // Generate Past Dates from Term Start to Today for a Course
  const getPastLectureDates = (course: Course | undefined) => {
    if (!course) return [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDateStr = profile?.term_start_date || '2026-08-01';
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const scheduleDays = course.schedule_days && course.schedule_days.length > 0
      ? course.schedule_days
      : [0, 1, 2, 3, 4]; // All weekdays if not specified

    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= today) {
      const dayOfWeek = current.getDay(); // 0: Sun ... 4: Thu
      if (scheduleDays.includes(dayOfWeek) && dayOfWeek !== 5 && dayOfWeek !== 6) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates.reverse(); // Most recent first
  };

  const currentSelectedCourse = courses.find(c => c.id === selectedPastCourseId) || courses[0];
  const pastDates = getPastLectureDates(currentSelectedCourse);

  const handleQuickChangeStatus = async (courseId: string, dateStr: string, newStatus: AttendanceStatus) => {
    await recordAttendance(courseId, dateStr, newStatus);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseId || !targetDate) return;
    await recordAttendance(targetCourseId, targetDate, targetStatus);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">سجل الحضور وحساب الغياب المنقضي</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            يمكنك تصفح جميع المحاضرات السابقة وتعديل حالتها مباشرة (حاضر / غائب / متأخر / تم إلغاء الدرس).
          </p>
        </div>

        <button
          onClick={() => {
            setTargetCourseId(courses[0]?.id || '');
            setTargetDate(new Date().toISOString().split('T')[0]);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs sm:text-sm font-bold transition shadow-lg shrink-0 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل / تعديل تاريخ محدد</span>
        </button>
      </div>

      {/* 2. Strict Academic Rule Alert Banner */}
      <div className="p-4 rounded-2xl bg-[#0F3040] border-2 border-[#A56F63]/50 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[#A56F63]/20 text-[#D99B7F] shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-200 leading-relaxed space-y-1">
          <p className="font-bold text-[#D99B7F]">نظام احتساب وتعديل الغياب:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            <li>الحساب يبدأ من بداية الترم <b>({profile?.term_start_date || '2026-08-01'})</b> وحتى اليوم، وتُستثنى المحاضرات الملغاة والمستقبلية.</li>
            <li>يمكنك الضغط على أي محاضرة سابقة لتغيير حالتها فوراً وسيتم إعادة حساب نسبة الغياب تلقائياً.</li>
          </ul>
        </div>
      </div>

      {/* 3. NEW: Past Lectures Browser & Interactive Status Switcher (تعديل المحاضرات السابقة) */}
      {courses.length > 0 && (
        <div className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/50 p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A56F63]/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/30">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>تعديل سجل المحاضرات السابقة لمادة:</span>
                  <span className="text-[#D99B7F] font-black">{currentSelectedCourse?.course_name}</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  اختر المادة ثم اضغط على الحالة المطلوبة لأي يوم سابق لتعديلها بضغطة زر واحدة.
                </p>
              </div>
            </div>

            {/* Course Selector for Past Lectures */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-semibold">المادة:</span>
              <select
                value={selectedPastCourseId || currentSelectedCourse?.id}
                onChange={(e) => setSelectedPastCourseId(e.target.value)}
                className="bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-hidden"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Past Sessions List */}
          {pastDates.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              لا توجد تواريخ محاضرات منقضية لهذا المقرر حتى اليوم.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {pastDates.map((dateStr) => {
                const record = attendance.find(
                  a => a.course_id === currentSelectedCourse.id && a.session_date === dateStr
                );
                const currentStatus = record ? record.status : null;

                return (
                  <div
                    key={dateStr}
                    className="p-3.5 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D99B7F]/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#D99B7F] shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {formatDateArabic(dateStr)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {dateStr}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mr-2">
                        الحالة الحالية:{' '}
                        <b className={
                          currentStatus === 'حاضر' ? 'text-emerald-400' :
                          currentStatus === 'غائب' ? 'text-rose-400' :
                          currentStatus === 'متأخر' ? 'text-amber-400' :
                          currentStatus === 'تم إلغاء الدرس' ? 'text-slate-400' :
                          'text-slate-400'
                        }>
                          {currentStatus || 'لم تُسجل بعد'}
                        </b>
                      </span>
                    </div>

                    {/* Quick 1-Click Status Switcher Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-bold shrink-0">
                      <button
                        onClick={() => handleQuickChangeStatus(currentSelectedCourse.id, dateStr, 'حاضر')}
                        className={`px-3 py-1.5 rounded-xl border transition ${
                          currentStatus === 'حاضر'
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                            : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-emerald-300'
                        }`}
                      >
                        حاضر
                      </button>

                      <button
                        onClick={() => handleQuickChangeStatus(currentSelectedCourse.id, dateStr, 'غائب')}
                        className={`px-3 py-1.5 rounded-xl border transition ${
                          currentStatus === 'غائب'
                            ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                            : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-rose-300'
                        }`}
                      >
                        غائب
                      </button>

                      <button
                        onClick={() => handleQuickChangeStatus(currentSelectedCourse.id, dateStr, 'متأخر')}
                        className={`px-3 py-1.5 rounded-xl border transition ${
                          currentStatus === 'متأخر'
                            ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                            : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        متأخر
                      </button>

                      <button
                        onClick={() => handleQuickChangeStatus(currentSelectedCourse.id, dateStr, 'تم إلغاء الدرس')}
                        className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] ${
                          currentStatus === 'تم إلغاء الدرس'
                            ? 'bg-slate-700 border-slate-400 text-white shadow-md'
                            : 'bg-[#464858] border-[#A56F63]/30 text-slate-300 hover:text-white'
                        }`}
                        title="استبعاد من إجمالي المحاضرات"
                      >
                        ملغي
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Absence Status Cards for Each Course */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>حالة ونسب الغياب الأكاديمي الحالية</span>
          <span className="text-xs font-normal text-slate-400">({courses.length} مقررات)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const courseAtt = attendance.filter(a => a.course_id === course.id);
            const stats = calculateElapsedAbsenceStats(
              courseAtt,
              profile?.term_start_date,
              profile?.term_end_date
            );

            return (
              <div
                key={course.id}
                className="bg-[#464858] p-5 rounded-2xl border border-[#A56F63]/30 shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span 
                      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" 
                      style={{ backgroundColor: course.color_code }}
                    />
                    <span className="text-xs font-bold text-white">{course.course_name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{course.instructor_name || 'أستاذ المادة'}</p>
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                    stats.warningLevel === 'dn_risk'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : stats.warningLevel === 'danger'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : stats.warningLevel === 'warning'
                      ? 'bg-amber-900/40 text-amber-200 border-amber-700/40'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {stats.effectiveAbsencePercentage}% غياب
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#0F3040] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      stats.warningLevel === 'dn_risk'
                        ? 'bg-rose-500'
                        : stats.warningLevel === 'danger'
                        ? 'bg-amber-500'
                        : 'bg-[#D99B7F]'
                    }`}
                    style={{ width: `${Math.min(100, stats.effectiveAbsencePercentage)}%` }}
                  />
                </div>

                {/* Breakdown Stats */}
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] bg-[#0F3040]/60 p-2 rounded-xl border border-[#A56F63]/20">
                  <div>
                    <span className="text-slate-400 block">حاضر</span>
                    <span className="font-bold text-emerald-400">{stats.presentCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">غائب</span>
                    <span className="font-bold text-rose-400">{stats.absentCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">متأخر</span>
                    <span className="font-bold text-amber-400">{stats.lateCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ملغي</span>
                    <span className="font-bold text-slate-300">{stats.cancelledCount}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 font-semibold">{stats.warningMessage}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Detailed Attendance Table with In-line Status Modifier */}
      <div className="bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A56F63]/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#D99B7F]" />
            <h3 className="text-sm font-bold text-white">سجل الجلسات المسجلة مع إمكانية التعديل الفوري</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3 py-1.5 text-xs text-white outline-hidden"
            >
              <option value="all">كافة المقررات</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_name}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3 py-1.5 text-xs text-white outline-hidden"
            >
              <option value="all">كافة الحالات</option>
              <option value="حاضر">حاضر</option>
              <option value="غائب">غائب</option>
              <option value="متأخر">متأخر</option>
              <option value="تم إلغاء الدرس">تم إلغاء الدرس</option>
            </select>
          </div>
        </div>

        {filteredAttendance.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="لا توجد سجلات حضور مسجلة"
            description="يمكنك تسجيل حضور أي محاضرة سابقة من قسم 'تعديل سجل المحاضرات السابقة' أعلاه."
            actionText="تسجيل محاضرة الآن"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#A56F63]/30 text-[#D99B7F]">
                  <th className="py-3 px-4 font-bold">المقرر الدراسي</th>
                  <th className="py-3 px-4 font-bold">تاريخ المحاضرة</th>
                  <th className="py-3 px-4 font-bold">الحالة الحالية</th>
                  <th className="py-3 px-4 font-bold text-center">تغيير الحالة مباشرة</th>
                  <th className="py-3 px-4 font-bold text-left">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A56F63]/20">
                {filteredAttendance.map((item) => {
                  const course = courses.find(c => c.id === item.course_id);
                  return (
                    <tr key={item.id} className="hover:bg-[#0F3040]/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: course?.color_code || '#A56F63' }}
                        />
                        <span>{course?.course_name || 'مقرر'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {formatDateArabic(item.session_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                          item.status === 'حاضر'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : item.status === 'غائب'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : item.status === 'متأخر'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {item.status === 'حاضر' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'غائب' && <AlertTriangle className="w-3 h-3" />}
                          {item.status === 'متأخر' && <Clock className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      
                      {/* Inline 1-Click Status Switcher */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#0F3040] p-1 rounded-xl border border-[#A56F63]/30">
                          {(['حاضر', 'غائب', 'متأخر', 'تم إلغاء الدرس'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleQuickChangeStatus(item.course_id, item.session_date, st)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                item.status === st
                                  ? 'bg-[#A56F63] text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {st === 'تم إلغاء الدرس' ? 'ملغي' : st}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <button
                          onClick={() => deleteAttendanceRecord(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                          title="حذف هذا السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Attendance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#D99B7F]">تسجيل أو تعديل حضور محاضرة سابقة</h3>
            
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">المادة الدراسية</label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ المحاضرة (اختر أي يوم سابق)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الحالة المطلوبة</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {(['حاضر', 'غائب', 'متأخر', 'تم إلغاء الدرس'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`py-2.5 rounded-xl border transition ${
                        targetStatus === st
                          ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow'
                          : 'bg-[#0F3040] border-[#A56F63]/30 text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A56F63]/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow transition"
                >
                  حفظ وتحديث الحالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
