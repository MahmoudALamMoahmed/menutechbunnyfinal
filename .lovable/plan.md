# تصميم `create_order()` — دالة إنشاء الطلب الآمنة (تصميم فقط، بدون تنفيذ)

الهدف: يصبح إنشاء الطلب عبر **دالة واحدة** `SECURITY DEFINER` تستقبل **معرّفات وكميات فقط**، وتعيد حساب كل الأسعار من الجداول. الواجهة لا تُرسل أي سعر ولا إجمالي.

## 1) التوقيع والمدخلات

```sql
create or replace function public.create_order(
  p_restaurant_username text,
  p_branch_id           uuid,
  p_delivery_area_id    uuid,
  p_customer_name       text,
  p_customer_phone      text,
  p_customer_address    text,
  p_payment_method      text,        -- 'cash' أو name من branch_payment_methods
  p_order_source        text,        -- 'dashboard' | 'whatsapp'
  p_items               jsonb,       -- انظر الشكل أدناه
  p_notes               text default null
) returns jsonb                      -- { order_id, subtotal, delivery_fee, total_price, items }
language plpgsql security definer set search_path = public
```

شكل كل عنصر في `p_items` (لا يوجد أي حقل سعر):

```json
{ "menu_item_id": "uuid|null", "offer_id": "uuid|null",
  "size_id": "uuid|null", "variant_id": "uuid|null",
  "extra_ids": ["uuid", "..."], "quantity": 2 }
```

قاعدة: كل عنصر يحمل **إما** `menu_item_id` **أو** `offer_id`، لا الاثنين ولا لا شيء.

## 2) الجداول التي تُقرأ

`restaurants` (لتحويل username → id)، `branches`، `delivery_areas`، `branch_payment_methods`، `menu_items`، `sizes`، `item_variants`، `extras`، `offers`. والكتابة في `orders` فقط.

## 3) الفحوصات بالترتيب

1. **المطعم**: `select id into v_rid from restaurants where username = p_restaurant_username` → غير موجود ⇒ `RESTAURANT_NOT_FOUND`.
2. **بيانات العميل**: `trim` ثم رفض الفارغ؛ `length(name) <= 100`، `address <= 300`، `phone` مطابق لـ `^[0-9+\s-]{7,20}$` ⇒ `INVALID_CUSTOMER_DATA`.
3. **الفرع**: إذا كان للمطعم فروع فعّالة فـ `p_branch_id` إلزامي، ويجب `branches.restaurant_id = v_rid AND is_active` ⇒ `INVALID_BRANCH`.
4. **منطقة التوصيل**: إذا للفرع مناطق فعّالة فـ `p_delivery_area_id` إلزامي، ويجب `delivery_areas.branch_id = p_branch_id AND is_active`. تُقرأ `delivery_price` من الجدول → `v_delivery_fee` (0 عند عدم وجود منطقة) ⇒ `INVALID_DELIVERY_AREA`.
5. **طريقة الدفع**: `'cash'` مقبولة دائمًا؛ غير ذلك يجب أن توجد في `branch_payment_methods` بنفس `p_branch_id` و`is_active` ⇒ `INVALID_PAYMENT_METHOD`.
6. **المصدر**: `p_order_source in ('dashboard','whatsapp')`. اختياريًا مطابقته لـ `branches.order_mode`.
7. **السلة**: `jsonb_typeof(p_items)='array'` وطولها بين 1 و 50 ⇒ `EMPTY_CART` / `TOO_MANY_ITEMS`.

## 4) حساب سعر كل سطر (حلقة على `p_items`)

لكل عنصر:

1. **الكمية**: `v_qty := (item->>'quantity')::int`؛ يجب `v_qty between 1 and 99` ⇒ `INVALID_QUANTITY`.
2. **الأساس**:
   - **عرض** (`offer_id`): `select * from offers where id = offer_id and restaurant_id = v_rid and is_active` ⇒ وإلا `INVALID_OFFER`. `v_base := offers.price`، `v_name := offers.title`، وإذا كان `offers.menu_item_id` غير null فهو المرجع المسموح لقراءة الأحجام/الأنواع.
   - **صنف** (`menu_item_id`): `select * from menu_items where id = menu_item_id and restaurant_id = v_rid and is_available` ⇒ وإلا `INVALID_MENU_ITEM`. `v_base := menu_items.price`.
3. **الحجم**: إذا `size_id` غير null: `select price from sizes where id = size_id and menu_item_id = <الصنف المرجعي>` ⇒ وإلا `INVALID_SIZE`.
   - في حالة الصنف العادي: `v_base := sizes.price` (يستبدل السعر الأساسي، مطابق للسلوك الحالي).
   - في حالة العرض: **لا يُستبدل** سعر العرض؛ سعر العرض يبقى هو الأساس (نمنع استخدام الحجم لتخفيض السعر). القرار قابل للتغيير حسب رغبتك.
   - وإذا كان للصنف أحجام متعددة، فـ `size_id` إلزامي ⇒ `SIZE_REQUIRED`.
4. **النوع**: إذا `variant_id` غير null: `select price from item_variants where id = variant_id and menu_item_id = <الصنف المرجعي>` ⇒ وإلا `INVALID_VARIANT`. `v_variant := coalesce(price, 0)`. وإذا كان للصنف أنواع فـ `variant_id` إلزامي ⇒ `VARIANT_REQUIRED`.
5. **الإضافات**: `extra_ids` بلا تكرار وطولها ≤ 20؛ لكل معرّف: `select price from extras where id = ? and restaurant_id = v_rid and is_available` ⇒ وإلا `INVALID_EXTRA`. `v_extras := Σ prices`.
6. **سعر الوحدة والسطر**:
   `v_unit := v_base + v_variant + v_extras`
   `v_line := round(v_unit * v_qty, 2)`؛ يجب `v_unit > 0` ⇒ `INVALID_PRICE`.
7. **بناء snapshot** للسطر بالأسماء والأسعار **المقروءة من قاعدة البيانات** (لا من العميل) بنفس شكل `items` الحالي كي تعمل شاشات المطعم و`get_analytics_summary` دون تغيير:
   `{ id, name, price: v_unit, quantity, total: v_line, size:{id,name,price}, variant:{id,name,price}, extras:[{id,name,price}], is_offer, offer_id }`

## 5) الإجماليات

```
subtotal    = Σ v_line
delivery_fee = delivery_areas.delivery_price  (أو 0)
total_price = subtotal + delivery_fee
```
شرط نهائي: `subtotal > 0`. لا يوجد أي خصم إضافي: العرض مُطبَّق أصلًا داخل سعر الوحدة.

## 6) الإدراج والإرجاع

`insert into orders (restaurant_id, branch_id, delivery_area_id, customer_*, payment_method, items, total_price, notes, status, order_source)` بقيم مفروضة من الدالة: `status = 'pending'`، `order_source = p_order_source`، و`notes` من الدالة (اسم المنطقة/الفرع + `p_notes` منقّى بحد 500 حرفًا).

تُعيد `jsonb`: `order_id`, `subtotal`, `delivery_fee`, `total_price`, `items` — فتستخدمها الواجهة لعرض التأكيد وبناء نص واتساب من **أرقام السيرفر**.

مقترح إضافي (منفصل): عمود `delivery_fee numeric` في `orders` بدل دمجه ضمن `total_price` فقط.

## 7) WhatsApp و Dashboard

- الفرق بينهما ليس مسار كتابة مختلفًا: نفس الدالة، فقط `p_order_source`.
- مسار **Dashboard**: تُستدعى الدالة، ثم رسالة نجاح.
- مسار **WhatsApp**: تُستدعى الدالة أولًا (إن كانت الباقة تسمح — والتحقق يصبح داخل الدالة عبر `get_restaurant_limits(v_rid)` وليس في الواجهة)، ثم تبني الواجهة نص `wa.me` من الـ `items` والإجماليات التي أعادتها الدالة. عند رفض الباقة تُعيد الدالة النص بدون إنشاء صف (وضع "quote only").
- خيار أنظف: دالة قراءة مساعدة `quote_order(...)` بنفس منطق الحساب لعرض السلة، لتفادي تكرار الحساب في الواجهة أصلًا.

## 8) الصلاحيات المصاحبة (تصميم فقط)

```
REVOKE INSERT ON public.orders FROM anon, authenticated;   -- المسار الوحيد يصبح الدالة
GRANT EXECUTE ON FUNCTION public.create_order(...) TO anon, authenticated;
```
سياسة `anyone_can_insert_orders` تُحذف أو تُقيَّد. الـ trigger `validate_order_insert` يبقى كشبكة أمان ثانية.

## 9) الحد من الإساءة (Rate limiting)

داخل الدالة: رفض إن وُجد ≥ 3 طلبات لنفس `customer_phone` + نفس `restaurant_id` خلال آخر دقيقة، و≥ 20 خلال آخر ساعة ⇒ `RATE_LIMITED`. يغني عن `useRateLimit` المعتمد على `localStorage`.

## 10) الأخطاء

كل رفض عبر `RAISE EXCEPTION USING errcode='P0001', message='<CODE>'`، وتُترجم الواجهة الأكواد لرسائل عربية. لا تُكشف تفاصيل داخلية للعميل.

## 11) ما يتغير في الواجهة (لاحقًا، وليس الآن)

- `useCart` يخزّن المعرّفات والكمية؛ العرض السعري يأتي من `quote_order`.
- `CartDialog.buildOrderData` تُستبدل ببناء مصفوفة معرّفات، و`insert` يُستبدل بـ `supabase.rpc('create_order', ...)`.
- `getFinalTotal/getDeliveryPrice` تصبحان عرضًا لقيم السيرفر.

لم يُنفَّذ أي شيء من هذا التصميم. أي تنفيذ سيحتاج موافقتك على نطاق محدد (الدالة أولًا، ثم تعديل الواجهة، ثم تضييق الصلاحيات).
