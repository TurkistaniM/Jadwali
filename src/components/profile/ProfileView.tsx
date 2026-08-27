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
  Save,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GpaType } from '../../types/database';
import { formatGpaDisplay, formatDateArabic } from '../../utils/academicCalculations';

const DEFAULT_TERM_START = '2026-08-23';
const DEFAULT_TERM_END = '2026-12-17';

export const ProfileView: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [academicId, setAcademicId] = useState(profile?.academic_id || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [gpaType, setGpaType] = useState<GpaType>(profile?.gpa_type || '5');
  const [gpaValue, setGpaValue] = useState<string>(
    profile?.gpa_value !== undefined && profile?.gpa_value !== null && profile.gpa_value > 0
      ? profile.gpa_value.toString() 
      : ''
  );
  const [termStartDate, setTermStartDate] = useState(profile?.term_start_date || DEFAULT_TERM_START);
  const [termEndDate, setTermEndDate] = useState(profile?.term_end_date || DEFAULT_TERM_END);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // مزامنة الحقول عند تغير الملف الشخصي
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAcademicId(profile.academic_id || '');
      setEmail(profile.email || user?.email || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setGpaType(profile.gpa_type || '5');
      setGpaValue(
        profile.gpa_value !== undefined && profile.gpa_value !== null && profile.gpa_value > 0
          ? profile.gpa_value.toString()
          : ''
      );
      setTermStartDate(profile.term_start_date || DEFAULT_TERM_START);
      setTermEndDate(profile.term_end_date || DEFAULT_TERM_END);
    }
  }, [profile, user]);

  const openEdit = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAcademicId(profile.academic_id || '');
      setEmail(profile.email || user?.email || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setGpaType(profile.gpa_type || '5');
      setGpaValue(
        profile.gpa_value !== undefined && profile.gpa_value !== null && profile.gpa_value > 0
          ? profile.gpa_value.toString()
          : ''
      );
      setTermStartDate(profile.term_start_date || DEFAULT_TERM_START);
      setTermEndDate(profile.term_end_date || DEFAULT_TERM_END);
    }
    setIsEditing(true);
  };

  const parsedNumericGpa = gpaValue.trim() !== '' && !isNaN(Number(gpaValue)) ? Number(gpaValue) : (profile?.gpa_value || 0);
  const gpaInfo = formatGpaDisplay(parsedNumericGpa, gpaType);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const numericGpa = gpaValue.trim() !== '' && !isNaN(Number(gpaValue)) ? parseFloat(gpaValue) : 0;

    const success = await updateProfile({
      full_name: fullName.trim(),
      academic_id: academicId.trim(),
      email: email.trim(),
      university: university.trim(),
      major: major.trim(),
      gpa_type: gpaType,
      gpa_value: numericGpa,
      term_start_date: termStartDate.trim() || DEFAULT_TERM_START,
      term_end_date: termEndDate.trim() || DEFAULT_TERM_END,
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
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'ط'}
          </div>

          <div className="space-y-2 text-center sm:text-right flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-white">{profile?.full_name || 'طالب جامعي'}</h1>
                <p className="text-sm text-[#D99B7F] font-semibold mt-0.5">{profile?.major || 'لم يتم تحديد التخصص بعد'}</p>
              </div>

              {!isEditing && (
                <button
                  onClick={openEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3040] hover:bg-[#0F3040]/80 text-[#D99B7F] border border-[#A56F63]/40 text-xs font-bold transition shadow cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل البيانات الأكاديمية</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-3 text-xs text-slate-300">
              <span>{profile?.university || 'لم تحدد الجامعة'}</span>
              <span>•</span>
              <span>الرقم الجامعي: <b className="font-mono text-white">{profile?.academic_id || '---'}</b></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#D99B7F]" />
                <span className="font-mono text-white font-medium">{profile?.email || user?.email || 'لم يتم تسجيل البريد الإلكتروني'}</span>
              </span>
            </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* المعدل */}
        <div className="bg-[#464858] rounded-2xl border border-[#A56F63]/40 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Award className="w-4 h-4 text-[#D99B7F]" />
              <span>المعدل</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#0F3040] text-[#D99B7F] font-bold border border-[#A56F63]/30">
              {profile?.gpa_type === '100' ? 'نظام مئوي' : `نظام ${profile?.gpa_type || '5'}`}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white font-mono">
              {profile?.gpa_value && profile.gpa_value > 0 ? profile.gpa_value.toFixed(2) : 'لم يُحدد'}
            </span>
            <span className="text-xs text-slate-300 font-semibold">{gpaInfo.label}</span>
          </div>

          <div className="w-full bg-[#0F3040] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#A56F63]/30">
            <div 
              className="bg-gradient-to-l from-[#D99B7F] to-[#A56F63] h-full rounded-full transition-all duration-500"
              style={{ width: `${gpaInfo.percentage}%` }}
            />
          </div>
        </div>

        {/* الفصل الدراسي والتواريخ الافتراضية */}
        <div className="bg-[#464858] rounded-2xl border border-[#A56F63]/40 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Calendar className="w-4 h-4 text-[#D99B7F]" />
            <span>الفصل الدراسي الحالي</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-[#0F3040] border border-[#A56F63]/30">
              <span className="text-slate-400 block text-[10px] mb-1">بداية الفصل الدراسي</span>
              <b className="text-white font-mono">{formatDateArabic(profile?.term_start_date || DEFAULT_TERM_START)}</b>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0F3040] border border-[#A56F63]/30">
              <span className="text-slate-400 block text-[10px] mb-1">نهاية الفصل الدراسي</span>
              <b className="text-white font-mono">{formatDateArabic(profile?.term_end_date || DEFAULT_TERM_END)}</b>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="bg-[#464858] rounded-3xl border-2 border-[#D99B7F] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#A56F63]/40 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#D99B7F]" />
              <span>تعديل وحفظ بيانات الحساب الأكاديمي</span>
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-[#0F3040] cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* الاسم والرقم الجامعي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الاسم الكامل للطالب</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الرقم الجامعي</label>
                <input
                  type="text"
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  placeholder="مثال: 2360558"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>
            </div>

            {/* البريد الإلكتروني والجامعة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@stu.kau.edu.sa"
                  dir="ltr"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden font-mono text-left focus:border-[#D99B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">الجامعة</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="مثال: جامعة الملك عبدالعزيز"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>
            </div>

            {/* التخصص ونظام المعدل */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">التخصص الدراسي</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="مثال: علوم الحاسب"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">المعدل</label>
                <select
                  value={gpaType}
                  onChange={(e) => setGpaType(e.target.value as GpaType)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                >
                  <option value="5">سلم المعدل من 5.00 (الجامعات السعودية)</option>
                  <option value="4">سلم المعدل من 4.00</option>
                  <option value="100">نظام النسبة المئوية (100%)</option>
                </select>
              </div>
            </div>

            {/* قيمة المعدل التراكمي */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                المعدل التراكمي
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={gpaType === '100' ? 100 : gpaType === '4' ? 4 : 5}
                value={gpaValue}
                onChange={(e) => setGpaValue(e.target.value)}
                placeholder="أدخل معدلك التراكمي (مثال: 4.75)"
                className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
              />
            </div>

            {/* تواريخ بداية ونهاية الفصل الدراسي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ بداية الفصل الدراسي</label>
                <input
                  type="date"
                  value={termStartDate}
                  onChange={(e) => setTermStartDate(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">تاريخ نهاية الفصل الدراسي</label>
                <input
                  type="date"
                  value={termEndDate}
                  onChange={(e) => setTermEndDate(e.target.value)}
                  className="w-full bg-[#0F3040] border border-[#A56F63]/40 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-[#D99B7F]"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0F3040] text-slate-300 text-xs font-bold hover:bg-[#0F3040]/80 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-xs font-bold transition shadow-lg flex items-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات وتثبيتها'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
