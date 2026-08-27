# قواعد الأمان والـ RLS - SECURITY_RULES.md

## 1. القاعدة الذهبية للأمان
> **Each user can only read and modify their own data using Supabase Row Level Security (RLS).**

---

## 2. حماية مفاتيح البيئة ومتغيرات النظام
- يتم إخفاء وتشفير `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` وعدم رفع ملف `.env` إلى GitHub نهائياً.
- إضافة ملف `.env` داخل ملف `.gitignore`.
- يتم ضبط المتغيرات يدوياً داخل لوحة تحكم Render من قسم Environment Variables لضمان أمان المفاتيح.

---

## 3. سياسات الوصول للجداول (RLS SQL Policies)

```sql
-- تفعيل الـ RLS على الجداول السبعة
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الوصول الخاصة بكل طالب
CREATE POLICY "Profiles access" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Courses access" ON courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Attendance access" ON attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Tasks access" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Exams access" ON exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Scholarships access" ON scholarships FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Notifications access" ON notifications FOR ALL USING (auth.uid() = user_id);
```

---
**تم تصميم هذا الموقع من قبل محمد تركستاني**
