# إصلاح الثغرة الحرجة فقط: جعل `public_restaurants` للقراءة فقط

## النطاق
- تعديل صلاحيات (GRANT/REVOKE) على الـ view `public.public_restaurants` **فقط**.
- لا تغيير في `security_invoker` (سيبقى `off` كما هو).
- لا تغيير في سياسات RLS على `restaurants` ولا على أي جدول آخر.
- لا تغيير في تدفق بيانات المنيو العام ولا في أي بيانات موجودة.

## الـ SQL المطلوب تنفيذه

```sql
-- 1) سحب كل الصلاحيات عن الـ view من الدورين العامين (تنظيف شامل)
REVOKE ALL PRIVILEGES ON TABLE public.public_restaurants FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.public_restaurants FROM authenticated;

-- 2) إعادة منح القراءة فقط (لازمة لصفحة المنيو العامة و hook useRestaurant)
GRANT SELECT ON TABLE public.public_restaurants TO anon;
GRANT SELECT ON TABLE public.public_restaurants TO authenticated;
```

### شرح كل سطر
- `REVOKE ALL ... FROM anon` — يسحب INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES, MAINTAIN, SELECT دفعة واحدة. هذا هو السطر الذي يقفل الثغرة الحرجة: بعده لا يستطيع أي زائر مجهول تعديل أو حذف أي مطعم عبر الـ view.
- `REVOKE ALL ... FROM authenticated` — نفس الشيء لدور المستخدمين المسجّلين، لأنهم أيضاً كانوا يستطيعون التعديل/الحذف على أي مطعم عبر الـ view (تجاوز RLS).
- `GRANT SELECT ... TO anon` — يُعيد القراءة فقط، وهي المطلوبة فعلاً لصفحة المطعم العامة.
- `GRANT SELECT ... TO authenticated` — يُعيد القراءة للمستخدم المسجّل (لوحة التحكم تقرأ من `public_restaurants` عبر hook `useRestaurant`).

ملاحظة: `service_role` و`postgres` لا يُمسّان إطلاقاً، فتبقى الدوال والـ Edge Functions تعمل كما هي.

## التحقق بعد التنفيذ (قراءة فقط)
1. استعلام `aclexplode` لتأكيد أن `anon` و`authenticated` لديهما `SELECT` فقط ولا شيء غيرها.
2. تأكيد بقاء `security_invoker=off` بدون تغيير.
3. عدّ صفوف `restaurants` قبل/بعد لتأكيد أن أي بيانات لم تُعدّل أو تُحذف.
4. فتح صفحة مطعم عامة في المتصفح والتأكد من ظهور الاسم/الغلاف/المنيو بشكل طبيعي بدون أخطاء في الـ console.
5. تعذّر INSERT/UPDATE/DELETE/TRUNCATE من `anon` يصبح مضموناً بحكم غياب الصلاحية (permission denied من PostgREST).

## ما تم استثناؤه عن قصد (لوقت لاحق)
- `security_invoker = on` (سبَّب توقف المنيو سابقاً).
- سحب الصلاحيات الزائدة عن `anon` على جدول `restaurants` وبقية الجداول.
- تضييق السياسات من `public` إلى `authenticated`.
