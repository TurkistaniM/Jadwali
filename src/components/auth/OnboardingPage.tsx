import React, { useState } from "react";
import {
  GraduationCap, User, Hash, Mail, Building2, BookOpen,
  TrendingUp, Calendar, AlertCircle, ArrowLeft, Sparkles, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { GpaType } from "../../types/database";

export const OnboardingPage: React.FC = () => {
  const { user, profile, completeOnboarding, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [academicId, setAcademicId] = useState(profile?.academic_id || "");
  const [university, setUniversity] = useState(profile?.university || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gpaType, setGpaType] = useState<GpaType>(profile?.gpa_type || "5");
  const [gpaValue, setGpaValue] = useState(profile?.gpa_value ? String(profile.gpa_value) : "");
  const [termStartDate, setTermStartDate] = useState(profile?.term_start_date || "2026-08-23");
  const [termEndDate, setTermEndDate] = useState(profile?.term_end_date || "2026-12-17");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gpaMax = gpaType === "4" ? 4 : gpaType === "5" ? 5 : 100;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "الاسم الكامل مطلوب";
    if (!academicId.trim()) errs.academicId = "الرقم الجامعي مطلوب";
    if (!university.trim()) errs.university = "اسم الجامعة مطلوب";
    if (!major.trim()) errs.major = "التخصص مطلوب";
    const gpaNum = parseFloat(gpaValue);
    if (!gpaValue || isNaN(gpaNum) || gpaNum < 0 || gpaNum > gpaMax) {
      errs.gpaValue = `المعدل يجب ان يكون بين 0 و ${gpaMax}`;
    }
    if (!termStartDate) errs.termStartDate = "تاريخ بداية الفصل مطلوب";
    if (!termEndDate) errs.termEndDate = "تاريخ نهاية الفصل مطلوب";
    if (termStartDate && termEndDate && termEndDate <= termStartDate) {
      errs.termEndDate = "تاريخ النهاية يجب ان يكون بعد تاريخ البداية";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    const result = await completeOnboarding({
      full_name: fullName.trim(),
      academic_id: academicId.trim(),
      university: university.trim(),
      major: major.trim(),
      gpa_type: gpaType,
      gpa_value: parseFloat(gpaValue),
      term_start_date: termStartDate,
      term_end_date: termEndDate,
    });
    setIsSubmitting(false);
    if (!result.success) setSubmitError(result.error || "حدث خطا ما");
  };

  const isAcademicIdConflict = submitError?.includes("مرتبط بحساب");

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 bg-[#0F3040] animate-fade-in" dir="rtl">
      <div className="w-full max-w-xl space-y-6">

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-3xl bg-[#464858] border-2 border-[#A56F63]/50 text-[#D99B7F] shadow-xl">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white">اكمل ملفك الشخصي</h1>
            <p className="text-sm text-[#D99B7F] font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              خطوة اخيرة لبدء استخدام جدولي
            </p>
            <p className="text-xs text-slate-300 max-w-sm mx-auto pt-1">
              هذه البيانات ضرورية لحساب نسبة الغياب المنقضية وعداد المكافاة بشكل صحيح.
            </p>
          </div>
        </div>

        {user?.email && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#464858]/60 border border-[#A56F63]/20 text-xs text-slate-300">
            <Mail className="w-3.5 h-3.5 text-[#D99B7F] shrink-0" />
            <span>الحساب المرتبط:</span>
            <span className="font-bold text-white truncate">{user.email}</span>
          </div>
        )}

        <div className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/50 p-6 sm:p-8 shadow-2xl">

          {isAcademicIdConflict && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-200">الرقم الجامعي مرتبط بحساب آخر</p>
                  <p className="text-xs text-rose-300">
                    الرقم الجامعي <span className="font-bold text-white">{academicId}</span> مسجل مع حساب آخر في المنصة.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-rose-500/30 space-y-1.5 text-xs text-rose-200">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  هل سبق ان سجلت بايميل آخر؟ سجل الخروج وادخل بالحساب الاول.
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  اذا كان هناك خطأ، تواصل مع المطور لحل المشكلة.
                </p>
              </div>
            </div>
          )}

          {submitError && !isAcademicIdConflict && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 flex items-center gap-2 text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D99B7F]" />
                  الاسم الكامل *
                </span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({ ...p, fullName: "" })); }}
                placeholder="مثال: عبدالله محمد الشهري"
                className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-hidden transition"
              />
              {fieldErrors.fullName && (
                <p className="text-[11px] text-rose-300 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#D99B7F]" />
                  الرقم الجامعي *
                  <span className="text-[10px] text-slate-400 font-normal">(فريد لكل طالب)</span>
                </span>
              </label>
              <input
                type="text"
                value={academicId}
                onChange={(e) => { setAcademicId(e.target.value); setFieldErrors(p => ({ ...p, academicId: "" })); setSubmitError(null); }}
                placeholder="مثال: 44100234"
                className={"w-full bg-[#0F3040] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-hidden transition " + (fieldErrors.academicId || isAcademicIdConflict ? "border-rose-500/70" : "border-[#A56F63]/50 focus:border-[#D99B7F]")}
              />
              {fieldErrors.academicId && (
                <p className="text-[11px] text-rose-300 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.academicId}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#D99B7F]" />الجامعة *
                  </span>
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => { setUniversity(e.target.value); setFieldErrors(p => ({ ...p, university: "" })); }}
                  placeholder="جامعة الملك عبدالعزيز"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-hidden transition"
                />
                {fieldErrors.university && <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.university}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#D99B7F]" />التخصص *
                  </span>
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => { setMajor(e.target.value); setFieldErrors(p => ({ ...p, major: "" })); }}
                  placeholder="هندسة البرمجيات"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-hidden transition"
                />
                {fieldErrors.major && <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.major}</p>}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-3">
              <p className="text-[11px] font-bold text-[#D99B7F] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />المعدل التراكمي
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">نظام المعدل</label>
                  <select
                    value={gpaType}
                    onChange={(e) => { setGpaType(e.target.value as GpaType); setGpaValue(""); }}
                    className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  >
                    <option value="5">من 5.00 (الجامعات السعودية)</option>
                    <option value="4">من 4.00 (نظام 4 نقاط)</option>
                    <option value="100">مئوي % (100)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">قيمة المعدل (0 - {gpaMax})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={gpaMax}
                    value={gpaValue}
                    onChange={(e) => { setGpaValue(e.target.value); setFieldErrors(p => ({ ...p, gpaValue: "" })); }}
                    placeholder={gpaType === "100" ? "85" : gpaType === "4" ? "3.80" : "4.50"}
                    className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.gpaValue && <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.gpaValue}</p>}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-3">
              <p className="text-[11px] font-bold text-[#D99B7F] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />تواريخ الفصل الدراسي (لحساب الغياب المنقضي)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">بداية الفصل *</label>
                  <input
                    type="date"
                    value={termStartDate}
                    onChange={(e) => { setTermStartDate(e.target.value); setFieldErrors(p => ({ ...p, termStartDate: "" })); }}
                    className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.termStartDate && <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.termStartDate}</p>}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">نهاية الفصل *</label>
                  <input
                    type="date"
                    value={termEndDate}
                    onChange={(e) => { setTermEndDate(e.target.value); setFieldErrors(p => ({ ...p, termEndDate: "" })); }}
                    className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.termEndDate && <p className="text-[11px] text-rose-300 mt-1">{fieldErrors.termEndDate}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <span>حفظ المعلومات والبدء</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            تسجيل الخروج واستخدام حساب آخر
          </button>
        </div>

      </div>
    </div>
  );
};