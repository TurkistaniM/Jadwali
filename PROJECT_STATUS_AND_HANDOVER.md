# 📋 ملخص شامل لتسليم ومتابعة مشروع منصة "جَدْوَلي" (Jadwali Handover Summary)

---

## 📌 1. نبذة عن المشروع والهوية (Project Overview)
- **اسم المشروع:** جَدْوَلي (منصة الطالب الجامعي الشاملة).
- **الهدف:** إدارة الحياة الأكاديمية للطالب الجامعي بالكامل (الجدول الأسبوعي، المعامل، الغياب والحرمان الذكي، المهام، الاختبارات، وحاسبة المعدل والمكافأة).
- **التقنيات المستخدمة (Tech Stack):**
  - **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons.
  - **Backend & Database:** Supabase (PostgreSQL + Supabase Auth + Row Level Security - RLS).
  - **Deployment:** Render (مرتبط تلقائياً مع فرع `main`).
  - **Git Repo:** `https://github.com/TurkistaniM/Jadwali.git`

---

## 🔑 2. إعدادات وبيانات الربط مع Supabase (Credentials)
- **Supabase Project URL:** `https://zjpywlnehorrdrnrasxi.supabase.co`
- **Supabase Anon / Publishable Key:** `sb_publishable_s7DstU3Vf59CY6H-FrsmlQ_GYsCF0UI`

---

## 🚀 3. ما تم إنجازه وضبطه بدقة 100% (Accomplished Work)

### 1. المصادقة والأمان وعزل البيانات (Auth & Strict Data Isolation):
- دعم تسجيل الدخول المباشر عبر **Google OAuth** والبريد الإلكتروني الجامعي أو الشخصي.
- **عزل صارم 100% لبيانات كل طالب:** كل طالب لا يرى إلا بياناته الخاصة المرتبطة بـ `auth.uid() = user_id`.
- تصفير فوري لذاكرة المتصفح عند الضغط على تسجيل الخروج (`signOut`).

### 2. الملف الشخصي والبيانات الأكاديمية (Profile System):
- إزالة كافة البيانات الوهمية القديمة (بدون قيم افتراضية عشوائية).
- تثبيت التواريخ الافتراضية المعتمدة للفصل الدراسي:
  - **تاريخ بداية الفصل:** `2026-08-23`
  - **تاريخ نهاية الفصل:** `2026-12-17`
- دعم وتوحيد عمود المعدل التراكمي في قاعدة البيانات (`gpa_value`).
- دعم كافة سلالم المعدل (من 5.00، من 4.00، أو النسبة المئوية 100%).

### 3. المقررات الدراسية وإضافة المعامل (Courses & Lab Feature):
- إضافة خياري توزيع الأيام الأكاديمية المعتمدة:
  - `(أحد - ثلاثاء - خميس)`: مدة المحاضرة 50 دقيقة تلقائياً.
  - `(اثنين - أربعاء)`: مدة المحاضرة ساعة و 15 دقيقة تلقائياً.
- **إضافة خيار المعمل / السكشن العملي (Lab Option):**
  - زر تفعيل `[✓] إضافة معمل / سكشن عملي للمادة (اختياري)`.
  - تحديد يوم المعمل الأسبوعي، أوقات المعمل (مثل: 13:00 - 14:50)، ومبنى وقاعة المعمل.
- **حل مشكلة اختفاء المواد نهائياً:** الربط المباشر مع جدول `courses` في Supabase.

### 4. الجدول الدراسي الأسبوعي (Weekly Schedule):
- عرض جميع المحاضرات النظرية موزعة على أيام الأسبوع.
- إدراج جلسات **المعمل والسكشن العملي** في أيامها المستقلة مع شارة `🧪 معمل`.

### 5. متابعة الحضور والغياب الذكي (Absence & Attendance):
- حساب دقيق لنسب الغياب المحسوبة بالنسبة للأسابيع المنقضية فقط لتجنب الإنذارات المبكرة غير المنطقية.

---

## 🗄️ 4. كود SQL الشامل لقاعدة بيانات Supabase (Master SQL Schema)
في حال أردت إعادة تهيئة أو التأكد من سلامة الجداول في Supabase:

```sql
-- 1. جدول الملف الشخصي (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  academic_id TEXT,
  email TEXT,
  university TEXT,
  major TEXT,
  gpa_type VARCHAR(10) DEFAULT '5',
  gpa_value NUMERIC(4,2),
  term_start_date DATE DEFAULT '2026-08-23',
  term_end_date DATE DEFAULT '2026-12-17',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المواد (courses) مع دعم المعمل
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
  has_lab BOOLEAN DEFAULT false,
  lab_day INTEGER,
  lab_time TEXT,
  lab_building TEXT,
  lab_room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_lab BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_day INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_time TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_building TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lab_room TEXT;

-- 3. جدول الحضور والغياب (attendance)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'تم إلغاء الدرس')),
  UNIQUE(course_id, session_date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول المهام (tasks)
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

-- 5. جدول الاختبارات (exams)
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول المكافآت الجامعية (scholarships)
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  disbursement_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'تم الصرف',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول الإشعارات (notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS لجميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الحفظ الكاملة (SELECT / INSERT / UPDATE / DELETE) لكل مستخدم
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
CREATE POLICY "Users can manage their own courses" ON courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;
CREATE POLICY "Users can manage their own attendance" ON attendance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own exams" ON exams;
CREATE POLICY "Users can manage their own exams" ON exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own scholarships" ON scholarships;
CREATE POLICY "Users can manage their own scholarships" ON scholarships FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 💬 5. الرسالة الجاهزة للصقها في المحادثة الجديدة (Prompt for Next Chat)

> **"السلام عليكم، نحن نعمل على تطوير منصة 'جَدْوَلي' (منصة الطالب الجامعي الشاملة). المشروع مبني بـ React + Vite + TypeScript ومربوط مع Supabase السحابية ومرفوع على Render عبر مستودع GitHub `https://github.com/TurkistaniM/Jadwali.git`. اقرأ ملف `PROJECT_STATUS_AND_HANDOVER.md` لمعرفة كل التفاصيل ومتابعة العمل."**

---
تم حفظ هذا الملف في جذر المشروع: `PROJECT_STATUS_AND_HANDOVER.md`
