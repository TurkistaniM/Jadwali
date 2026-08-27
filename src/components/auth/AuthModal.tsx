import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  Building2, 
  BookOpen, 
  Calendar, 
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth, SignUpData } from '../../context/AuthContext';
import { GpaType } from '../../types/database';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup' | 'forgot';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
}) => {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicId, setAcademicId] = useState('');
  const [university, setUniversity] = useState('جامعة الملك عبدالعزيز');
  const [major, setMajor] = useState('');
  const [gpaType, setGpaType] = useState<GpaType>('5');
  const [gpaValue, setGpaValue] = useState<string>('4.50');
  const [termStartDate, setTermStartDate] = useState('2026-08-01');
  const [termEndDate, setTermEndDate] = useState('2026-12-25');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Inline field validation errors (PRD Section 4)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    clearError();
    setFieldErrors({});
    setResetSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginIdentifier.trim()) {
      errs.loginIdentifier = 'يرجى إدخال البريد الإلكتروني أو الرقم الجامعي';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'الاسم الكامل مطلوب';
    if (!email.trim() || !email.includes('@')) errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    if (!password.trim() || password.length < 6) errs.password = 'كلمة المرور يجب ألا تقل عن 6 خانات';
    if (!academicId.trim()) errs.academicId = 'الرقم الجامعي مطلوب وفريد';
    if (!university.trim()) errs.university = 'اسم الجامعة مطلوب';
    if (!major.trim()) errs.major = 'اسم التخصص مطلوب';
    if (!gpaValue || isNaN(Number(gpaValue))) errs.gpaValue = 'يرجى إدخال قيمة المعدل بشكل صحيح';
    if (!termStartDate) errs.termStartDate = 'تاريخ بداية الفصل الدراسي مطلوب';
    if (!termEndDate) errs.termEndDate = 'تاريخ نهاية الفصل الدراسي مطلوب';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsSubmitting(true);
    const res = await signIn(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setIsSubmitting(true);
    const signupData: SignUpData = {
      full_name: fullName,
      email,
      password,
      academic_id: academicId,
      university,
      major,
      gpa_type: gpaType,
      gpa_value: parseFloat(gpaValue) || 4.5,
      term_start_date: termStartDate,
      term_end_date: termEndDate,
    };

    const res = await signUp(signupData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setFieldErrors({ forgotEmail: 'يرجى إدخال بريد إلكتروني صحيح ومسجل' });
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(forgotEmail);
    setIsSubmitting(false);

    if (res.success && res.message) {
      setResetSuccessMessage(res.message);
    } else if (res.error) {
      setFieldErrors({ forgotEmail: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#464858] text-white rounded-3xl border-2 border-[#A56F63]/50 shadow-2xl overflow-hidden my-8 animate-scale-up">
        
        {/* Modal Top Header */}
        <div className="bg-[#0F3040] p-6 border-b border-[#A56F63]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#A56F63] text-white shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {mode === 'login' && 'تسجيل الدخول إلى بوابتك'}
                {mode === 'signup' && 'إنشاء حساب طالب جديد'}
                {mode === 'forgot' && 'استعادة كلمة المرور'}
              </h3>
              <p className="text-xs text-[#D99B7F]">
                {mode === 'login' && 'أدخل بياناتك للمتابعة والوصول لموادك وجدولك'}
                {mode === 'signup' && 'سجل حسابك الأكاديمي لحساب الغياب وإدارة المكافأة'}
                {mode === 'forgot' && 'سنرسل رابط استعادة آمن لبريدك الإلكتروني'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#464858] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-600/50 flex items-center gap-2 text-rose-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  البريد الإلكتروني أو الرقم الجامعي
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="مثال: 44210987 أو student@kau.edu.sa"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 outline-hidden transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                {fieldErrors.loginIdentifier && (
                  <p className="text-xs text-rose-300 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.loginIdentifier}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#D99B7F] hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري تسجيل الدخول...</span>
                ) : (
                  <>
                    <span>دخول المنصة</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#A56F63]/30 text-center">
                <p className="text-xs text-slate-300">
                  ليس لديك حساب بعد؟{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-[#D99B7F] hover:underline"
                  >
                    أنشئ حسابك الأكاديمي الآن
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 max-h-[68vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم الكامل (ثلاثي أو رباعي) *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد القرشي"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-300 mt-0.5">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kau.edu.sa"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-300 mt-0.5">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    الرقم الجامعي الفريد *
                  </label>
                  <input
                    type="text"
                    value={academicId}
                    onChange={(e) => setAcademicId(e.target.value)}
                    placeholder="44210987"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.academicId && (
                    <p className="text-[11px] text-rose-300 mt-0.5">{fieldErrors.academicId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                />
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-300 mt-0.5">{fieldErrors.password}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    الجامعة *
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="جامعة الملك عبدالعزيز"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    التخصص الأكاديمي *
                  </label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="علوم الحاسب"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* GPA Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    المعدل
                  </label>
                  <select
                    value={gpaType}
                    onChange={(e) => setGpaType(e.target.value as GpaType)}
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  >
                    <option value="5">من 5.00 (الجامعات السعودية)</option>
                    <option value="4">من 4.00 (نظام الـ 4 نقاط)</option>
                    <option value="100">مئوي % (100)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    المعدل التراكمي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gpaValue}
                    onChange={(e) => setGpaValue(e.target.value)}
                    placeholder="4.82"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Term Dates (Critical for Elapsed Absence Calculations) */}
              <div className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2">
                <p className="text-[11px] font-bold text-[#D99B7F]">
                  تواريخ الفصل الدراسي (مهمة لحساب الغياب المنقضي):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">
                      تاريخ بداية الفصل الدراسي:
                    </label>
                    <input
                      type="date"
                      value={termStartDate}
                      onChange={(e) => setTermStartDate(e.target.value)}
                      className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">
                      تاريخ نهاية الفصل الدراسي:
                    </label>
                    <input
                      type="date"
                      value={termEndDate}
                      onChange={(e) => setTermEndDate(e.target.value)}
                      className="w-full bg-[#464858] border border-[#A56F63]/40 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'جاري إنشاء الحساب...' : 'إتمام التسجيل والبدء'}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-300">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-[#D99B7F] hover:underline"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {resetSuccessMessage ? (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-emerald-200">{resetSuccessMessage}</p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#A56F63] text-white text-xs font-bold"
                  >
                    العودة لصفحة الدخول
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      البريد الإلكتروني المسجل في حسابك
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="student@kau.edu.sa"
                        className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 outline-hidden"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                    {fieldErrors.forgotEmail && (
                      <p className="text-xs text-rose-300 mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.forgotEmail}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-[#D99B7F] hover:underline"
                    >
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
