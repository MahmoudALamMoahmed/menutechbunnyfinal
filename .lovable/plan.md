# Audit فقط: سياسة UPDATE على `public.restaurants`

## 1) التعريف الحالي للسياسات (قراءة من `pg_policies`)

| العملية | اسم السياسة | الأدوار | USING | WITH CHECK |
|---|---|---|---|---|
| UPDATE | أصحاب المطاعم يمكنهم تحديث مطعمهم | `public` | `auth.uid() = owner_id` | **لا يوجد (NULL)** |
| INSERT | أصحاب المطاعم يمكنهم إنشاء مطعمهم | `public` | — | `auth.uid() = owner_id` |
| DELETE | أصحاب المطاعم يمكنهم حذف مطعمهم | `public` | `auth.uid() = owner_id` | — |
| SELECT | المالك يقرأ مطعمه فقط | `authenticated` | `auth.uid() = owner_id` | — |
| SELECT | موظف الفرع يقرأ مطعمه | `authenticated` | `get_staff_restaurant_id(auth.uid()) = id` | — |
| SELECT | super_admin_read_all_restaurants | `authenticated` | `has_role(auth.uid(),'super_admin')` | — |

ملاحظة: سياسات UPDATE/INSERT/DELETE مكتوبة لدور `public` (أي كل الأدوار)، لكن `anon` لم يعد يملك أي GRANT على الجدول بعد الإصلاح السابق، فعمليًا لا تنطبق إلا على `authenticated`.

## 2) ماذا يستطيع مستخدم `authenticated` فعله عمليًا الآن؟

- يمكنه تحديث **الصف الذي يملكه فقط** (`owner_id = auth.uid()`) لأن USING تحصر الصفوف المرئية للتحديث.
- لكن **بعد** التحديث لا يوجد أي تحقق على القيمة الجديدة، لأن Postgres عند غياب `WITH CHECK` في سياسة UPDATE يستخدم تعبير `USING` نفسه للتحقق من الصف الجديد. أي أن الصف الناتج يجب أن يحقق `auth.uid() = owner_id`.
- **النتيجة العملية:** تغيير `owner_id` إلى مستخدم آخر **مرفوض** من RLS، لأن الصف الجديد لن يحقق `auth.uid() = owner_id` (خطأ `42501 new row violates row-level security policy`). أما تعيين `owner_id` لنفس القيمة فمسموح.
- ما يستطيع تغييره فعليًا: `name`, `username`, `description`, `email`, `logo_url/logo_public_id`, `cover_image_url/cover_image_public_id`, `address`, `working_hours`, `facebook_url`, `instagram_url`.
- لا يوجد أي تحقق على `username` (طول/شكل/كلمات محجوزة) — القيد الوحيد هو تفرّده على مستوى قاعدة البيانات.

اختبار آمن مقترح (لم يُنفَّذ في هذا التدقيق لأنه يحتاج جلسة مستخدم حقيقية): تنفيذ `UPDATE ... SET owner_id = <uuid آخر>` داخل `BEGIN; ... ROLLBACK;` بجلسة `authenticated`. المتوقع: رفض بالخطأ `42501`.

## 3) مراجعة كود المشروع الذي ينفّذ UPDATE على `restaurants`

مكان واحد فقط:
- `src/hooks/admin-mutations/useRestaurantMutations.ts` → `supabase.from('restaurants').update(data).eq('id', id)`

المُستدعون:
- `src/pages/RestaurantInfo.tsx`: يرسل `name, username, description, email, cover_image_url, logo_url, cover_image_public_id, logo_public_id`.
- `src/pages/FooterManagement.tsx`: يرسل `address, email, facebook_url, instagram_url, working_hours`.

`owner_id` **لا يُرسل أبدًا في أي UPDATE** — يُستخدم فقط في INSERT عند إنشاء المطعم (`useAuth.tsx` و INSERT داخل نفس الـ hook). بقية استخدامات `owner_id` في Edge Functions هي `select ... eq('owner_id', user.id)` للتحقق من الملكية، وليست كتابة.

لا توجد أي عملية UPDATE على `restaurants` في أي Edge Function.

## 4) هل `WITH CHECK (auth.uid() = owner_id)` مطلوبة؟

- **أمنيًا: غير مطلوبة لسدّ ثغرة.** غياب `WITH CHECK` لا يفتح ثغرة هنا لأن Postgres يعيد استخدام `USING` للتحقق من الصف الجديد، وتغيير `owner_id` لمستخدم آخر مرفوض أصلًا.
- **كتحسين توثيقي/دفاعي: مفيدة.** إضافتها تجعل النية صريحة، وتحمي من تعديل مستقبلي يُوسّع `USING` (مثل السماح لـ super_admin أو موظف الفرع بالتحديث) فينتقل الفحص تلقائيًا إلى شرط أوسع دون أن يلاحظ أحد.
- **التأثير على التطبيق: صفر.** لأن الكود لا يرسل `owner_id` في UPDATE، والسلوك المُطبَّق حاليًا مطابق تمامًا.

## 5) SQL المقترح (لن يُنفَّذ إلا بموافقة منفصلة)

```sql
ALTER POLICY "أصحاب المطاعم يمكنهم تحديث مطعمهم"
  ON public.restaurants
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

اختياري ومنفصل (لم أطلبه ضمن هذا النطاق): تضييق أدوار سياسات UPDATE/INSERT/DELETE من `public` إلى `TO authenticated` — تجميلي فقط لأن `anon` بلا GRANT.

## 6) ما لم يُلمس في هذا التدقيق
لا `ALTER/DROP/CREATE POLICY`، لا تعديل على `restaurants` أو `public_restaurants` أو الـ RPC، ولا أي تغيير في الكود أو البيانات. كل ما نُفِّذ: استعلام قراءة على `pg_policies` وبحث نصي في ملفات المشروع.
