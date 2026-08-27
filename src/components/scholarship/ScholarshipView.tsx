import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  Info,
  Building,
  HelpCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { calculateNextScholarshipCountdown, formatDateArabic } from '../../utils/academicCalculations';

export const ScholarshipView: React.FC = () => {
  const { scholarships, updateScholarshipStatus } = useData();
  const { profile } = useAuth();

  const [countdown, setCountdown] = useState(calculateNextScholarshipCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateNextScholarshipCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <Wallet className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">المكافأة الجامعية وسجل الصرف</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            متابعة مواعيد إيداع المكافأة الشهرية بالتقويم المالي وحالات الصرف والاستحقاق.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-[#0F3040] border border-[#A56F63]/40 flex items-center gap-2 text-xs font-bold text-[#D99B7F]">
          <DollarSign className="w-4 h-4" />
          <span>المبلغ الشهري: 1000.00 ريال سعودي</span>
        </div>
      </div>

      {/* Hero Live Countdown Card */}
      <div className="bg-gradient-to-br from-[#464858] to-[#0F3040] rounded-3xl border-2 border-[#A56F63]/50 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A56F63]/30 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/30 inline-block mb-1">
              مكافأة شهر {countdown.monthNameArabic}
            </span>
            <h2 className="text-2xl font-black text-white">
              موعد الصرف القادم: <span className="text-[#D99B7F]">{countdown.formattedTargetDate}</span>
            </h2>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block">الحالة الحالية:</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>مستحقة الصرف</span>
            </span>
          </div>
        </div>

        {/* Big Interactive Timer */}
        {countdown.isToday ? (
          <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2 animate-pulse">
            <p className="text-xl sm:text-2xl font-black text-emerald-300">🎉 يتم إيداع المكافأة الجامعية في الحسابات اليوم!</p>
            <p className="text-xs sm:text-sm text-emerald-200">نتمنى لك دوام التوفيق والنجاح الأكاديمي</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-[#0F3040] p-5 rounded-2xl border border-[#A56F63]/40 shadow-inner">
              <span className="text-3xl sm:text-4xl font-black text-[#D99B7F] block">{countdown.days}</span>
              <span className="text-xs text-slate-300 font-bold mt-1 block">أيام متبقية</span>
            </div>
            <div className="bg-[#0F3040] p-5 rounded-2xl border border-[#A56F63]/40 shadow-inner">
              <span className="text-3xl sm:text-4xl font-black text-white block">{countdown.hours}</span>
              <span className="text-xs text-slate-300 font-bold mt-1 block">ساعات</span>
            </div>
            <div className="bg-[#0F3040] p-5 rounded-2xl border border-[#A56F63]/40 shadow-inner">
              <span className="text-3xl sm:text-4xl font-black text-white block">{countdown.minutes}</span>
              <span className="text-xs text-slate-300 font-bold mt-1 block">دقائق</span>
            </div>
            <div className="bg-[#0F3040] p-5 rounded-2xl border border-[#A56F63]/40 shadow-inner">
              <span className="text-3xl sm:text-4xl font-black text-[#D99B7F] block">{countdown.seconds}</span>
              <span className="text-xs text-slate-300 font-bold mt-1 block">ثواني</span>
            </div>
          </div>
        )}

        {/* PRD Financial Rule Explanation Banner */}
        <div className="p-4 rounded-2xl bg-[#0F3040]/80 border border-[#A56F63]/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#D99B7F] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
            <p className="font-bold text-white">قاعدة الصرف بالتقويم المالي الجامعي:</p>
            <p>
              يتم إيداع المكافأة يوم <b>27</b> من كل شهر ميلادي. وفي حال صادف يوم 27 <b>الجمعة</b> يتم تقديم الصرف إلى يوم <b>الخميس 26</b>، وإذا صادف <b>السبت</b> يتم تأخير الصرف إلى يوم <b>الأحد 28</b>.
            </p>
            <p className="text-[#D99B7F] font-semibold">ملاحظة هذا الشهر: {countdown.adjustmentNote}.</p>
          </div>
        </div>
      </div>

      {/* Historical Ledger Table (PRD Table 6: scholarships) */}
      <div className="bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#A56F63]/30 pb-3">
          <Clock className="w-4 h-4 text-[#D99B7F]" />
          <span>سجل المكافآت والحوالات السابقة</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#A56F63]/30 text-[#D99B7F]">
                <th className="py-3 px-4 font-bold">شهر الاستحقاق</th>
                <th className="py-3 px-4 font-bold">تاريخ الإيداع الفعلي</th>
                <th className="py-3 px-4 font-bold">المبلغ</th>
                <th className="py-3 px-4 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A56F63]/20">
              {scholarships.map((s) => (
                <tr key={s.id} className="hover:bg-[#0F3040]/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {formatDateArabic(s.month_year)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {s.disbursement_date ? formatDateArabic(s.disbursement_date) : '27 من الشهر'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#D99B7F]">
                    {Number(s.amount).toFixed(2)} ر.س
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                      s.status === 'تم الصرف'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : s.status === 'مستحقة'
                        ? 'bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {s.status === 'تم الصرف' && <CheckCircle2 className="w-3 h-3" />}
                      {s.status === 'مستحقة' && <Clock className="w-3 h-3" />}
                      {s.status === 'موقوفة' && <AlertCircle className="w-3 h-3" />}
                      <span>{s.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
