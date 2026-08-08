# تقرير تدقيق أمني لقاعدة البيانات (Audit فقط — لم يتم تنفيذ أي تعديل)

## 1. جدول `restaurants`
- RLS مُفعّل: **نعم** (`relrowsecurity = true`, force = false).
- السياسات الموجودة:
  - SELECT `المالك يقرأ مطعمه فقط` — authenticated — `auth.uid() = owner_id`
  - SELECT `موظف الفرع يقرأ مطعمه` — authenticated — `get_staff_restaurant_id(auth.uid()) = id`
  - SELECT `super_admin_read_all_restaurants` — authenticated — `has_role(auth.uid(),'super_admin')`
  - INSERT — public — `with_check: auth.uid() = owner_id`
  - UPDATE — public — `auth.uid() = owner_id`
  - DELETE — public — `auth.uid() = owner_id`
- الـ Grants: `anon` لديه INSERT/UPDATE/DELETE/TRUNCATE **لكن بدون SELECT**؛ `authenticated` و`service_role` و`postgres` لديهم كل الصلاحيات.
- أعمدة حساسة: `owner_id` (معرّف المستخدم)، `email`. الاثنان **غير موجودين** في الـ view العام.

## 2. الـ view `public_restaurants`
تعريفها الفعلي:

```sql
SELECT id, username, name, description, address, working_hours,
       logo_url, logo_public_id, cover_image_url, cover_image_public_id,
       facebook_url, instagram_url, created_at, updated_at
FROM restaurants;
```

- `security_invoker = **off**` → تُنفَّذ بصلاحيات مالكها `postgres`، ومالك الجدول أيضاً `postgres` ولديه `BYPASSRLS = true` ⇒ **الـ view تتجاوز RLS على `restaurants` بالكامل**.
- قابلة للتعديل تلقائياً: `is_insertable_into = YES`, `is_updatable = YES`، ولا يوجد أي trigger عليها (0 triggers) ⇒ عمليات INSERT/UPDATE/DELETE تُمرَّر مباشرة للجدول الأساسي.
- الصلاحيات على الـ view: **anon و authenticated و service_role و postgres لديهم جميعاً SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN**.

## 3. ماذا يستطيع المستخدم المجهول (anon) فعله عبر `public_restaurants`؟
- قراءة بيانات المطاعم: **نعم** (وهذا مطلوب لصفحة المنيو العامة).
- إدخال مطعم: صلاحية INSERT ممنوحة، لكن العملية تفشل عملياً لأن `owner_id` NOT NULL وغير موجود في الـ view وبلا قيمة افتراضية.
- **تحديث أي مطعم: نعم — ممكن فعلياً** (اسم/وصف/غلاف/لوجو/username لأي مطعم).
- **حذف أي مطعم: نعم — ممكن فعلياً** (وسيؤدي إلى فقدان بيانات مرتبطة).
- TRUNCATE ممنوح أيضاً لـ anon على الـ view.

## 4. تعرّض بيانات حساسة عبر الـ view
- الـ view لا تُخرج `owner_id` ولا `email` ⇒ لا تسريب لبيانات الحساب أو المدفوعات أو الاشتراكات من خلالها.
- جداول `wallets` و`wallet_transactions` و`subscriptions` و`subscription_transactions` منفصلة، RLS مُفعّل عليها، ولا علاقة لها بالـ view.

## 5. مسار المنيو العام (RLS + Grants)
- RLS مُفعّل على كل جداول `public` (19 جدولاً).
- سياسات القراءة العامة `qual: true` موجودة على: `categories, menu_items, sizes, item_variants, extras, offers, branches, delivery_areas, branch_payment_methods` — وهذا مقصود لصفحة المنيو.
- التعديل على هذه الجداول محصور بـ `owner_id = auth.uid()` عبر سياسات ALL — سليم.
- دالة `get_public_restaurant_data` هي SECURITY DEFINER وتقرأ من `public_restaurants` — تعمل بشكل صحيح ولا تحتاج صلاحيات anon مباشرة على الـ view.
- ملاحظة: `orders` تسمح بـ INSERT للجميع (`with_check: true`) مع trigger تحقق — مقبول لتدفق الطلبات لكن يستحق rate limiting.

## 6. لماذا تظهر `public_restaurants` كـ `UNRESTRICTED`؟
لأن الـ Views في Postgres **لا يمكن تفعيل RLS عليها**. Supabase يصنّف أي كائن في الـ Data API لا يحمل RLS بأنه UNRESTRICTED. مع `security_invoker = off` تصبح الـ view نافذة تعمل بصلاحيات `postgres`، أي أنها تتجاوز سياسات الجدول الأساسي تماماً — وهذا ما يجعل التصنيف تحذيراً حقيقياً هنا وليس شكلياً.

---

## النتائج مصنّفة

### Critical
1. `anon` و`authenticated` يملكون UPDATE/DELETE/TRUNCATE على `public_restaurants` وهي view قابلة للتعديل تلقائياً تعمل بصلاحيات `postgres` (BYPASSRLS) ⇒ **أي زائر مجهول يستطيع تعديل أو حذف أي مطعم في النظام** باستخدام المفتاح العام فقط.

### High
2. `security_invoker = off` على view معروضة في الـ Data API — تتجاوز RLS بالكامل بدلاً من احترام صلاحيات المستخدم.
3. `anon` يملك INSERT/UPDATE/DELETE/TRUNCATE على جدول `restaurants` نفسه؛ RLS يحجبها الآن، لكنها صلاحيات زائدة تُوسّع أثر أي خطأ مستقبلي في السياسات.

### Medium
4. صلاحيات موسّعة لـ `anon` على جداول لا تحتاجها إطلاقاً (مثل `branch_staff`, `menu_items` … INSERT/UPDATE/DELETE/TRUNCATE) — الحماية تعتمد على RLS وحده كطبقة واحدة.
5. سياسات كثيرة مكتوبة لدور `public` بدل `authenticated`، ما يجعل نطاقها أوسع من اللازم.

### Low
6. `orders` تسمح بـ INSERT مجهول بلا حد معدّل على مستوى قاعدة البيانات.
7. `public_restaurants` تُخرج `updated_at`/`*_public_id` — غير حسّاسة لكن غير ضرورية للعرض العام.

## الوضع الأمني الحالي
قراءة البيانات محمية بشكل جيد (لا تسريب لبيانات المالك/المدفوعات)، لكن **الكتابة مفتوحة للعموم عبر الـ view** — وهذه ثغرة حرجة قابلة للاستغلال حالياً.

## الإصلاح الموصى به (لن يُنفّذ إلا بموافقتك)
البنية الأسلم: **الـ view للقراءة فقط + RLS يحكم الكتابة على الجدول**.
1. سحب INSERT/UPDATE/DELETE/TRUNCATE من `anon` و`authenticated` على `public_restaurants`، وإبقاء SELECT فقط.
2. تحويل الـ view إلى `security_invoker = on` وإضافة سياسة SELECT عامة على `restaurants` تقتصر على الصفوف المطلوبة، أو الأفضل: الاستمرار في تمرير البيانات العامة عبر دالة `get_public_restaurant_data` (SECURITY DEFINER) وحصر صلاحيات الـ view.
3. سحب صلاحيات الكتابة الزائدة من `anon` على `restaurants` وبقية الجداول التي لا يحتاجها الجمهور، مع إبقاء SELECT حيث يلزم المنيو.
4. تضييق السياسات من `public` إلى `authenticated` حيث ينطبق.
5. (اختياري) `WITH (security_barrier)` وتقليل الأعمدة المعروضة.

أخبرني إذا أردت أن أُعِدّ migration لهذه الإصلاحات.
