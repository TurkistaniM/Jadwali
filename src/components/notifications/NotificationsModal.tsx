import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  FileText,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateArabic } from '../../utils/academicCalculations';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification 
  } = useData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0F3040] text-[#D99B7F]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مركز الإشعارات والتنبيهات</h3>
              <p className="text-[11px] text-[#D99B7F]">تنبيهات الغياب، مواعيد الاختبارات، وصرف المكافأة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#0F3040] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-300 px-1 shrink-0">
            <span>لديك {notifications.filter(n => !n.is_read).length} إشعار غير مقروء</span>
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-[#D99B7F] hover:underline font-bold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحديد الكل كمقروء</span>
            </button>
          </div>
        )}

        {/* Notification Items List */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
              <p>لا توجد إشعارات جديدة حالياً.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  notif.is_read
                    ? 'bg-[#0F3040]/50 border-[#A56F63]/20 opacity-75'
                    : 'bg-[#0F3040] border-[#A56F63]/50 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    notif.type === 'absence'
                      ? 'bg-rose-950 text-rose-300'
                      : notif.type === 'scholarship'
                      ? 'bg-emerald-950 text-emerald-300'
                      : notif.type === 'exam'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-[#464858] text-[#D99B7F]'
                  }`}>
                    {notif.type === 'absence' && <AlertTriangle className="w-4 h-4" />}
                    {notif.type === 'scholarship' && <Wallet className="w-4 h-4" />}
                    {notif.type === 'exam' && <FileText className="w-4 h-4" />}
                    {(!notif.type || notif.type === 'system') && <Sparkles className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#A56F63] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {formatDateArabic(notif.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-300 transition shrink-0"
                  title="حذف الإشعار"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#A56F63]/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-white text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
