import React, { useState, useEffect } from 'react';
import { 
  User, 
  Hash, 
  Building2, 
  BookOpen, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Edit3, 
  Sparkles,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GpaType } from '../../types/database';
import { formatGpaDisplay, formatDateArabic } from '../../utils/academicCalculations';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [academicId, setAcademicId] = useState(profile?.academic_id || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [gpaType, setGpaType] = useState<GpaType>(profile?.gpa_type || '5');
  const [gpaValue, setGpaValue] = useState<string>(profile?.gpa_value?.toString() || '4.50');
  const [termStartDate, setTermStartDate] = useState(profile?.term_start_date || '2026-08-01');
  const [termEndDate, setTermEndDate] = useState(profile?.term_end_date || '2026-12-25');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // مزامنة الحقول عند تغير الملف الشخصي
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAcademicId(profile.academic_id || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setGpaType(profile.gpa_type || '5');
      setGpaValue(profile.gpa_value?.toString() || '4.50');
      setTermStartDate(profile.term_start_date || '2026-08-01');
      setTermEndDate(profile.term_end_date || '2026-12-25');
    }
  }, [profile]);

  const openEdit = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAcademicId(profile.academic_id || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setGpaType(profile.gpa_type || '5');
      setGpaValue(profile.gpa_value?.toString() || '4.50');
      setTermStartDate(profile.term_start_date || '2026-08-01');
      setTermEndDate(profile.term_end_date || '2026-12-25');
    }
    setIsEditing(true);
  };

  const gpaInfo = profile ? formatGpaDisplay(Number(gpaValue) || profile.gpa_value, gpaType) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const success = await updateProfile({
      full_name: fullName.trim(),
      academic_id: academicId.trim(),
      university: university.trim(),
      major: major.trim(),
      gpa_type: gpaType,
      gpa_value: parseFloat(gpaValue) || 4.5,
      term_start_date: termStartDate,
      term_end_date: termEndDate,
    });

    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Profile Header Card */}
      <div className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/40 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0F3040] to-[#A56F63] border-2 border-[#D99B7F] flex items-center justify-center text-white text-3xl font-black shadow-2xl shrink-0">
            {profile?.full_name?.charAt(0) || 'ط'}
          </div>

          <div className="space-y-2 text-center sm:text-right flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-white">{profile?.full_name || 'طالب جامعي'}</h1>
                <p className="text-sm text-[#D99B7F] font-semibold mt-0.5">{profile?.major || 'تخصصك الدراسي'}</p>
              </div>

              {!isEditing && (
                <button
                  onClick={openEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-[#D99B7F] border border-[#A56F63]/40 text-xs font-bold transition shadow"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل البيانات الأكاديمية</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300">
              {profile?.university || 'جامعتك'} • الرقم الجامعي: <span className="font-mono text-white font-bold">{profile?.academic_id || '---'}</span>
            </p>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم حفظ وتحديث بيانات الملف الشخصي بنجاح دائم!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GPA & Term Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GPA Meter Card */}
        <div className="bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D99B7F]" />
              <span>المعدل التراكمي ونظام التقييم</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0F3040] text-[#D99B7F]">
              {gpaInfo?.label}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white">{gpaInfo?.display}</span>
            <span className="text-xs text-emerald-400 font-bold">مرتبة الشرف ⭐</span>
          </div>

          <div className="w-full bg-[#0F3040] h-3 rounded-full overflow-hidden p-0.5 border border-[#A56F63]/30">
            <div 
              className="h-full bg-gradient-to-r from-[#A56F63] to-[#D99B7F] rounded-full transition-all duration-500"
              style={{ width: `${gpaInfo?.percentage || 90}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300">
            نظام المعدل المسجل: {profile?.gpa_type === '5' ? 'نظام الـ 5 نقاط' : profile?.gpa_type === '4' ? 'نظام الـ 4 نقاط' : 'نظام النسبة المئوية %'}
          </p>
        </div>

        {/* Term Dates Card */}
        <div className="bg-[#464858] p-6 rounded-3xl border border-[#A56F63]/30 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D99B7F]" />
            <span>الفترة الزمنية للفصل الدراسي</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-200">
            <div className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 flex items-center justify-between">
              <span className="text-slate-400">تاريخ بداية الترم:</span>
              <span className="font-bold text-white">{formatDateArabic(profile?.term_start_date)}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 flex items-center justify-between">
              <span className="text-slate-400">تاريخ نهاية الترم:</span>
              <span className="font-bold text-white">{formatDateArabic(profile?.term_end_date)}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#D99B7F]">
            * تعتمد خوارزمية حساب الغياب على تاريخ بداية الترم لحساب المحاضرات المنقضية بدقة.
          </p>
        </div>

      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-[#464858] rounded-3xl border-2 border-[#A56F63] p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up">
          <h2 className="text-lg font-bold text-[#D99B7F] border-b border-[#A56F63]/30 pb-3">
            تعديل البيانات الأكاديمية والتواريخ
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الرقم الجامعي</label>
                <input
                  type="text"
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الجامعة</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">التخصص</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">نظام المعدل</label>
                <select
                  value={gpaType}
                  onChange={(e) => setGpaType(e.target.value as GpaType)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                >
                  <option value="5">من 5.00</option>
                  <option value="4">من 4.00</option>
                  <option value="100">مئوي % (100)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">قيمة المعدل</label>
                <input
                  type="number"
                  step="0.01"
                  value={gpaValue}
                  onChange={(e) => setGpaValue(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ بداية الترم</label>
                <input
                  type="date"
                  value={termStartDate}
                  onChange={(e) => setTermStartDate(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ نهاية الترم</label>
                <input
                  type="date"
                  value={termEndDate}
                  onChange={(e) => setTermEndDate(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#A56F63]/30">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold shadow-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
