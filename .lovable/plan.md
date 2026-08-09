# تقرير تدقيق: صلاحيات الكتابة على جدول `restaurants`

**لم يُنفَّذ أي تعديل. تحليل فقط.**

## 1. الوضع الفعلي للصلاحيات (مؤكد بالاستعلام)

| الدور | الصلاحيات الحالية على `restaurants` |
|---|---|
| `anon` | INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES, MAINTAIN — **وبدون SELECT** |
| `authenticated` | SELECT + INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES, MAINTAIN |
| `service_role` | كل الصلاحيات |
| `postgres` | كل الصلاحيات |

سبب وجود صلاحيات `anon` غير المنطقية: إنها من الـ **default grants القديمة** لمخطط `public` في Supabase (كان `GRANT ALL ON ALL TABLES ... TO anon, authenticated` يُطبَّق تلقائيًا عند إنشاء المشروع). لا يوجد أي كود في المشروع يطلبها. لاحظ التناقض الدال: `anon` يملك DELETE ولا يملك SELECT — لم يمنحها أحد بنيّة، فهي إرث تلقائي. (سُحب SELECT سابقًا لأنه كان الخطر الظاهر، وبقيت صلاحيات الكتابة.)

## 2. كل عمليات الكتابة على `restaurants` في المشروع

| الموقع | العملية | الدور المُنفِّذ فعليًا |
|---|---|---|
| `src/hooks/useAuth.tsx` سطر ~167 (`ensureRestaurantExists`) | INSERT مع `owner_id: user.id` | `authenticated` — الدالة تعود مباشرة بخطأ لو `!user`، فلا تُنفَّذ إطلاقًا بدور `anon` |
| `src/hooks/admin-mutations/useRestaurantMutations.ts` سطر 14 | UPDATE ... eq('id', id) | `authenticated` (داخل لوحة تحكم محمية بـ `ProtectedRoute`) |
| `src/hooks/admin-mutations/useRestaurantMutations.ts` سطر 17 | INSERT مع `owner_id: ownerId` | `authenticated` |

- **DELETE**: لا يوجد أي كود في المشروع يحذف صفًّا من `restaurants` — لا في الـ frontend، ولا في Super Admin (فحصت `useSuperAdminMutations.ts` و`RestaurantsTab.tsx`: قراءة فقط). سياسة الحذف موجودة في RLS لكن لا مستهلك لها.
- **دوال قاعدة البيانات**: فحصت كل دوال `public`؛ الدالتان الوحيدتان التي تذكران `restaurants` هما `get_public_restaurant_data` و`validate_order_insert`، وكلتاهما **قراءة فقط**. لا توجد أي دالة `SECURITY DEFINER` تكتب في `restaurants`.
- **Edge Functions**: `bunny-upload`، `bunny-delete`، `create-branch-staff`، `delete-branch-staff`، `create-payment-session` كلها تستعلم `restaurants` بـ `select('id')` للتحقق من الملكية فقط. لا كتابة. (ولو كتبت، فهي تستخدم `service_role` غير المتأثر.)

## 3. تدفق إنشاء المطعم عند التسجيل

1. `signUp()` ينشئ حساب Supabase Auth ويخزن `{username, restaurantName}` في `localStorage` فقط — **لا لمس لجدول `restaurants` هنا**.
2. بعد وجود جلسة (تأكيد الإيميل أو جلسة فورية) يُنادى `ensureRestaurantExists()`، وهو يبدأ بـ `if (!user) return` ثم `INSERT` بـ `owner_id: user.id`.
3. الدور المُنفِّذ: `authenticated` (الـ JWT موجود).
4. سياسة RLS للإدخال: `WITH CHECK (auth.uid() = owner_id)` — فلا يمكن لأحد إنشاء مطعم باسم مالك آخر، ولا يمكن لـ `anon` تمريرها أصلًا لأن `auth.uid()` تكون NULL.
5. **سحب INSERT من `anon` لن يعطّل التسجيل**، لأن الإدخال لا يحدث أبدًا قبل توفر الجلسة.
6. فحص توفر اسم المستخدم في `Auth.tsx` يقرأ من الـ view `public_restaurants` (لا من الجدول)، فلا يتأثر.

## 4. تدفقات صاحب المطعم / المشرف

- **تحديث بيانات المطعم** (`RestaurantInfo.tsx` → `useSaveRestaurant`): `authenticated` + سياسة `USING (auth.uid() = owner_id)`. ملاحظة: سياسة التحديث ليس لها `WITH CHECK`، ما يعني نظريًا أن المالك يستطيع تغيير `owner_id` لمطعمه إلى مستخدم آخر (تسليم ملكية غير مقصود). خارج نطاق هذا التدقيق لكن يستحق التسجيل.
- **حذف مطعم**: غير مستخدم من التطبيق أصلًا (السياسة موجودة، لا واجهة تستدعيها).
- **الإعدادات الأخرى** (الشعار/الغلاف/السوشيال/ساعات العمل): كلها UPDATE عبر نفس الـ mutation، دور `authenticated`.
- **Super Admin**: قراءة فقط على `restaurants` عبر سياسة `super_admin_read_all_restaurants`.

## 5. الحد الأدنى الموصى به لكل دور

| الدور | المطلوب فعلًا | ما يجب سحبه |
|---|---|---|
| `anon` | **لا شيء** على `restaurants`. القراءة العامة تمر عبر الـ view `public_restaurants` وعبر `get_public_restaurant_data` (SECURITY DEFINER) | INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES, MAINTAIN |
| `authenticated` | SELECT, INSERT, UPDATE (وDELETE إن أردت الاحتفاظ بمسار حذف مستقبلي؛ حاليًا غير مستخدم) | TRUNCATE, TRIGGER, REFERENCES, MAINTAIN |
| `service_role` | كل الصلاحيات (تبقى كما هي) | لا شيء |
| `postgres` | كما هي | لا شيء |

## 6. الإجابة المباشرة: نعم، يمكن سحب كل صلاحيات الكتابة من `anon` بأمان

لن يتأثر: التسجيل، إنشاء المطعم، لوحة التحكم، تعديل المطعم، حذف المطعم (غير مستخدم)، المنيو العام، أي Edge Function، أي دالة RPC.
السبب: لا يوجد سطر واحد في المشروع يكتب في `restaurants` بدون جلسة مستخدم، والقراءة العامة لا تمر بالجدول مباشرة.

## 7. التغييرات الموصى بها بالضبط (للتنفيذ بعد موافقتك)

```sql
-- 1) سحب كل صلاحيات الكتابة الموروثة عن الزائر المجهول
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.restaurants FROM anon;

-- 2) سحب الصلاحيات الزائدة عن المستخدم المسجّل (تبقى SELECT/INSERT/UPDATE/DELETE)
REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.restaurants FROM authenticated;
```

ملاحظات تنفيذية:
- لا يُلمس `service_role` ولا `postgres`، فالـ Edge Functions تعمل كما هي.
- `MAINTAIN` صلاحية PG 17 وتُسحب ضمنًا مع `REVOKE ALL`؛ لو أردت ضمان سحبها نستخدم `REVOKE ALL` على `anon` (آمن لأن `anon` لا يحتاج SELECT على الجدول) بدل التعداد.
- لا تغيير على أي سياسة RLS ولا على الـ view ولا على كود التطبيق.

### التحقق المقترح بعد التنفيذ
1. استعلام `aclexplode` لتأكيد أن `anon` لم يبقَ له أي صلاحية على `restaurants`.
2. محاولة PATCH/DELETE بمفتاح anon عبر `curl` → يجب أن ترجع `permission denied`.
3. فتح صفحة منيو عامة + تسجيل مستخدم جديد + تعديل بيانات مطعم من اللوحة للتأكد أن كل شيء يعمل.

## 8. بند إضافي رصدته (لا يشمله الإصلاح المقترح)

سياسة `أصحاب المطاعم يمكنهم تحديث مطعمهم` بلا `WITH CHECK`، وسياستا الإنشاء/التحديث/الحذف مُعرَّفة لدور `public` بدل `authenticated`. الأثر العملي محدود لأن `auth.uid()` تكون NULL للزائر، لكن تضييقها لاحقًا يعطي طبقة دفاع إضافية. أذكرها للعلم فقط ولم أدرجها في التغييرات المقترحة احترامًا لنطاق طلبك.
