import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Sparkles,
  FlaskConical
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

interface DayScheduleItem {
  id: string;
  course: Course;
  isLab: boolean;
  time: string;
  building?: string | null;
  room?: string | null;
}

export const ScheduleView: React.FC = () => {
  const { courses } = useData();
  const { profile } = useAuth();

  // Helper to get all lectures and labs for a specific day
  const getScheduleItemsForDay = (dayId: number): DayScheduleItem[] => {
    const items: DayScheduleItem[] = [];

    courses.forEach((c) => {
      // 1. المحاضرة النظرية
      if (c.schedule_days && Array.isArray(c.schedule_days) && c.schedule_days.includes(dayId)) {
        items.push({
          id: `${c.id}-lecture-${dayId}`,
          course: c,
          isLab: false,
          time: c.schedule_time || '09:00 - 10:15',
          building: c.building,
          room: c.room
        });
      }

      // 2. سكشن المعمل / العملي
      if (c.has_lab && c.lab_day === dayId) {
        items.push({
          id: `${c.id}-lab-${dayId}`,
          course: c,
          isLab: true,
          time: c.lab_time || '13:00 - 14:50',
          building: c.lab_building || c.building,
          room: c.lab_room || c.room
        });
      }
    });

    return items;
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
            توزيع المحاضرات الأسبوعية والمعامل من الأحد إلى الخميس ومواعيد وأماكن القاعات.
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
          const dayItems = getScheduleItemsForDay(day.id);
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

              {/* Day Courses / Labs List */}
              <div className="p-3 space-y-3 flex-1">
                {dayItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    لا توجد محاضرات
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border shadow-inner space-y-2 transition ${
                        item.isLab
                          ? 'bg-[#0F3040] border-[#D99B7F]/60'
                          : 'bg-[#0F3040]/80 border-[#A56F63]/30 hover:border-[#D99B7F]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: item.course.color_code }}
                          />
                          <h4 className="text-xs font-bold text-white truncate">{item.course.course_name}</h4>
                        </div>
                        {item.isLab && (
                          <span className="px-1.5 py-0.5 rounded bg-[#A56F63] text-white text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                            <FlaskConical className="w-2.5 h-2.5" />
                            <span>معمل</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3 text-[#D99B7F]" />
                          <span>{item.time}</span>
                        </div>

                        {(item.building || item.room) && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3 h-3 text-[#D99B7F]" />
                            <span>{item.building || ''} {item.room ? `(${item.room})` : ''}</span>
                          </div>
                        )}

                        {!item.isLab && item.course.instructor_name && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{item.course.instructor_name}</span>
                          </div>
                        )}
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
