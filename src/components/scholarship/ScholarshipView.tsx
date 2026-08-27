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
  Edit3,
  Plus,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { calculateNextScholarshipCountdown, formatDateArabic } from '../../utils/academicCalculations';
import { Scholarship } from '../../types/database';

export const ScholarshipView: React.FC = () => {
  const { 
    scholarships, 
    monthlyScholarshipAmount, 
    setMonthlyScholarshipAmount,
    addScholarship,
    updateScholarshipStatus,
    deleteScholarship 
  } = useData();
  const { profile } = useAuth();

  const [countdown, setCountdown] = useState(calculateNextScholarshipCountdown());

  // Modal State for Editing Monthly Amount
  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>(monthlyScholarshipAmount.toString());

  // Modal State for Adding a new scholarship ledger entry
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryAmount, setEntryAmount] = useState<string>(monthlyScholarshipAmount.toString());
  const [entryStatus, setEntryStatus] = useState<Scholarship['status']>('تم الصرف');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateNextScholarshipCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveMonthlyAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(customAmount) || 990;
    setMonthlyScholarshipAmount(num);
    setIsAmountModalOpen(false);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    await addScholarship({
      disbursement_date: entryDate,
      amount: parseFloat(entryAmount) || monthlyScholarshipAmount,
      status: entryStatus
    });
    setIsAddEntryModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D99B7F]">
            <Wallet className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-black text-white">المكافأة الجامعية وسجل الصرف</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            تخصيص مبلغ المكافأة، متابعة العداد التنازلي لموعد الإيداع، وإدارة سجل الحوالات السابقة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCustomAmount(monthlyScholarshipAmount.toString());
              setIsAmountModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-[#D99B7F] border border-[#A56F63]/50 text-xs font-bold transition shadow"
            title="تعديل قيمة المكافأة الشهرية"
          >
            <Edit3 className="w-4 h-4" />
            <span>المبلغ الشهري: {monthlyScholarshipAmount.toLocaleString()} ر.س</span>
          </button>

          <button
            onClick={() => {
              setEntryAmount(monthlyScholarshipAmount.toString());
              setEntryDate(new Date().toISOString().split('T')[0]);
              setIsAddEntryModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold transition shadow shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حوالة للسجل</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Live Countdown Card */}
      <div className="bg-gradient-to-br from-[#464858] to-[#0F3040] rounded-3xl border-2 border-[#A56F63]/50 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A56F63]/30 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/30 inline-block mb-1">
              مكافأة شهر {countdown.monthNameArabic} • {monthlyScholarshipAmount.toLocaleString()} ريال
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
            <p className="text-xl sm:text-2xl font-black text-emerald-300">🎉 يتم إيداع المكافأة الجامعية ({monthlyScholarshipAmount} ر.س) في الحسابات اليوم!</p>
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

        {/* Financial Rule Explanation Banner */}
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

      {/* 3. Historical Ledger Table with Custom Entries & Status Changer */}
      <div className="bg-[#464858] rounded-3xl border border-[#A56F63]/30 p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A56F63]/30 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D99B7F]" />
            <span>سجل المكافآت والحوالات المودعة</span>
          </h3>

          <span className="text-xs text-slate-400">
            ({scholarships.length} سجلات مسجلة)
          </span>
        </div>

        {scholarships.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-[#0F3040]/40 rounded-2xl border border-[#A56F63]/20">
            <Wallet className="w-10 h-10 text-[#D99B7F] mx-auto opacity-70" />
            <p className="text-xs text-slate-300">لم تقم بإضافة سجلات صرف سابقة بعد.</p>
            <button
              onClick={() => setIsAddEntryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#A56F63] text-white text-xs font-bold"
            >
              إضافة أول سجل صرف
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#A56F63]/30 text-[#D99B7F]">
                  <th className="py-3 px-4 font-bold">تاريخ الإيداع</th>
                  <th className="py-3 px-4 font-bold">المبلغ</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold text-center">تغيير الحالة</th>
                  <th className="py-3 px-4 font-bold text-left">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A56F63]/20">
                {scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-[#0F3040]/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatDateArabic(s.disbursement_date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#D99B7F]">
                      {Number(s.amount).toFixed(2)} ر.س
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                        s.status === 'تم الصرف'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : s.status === 'قيد الانتظار'
                          ? 'bg-[#0F3040] text-[#D99B7F] border border-[#A56F63]/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {s.status === 'تم الصرف' && <CheckCircle2 className="w-3 h-3" />}
                        {s.status === 'قيد الانتظار' && <Clock className="w-3 h-3" />}
                        {s.status === 'معلقة' && <AlertCircle className="w-3 h-3" />}
                        <span>{s.status}</span>
                      </span>
                    </td>

                    {/* Fast Status Switcher */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-[#0F3040] p-1 rounded-xl border border-[#A56F63]/30">
                        {(['تم الصرف', 'قيد الانتظار', 'معلقة'] as Scholarship['status'][]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateScholarshipStatus(s.id, st)}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                              s.status === st
                                ? 'bg-[#A56F63] text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-left">
                      <button
                        onClick={() => deleteScholarship(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                        title="حذف هذا السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Edit Monthly Scholarship Amount */}
      {isAmountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-3">
              <h3 className="text-base font-bold text-[#D99B7F]">تعديل مبلغ المكافأة الشهرية</h3>
              <button
                onClick={() => setIsAmountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  المبلغ الشهري المستحق (بالريال السعودي)
                </label>
                <input
                  type="number"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="990"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-4 py-3 text-sm text-white font-bold outline-hidden"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-300 font-semibold block">خيارات سريعة حسب التخصص:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCustomAmount('990')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      customAmount === '990'
                        ? 'bg-[#A56F63] border-[#D99B7F] text-white'
                        : 'bg-[#0F3040] border-[#A56F63]/30 text-slate-300'
                    }`}
                  >
                    990 ر.س
                    <span className="block text-[9px] font-normal text-slate-300">علمي / هندسي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomAmount('840')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      customAmount === '840'
                        ? 'bg-[#A56F63] border-[#D99B7F] text-white'
                        : 'bg-[#0F3040] border-[#A56F63]/30 text-slate-300'
                    }`}
                  >
                    840 ر.س
                    <span className="block text-[9px] font-normal text-slate-300">أدبي / إداري</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomAmount('1000')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      customAmount === '1000'
                        ? 'bg-[#A56F63] border-[#D99B7F] text-white'
                        : 'bg-[#0F3040] border-[#A56F63]/30 text-slate-300'
                    }`}
                  >
                    1000 ر.س
                    <span className="block text-[9px] font-normal text-slate-300">تحضيري / صحي</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A56F63]/30">
                <button
                  type="button"
                  onClick={() => setIsAmountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow"
                >
                  حفظ المبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Scholarship Ledger Entry */}
      {isAddEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63] p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#A56F63]/30 pb-3">
              <h3 className="text-base font-bold text-[#D99B7F]">إضافة سجل إيداع مكافأة</h3>
              <button
                onClick={() => setIsAddEntryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ الإيداع</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">المبلغ المودع (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">حالة الصرف</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['تم الصرف', 'قيد الانتظار', 'معلقة'] as Scholarship['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEntryStatus(st)}
                      className={`py-2.5 rounded-xl border transition ${
                        entryStatus === st
                          ? 'bg-[#A56F63] border-[#D99B7F] text-white shadow'
                          : 'bg-[#0F3040] border-[#A56F63]/30 text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A56F63]/30">
                <button
                  type="button"
                  onClick={() => setIsAddEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow"
                >
                  إضافة السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
