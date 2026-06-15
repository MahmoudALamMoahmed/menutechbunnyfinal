## الهدف
إضافة "إدارة الأنواع" بجوار "إدارة الأحجام" للأصناف، مع عرض النوع المختار بتصميم مميز في السلة والطلبات.

## التصميم المقترح

### 1) قاعدة البيانات (migration واحدة)
- جدول جديد `public.item_variants` مطابق لبنية `sizes` لكن `price` **nullable** (لأن النوع قد لا يكون له سعر):
  - `id, menu_item_id (FK→menu_items ON DELETE CASCADE), name TEXT, price NUMERIC NULL, display_order INT, created_at, updated_at`
- GRANTs كاملة (anon SELECT + authenticated CRUD + service_role) و RLS بنفس سياسات `sizes` (قراءة عامة، كتابة لمالك المطعم/سوبر أدمن).
- Trigger `update_updated_at_column`.
- تحديث RPC `get_public_restaurant_data` لإرجاع مفتاح `item_variants` (مثل `sizes`).
- إضافة `item_variants` إلى `batch_update_display_order` whitelist.

### 2) Admin: SizesDialog → تبويبين
- إعادة تسمية الديالوج: **"إدارة الأحجام والأنواع"**.
- استخدام `Tabs` من shadcn بداخله: تبويب "الأحجام" (الموجود حالياً) + تبويب "الأنواع".
- تبويب الأنواع: نفس واجهة الأحجام مع جعل حقل السعر **اختيارياً** ونص توضيحي "اتركه فارغاً إذا لم يكن للنوع سعر إضافي".
- استخراج النموذج المشترك في sub-component `VariantFormList` لتفادي التكرار (clean code).

### 3) Hooks & mutations
- في `useRestaurantData.ts`: إضافة `useAdminVariants` و include `item_variants` ضمن data العامة.
- في `useMenuMutations.ts`: إضافة `useSaveVariant` + `useDeleteVariant` (نفس نمط sizes).
- في `MenuManagement.tsx`: تمرير variants للديالوج وربط الـ delete dialog لنوع `"variant"`.

### 4) واجهة العميل (ProductDetailsDialog)
- بعد قسم الأحجام، قسم "اختر النوع" (RadioGroup مشابه تصميمياً للأحجام، لكن يعرض السعر فقط إذا كان موجوداً، وإلا يعرض اسم النوع فقط).
- إذا وُجدت أنواع للصنف → الاختيار **إلزامي** قبل الإضافة للسلة (نفس منطق الأحجام).
- حساب السعر النهائي: `basePrice + (variant.price ?? 0) + extras`.

### 5) useCart
- إضافة `selectedVariant?: Variant` إلى `CartItem`.
- تحديث `getCartKey` ودوال `addToCart`/`removeFromCart` لتضمين `variantId` ضمن المفتاح الفريد.
- توست الإضافة يذكر النوع.

### 6) CartDialog — تصميم مميز للنوع
- بدلاً من السطر النصي البسيط الخاص بالحجم، يُعرض النوع كـ **chip/Badge ملوّن** (مثلاً `bg-accent/15 text-accent border border-accent/30 rounded-full px-2 py-0.5`) بأيقونة صغيرة (مثل `Tag` من lucide) بجوار اسم الصنف — مختلف بصرياً عن سطر "الحجم: …".
- تحديث `removeFromCart` لتمرير `variantId`.
- تحديث `buildOrderData` و رسالة واتساب لتضمين النوع: `🏷️ النوع: ...`.

### 7) عرض النوع في الطلبات
- `OrderCard` (لوحة التحكم + WhatsApp orders): عرض النوع من `items[].variant` بنفس نمط الـ chip.

### 8) تنظيف
- لا حذف لميزات قائمة. تعديلات additive فقط.
- TypeScript types ستُحدَّث تلقائياً من Supabase بعد الـ migration.

## الملفات المتأثرة
- migration جديدة (DB + RPC + grants).
- `src/components/menu-management/SizesDialog.tsx` (إعادة هيكلة بـ Tabs، ربما تغيير الاسم للملف لاحقاً — سنبقيه لتقليل diff).
- `src/pages/MenuManagement.tsx` (variants data + delete branch).
- `src/hooks/useRestaurantData.ts`, `src/hooks/admin-mutations/useMenuMutations.ts`.
- `src/components/ProductDetailsDialog.tsx`.
- `src/hooks/useCart.ts`.
- `src/components/restaurant/CartDialog.tsx`.
- `src/components/OrderCard.tsx` (عرض النوع).

## ملاحظات تقنية
- استخدام `Tag` icon ومتغير لون موجود في design system (لا ألوان مباشرة).
- لا تعديل على هيكل `orders.items` (jsonb) — مجرد إضافة حقل `variant` اختياري.
- الأداء: variants تُجلب ضمن نفس `get_public_restaurant_data` (لا طلبات إضافية).