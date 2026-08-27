import React, { useState } from 'react';
import { 
  GraduationCap, 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  Calendar, 
  Wallet, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth, SignUpData } from '../../context/AuthContext';
import { GpaType } from '../../types/database';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');

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
  const [termStartDate, setTermStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [termEndDate, setTermEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 4, 25).toISOString().split('T')[0]
  );

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (tab: 'login' | 'signup' | 'forgot') => {
    setActiveTab(tab);
    clearError();
    setFieldErrors({});
    setResetSuccessMessage(null);
  };

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginIdentifier.trim()) {
      errs.loginIdentifier = 'يرجى إدخال البريد الإلكتروني أو الرقم الجامعي';
    }
    if (!loginPassword.trim()) {
      errs.loginPassword = 'يرجى إدخال كلمة المرور';
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
    if (!gpaValue || isNaN(Number(gpaValue))) errs.gpaValue = 'يرجى إدخال المعدل التراكمي';
    if (!termStartDate) errs.termStartDate = 'تاريخ بداية الفصل الدراسي مطلوب';
    if (!termEndDate) errs.termEndDate = 'تاريخ نهاية الفصل الدراسي مطلوب';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsSubmitting(true);
    await signIn(loginIdentifier, loginPassword);
    setIsSubmitting(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setIsSubmitting(true);
    const signupData: SignUpData = {
      full_name: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
      academic_id: academicId.trim(),
      university: university.trim(),
      major: major.trim(),
      gpa_type: gpaType,
      gpa_value: parseFloat(gpaValue) || 4.5,
      term_start_date: termStartDate,
      term_end_date: termEndDate,
    };

    await signUp(signupData);
    setIsSubmitting(false);
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
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 animate-fade-in">
      <div className="w-full max-w-xl space-y-8">
        
        {/* Brand Logo & Welcome Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-3xl bg-[#464858] border-2 border-[#A56F63]/50 text-[#D99B7F] shadow-xl">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              جَدْوَلي
            </h1>
            <p className="text-sm text-[#D99B7F] font-bold">
              منصة الطالب الجامعي الشاملة
            </p>
            <p className="text-xs text-slate-300 max-w-md mx-auto pt-1">
              تنظيم المقررات، حساب نسبة الغياب المنقضية، عداد المكافأة الجامعية، وتتبع المهام والاختبارات في مكان واحد.
            </p>
          </div>
        </div>

        {/* Auth Main Card */}
        <div className="bg-[#464858] rounded-3xl border-2 border-[#A56F63]/50 p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Navigation Tabs (Login / Signup) */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#0F3040] border border-[#A56F63]/30 gap-1 text-xs sm:text-sm font-bold">
            <button
              onClick={() => handleTabChange('login')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-[#A56F63] text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              onClick={() => handleTabChange('signup')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-[#A56F63] text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 flex items-center gap-2 text-rose-200 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {activeTab === 'login' && (
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
                    placeholder="مثال: 44102938 أو student@university.edu.sa"
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
                    onClick={() => handleTabChange('forgot')}
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
                {fieldErrors.loginPassword && (
                  <p className="text-xs text-rose-300 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.loginPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>جاري تسجيل الدخول...</span>
                ) : (
                  <>
                    <span>تسجيل الدخول إلى حسابي</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم الكامل للطالب *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: عبدالله محمد الشهري"
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
                    placeholder="student@university.edu.sa"
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
                    placeholder="44100234"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                  {fieldErrors.academicId && (
                    <p className="text-[11px] text-rose-300 mt-0.5">{fieldErrors.academicId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  كلمة المرور (6 خانات على الأقل) *
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
                    placeholder="هندسة البرمجيات"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

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
                    placeholder="4.50"
                    className="w-full bg-[#0F3040] border border-[#A56F63]/50 focus:border-[#D99B7F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Term Dates */}
              <div className="p-3 rounded-xl bg-[#0F3040]/70 border border-[#A56F63]/30 space-y-2">
                <p className="text-[11px] font-bold text-[#D99B7F]">
                  تواريخ الفصل الدراسي (لحساب الغياب المنقضي):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">
                      بداية الفصل الدراسي:
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
                      نهاية الفصل الدراسي:
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
                {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وبدء الاستخدام'}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {resetSuccessMessage ? (
                <div className="p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-emerald-200">{resetSuccessMessage}</p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
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
                        placeholder="student@university.edu.sa"
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
                      onClick={() => handleTabChange('login')}
                      className="text-xs text-[#D99B7F] hover:underline font-bold"
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
