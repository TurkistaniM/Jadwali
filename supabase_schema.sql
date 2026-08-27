-- ==============================================================================
-- مخطط وتحديث أمان قاعدة بيانات "جَدْوَلي" الشامل - Supabase SQL Schema
-- انسخ هذا الملف وشغله في SQL Editor في Supabase
-- ==============================================================================

-- 1. جدول الملف الشخصي للطالب (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  academic_id VARCHAR(50),
  email TEXT,
  university TEXT DEFAULT 'جامعة الملك عبدالعزيز',
  major TEXT DEFAULT 'علوم الحاسب',
  gpa_type VARCHAR(10) CHECK (gpa_type IN ('4', '5', '100')) DEFAULT '5',
  gpa_value NUMERIC(4,2) DEFAULT 4.50,
  term_start_date DATE DEFAULT '2026-08-01',
  term_end_date DATE DEFAULT '2026-12-25',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تحديث جدول profiles إن كان موجوداً مسبقاً
ALTER TABLE profiles ALTER COLUMN academic_id DROP NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ALTER COLUMN university SET DEFAULT 'جامعة الملك عبدالعزيز';
ALTER TABLE profiles ALTER COLUMN major SET DEFAULT 'علوم الحاسب';
ALTER TABLE profiles ALTER COLUMN gpa_type SET DEFAULT '5';
ALTER TABLE profiles ALTER COLUMN gpa_value SET DEFAULT 4.50;
ALTER TABLE profiles ALTER COLUMN term_start_date SET DEFAULT '2026-08-01';
ALTER TABLE profiles ALTER COLUMN term_end_date SET DEFAULT '2026-12-25';

-- 2. جدول المواد الدراسية (Courses)
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  instructor_name TEXT,
  building TEXT,
  room TEXT,
  color_code VARCHAR(15) DEFAULT '#A56F63',
  contact_info TEXT,
  contact_method TEXT,
  schedule_days INTEGER[] DEFAULT ARRAY[1, 3],
  schedule_time TEXT DEFAULT '09:00 - 10:15',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول الحضور والغياب (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'تم إلغاء الدرس')),
  UNIQUE(course_id, session_date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول المهام (Tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  is_important BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول الاختبارات (Exams)
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول سجلات المكافأة الجامعية (Scholarships)
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  disbursement_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('قيد الانتظار', 'تم الصرف', 'معلقة')) DEFAULT 'قيد الانتظار',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) CHECK (type IN ('absence_warning', 'scholarship', 'exam_reminder', 'task_reminder')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- تفعيل أمان مستوى الصفوف (Row Level Security - RLS) مع تصاريح كاملة للطالب
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
CREATE POLICY "Users can manage their own courses" ON courses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;
CREATE POLICY "Users can manage their own attendance" ON attendance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own exams" ON exams;
CREATE POLICY "Users can manage their own exams" ON exams
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own scholarships" ON scholarships;
CREATE POLICY "Users can manage their own scholarships" ON scholarships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- دالة البحث عن الإيميل بالرقم الجامعي
CREATE OR REPLACE FUNCTION get_email_by_academic_id(p_academic_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT u.email INTO v_email 
  FROM auth.users u 
  JOIN profiles p ON p.id = u.id 
  WHERE p.academic_id = p_academic_id 
  LIMIT 1;

  IF v_email IS NULL THEN
    SELECT email INTO v_email FROM profiles WHERE academic_id = p_academic_id LIMIT 1;
  END IF;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_academic_id(TEXT) TO anon, authenticated, service_role;
