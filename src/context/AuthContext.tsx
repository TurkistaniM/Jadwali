import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, GpaType } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password?: string;
  full_name: string;
  academic_id: string;
  university: string;
  major: string;
  gpa_type: GpaType;
  gpa_value: number;
  term_start_date: string;
  term_end_date: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'jadwali_auth_user';
const LOCAL_STORAGE_PROFILE_KEY = 'jadwali_profile_data';

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
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // مزامنة والتحقق من الجلسة في Supabase في الخلفية
  useEffect(() => {
    const checkSupabaseSession = async () => {
      if (!isSupabaseConfigured) return;
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
            setProfile(profData as Profile);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profData));
            localStorage.setItem(`jadwali_profile_${session.user.id}`, JSON.stringify(profData));
            if (profData.academic_id) {
              localStorage.setItem(`jadwali_academic_map_${profData.academic_id}`, authUser.email);
            }
          } else {
            const saved = 
              localStorage.getItem(`jadwali_profile_${session.user.id}`) ||
              localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);

            if (saved) {
              const localProf = JSON.parse(saved);
              setProfile(localProf);
              try {
                await supabase.from('profiles').upsert(localProf);
              } catch (e) {
                console.warn('Sync profile to Supabase note:', e);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Background Supabase session sync note:', err);
      }
    };

    checkSupabaseSession();
  }, []);

  const signIn = async (identifier: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes('@');
      let loginEmail = cleanIdentifier;

      // إذا أدخل الطالب الرقم الجامعي، نقوم بربطه بالإيميل
      if (!isEmail) {
        // 1. البحث في الخريطة المحلية
        const mappedEmail = 
          localStorage.getItem(`jadwali_academic_map_${cleanIdentifier}`) ||
          localStorage.getItem(`jadwali_prof_email_${cleanIdentifier}`);

        if (mappedEmail) {
          loginEmail = mappedEmail;
        } else if (isSupabaseConfigured) {
          // 2. محاولة الاستعلام من Supabase عبر دالة RPC
          try {
            const { data: rpcEmail, error: rpcErr } = await supabase
              .rpc('get_email_by_academic_id', { p_academic_id: cleanIdentifier });

            if (rpcEmail && !rpcErr) {
              loginEmail = rpcEmail;
            } else {
              // 3. محاولة الاستعلام المباشر من جدول profiles
              const { data: profRow } = await supabase
                .from('profiles')
                .select('email')
                .eq('academic_id', cleanIdentifier)
                .single();

              if (profRow?.email) {
                loginEmail = profRow.email;
              }
            }
          } catch (e) {
            console.warn('RPC lookup note:', e);
          }
        }
      }

      if (isSupabaseConfigured) {
        // إذا كان لا يزال رقماً ولم يتم العثور على إيميل، ننبه المستخدم بلطف
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
            effectiveProfile = profData as Profile;
          } else {
            const saved = 
              localStorage.getItem(`jadwali_profile_${userId}`) ||
              localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);

            if (saved) {
              effectiveProfile = { ...JSON.parse(saved), id: userId };
            } else {
              effectiveProfile = {
                id: userId,
                full_name: data.user.user_metadata?.full_name || userEmail.split('@')[0] || 'طالب جامعي',
                academic_id: data.user.user_metadata?.academic_id || cleanIdentifier || '44100000',
                university: 'جامعة الملك عبدالعزيز',
                major: 'هندسة الحاسب',
                gpa_type: '5',
                gpa_value: 4.5,
                term_start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                term_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 4, 25).toISOString().split('T')[0],
                created_at: new Date().toISOString()
              };
            }
            try {
              await supabase.from('profiles').upsert(effectiveProfile);
            } catch (e) {
              console.warn('Auto create profile note:', e);
            }
          }

          setProfile(effectiveProfile);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(effectiveProfile));
          localStorage.setItem(`jadwali_profile_${userId}`, JSON.stringify(effectiveProfile));
          
          if (effectiveProfile.academic_id) {
            localStorage.setItem(`jadwali_academic_map_${effectiveProfile.academic_id}`, userEmail);
          }

          setIsLoading(false);
          return { success: true };
        }
      }

      // تسجيل الدخول المحلي
      const savedProf = 
        localStorage.getItem(`jadwali_prof_${cleanIdentifier}`) ||
        localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);

      if (savedProf) {
        const parsed = JSON.parse(savedProf);
        const authUser = { id: parsed.id || `usr-${Date.now()}`, email: parsed.email || `${cleanIdentifier}@university.edu.sa` };
        setUser(authUser);
        setProfile(parsed);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(parsed));
        setIsLoading(false);
        return { success: true };
      }

      const msg = 'الحساب غير مسجل، يرجى إنشاء حساب جديد أو الدخول بالبريد';
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
      let userId = `usr-${Date.now()}`;

      if (isSupabaseConfigured) {
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

        if (authData.user) {
          userId = authData.user.id;
        }
      }

      const newProfile: Profile = {
        id: userId,
        full_name: data.full_name.trim(),
        academic_id: data.academic_id.trim(),
        university: data.university.trim(),
        major: data.major.trim(),
        gpa_type: data.gpa_type,
        gpa_value: Number(data.gpa_value),
        term_start_date: data.term_start_date,
        term_end_date: data.term_end_date,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('profiles').upsert(newProfile);
        } catch (err) {
          console.warn('Profiles upsert warning:', err);
        }
      }

      const authUser = { id: userId, email: data.email.trim() };
      setUser(authUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      localStorage.setItem(`jadwali_profile_${userId}`, JSON.stringify(newProfile));
      localStorage.setItem(`jadwali_academic_map_${data.academic_id.trim()}`, data.email.trim());
      localStorage.setItem(`jadwali_prof_${data.academic_id.trim()}`, JSON.stringify(newProfile));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!profile) return false;
    try {
      const updated: Profile = {
        ...profile,
        ...updates,
      };

      setProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
      if (user) {
        localStorage.setItem(`jadwali_profile_${user.id}`, JSON.stringify(updated));
      }
      if (updated.academic_id && user) {
        localStorage.setItem(`jadwali_academic_map_${updated.academic_id}`, user.email);
      }

      if (isSupabaseConfigured && (profile.id || user?.id)) {
        const targetId = profile.id || user?.id;
        const profilePayload = {
          ...updated,
          id: targetId
        };
        
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert(profilePayload);

          if (error) {
            console.warn('Supabase profile upsert error, trying update:', error.message);
            await supabase
              .from('profiles')
              .update(updates)
              .eq('id', targetId);
          }
        } catch (err) {
          console.warn('Supabase updateProfile catch:', err);
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
      if (isSupabaseConfigured) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (resetErr) throw resetErr;
      }
      return {
        success: true,
        message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بأمان.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'تعذر إرسال الرابط، يرجى التأكد من صحة البريد'
      };
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: Boolean(user && profile),
        isLoading,
        error,
        signIn,
        signUp,
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
