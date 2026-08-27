import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Clock, 
  MapPin, 
  Calendar, 
  Trash2, 
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateArabic } from '../../utils/academicCalculations';
import { EmptyState } from '../common/EmptyState';

export const ExamsView: React.FC = () => {
  const { exams, courses, addExam, deleteExam } = useData();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examCourseId, setExamCourseId] = useState<string>(courses[0]?.id || '');
  const [examDate, setExamDate] = useState<string>('');
  const [examLocation, setExamLocation] = useState<string>('');

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examCourseId || !examDate) return;

    await addExam({
      title: examTitle.trim(),
      course_id: examCourseId,
      exam_date: new Date(examDate).toISOString(),
      location: examLocation.trim() || 'القاعة المحددة بالجدول',
    });

    setExamTitle('');
    setExamDate('');
    setExamLocation('');
    setIsAddModalOpen(false);
  };

  // Helper for days until exam
  const getDaysUntilExam = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">جدول ومواعيد الاختبارات</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            متابعة مواعيد الاختبارات النصفية والنهائية وقاعات الامتحان والعد التنازلي.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs sm:text-sm font-bold transition shadow-lg shrink-0 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة موعد اختبار</span>
        </button>
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد اختبارات مسجلة حالياً"
          description="أضف مواعيد اختباراتك القادمة لمتابعتها وتلقي إشعارات تنبيهية قبل موعدها."
          actionText="إضافة اختبار جديد"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const course = courses.find(c => c.id === exam.course_id);
            const daysLeft = getDaysUntilExam(exam.exam_date);

            return (
              <div
                key={exam.id}
                className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/30 hover:border-[#D99B7F]/60 transition shadow-xl p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: course?.color_code || '#A56F63' }}
                      />
                      <span className="text-xs font-bold text-slate-300">
                        {course?.course_name || 'مقرر دراسي'}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="p-1 text-slate-400 hover:text-rose-300 transition"
                      title="حذف الاختبار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-white">{exam.title}</h3>

                  <div className="space-y-2 text-xs text-slate-300 bg-[#0F3040]/70 p-3 rounded-2xl border border-[#A56F63]/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D99B7F]" />
                      <span>{formatDateArabic(exam.exam_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D99B7F]" />
                      <span>{exam.location || 'القاعة المحددة'}</span>
                    </div>
                  </div>
                </div>

                {/* Days Left Countdown Indicator */}
                <div className="pt-3 border-t border-[#A56F63]/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-[#D99B7F]" />
                    <span>المتبقي:</span>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    daysLeft <= 3 && daysLeft >= 0
                      ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                      : daysLeft < 0
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-[#0F3040] text-[#D99B7F] border-[#A56F63]/30'
                  }`}>
                    {daysLeft > 0 ? `${daysLeft} أيام متبقية` : daysLeft === 0 ? 'اليوم موعد الاختبار!' : 'انتهى الاختبار'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#D99B7F]">إضافة موعد اختبار جديد</h3>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">عنوان الاختبار *</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: الاختبار النهائي لمقرر هندسة البرمجيات"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">المادة الدراسية *</label>
                <select
                  value={examCourseId}
                  onChange={(e) => setExamCourseId(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ الاختبار *</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">مكان / قاعة الاختبار</label>
                  <input
                    type="text"
                    value={examLocation}
                    onChange={(e) => setExamLocation(e.target.value)}
                    placeholder="مبنى 31 - مسرح الكلية"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
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
                  حفظ الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
