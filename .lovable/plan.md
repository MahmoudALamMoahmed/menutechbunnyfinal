

## الخطة: RPC واحدة لجلب بيانات صفحة المطعم العامة

### الفكرة باختصار

دلوقتي صفحة `/:username` بتعمل **7 طلبات HTTP** متتالية للسيرفر (restaurant → categories → menu_items → sizes → extras → branches → delivery_areas). كل طلب فيهم بياخد latency (round-trip) لوحده.

الحل: **RPC function واحدة** اسمها `get_public_restaurant_data(p_username)` بترجع كل البيانات دي مرة واحدة في JSON. النتيجة: **طلب HTTP واحد بدل 7**، السرعة بتزيد بشكل ملحوظ خصوصاً على شبكات الموبايل.

---

### اللي هيتغير

#### 1) Migration جديدة — إنشاء RPC function

```sql
CREATE OR REPLACE FUNCTION public.get_public_restaurant_data(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant record;
  v_result jsonb;
BEGIN
  -- 1) جلب المطعم من الـ view العام
  SELECT * INTO v_restaurant
  FROM public_restaurants
  WHERE username = p_username
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2) تجميع كل البيانات في JSON واحد
  SELECT jsonb_build_object(
    'restaurant', to_jsonb(v_restaurant),

    'categories', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.display_order)
      FROM categories c WHERE c.restaurant_id = v_restaurant.id
    ), '[]'::jsonb),

    'menu_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(m) ORDER BY m.display_order)
      FROM menu_items m
      WHERE m.restaurant_id = v_restaurant.id AND m.is_available = true
    ), '[]'::jsonb),

    'sizes', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.display_order)
      FROM sizes s
      JOIN menu_items mi ON mi.id = s.menu_item_id
      WHERE mi.restaurant_id = v_restaurant.id
    ), '[]'::jsonb),

    'extras', COALESCE((
      SELECT jsonb_agg(to_jsonb(e) ORDER BY e.display_order)
      FROM extras e
      WHERE e.restaurant_id = v_restaurant.id AND e.is_available = true
    ), '[]'::jsonb),

    'branches', COALESCE((
      SELECT jsonb_agg(to_jsonb(b) ORDER BY b.display_order)
      FROM branches b
      WHERE b.restaurant_id = v_restaurant.id AND b.is_active = true
    ), '[]'::jsonb),

    'delivery_areas', COALESCE((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.display_order)
      FROM delivery_areas d
      JOIN branches b ON b.id = d.branch_id
      WHERE b.restaurant_id = v_restaurant.id
        AND b.is_active = true
        AND d.is_active = true
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_restaurant_data(text) TO anon, authenticated;
```

#### 2) `src/hooks/useRestaurantData.ts` — إضافة hook جديدة بدون حذف القديمة

هضيف hook جديدة `usePublicRestaurantData(username)` بتعمل استدعاء واحد للـ RPC وترجّع كل البيانات. **مش هحذف الـ hooks القديمة** لأنها مستخدمة في:

- `useRestaurant` → في `ProtectedRoute.tsx`
- `useBranches` → في `RestaurantFooter.tsx` و `BranchesDialog.tsx`
- `useBranchPaymentMethods` → في `PaymentMethodSection.tsx`
- `useCategories`, `useMenuItems`, `useSizes`, `useExtras`, `useDeliveryAreas` → مستخدمين بس في `Restaurant.tsx` لكن سيبهم موجودين كـ utility متاحة لو احتجناها لاحقاً.

#### 3) `src/pages/Restaurant.tsx` — استبدال 7 hooks بـ hook واحدة

بدل 7 سطور من الـ `useQuery`، هيبقى:

```ts
const { data, isLoading } = usePublicRestaurantData(username);
const restaurant = data?.restaurant;
const allCategories = data?.categories ?? [];
const allMenuItems = data?.menu_items ?? [];
const sizes = data?.sizes ?? [];
const allExtras = data?.extras ?? [];
const allBranches = data?.branches ?? [];
const deliveryAreas = data?.delivery_areas ?? [];
```

كل باقي المنطق (الـ `useMemo` لتطبيق حدود الباقة، الفلترة بالـ category، الـ Cart، الـ Dialogs) **يفضل زي ما هو 100%**.

---

### ضمان عدم كسر أي حاجة

| المكوّن | الحالة |
|---------|--------|
| `ProtectedRoute.tsx` (يستخدم `useRestaurant`) | لم يُمس |
| `RestaurantFooter.tsx` (يستخدم `useBranches`) | لم يُمس |
| `BranchesDialog.tsx` (يستخدم `useBranches`) | لم يُمس |
| `PaymentMethodSection.tsx` (يستخدم `useBranchPaymentMethods`) | لم يُمس |
| `useAvailabilityCheck.ts` (يقرأ `public_restaurants` مباشرة) | لم يُمس |
| RLS policies | بدون تغيير — الـ RPC بتستخدم `SECURITY DEFINER` وبترجع نفس البيانات اللي الـ public RLS بتسمح بيها |
| Schema | بدون أي تغيير في الجداول |
| Cart, Limits, Dialogs | بدون تغيير |

---

### الفائدة المتوقعة

- **قبل:** 7 round-trips متتالية ≈ 7 × ~150ms = ~1s على شبكة 4G
- **بعد:** 1 round-trip ≈ ~200ms (السيرفر بيعمل 6 sub-queries موازية محلياً جوّا Postgres وهي أسرع جداً)
- **تحسّن متوقع:** 60-75% في وقت تحميل صفحة المطعم العامة

---

### الملفات المتأثرة

1. **migration جديدة** — إنشاء `get_public_restaurant_data` RPC
2. **`src/hooks/useRestaurantData.ts`** — إضافة `usePublicRestaurantData` (إضافة فقط، بدون حذف)
3. **`src/pages/Restaurant.tsx`** — استبدال 7 استدعاءات hooks بواحد

وافق على الخطة وأنا هنفّذها.

