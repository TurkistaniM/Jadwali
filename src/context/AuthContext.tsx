import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, GpaType } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password?: string;
  full_name: string;
  academic_id: string;
  university?: string;
  major?: string;
  gpa_type?: GpaType;
  gpa_value?: number | null;
  term_start_date?: string;
  term_end_date?: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'jadwali_auth_active_user';

const DEFAULT_TERM_START = '2026-08-23';
const DEFAULT_TERM_END = '2026-12-17';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.id) {
          const userSpecificProfile = localStorage.getItem(`jadwali_profile_${parsedUser.id}`);
          return userSpecificProfile ? JSON.parse(userSpecificProfile) : null;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // دالة موحدة لقراءة وتجهيز الملف الشخصي من Supabase
  const mapSupabaseProfile = (data: any, userId: string, email: string): Profile => {
    const numericGpa = data.gpa_value !== undefined && data.gpa_value !== null 
      ? Number(data.gpa_value) 
      : data.value_gpa !== undefined && data.value_gpa !== null 
      ? Number(data.value_gpa) 
      : 0;

    return {
      id: userId,
      full_name: data.full_name || email.split('@')[0] || 'طالب جامعي',
      academic_id: data.academic_id || '',
      email: data.email || email,
      university: data.university || '',
      major: data.major || '',
      gpa_type: (data.gpa_type as GpaType) || '5',
      gpa_value: numericGpa,
      term_start_date: data.term_start_date || DEFAULT_TERM_START,
      term_end_date: data.term_end_date || DEFAULT_TERM_END,
      created_at: data.created_at || new Date().toISOString()
    };
  };

  // مزامنة والتحقق من الجلسة في Supabase مباشرة
  useEffect(() => {
    const checkSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || '' };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));

          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profData) {
            const mapped = mapSupabaseProfile(profData, session.user.id, authUser.email);
            setProfile(mapped);
            localStorage.setItem(`jadwali_profile_${session.user.id}`, JSON.stringify(mapped));
            if (mapped.academic_id) {
              localStorage.setItem(`jadwali_academic_map_${mapped.academic_id}`, authUser.email);
            }
          } else {
            const googleFullName = 
              session.user.user_metadata?.full_name || 
              session.user.user_metadata?.name || 
              authUser.email.split('@')[0] || 
              'طالب جامعي';

            const newProf: Profile = {
              id: session.user.id,
              full_name: googleFullName,
              academic_id: session.user.user_metadata?.academic_id || '',
              email: authUser.email,
              university: '',
              major: '',
              gpa_type: '5',
              gpa_value: 0,
              term_start_date: DEFAULT_TERM_START,
              term_end_date: DEFAULT_TERM_END,
              created_at: new Date().toISOString()
            };

            setProfile(newProf);
            localStorage.setItem(`jadwali_profile_${session.user.id}`, JSON.stringify(newProf));

            // حفظ في Supabase مع دعم أسماء الأعمدة
            await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: googleFullName,
              email: authUser.email,
              academic_id: null,
              university: null,
              major: null,
              gpa_type: '5',
              term_start_date: DEFAULT_TERM_START,
              term_end_date: DEFAULT_TERM_END
            });
          }
        }
      } catch (err) {
        console.warn('Background sync note:', err);
      }
    };

    checkSupabaseSession();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = { id: session.user.id, email: session.user.email || '' };
        setUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));

        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profData) {
          const mapped = mapSupabaseProfile(profData, session.user.id, authUser.email);
          setProfile(mapped);
          localStorage.setItem(`jadwali_profile_${session.user.id}`, JSON.stringify(mapped));
        } else {
          const newProf: Profile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || authUser.email.split('@')[0] || 'طالب جامعي',
            academic_id: '',
            email: authUser.email,
            university: '',
            major: '',
            gpa_type: '5',
            gpa_value: 0,
            term_start_date: DEFAULT_TERM_START,
            term_end_date: DEFAULT_TERM_END,
            created_at: new Date().toISOString()
          };
          setProfile(newProf);
          localStorage.setItem(`jadwali_profile_${session.user.id}`, JSON.stringify(newProf));
          
          await supabase.from('profiles').upsert({
            id: session.user.id,
            full_name: newProf.full_name,
            email: authUser.email,
            academic_id: null,
            university: null,
            major: null,
            gpa_type: '5',
            term_start_date: DEFAULT_TERM_START,
            term_end_date: DEFAULT_TERM_END
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes('@');
      let loginEmail = cleanIdentifier;

      if (!isEmail) {
        const mappedEmail = 
          localStorage.getItem(`jadwali_academic_map_${cleanIdentifier}`) ||
          localStorage.getItem(`jadwali_prof_email_${cleanIdentifier}`);

        if (mappedEmail) {
          loginEmail = mappedEmail;
        } else {
          try {
            const { data: profRow } = await supabase
              .from('profiles')
              .select('email')
              .eq('academic_id', cleanIdentifier)
              .single();

            if (profRow?.email) {
              loginEmail = profRow.email;
            }
          } catch (e) {
            console.warn('Academic lookup note:', e);
          }
        }
      }

      if (!loginEmail.includes('@')) {
        const msg = 'لم يتم العثور على بريد مرتبط بهذا الرقم الجامعي. يرجى إدخال بريدك الإلكتروني لتسجيل الدخول';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim(),
      });

      if (authErr) {
        const msg = authErr.message.includes('Invalid login credentials')
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : authErr.message.includes('Email not confirmed')
          ? 'يرجى تأكيد البريد الإلكتروني أو تعطيل التأكيد من Supabase'
          : authErr.message;
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      if (data.user) {
        const userId = data.user.id;
        const userEmail = data.user.email || loginEmail;
        
        const authUser = { id: userId, email: userEmail };
        setUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));

        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        let effectiveProfile: Profile;
        if (profData) {
          effectiveProfile = mapSupabaseProfile(profData, userId, userEmail);
        } else {
          effectiveProfile = {
            id: userId,
            full_name: data.user.user_metadata?.full_name || userEmail.split('@')[0] || 'طالب جامعي',
            academic_id: cleanIdentifier || '',
            email: userEmail,
            university: '',
            major: '',
            gpa_type: '5',
            gpa_value: 0,
            term_start_date: DEFAULT_TERM_START,
            term_end_date: DEFAULT_TERM_END,
            created_at: new Date().toISOString()
          };

          await supabase.from('profiles').upsert({
            id: userId,
            full_name: effectiveProfile.full_name,
            email: userEmail,
            academic_id: effectiveProfile.academic_id || null,
            university: null,
            major: null,
            gpa_type: '5',
            term_start_date: DEFAULT_TERM_START,
            term_end_date: DEFAULT_TERM_END
          });
        }

        setProfile(effectiveProfile);
        localStorage.setItem(`jadwali_profile_${userId}`, JSON.stringify(effectiveProfile));
        
        if (effectiveProfile.academic_id) {
          localStorage.setItem(`jadwali_academic_map_${effectiveProfile.academic_id}`, userEmail);
        }

        setIsLoading(false);
        return { success: true };
      }

      const msg = 'تعذر العثور على الحساب، يرجى إنشاء حساب جديد';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    } catch (err: any) {
      const msg = err?.message || 'حدث خطأ أثناء محاولة تسجيل الدخول';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password?.trim() || 'Password123!',
        options: {
          data: {
            full_name: data.full_name.trim(),
            academic_id: data.academic_id.trim()
          }
        }
      });

      if (authErr) {
        const msg = authErr.message.includes('already registered')
          ? 'البريد الإلكتروني مستخدم بالفعل في النظام'
          : authErr.message;
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const userId = authData.user?.id || `usr-${Date.now()}`;

      const newProfile: Profile = {
        id: userId,
        full_name: data.full_name.trim(),
        academic_id: data.academic_id.trim(),
        email: data.email.trim(),
        university: data.university?.trim() || '',
        major: data.major?.trim() || '',
        gpa_type: data.gpa_type || '5',
        gpa_value: Number(data.gpa_value) || 0,
        term_start_date: data.term_start_date || DEFAULT_TERM_START,
        term_end_date: data.term_end_date || DEFAULT_TERM_END,
        created_at: new Date().toISOString(),
      };

      const gpaNum = Number(data.gpa_value) || null;

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: data.full_name.trim(),
        academic_id: data.academic_id.trim() || null,
        email: data.email.trim(),
        university: data.university?.trim() || null,
        major: data.major?.trim() || null,
        gpa_type: data.gpa_type || '5',
        gpa_value: gpaNum,
        term_start_date: data.term_start_date || DEFAULT_TERM_START,
        term_end_date: data.term_end_date || DEFAULT_TERM_END
      });

      const authUser = { id: userId, email: data.email.trim() };
      setUser(authUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));
      localStorage.setItem(`jadwali_profile_${userId}`, JSON.stringify(newProfile));
      localStorage.setItem(`jadwali_academic_map_${data.academic_id.trim()}`, data.email.trim());

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'تعذر تسجيل الدخول عبر Google، يرجى التأكد من إعدادات المفاتيح';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const currentProfile = profile || {
        id: user.id,
        full_name: '',
        academic_id: '',
        email: user.email,
        university: '',
        major: '',
        gpa_type: '5' as GpaType,
        gpa_value: 0,
        term_start_date: DEFAULT_TERM_START,
        term_end_date: DEFAULT_TERM_END,
        created_at: new Date().toISOString()
      };

      const updated: Profile = {
        ...currentProfile,
        ...updates,
        id: user.id
      };

      setProfile(updated);
      localStorage.setItem(`jadwali_profile_${user.id}`, JSON.stringify(updated));

      if (updated.academic_id && (updated.email || user?.email)) {
        localStorage.setItem(`jadwali_academic_map_${updated.academic_id}`, updated.email || user.email);
      }

      const gpaNum = typeof updated.gpa_value === 'number' && !isNaN(updated.gpa_value) ? updated.gpa_value : null;

      const basePayload: any = {
        id: user.id,
        full_name: updated.full_name?.trim() || '',
        academic_id: updated.academic_id?.trim() || null,
        email: updated.email?.trim() || user.email,
        university: updated.university?.trim() || null,
        major: updated.major?.trim() || null,
        gpa_type: updated.gpa_type || '5',
        term_start_date: updated.term_start_date?.trim() || DEFAULT_TERM_START,
        term_end_date: updated.term_end_date?.trim() || DEFAULT_TERM_END
      };

      // 1. محاولة الحفظ بـ gpa_value
      let { error: err1 } = await supabase
        .from('profiles')
        .upsert({ ...basePayload, gpa_value: gpaNum });

      // 2. إذا كان اسم العمود value_gpa
      if (err1 && (err1.message.includes('gpa_value') || err1.message.includes('column'))) {
        const { error: err2 } = await supabase
          .from('profiles')
          .upsert({ ...basePayload, value_gpa: gpaNum });
        if (err2) {
          console.warn('Upsert fallback note:', err2.message);
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetErr) throw resetErr;
      return {
        success: true,
        message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بأمان.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'تعذر إرسال الرابط، يرجى التأكد من صحة البريد الإلكتروني'
      };
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
