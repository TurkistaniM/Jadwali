import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Course } from '../../types/database';

const DAYS_OF_WEEK = [
  { id: 0, name: 'الأحد', short: 'أحد' },
  { id: 1, name: 'الاثنين', short: 'اثنين' },
  { id: 2, name: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 3, name: 'الأربعاء', short: 'أربعاء' },
  { id: 4, name: 'الخميس', short: 'خميس' },
];

export const ScheduleView: React.FC = () => {
  const { courses } = useData();
  const { profile } = useAuth();

  // Helper to get courses for a specific day based on configured schedule_days
  const getCoursesForDay = (dayId: number): Course[] => {
    return courses.filter((c) => {
      if (c.schedule_days && Array.isArray(c.schedule_days) && c.schedule_days.length > 0) {
        return c.schedule_days.includes(dayId);
      }
      return false;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <Calendar className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">الجدول الدراسي الأسبوعي</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            توزيع المحاضرات الأسبوعية من الأحد إلى الخميس ومواعيد وأماكن القاعات وفق الأيام والأوقات التي اخترتها.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#D99B7F] bg-[#0F3040] px-4 py-2 rounded-2xl border border-[#A56F63]/30">
          <Sparkles className="w-4 h-4" />
          <span>{courses.length} مواد مسجلة هذا الفصل</span>
        </div>
      </div>

      {/* Weekly Schedule Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayCourses = getCoursesForDay(day.id);
          const isToday = new Date().getDay() === day.id;

          return (
            <div
              key={day.id}
              className={`rounded-3xl border-2 transition shadow-lg overflow-hidden flex flex-col ${
                isToday
                  ? 'bg-[#464858] border-[#D99B7F]'
                  : 'bg-[#464858]/80 border-[#A56F63]/30'
              }`}
            >
              {/* Day Header */}
              <div className={`p-4 text-center border-b ${
                isToday
                  ? 'bg-[#A56F63] text-white border-[#D99B7F]/40'
                  : 'bg-[#0F3040] text-slate-200 border-[#A56F63]/30'
              }`}>
                <h3 className="font-bold text-base">{day.name}</h3>
                {isToday && (
                  <span className="text-[10px] font-bold bg-[#0F3040] text-[#D99B7F] px-2 py-0.5 rounded-full inline-block mt-1">
                    اليوم الحالي
                  </span>
                )}
              </div>

              {/* Day Courses List */}
              <div className="p-3 space-y-3 flex-1">
                {dayCourses.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    لا توجد محاضرات
                  </div>
                ) : (
                  dayCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 shadow-inner space-y-2 hover:border-[#D99B7F]/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: c.color_code }}
                        />
                        <h4 className="text-xs font-bold text-white truncate">{c.course_name}</h4>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3 text-[#D99B7F]" />
                          <span>{c.schedule_time || '09:00 - 10:20'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3 h-3 text-[#D99B7F]" />
                          <span>{c.building || 'المبنى'} ({c.room || 'القاعة'})</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{c.instructor_name || 'الدكتور'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
