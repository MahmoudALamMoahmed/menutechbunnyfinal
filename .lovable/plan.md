# Audit فقط — مسار إنشاء الطلب من جانب الزبون (MenuBunny)

لا يوجد أي تعديل في هذا التقرير. كل ما نُفِّذ: قراءة ملفات + استعلامات SELECT على `pg_policies` و`pg_constraint` و`aclexplode`.

## A. Current Order Flow

1. `src/pages/Restaurant.tsx` يجلب كل البيانات العامة عبر RPC `get_public_restaurant_data(username)` (SECURITY DEFINER): المطعم، الأصناف، الأحجام، الأنواع، الإضافات، الفروع، مناطق التوصيل، العروض.
2. المستخدم يفتح `ProductDetailsDialog` (أو عرضًا عبر `OffersStrip` → `openOfferDialog`) ويختار حجمًا/نوعًا/إضافات وكمية، ثم `handleAddToCart` ينادي `onAddToCart` **مرة لكل وحدة** في حلقة `for (let i=0;i<quantity;i++)`.
3. `src/hooks/useCart.ts` → `addToCart` يبني `CartItem` = كل أعمدة `menu_items` + `quantity` + `selectedSize/selectedVariant/selectedExtras` + `price` **محسوب ومُستبدل محليًا**. التجميع في نفس السطر يتم عبر مفتاح `itemId-sizeId-variantId-extrasKey`.
4. `src/components/restaurant/CartDialog.tsx` يجمع بيانات العميل والفرع والمنطقة وطريقة الدفع، ثم:
   - `sendOrderToDashboard()` → `supabase.from('orders').insert({...})`
   - أو `sendOrderToWhatsApp()` → يُدخل صفًا في `orders` (فقط إذا `limits.features.dashboard_orders`) بـ `order_source:'whatsapp'` ثم يفتح رابط `wa.me`.
5. الإدخال يمر بـ trigger `validate_order_before_insert` → `validate_order_insert()`، وسياسة RLS للإدراج `anyone_can_insert_orders` (`WITH CHECK true`).

العميل **غير مسجّل دخول** → يعمل بدور `anon`. صلاحيات `anon` على `orders`: INSERT/SELECT/UPDATE/DELETE ممنوحة، لكن RLS تسمح فقط بالـ INSERT (لا سياسة SELECT/UPDATE تنطبق على مجهول، ولا سياسة DELETE إطلاقًا) — أي أن الزائر **يُدخل ولا يقرأ ولا يعدّل ولا يحذف**. هذا محمي بـ RLS لا بالـ GRANT.

## B. Exact Price Calculation Flow

كل الحسابات في الواجهة فقط:

- `useCart.addToCart`:
  `price = (selectedSize ? selectedSize.price : item.price) + (selectedVariant?.price ?? 0) + Σ(extras.price)`
  ثم يُخزَّن في حقل `price` للـ CartItem (يُطمس سعر `menu_items` الأصلي).
- الكمية: `getTotalPrice() = Σ(item.price × item.quantity)` — لا حد أدنى/أعلى، ولا تحقق أنها عدد صحيح موجب.
- العروض: `Restaurant.tsx → openOfferDialog` يبني عنصرًا مزيّفًا من العرض:
  - عرض مرتبط بصنف (`offer.menu_item_id`) → ينسخ الصنف مع `price = offer.price` ويحتفظ بـ `id` الأصلي.
  - عرض غير مرتبط → `offerToMenuItem` بـ `id = "offer:<uuid>"` (هذا الـ id **ليس** موجودًا في `menu_items`).
  فلا خصم منفصل: سعر العرض يحلّ محل سعر الصنف الأساسي ثم تُضاف الأنواع/الإضافات فوقه.
- التوصيل: `CartDialog.getDeliveryPrice()` = `delivery_areas.find(a => a.id === selectedArea)?.delivery_price || 0`. اختيار المنطقة في الواجهة مفلتر بـ `getAreasForBranch(branchId)`.
- الإجمالي المرسل: `getFinalTotal() = getTotalPrice() + getDeliveryPrice()`
  أي: `total_price = Σ((base|size) + variant + Σextras) × quantity + delivery_price`. لا حقل منفصل للتوصيل في `orders` — مدموج داخل `total_price` ومذكور نصيًا في `notes`.

## C. الحقول المُرسلة فعليًا إلى جدول `orders`

`restaurant_id`, `branch_id` (أو null), `delivery_area_id` (أو null), `customer_name`, `customer_phone`, `customer_address`, `payment_method`, `items` (jsonb: `id,name,price,quantity,total,size{id,name,price},variant{...},extras[]`), `total_price`, `notes` (نص المنطقة/الفرع), `status:'pending'`, و`order_source:'whatsapp'` في مسار واتساب فقط (مسار الداشبورد لا يرسله → يعتمد على DEFAULT).

## D. Backend / Database Validation

`validate_order_insert()` (trigger BEFORE INSERT على `orders`) يتحقق من:
- `total_price > 0`
- وجود `restaurant_id` في `restaurants`
- إذا كان `branch_id` غير null: أن الفرع يتبع نفس `restaurant_id`
- `customer_name` و`customer_phone` غير فارغين بعد trim
- `order_source IN ('dashboard','whatsapp')`

قيود الجدول: FKs على `restaurant_id`/`branch_id`/`delivery_area_id`، و`orders_status_check` على قيم الحالة.

**غير متحقَّق منه إطلاقًا:** أي سعر (صنف/حجم/نوع/إضافة/عرض)، الكمية، رسوم التوصيل، تطابق `total_price` مع `items`، انتماء `delivery_area_id` للفرع المختار أو للمطعم، انتماء عناصر `items` للمطعم، صحة `payment_method` مقابل `branch_payment_methods`، بنية `items` نفسها، حالة `is_available`، وحدود الطول/الشكل لبيانات العميل. لا توجد أي Edge Function في مسار إنشاء الطلب (`bunny-*`, `create/delete-branch-staff`, `kashier-*`, `auto-renew-*` فقط).

## E. Attack Scenarios + Severity + Exact Location

المسار الوحيد المطلوب للمهاجم: `POST https://<ref>.supabase.co/rest/v1/orders` بالمفتاح العام `anon` (موجود في الـ bundle) بجسم JSON من اختياره. RLS تسمح (`anyone_can_insert_orders` WITH CHECK true) والـ trigger يفحص ما ذُكر أعلاه فقط.

| # | السيناريو | الحالة | Severity | الموقع |
|---|---|---|---|---|
| 1 | تزوير سعر صنف/حجم/نوع/إضافة داخل `items` (مثلاً بيتزا بـ 1 جنيه) | **Confirmed Vulnerability** — لا شيء يعيد الحساب | High | `CartDialog.buildOrderData/sendOrderToDashboard`، جدول `orders`، `validate_order_insert` |
| 2 | `total_price` لا يساوي مجموع `items` + التوصيل (مثلاً `total_price = 1`) | **Confirmed** — الشرط الوحيد `> 0` | High | نفس ما سبق |
| 3 | إسقاط رسوم التوصيل مع إرسال `delivery_area_id` | **Confirmed** | Medium | `getDeliveryPrice`, `validate_order_insert` |
| 4 | `delivery_area_id` تابعة لفرع آخر أو لمطعم آخر | **Confirmed** — FK يتحقق من الوجود فقط، لا من الانتماء | Medium | `orders_delivery_area_id_fkey`, `validate_order_insert` |
| 5 | `items` تحتوي أصنافًا من مطعم آخر أو `id` وهمي (`offer:...` أو أي نص) | **Confirmed** — `items` jsonb حر بلا فحص | Medium | `orders.items` |
| 6 | `payment_method` غير مفعّلة في الفرع (أو نص عشوائي) | **Confirmed** — لا CHECK ولا مقارنة بـ `branch_payment_methods` | Medium | `PaymentMethodSection`, `orders.payment_method` |
| 7 | `quantity` سلبية/عشرية/ضخمة داخل `items` | **Confirmed** (يؤثر على العرض والتحليلات؛ `total_price>0` فقط يمنع الإجمالي السالب) | Medium | `useCart`, `get_analytics_summary` |
| 8 | Spam/إغراق بطلبات مزيفة | **Confirmed** — `useRateLimit` يعتمد `localStorage` فقط (يُتجاوز بمسح التخزين أو بطلب مباشر) | Medium | `src/hooks/useRateLimit.ts` |
| 9 | `branch_id` من مطعم آخر | **Protected** — `validate_order_insert` يرفض صراحة | — | `validate_order_insert` |
| 10 | `status` بقيمة غير مسموحة، أو تعديل/حذف/قراءة طلبات الآخرين كزائر | **Protected** — `orders_status_check` + غياب سياسات SELECT/UPDATE/DELETE تنطبق على `anon` | — | `pg_policies` على `orders` |
| 11 | كتابة مباشرة على `menu_items`/`sizes`/`extras`/`delivery_areas`/`offers`/`branch_payment_methods` بمفتاح anon لتخفيض الأسعار | **Protected عمليًا** — سياسات `FOR ALL` تشترط `restaurants.owner_id = auth.uid()`، ومع `anon` تكون `auth.uid()` NULL فتفشل (وتُستخدم USING كـ WITH CHECK للإدراج). لكن GRANTs الافتراضية تمنح `anon` صلاحيات INSERT/UPDATE/DELETE/TRUNCATE على هذه الجداول — لا استغلال حالي، لكنه خطر إن أُضيفت يومًا سياسة أوسع | Low / Informational | GRANTs على تلك الجداول |
| 12 | حقن HTML/نصوص طويلة في `customer_name`/`notes` | **Theoretical Risk** — العرض عبر React نصي (لا `dangerouslySetInnerHTML`)، لكن لا حدود طول ولا تنقيح، ويظهر في رسائل واتساب | Low | `CartDialog`, `OrderCard` |
| 13 | إغراق `orders` عبر مسار واتساب حتى لو الباقة لا تتيح `dashboard_orders` | **Confirmed** — الشرط `limits.features.dashboard_orders` واجهة فقط | Low | `sendOrderToWhatsApp` |

الخلاصة الحقيقية: **كل الأسعار والإجماليات في هذا النظام مصدرها العميل، وقاعدة البيانات تقبلها كما هي.** أخطر أثر عملي: طلبات بأسعار مزوّرة تصل لشاشة المطعم وتفسد الإيرادات في `get_analytics_summary`.

## F. Recommended Architecture (اقتراح فقط — لا تنفيذ)

1. دالة `SECURITY DEFINER` واحدة، مثلاً `create_order(p_restaurant_username, p_branch_id, p_delivery_area_id, p_items jsonb, p_customer..., p_payment_method)` تكون **المسار الوحيد** لإنشاء الطلب، مع `REVOKE INSERT ON orders FROM anon, authenticated`.
2. داخل الدالة: إرسال معرّفات فقط (`menu_item_id`/`offer_id`, `size_id`, `variant_id`, `extra_ids[]`, `quantity`) ثم **إعادة حساب** كل سعر من الجداول، والتحقق من انتماء كل معرّف لنفس المطعم و`is_available`، ومن أن `delivery_area.branch_id = p_branch_id`، ومن أن `payment_method` موجودة ومفعّلة في `branch_payment_methods`، ومن `quantity` عدد صحيح 1..N، ثم بناء `items` و`total_price` داخل الدالة وإضافة عمود `delivery_fee` مستقل.
3. تحقق مدخلات بـ zod في الواجهة (طول الاسم/الهاتف/العنوان + صيغة الهاتف) كطبقة أولى فقط.
4. تحديد معدل من جانب السيرفر (مثلاً عدّاد لكل `customer_phone`/IP داخل الدالة أو Edge Function) بدل `localStorage`.
5. تضييق GRANTs الزائدة لـ `anon` على جداول المنيو، وفرض `order_source` وحالة `pending` من السيرفر.

كل ما سبق مقترح ولم يُنفَّذ؛ أي إصلاح يحتاج موافقة منفصلة على نطاق محدد.
