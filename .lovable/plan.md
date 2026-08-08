# تقرير تدقيق: هل `public_restaurants` أصبح غير ضروري؟

## 1. هل هو مستخدم حاليًا؟ نعم — ولا يزال ضروريًا

`public_restaurants` **ليس** مستخدمًا فقط داخل `get_public_restaurant_data`. يوجد مسارَان في الـ frontend يقرآن منه مباشرة:

| المكان | الكود | لماذا يحتاجه |
|---|---|---|
| `src/hooks/useRestaurantData.ts` (`useRestaurant`) | `.from('public_restaurants').select('*').eq('username', …)` | يُستدعى من `src/components/ProtectedRoute.tsx` للتحقق من ملكية المطعم قبل فتح صفحات لوحة التحكم |
| `src/hooks/useAvailabilityCheck.ts` (`useUsernameAvailability`) | `.from('public_restaurants').select('id').eq('username', …)` | يُستدعى من `src/pages/Auth.tsx` للتحقق من توفر اسم المستخدم أثناء التسجيل |

بالإضافة إلى استخدام الدالة نفسها. أيضًا `src/components/RestaurantFooter.tsx` يستنتج نوعه من `Tables<'public_restaurants'>` (نوع TypeScript فقط، لا استعلام).

لا يوجد أي استخدام له في أي Edge Function (تم فحص كل الملفات في `supabase/functions`).

## 2. تعريف الدالة والـ view (حالة فعلية مؤكدة)

- `get_public_restaurant_data` هي `SECURITY DEFINER` وتبدأ بـ:
  `SELECT * INTO v_restaurant FROM public_restaurants WHERE username = p_username`
  ثم تقرأ مباشرةً من الجداول: `categories`, `menu_items`, `sizes`, `item_variants`, `extras`, `branches`, `delivery_areas`, `offers`.
  فهي تعتمد على view واحد فقط هو `public_restaurants`.
- `public_restaurants` = `SELECT` بأعمدة محددة من `restaurants` (بدون `owner_id` وبدون `email`)، وخصائصه `security_invoker=off` أي يعمل بصلاحيات المالك ويتجاوز RLS.
- الصلاحيات الحالية بعد إصلاح الأمس: `anon` و`authenticated` لهما `SELECT` فقط. `postgres` و`service_role` لهما كل الصلاحيات.
- سياسات RLS على `restaurants` لا تسمح لـ `anon` بأي قراءة، و`authenticated` يقرأ مطعمه فقط أو مطعم فرعه أو الكل لو super_admin. لذلك **القراءة العامة للمنيو تعتمد كليًا على تجاوز الـ view لـ RLS**.

## 3. هل يمكن للـ RPC القراءة من `restaurants` مباشرة؟

تقنيًا نعم: الدالة `SECURITY DEFINER` فتتجاوز RLS بنفسها، ولا حاجة للـ view من ناحية الوصول. لكن الـ view يقوم بدور **column allow-list**: `SELECT *` من الـ view يُرجع 14 عمودًا آمنًا فقط. لو صارت `SELECT * FROM restaurants` فسيدخل `owner_id` و`email` إلى الـ JSON الذي يُرسل لكل زائر مجهول — وهو تسريب بيانات فوري. أي تحويل يجب أن يستبدل `SELECT *` بقائمة أعمدة صريحة (`to_jsonb(json_build_object(...))`) وهذا يعني نسخ الـ allow-list داخل الدالة.

## 4. هل يمكن حذفه بأمان؟ لا

الحذف الآن سيُعطّل:
- `ProtectedRoute` → كل صفحات لوحة التحكم (`/:username/dashboard` وما يتبعها) تفشل في التحقق من الملكية.
- شاشة التسجيل في `Auth.tsx` → فحص توفر اسم المستخدم.
- `get_public_restaurant_data` → صفحة المنيو العامة بالكامل حتى تُعاد كتابة الدالة.
- أنواع TypeScript في `RestaurantFooter.tsx` (خطأ build).

المسارات التي لا تتأثر: الطلبات، الفروع، المحفظة/الاشتراكات، Super Admin، كل الـ Edge Functions، والمصادقة نفسها (Supabase Auth).

## 5. مقارنة المعمارية

```text
الحالية:  Customer → RPC (definer) → public_restaurants (invoker=off, أعمدة آمنة) → restaurants
          Owner/Signup → PostgREST → public_restaurants (SELECT فقط) → restaurants

المقترحة: Customer → RPC (definer) → restaurants
          Owner/Signup → ؟ (يحتاج بديلًا: RPC جديدة أو سياسة RLS عامة على restaurants)
```

المقترحة توفّر طبقة واحدة داخل الـ RPC فقط، لكنها تُجبرنا على بناء بديلين إضافيين لمساري لوحة التحكم والتسجيل، وتنقل حماية الأعمدة من تعريف مركزي واحد إلى داخل نص الدالة.

## 6. الأمان: من هو security boundary؟

- الـ RPC هو حدّ أمني جيد **للمنيو العام**: مدخل واحد (`username`)، مخرج JSON ثابت، لا يسمح للعميل باختيار أعمدة أو فلاتر.
- لكن الـ view يبقى حدًّا أمنيًا مستقلًا ومفيدًا: هو الوسيلة الوحيدة الحالية التي تتيح قراءة عامة/شبه عامة لبيانات المطعم دون فتح `SELECT` لـ `anon` على `restaurants`. إزالته ستدفع للحل الأسوأ (سياسة RLS عامة على `restaurants` = تسريب `owner_id`/`email`).
- مخاطر جعل الـ RPC يقرأ من `restaurants` مباشرة: تسريب `owner_id`/`email` عند `SELECT *`، وضياع الـ allow-list المركزي، واحتمال أن أي عمود حساس يُضاف مستقبلًا إلى `restaurants` يظهر تلقائيًا للجمهور.

## 7. ملاحظة خارج النطاق (لم يُطلب إصلاحها الآن)

الاستعلام على الصلاحيات كشف أن `anon` لا يزال يملك `INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES, MAINTAIN` على جدول `restaurants` نفسه (لا يملك `SELECT`). الحماية الحالية هي RLS فقط، وسياسة الإنشاء `(auth.uid() = owner_id)` تنطبق على دور `public`. الخطر عمليًا محجوز بـ RLS، لكن هذه صلاحيات زائدة لا مبرر لها ويُستحسن سحبها في مهمة أمنية لاحقة.

## 8. التوصية: الإبقاء على `public_restaurants`

- المكاسب من الحذف صغيرة: طبقة واحدة أقل وتنظيف مفهومي. لا ربح في الأداء (الـ view مجرد rewrite ولا يضيف تكلفة تنفيذ).
- التكلفة كبيرة: إعادة كتابة الدالة بقائمة أعمدة صريحة + بناء بديلين لـ `ProtectedRoute` والتسجيل + تعديل أنواع TypeScript + مخاطر تسريب أعمدة.
- الأفضل تركه كما هو الآن، وإن أردت التنظيف لاحقًا يكون على مرحلتين: أولًا تحويل `ProtectedRoute` والتسجيل إلى RPC مخصصة صغيرة، وبعد أن يصبح الـ view بلا أي مستخدم غير الدالة يُعاد تقييم حذفه.

**لم يُنفّذ أي تعديل. هذا تحليل فقط.** وافق إن أردتني أن أنتقل لأي من الخطوات المقترحة.
