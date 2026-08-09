# إصلاح صلاحيات `anon` على جدول `restaurants` — نطاق مضيّق

## رأيي في تعديلك: موافق وأفضل من اقتراحي
- `REVOKE ALL` أنظف من تعداد الصلاحيات: يسحب `MAINTAIN` وأي صلاحية تضيفها إصدارات Postgres لاحقًا، ولا يترك بقايا.
- آمن تمامًا لأن `anon` لا يحتاج **أي** صلاحية على الجدول: القراءة العامة تمر عبر الـ view `public_restaurants` وعبر `get_public_restaurant_data` (SECURITY DEFINER)، و`anon` لا يملك SELECT على الجدول أصلًا منذ الآن.
- تأجيل تنظيف `authenticated` قرار سليم: تلك الصلاحيات الزائدة (`TRUNCATE, TRIGGER, REFERENCES`) تجميلية ومحجوزة بـ RLS، وليست ثغرة. نتركها لمهمة منفصلة.

## التغيير الوحيد المطلوب

```sql
REVOKE ALL PRIVILEGES ON TABLE public.restaurants FROM anon;
```

لا شيء غير هذا السطر.

## ما لن يُلمس (التزامًا بطلبك)
- `authenticated` — بلا أي تغيير.
- أي سياسة RLS على أي جدول.
- الـ view `public_restaurants` وخصائصه بما فيها `security_invoker`.
- الدالة `get_public_restaurant_data`.
- `service_role` و`postgres`.
- أي ملف كود في المشروع، وأي جدول آخر.

## التحقق بعد التنفيذ (قراءة/اختبار فقط)
1. استعلام `aclexplode` على `public.restaurants` لتأكيد عدم بقاء أي صف لـ `anon`.
2. تأكيد بقاء `SELECT, INSERT, UPDATE, DELETE` لـ `authenticated` كما كانت.
3. اختبار كتابة بمفتاح anon عبر `curl` (PATCH و DELETE) → يجب أن ترجع `permission denied`.
4. اختبار صفحة المنيو العامة في المتصفح: الاسم/الغلاف/الأصناف تظهر بدون أخطاء في الـ console.
5. اختبار مسار إنشاء المطعم بعد تسجيل مستخدم (`ensureRestaurantExists` يعمل بدور `authenticated`).
6. اختبار تعديل بيانات المطعم من لوحة التحكم (`useSaveRestaurant`).
7. عدّ صفوف `restaurants` ومقارنة `updated_at` قبل/بعد لتأكيد عدم تغيّر أي بيانات.

## بعد التنفيذ
تقرير بالنتيجة فقط، دون أي إصلاح إضافي حتى لو ظهرت ملاحظات أخرى.
