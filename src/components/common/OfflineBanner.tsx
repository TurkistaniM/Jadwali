import React from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOfflineStatus();

  if (isOnline && !wasOffline) return null;

  if (isOnline && wasOffline) {
    return (
      <div className="bg-emerald-700 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-500 shadow-md sticky top-0 z-50 animate-fade-in">
        <Wifi className="w-4 h-4" />
        <span>تم استعادة الاتصال بالإنترنت بنجاح! يتم مزامنة البيانات تلقائياً.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#A56F63] text-white px-4 py-2.5 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg sticky top-0 z-50 border-b border-[#D99B7F]/40 animate-pulse-glow">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>تنبيه: انقطع الاتصال بالإنترنت! يعمل النظام في وضع عدم الاتصال (Offline) ويتم حفظ تعديلاتك محلياً.</span>
      <span className="hidden md:inline-block bg-[#0F3040]/50 px-2 py-0.5 rounded text-[11px] text-amber-100 mr-2">
        حفظ تلقائي محلي
      </span>
    </div>
  );
};
