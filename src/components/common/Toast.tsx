import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Toast: React.FC = () => {
  const { serverError, retryFetchData } = useData();
  const [dismissed, setDismissed] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (serverError) {
      setDismissed(false);
    }
  }, [serverError]);

  if (!serverError || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 sm:left-auto sm:right-6 max-w-md bg-[#464858] text-white p-4 rounded-2xl shadow-2xl border-2 border-[#A56F63] flex items-center justify-between gap-3 z-50 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#D99B7F]">تنبيه الاتصال</p>
          <p className="text-xs text-slate-200">{serverError}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => retryFetchData()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#A56F63] hover:bg-[#8E584D] text-xs font-bold transition shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#0F3040]/50 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
