import React from 'react';
import { 
  Home, 
  User, 
  BookOpen, 
  Calendar, 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  FileText,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../../types/database';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { courses, tasks, importantTasks, exams } = useData();
  const { profile } = useAuth();

  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'الرئيسية',
      icon: Home,
      badge: null,
    },
    {
      id: 'profile' as ActiveTab,
      label: 'الملف الشخصي',
      icon: User,
      badge: profile?.gpa_value ? `${profile.gpa_value}` : null,
    },
    {
      id: 'courses' as ActiveTab,
      label: 'المواد الدراسية',
      icon: BookOpen,
      badge: courses.length > 0 ? `${courses.length}` : null,
    },
    {
      id: 'schedule' as ActiveTab,
      label: 'الجدول الأسبوعي',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'attendance' as ActiveTab,
      label: 'لوحة التحكم والغياب',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'المهام الأكاديمية',
      icon: CheckSquare,
      badge: importantTasks.filter(t => !t.is_completed).length > 0 
        ? `${importantTasks.filter(t => !t.is_completed).length} مهمة` 
        : null,
    },
    {
      id: 'exams' as ActiveTab,
      label: 'جدول الاختبارات',
      icon: FileText,
      badge: exams.length > 0 ? `${exams.length}` : null,
    },
    {
      id: 'scholarships' as ActiveTab,
      label: 'المكافأة الجامعية',
      icon: Wallet,
      badge: '27 من الشهر',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (جهة اليمين RTL) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 lg:static lg:z-0 w-72 bg-[#464858] text-slate-100 flex flex-col border-l border-[#A56F63]/30 shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header (Mobile close + Title) */}
        <div className="p-5 flex items-center justify-between border-b border-[#A56F63]/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">جَدْوَلي الأكاديمي</h2>
              <p className="text-[11px] text-[#D99B7F]">منصة الطالب الجامعي الشاملة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0F3040]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Quick Profile Card in Sidebar */}
        {profile && (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A56F63] text-white flex items-center justify-center font-black text-sm shadow">
                {profile.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{profile.full_name}</p>
                <p className="text-[10px] text-[#D99B7F] truncate">{profile.major}</p>
                <p className="text-[10px] text-slate-400">{profile.university}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#A56F63] text-white shadow-md'
                    : 'text-slate-200 hover:bg-[#0F3040]/60 hover:text-[#D99B7F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition ${isActive ? 'text-white' : 'text-[#D99B7F] group-hover:scale-110'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#0F3040] text-[#D99B7F]'
                        : 'bg-[#0F3040]/80 text-slate-300 border border-[#A56F63]/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Security & System Info in Sidebar */}
        <div className="p-4 border-t border-[#A56F63]/30 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RLS حماية وعزل البيانات نشط</span>
          </div>
          <p className="text-[10px] text-slate-400">
            {profile?.term_start_date ? `الترم: من ${profile.term_start_date}` : 'الفصل الدراسي الحالي'}
          </p>
        </div>
      </aside>
    </>
  );
};
