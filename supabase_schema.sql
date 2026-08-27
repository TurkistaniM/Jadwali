-- ==============================================================================
-- مخطط قاعدة بيانات "جَدْوَلي" (منصة الطالب الجامعي الشاملة) - Supabase SQL Schema
-- ==============================================================================

-- 1. جدول الملف الشخصي للطالب (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  academic_id VARCHAR(50) UNIQUE NOT NULL,
  university TEXT NOT NULL,
  major TEXT NOT NULL,
  gpa_type VARCHAR(10) CHECK (gpa_type IN ('4', '5', '100')) NOT NULL,
  gpa_value NUMERIC(4,2),
  term_start_date DATE NOT NULL,
  term_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المواد الدراسية (Courses)
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  instructor_name TEXT,
  building TEXT,
  room TEXT,
  color_code VARCHAR(15) DEFAULT '#A56F63',
  contact_info TEXT,
  contact_method TEXT,
  schedule_days INTEGER[] DEFAULT ARRAY[1, 3], -- الافتراضي: الاثنين والأربعاء
  schedule_time TEXT DEFAULT '09:00 - 10:15',  -- الافتراضي: ساعة و 15 دقيقة (أو 50 دقيقة للـ 3 أيام: 09:00 - 09:50)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول الحضور والغياب (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'تم إلغاء الدرس')),
  UNIQUE(course_id, session_date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول المهام (Tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول سجلات المكافأة الجامعية (Scholarships)
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  disbursement_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('قيد الانتظار', 'تم الصرف', 'معلقة')) DEFAULT 'قيد الانتظار',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) CHECK (type IN ('absence_warning', 'scholarship', 'exam_reminder', 'task_reminder')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- تفعيل أمان مستوى الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (RLS Policies) الخاصة بالطالب فقط (auth.uid() = user_id / id)
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
CREATE POLICY "Users can manage their own courses" ON courses
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;
CREATE POLICY "Users can manage their own attendance" ON attendance
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own exams" ON exams;
CREATE POLICY "Users can manage their own exams" ON exams
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own scholarships" ON scholarships;
CREATE POLICY "Users can manage their own scholarships" ON scholarships
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
