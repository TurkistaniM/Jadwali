import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Calendar, 
  Star, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateArabic } from '../../utils/academicCalculations';
import { EmptyState } from '../common/EmptyState';

export const TasksView: React.FC = () => {
  const { 
    tasks, 
    courses, 
    addTask, 
    toggleTaskCompletion, 
    toggleTaskImportance, 
    deleteTask 
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'all' | 'important' | 'regular' | 'completed'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState<string>(courses[0]?.id || '');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskIsImportant, setTaskIsImportant] = useState<boolean>(false);

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'important' && !t.is_important) return false;
    if (activeFilter === 'regular' && t.is_important) return false;
    if (activeFilter === 'completed' && !t.is_completed) return false;
    if (courseFilter !== 'all' && t.course_id !== courseFilter) return false;
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle.trim(),
      course_id: taskCourseId || null,
      due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      is_important: taskIsImportant,
      is_completed: false,
    });

    setTaskTitle('');
    setTaskDueDate('');
    setTaskIsImportant(false);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <CheckSquare className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">إدارة المهام والواجبات الأكاديمية</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            تصنيف المهام بين "المهمة" (تظهر في الرئيسية) و"العامة" لكل مادة لمتابعة الإنجاز بدقة.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs sm:text-sm font-bold transition shadow-lg shrink-0 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#464858] p-4 rounded-2xl border border-[#A56F63]/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-[#A56F63] text-white shadow'
                : 'bg-[#0F3040] text-slate-300 hover:text-white'
            }`}
          >
            كافة المهام ({tasks.length})
          </button>

          <button
            onClick={() => setActiveFilter('important')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === 'important'
                ? 'bg-[#A56F63] text-white shadow'
                : 'bg-[#0F3040] text-[#D99B7F] hover:bg-[#0F3040]/80'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>المهام المهمة ({tasks.filter(t => t.is_important).length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('regular')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'regular'
                ? 'bg-[#A56F63] text-white shadow'
                : 'bg-[#0F3040] text-slate-300 hover:text-white'
            }`}
          >
            مهام المواد العامة ({tasks.filter(t => !t.is_important).length})
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'completed'
                ? 'bg-[#A56F63] text-white shadow'
                : 'bg-[#0F3040] text-slate-300 hover:text-white'
            }`}
          >
            المكتملة ({tasks.filter(t => t.is_completed).length})
          </button>
        </div>

        {/* Filter by Course */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">تصفية حسب المادة:</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3 py-1.5 text-xs text-white outline-hidden"
          >
            <option value="all">كافة المواد</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="لا توجد مهام مطابقة حالياً"
          description="يمكنك إضافة مهام أكاديمية وربطها بالمواد الدراسية وتحديد موعد التسليم."
          actionText="إضافة مهمة جديدة"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const course = courses.find(c => c.id === task.course_id);

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  task.is_completed
                    ? 'bg-[#464858]/50 border-emerald-500/30 opacity-75'
                    : 'bg-[#464858] border-[#A56F63]/40 hover:border-[#D99B7F]/60'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`w-6 h-6 rounded-xl border flex items-center justify-center transition shrink-0 ${
                      task.is_completed
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-[#A56F63] hover:border-[#D99B7F] text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-white leading-relaxed ${
                      task.is_completed ? 'line-through text-slate-400' : ''
                    }`}>
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-300">
                      {course && (
                        <span 
                          className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] text-white flex items-center gap-1"
                          style={{ backgroundColor: course.color_code }}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{course.course_name}</span>
                        </span>
                      )}

                      {task.due_date && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-[#D99B7F]" />
                          <span>{formatDateArabic(task.due_date)}</span>
                        </span>
                      )}

                      {task.is_important ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#A56F63]/30 text-[#D99B7F] font-bold text-[10px] border border-[#A56F63]/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>مهمة (تظهر في الرئيسية)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#0F3040] text-slate-400 text-[10px]">
                          داخل المادة فقط
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleTaskImportance(task.id)}
                    className={`p-2 rounded-xl border transition ${
                      task.is_important
                        ? 'bg-[#0F3040] text-[#D99B7F] border-[#A56F63]'
                        : 'bg-[#0F3040] text-slate-400 border-transparent hover:text-white'
                    }`}
                    title={task.is_important ? 'إلغاء التمييز كمهمة' : 'تمييز كمهمة رئيسية عاجلة'}
                  >
                    <Star className={`w-4 h-4 ${task.is_important ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-[#D99B7F]">إضافة مهمة أكاديمية جديدة</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">عنوان المهمة أو الواجب *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="مثال: تسليم المشروع النهائي لمقرر الذكاء الاصطناعي"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">المادة الدراسية المرتبطة</label>
                  <select
                    value={taskCourseId}
                    onChange={(e) => setTaskCourseId(e.target.value)}
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  >
                    <option value="">بدون مادة محددة (عامة)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.course_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">موعد التسليم النهائي</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Importance Checkbox (PRD 5.3 requirement) */}
              <div className="p-3.5 rounded-2xl bg-[#0F3040]/70 border border-[#A56F63]/30 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="taskImportant"
                  checked={taskIsImportant}
                  onChange={(e) => setTaskIsImportant(e.target.checked)}
                  className="mt-0.5 accent-[#A56F63] w-4 h-4"
                />
                <label htmlFor="taskImportant" className="text-xs cursor-pointer space-y-0.5">
                  <span className="font-bold text-white block">تصنيف المهمة كـ "مهمة عاجلة"</span>
                  <span className="text-slate-300 text-[11px] block">
                    المهام المهمة تظهر مباشرة في الصفحة الرئيسية ولوحة المتابعة، والمهام العادية تظهر فقط داخل صفحة المادة.
                  </span>
                </label>
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
                  إضافة المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
