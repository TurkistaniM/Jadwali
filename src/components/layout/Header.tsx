import React from 'react';
import { 
  GraduationCap, 
  Bell, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  Calendar,
  Wallet,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { calculateNextScholarshipCountdown } from '../../utils/academicCalculations';

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenNotifications: () => void;
  onToggleSidebar: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenNotifications,
  onToggleSidebar,
  onNavigateTab,
}) => {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { unreadNotificationCount } = useData();
  const scholarshipInfo = calculateNextScholarshipCountdown();

  return (
    <header className="sticky top-0 z-40 bg-[#0F3040]/95 backdrop-blur-md border-b border-[#A56F63]/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* جهة اليمين (RTL): اسم الطالب والشعار */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-[#464858] text-[#D99B7F] hover:bg-[#A56F63]/30 transition"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#464858] border border-[#A56F63]/50 flex items-center justify-center text-[#D99B7F] group-hover:scale-105 transition shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl text-white tracking-wide">
                  جَدْوَلي
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A56F63]/30 text-[#D99B7F] border border-[#A56F63]/40">
                  الجامعي
                </span>
              </div>
              {isAuthenticated && profile ? (
                <p className="text-xs text-[#D99B7F] font-semibold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
                  <span>أهلاً، {profile.full_name}</span>
                  <span className="text-slate-400 font-normal">({profile.academic_id})</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">بوابتك الأكاديمية الشاملة</p>
              )}
            </div>
          </div>
        </div>

        {/* المنتصف: اختصار عداد المكافأة السريع (للهواتف والشاشات) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('scholarships')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#464858] border border-[#A56F63]/30 hover:border-[#D99B7F]/60 text-xs text-slate-200 transition group"
            title={scholarshipInfo.adjustmentNote}
          >
            <div className="p-1 rounded-lg bg-[#0F3040] text-[#D99B7F]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">المكافأة القادمة:</span>
              <span className="font-bold text-[#D99B7F]">
                {scholarshipInfo.isToday ? 'يتم الإيداع اليوم 🎉' : `${scholarshipInfo.days} يوم متبقي`}
              </span>
            </div>
          </button>
        </div>

        {/* أقصى اليسار: أزرار الدخول، التسجيل، الإشعارات، وتسجيل الخروج */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* زر الإشعارات */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-[#464858] border border-[#A56F63]/30 hover:border-[#D99B7F]/50 text-slate-200 hover:text-[#D99B7F] transition shadow-sm"
                title="الإشعارات والتنبيهات"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-[#A56F63] text-white rounded-full px-1 border border-[#0F3040] animate-bounce">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* زر الملف الشخصي السريع */}
              <button
                onClick={() => onNavigateTab('profile')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#464858] border border-[#A56F63]/30 hover:border-[#D99B7F]/50 text-xs font-semibold text-slate-200 transition"
              >
                <div className="w-5 h-5 rounded-full bg-[#A56F63] text-white flex items-center justify-center text-[10px] font-bold">
                  {profile?.full_name?.charAt(0) || 'ط'}
                </div>
                <span>ملفي</span>
              </button>

              {/* زر تسجيل الخروج */}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-bold transition shadow-sm active:scale-95"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#464858] hover:bg-[#464858]/80 text-[#D99B7F] border border-[#A56F63]/40 text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold transition shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">إنشاء حساب</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
