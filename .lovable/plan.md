# خطة إضافة العروض (Offers) للمطاعم

## الفكرة العامة

- العروض هتكون **منفصلة عن الأقسام** عشان نقدر نديها شكل مميز.
- هتظهر في صفحة المطعم في **شريط مميز** فوق قائمة الأقسام مباشرة، وتحت الأيقونات (فيسبوك/إنستجرام/فروع).
- على نفس الصف بتاع الأيقونات الاجتماعية (يمين) → نضيف **زر "العروض" بارز على الشمال** (زي ما طلبت).
- العرض يضاف للسلة عادي زي أي صنف.
- نوعين مدعومين: **خصم على صنف موجود**، أو **عرض/كومبو جديد مخصوص**.
- بدون مدة (يفعّل/يوقف يدوياً).

## التغييرات في قاعدة البيانات

جدول جديد `offers`:

```text
offers
├─ id              uuid (PK)
├─ restaurant_id   uuid (NOT NULL)
├─ title           text  (اسم العرض)
├─ description     text  (وصف اختياري)
├─ image_url       text  (صورة العرض - Bunny CDN)
├─ image_public_id text
├─ price           numeric (السعر بعد الخصم - السعر النهائي)
├─ original_price  numeric (السعر قبل الخصم - اختياري للعرض البصري)
├─ menu_item_id    uuid nullable (لو العرض مرتبط بصنف موجود)
├─ is_active       boolean default true
├─ display_order   integer default 0
├─ created_at, updated_at
```

**RLS:**

- SELECT للجميع (true) — عشان صفحة المطعم العامة.
- ALL لصاحب المطعم (`owner_id = auth.uid()`).

**تعديل RPC `get_public_restaurant_data`:** نضيف `offers` للنتيجة عشان الصفحة العامة تجيب العروض في نفس الاستدعاء (نحافظ على الأداء، بدون طلبات إضافية).

## التغييرات في الواجهة

### 1) صفحة المطعم `src/pages/Restaurant.tsx`

- في الصف اللي فيه الأيقونات الاجتماعية، نضيف على **الشمال** زر "🔥 العروض" بتصميم جذاب:
  - Gradient ناري (أحمر/برتقالي) مع animation خفيف (pulse/shine).
  - Badge بعدد العروض النشطة.
  - مخفي تماماً لو مفيش عروض (`offers.length === 0`).
- لما يدوس على الزر، يفتح **Dialog** فيه شبكة العروض (كروت بصورة + سعر قبل/بعد + زر "أضف للسلة").
- بديل/إضافة: قسم "العروض" يظهر برضو في نفس الصفحة فوق `MenuGrid` لو في عروض، بتصميم مميز (كروت أعرض، badge "خصم"، السعر القديم مشطوب).
  - **القرار المقترح:** نخلي **الاتنين**: زر بارز فوق + شريط عروض مميز فوق `MenuGrid`. ده الأنسب تسويقياً.
- عند الضغط على عرض، يفتح `ProductDetailsDialog` المعدّل ليتعامل مع العرض:
  - لو مرتبط بـ `menu_item_id` → يستخدم نفس بيانات الصنف (sizes/extras) مع تطبيق سعر العرض.
  - لو عرض مستقل → يضيف للسلة مباشرة بسعر العرض، بدون أحجام/إضافات.

### 2) إدارة العروض

- نضيف Section جديد في `src/pages/MenuManagement.tsx` اسمه "العروض" (بجانب الأقسام/الأصناف/الإضافات).
- مكوّن جديد `src/components/menu-management/OffersSection.tsx` يدير CRUD + ترتيب (DnD) + رفع صورة عبر `ImageUploader` (نسبة 1:1 أو 4:3).
- نموذج العرض يسمح:
  - اختيار صنف موجود (dropdown اختياري) أو ترك فارغ لإنشاء عرض مستقل.
  - تحديد السعر الجديد + (اختياري) السعر القديم للشطب.
  - عنوان، وصف، صورة.

### 3) Hooks جديدة

- `src/hooks/admin-mutations/useOfferMutations.ts`: useSaveOffer, useDeleteOffer, useReorderOffers.
- في `useAdminData.ts`: `useAdminOffers(restaurantId)`.
- `usePublicRestaurantData` تُحدَّث لتشمل `offers` (تعديل تلقائي بعد تعديل RPC).

### 4) السلة `useCart`

- نضيف نوع item جديد فيه flag `is_offer` و `offer_id` عشان نمنع تعارض IDs لو عرض مرتبط بصنف موجود (نخزن المفتاح كـ `offer:{id}` بدل `{menu_item_id}`).
- WhatsApp message generator يعرض اسم العرض + علامة "🔥 عرض".

## ملفات هتتعدل/تتنشأ

**ملفات جديدة:**

- `src/components/menu-management/OffersSection.tsx`
- `src/components/restaurant/OffersStrip.tsx` (الشريط فوق القائمة)
- `src/components/restaurant/OffersDialog.tsx` (Dialog كل العروض)
- `src/hooks/admin-mutations/useOfferMutations.ts`

**ملفات هتتعدل:**

- `src/pages/Restaurant.tsx` (زر العروض + الشريط)
- `src/pages/MenuManagement.tsx` (إضافة OffersSection)
- `src/hooks/useAdminData.ts` (useAdminOffers)
- `src/hooks/admin-mutations/index.ts` (export)
- `src/hooks/useCart.ts` (دعم العروض)
- `src/components/ProductDetailsDialog.tsx` (دعم العروض)
- `src/components/restaurant/CartDialog.tsx` / WhatsApp generator (تمييز العروض)
- `src/components/restaurant/RestaurantSkeleton.tsx` (skeleton للشريط الجديد عشان CLS = 0)

## ملاحظات الأداء (LCP/CLS/INP)

- نحافظ على `RestaurantSkeleton` متطابق مع الواجهة الفعلية (نضيف placeholder للزر والشريط بنفس الأبعاد).
- صور العروض تستخدم `loading="lazy"` ماعدا اللي ظاهرة فوق الـ fold.
- البيانات تجيب مع نفس الـ RPC → بدون round-trips إضافية.

## خطوات التنفيذ بالترتيب

1. Migration: إنشاء جدول `offers` + RLS + تعديل RPC `get_public_restaurant_data`.
2. Hooks (admin + public read).
3. شاشة إدارة العروض في `MenuManagement`.
4. الزر المميز + شريط العروض في صفحة المطعم.
5. Dialog تفاصيل العرض + تكامل السلة.
6. تحديث Skeleton + اختبار CLS.

تحب أبدأ التنفيذ كده ولا عايز تعديل في حاجة (مثلاً تختار: زر بس بدون شريط، أو شريط بس بدون زر)؟  
  
ملحوظات مهمه :  
تمام نفذ الخطة ولكن انا عايزك تستخدم best practice  
وعايز الكود يكون متماشي ومرتب زي باقي اكواد المشروع  
واعمل حساب clean code + scalable للمشروع  
لو تقدر تنفذ migrations من غير ما تاخد موافقتي اعمل كدا انا موافق