# PROJECT_CONTEXT.md — سياق مشروع MenuBunny

> **اقرأ هذا الملف أولاً قبل أي تعديل.** هذا الملف هو "ذاكرة المشروع" — يحتوي على القرارات المعمارية، المشاكل التي حُلّت، والأنماط المتبعة.
> `README.md` = شرح عام للمشروع للزوار. هذا الملف = قواعد العمل الداخلية للمطوّر/الوكيل.
> آخر تحديث: 2026-09-04.

---

## 1. نظرة عامة

**MenuBunny (منيو تك)** — منصة قوائم طعام رقمية (QR Menu) مع نظام طلبات، فروع، عروض، اشتراكات مدفوعة، ومحافظ مالية لأصحاب المطاعم.

- **التقنيات**: React 18 + Vite 5 + Tailwind CSS v3 + TypeScript + shadcn/ui + React Query (@tanstack/react-query)
- **Backend**: Supabase خارجي (مشروع مربوط يدوياً — ليس Lovable Cloud). المفاتيح في `.env` بالأسماء: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- **تخزين الصور**: BunnyCDN عبر edge functions (`bunny-upload`, `bunny-delete`) — انظر `src/lib/bunny.ts`
- **المدفوعات**: Kashier (محفظة + اشتراكات + تجديد تلقائي)
- **اللغة**: واجهة عربية RTL بالكامل

---

## 2. بنية قاعدة البيانات

```text
auth.users
   │ owner_id (FK)
   ▼
restaurants (id, owner_id, username, name, ...)
   │ restaurant_id (FK) — كل الجداول تستخدم هذا النمط
   ▼
categories, menu_items, sizes, item_variants, extras, offers,
branches, orders, wallets, branch_staff, contact_leads ...
```

### قواعد مهمة
- **كل الجداول تشير للمطعم عبر `restaurant_id` FK → restaurants.id**
- جدول `wallets` كان يستخدم `owner_id` → `auth.users`، **وتم تحويله إلى `restaurant_id`**. لا تقترح إرجاعه — التحويل مقصود للتناسق وتبسيط الـ joins.
- نظام الأدوار في جدول منفصل `user_roles` + دالة `has_role(user_id, role)` (security definer). الأدوار: `super_admin`, `sales`. **لا تخزن أدوار على جدول المستخدمين أبداً.**

### ملاحظات قاعدة البيانات
- جميع التعديلات تتم عبر أداة الـ migration فقط — لا تعديل يدوي لملفات `supabase/migrations/`.
- كل `CREATE TABLE` يتبعه `GRANT` + `ENABLE ROW LEVEL SECURITY` + policies في نفس الـ migration.
- Validation triggers بدلاً من CHECK constraints للتحققات الزمنية.
- `contact_leads INSERT with true` قرار مقبول من المالك (نموذج تواصل عام) — لا "تصلحه" دون سؤال.

---

## 3. المصادقة والصلاحيات

### 4 أنواع مستخدمين (يُحدَّد في `useAuth.tsx` → `resolveUserType`)
1. **صاحب مطعم (owner)**: له سجل في `restaurants.owner_id`
2. **موظف فرع (branch_staff)**: سجل في `branch_staff` — يسجّل دخول من صفحة المطعم `/:username/branch-staff-login` (وليس من الصفحة الرئيسية)
3. **super_admin**: عبر `has_role` — صفحة `/super-admin`
4. **sales**: عبر `has_role` — صفحة `/staff-leads`

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- عند `requireOwner`: **يتحقق فعلياً** أن `username` في الرابط يطابق `username` من `useAuth` (أُضيف في مراجعة أمنية — لا تحذفه)
- `allowBranchStaff` يسمح لموظف الفرع بالدخول للصفحات المسموحة له فقط: `dashboard`, `dashboard-orders`, `whatsapp-orders` — ومحصور بفرعه فقط

---

## 4. قرارات معمارية مهمة (لا تعكسها دون سبب)

| القرار | السبب |
|---|---|
| **إنشاء الطلب حصريًا عبر RPC `create_order`** | الأسعار والإجماليات تُحسب على السيرفر من قيم قاعدة البيانات (items/sizes/variants/extras/offers/delivery). سُحبت صلاحية `INSERT` على `orders` من `anon` و`authenticated` وحُذفت السياسة العامة القديمة. **لا تُعِد أي insert مباشر للطلبات.** |
| **بيانات المنيو العامة عبر RPC `get_public_restaurant_data`** | استعلام واحد يجلب المطعم + الأقسام + الأصناف + الأحجام + الأنواع + الإضافات + العروض + الفروع، بدل 7 استعلامات (`usePublicRestaurantData` في `useRestaurantData.ts`) |
| **`public_restaurants` view = SELECT فقط** | سُحبت كل الصلاحيات من `anon`/`authenticated` ثم `GRANT SELECT` فقط. الـ view يعمل كـ allow-list للأعمدة العامة (لا يسرّب `owner_id`) |
| **`anon` بلا أي صلاحيات على `restaurants`** | كل عمليات الكتابة تحدث بدور `authenticated` فقط |
| **wallets.restaurant_id** بدل owner_id | تناسق مع كل الجداول + join مباشر wallets→restaurants في Super Admin |
| **Server-side pagination للطلبات** | `useAdminOrders` / `useBranchOrders` — `.range()` + `count: 'exact'` |
| **Batch reorder عبر DB function** | `batch_update_display_order` بدل N طلبات UPDATE |
| **Limit checks: UI + DB triggers فقط** | حُذفت من الـ mutations — UI يعرض تحذير و DB triggers تفرض الحد. استخدم `isLimitError()` |
| **state بيانات العميل داخل `CartDialog`** | الاسم/الهاتف/العنوان/الفرع/المنطقة/طريقة الدفع كلها داخل CartDialog — `Restaurant.tsx` لا يحتوي هذا الـ state |
| **Mutations مقسّمة حسب الـ domain** | `src/hooks/admin-mutations/` → `useMenuMutations`, `useBranchMutations`, `useOrderMutations`, `useRestaurantMutations`, `useOfferMutations` + `_shared.ts` + barrel `index.ts`. لا تُعِد ملف `useAdminMutations.ts` الضخم |
| **QueryClient defaults مضبوطة** | `ADMIN_STALE = 2min`, `ADMIN_GC = 10min` في `useAdminData.ts` |
| **console.log مغلفة بـ `import.meta.env.DEV`** | في `src/lib/bunny.ts` |
| **RouteErrorBoundary لكل route** | عبر `withErrorBoundary()` في `App.tsx` |
| **لا انيميشن انتقال بين الصفحات** | `PageTransition` حُذف نهائيًا من كل الصفحات (تحميل فوري) |
| **غلاف المطعم بنسبة 16:9 ثابتة** | `aspect-[16/9]` + `max-w-4xl` في العرض والرفع والـ Skeleton لتقليل CLS. **لا صورة blur ثانية** |
| **الأحجام والأنواع** | `sizes` + `item_variants` في ديالوج واحد بتابات؛ النوع قد يكون له سعر أو بدون |
| **العروض (`offers`)** | إدارة بالسحب والإفلات + `OffersStrip` في صفحة المطعم + دمج كامل بالسلة (`offer_id` في `useCart`) |
| **الشريط السفلي في صفحة المطعم** | Scroll Spy عبر `IntersectionObserver` — التلوين يظهر فقط عند الوصول للقسم |

---

## 5. مشاكل حُلّت سابقاً (لا تعد اقتراحها كحلول جديدة)

1. **ProtectedRoute لم يكن يتحقق من ملكية المطعم** — أُصلح بمقارنة username الرابط مع username المصادقة
2. **المحفظة تعرض رصيد صفر** — السبب `useAdminRestaurant(user?.id)` بدل `useAdminRestaurant(username)`. **الصحيح دائماً: `useAdminRestaurant(username)` من `useParams`**
3. **`as any` مع features** — أُزيلت وأُضيف type safety (استخدم `TablesUpdate<'table'>`)
4. **useMenuItems موحد** — الفلترة بـ `useMemo` في الصفحة وليس داخل الهوك
5. **View `wallets_with_restaurants`** أُنشئ ثم حُذف — التحويل المباشر لـ `restaurant_id` بدلاً منه
6. **7 استعلامات في صفحة المطعم** — استُبدلت بـ RPC واحد؛ هوك `useBranches` القديم حُذف و`RestaurantFooter` يستقبل الفروع كـ props
7. **تلاعب العميل بالأسعار** — حُلّ بـ `create_order` (حساب من جانب السيرفر)
8. **نظام موظف الفرع القديم** (`/branch-orders` + دخول من الموقع الرئيسي) — أُزيل بالكامل واستُبدل بـ `/:username/branch-staff-login`

---

## 6. Edge Functions (`supabase/functions/`)

| Function | الوظيفة |
|---|---|
| `bunny-upload` / `bunny-delete` | رفع وحذف الصور على BunnyCDN |
| `create-branch-staff` / `delete-branch-staff` | إنشاء وحذف حسابات موظفي الفروع |
| `create-payment-session` | جلسة دفع Kashier — يجلب `restaurant_id` أولاً ثم يبحث في `wallets` |
| `kashier-webhook` | استقبال تأكيد الدفع وتحديث الاشتراك/المحفظة |
| `auto-renew-subscriptions` | تجديد الاشتراكات تلقائياً (معالجة الأخطاء بـ `instanceof Error` لتوافق Deno) |

الدوال تُنشر تلقائياً. Secrets مُعدّة مسبقاً (Bunny, Kashier).

---

## 7. أنماط الكود المتبعة

- **Data fetching**: `useAdminData.ts` (أدمن)، `useRestaurantData.ts` (عام/RPC)، `useSuperAdminData.ts`, `useSubscription.ts`, `useAnalyticsData.ts`, `useStaffLeadsData.ts`
- **Mutations**: `src/hooks/admin-mutations/*` و `useSuperAdminMutations.ts` — مع invalidation لمفاتيح الاستعلام
- **Auth**: `useAuth.tsx` يوفر `user, session, username, isBranchStaff, branchStaffInfo, isSuperAdmin, isSales, userTypeLoading`
- **Realtime**: اشتراكات داخل useEffect مع cleanup `supabase.removeChannel` (`useOrdersRealtime.ts`)
- **الإشعارات الصوتية**: Supabase Realtime + Web Audio API — **لا Web Push ولا Service Workers**
- **الألوان**: design tokens دلالية فقط في `index.css` — لا ألوان hardcoded في المكونات
- **الأنواع**: أنواع Supabase المولّدة (`src/integrations/supabase/types.ts`) هي المرجع الوحيد — لا `any`

---

## 8. بنية الصفحات (مطابقة لـ `App.tsx`)

```text
/                                 → Index (صفحة هبوط)
/auth                             → تسجيل دخول / إنشاء حساب
/forgot-password /reset-password  → استعادة كلمة المرور
/:username                        → Restaurant (منيو عام + سلة)
/:username/branch-staff-login     → دخول موظف الفرع
/:username/dashboard              → لوحة التحكم (المالك + موظف الفرع)
/:username/restaurant-info        → معلومات المطعم
/:username/menu-management        → إدارة المنيو (أقسام، أصناف، أحجام/أنواع، إضافات، عروض)
/:username/footer-management      → إدارة الفوتر
/:username/branches-management    → الفروع ومناطق التوصيل
/:username/dashboard-orders       → طلبات لوحة التحكم (المالك + موظف الفرع)
/:username/whatsapp-orders        → طلبات واتساب (المالك + موظف الفرع)
/:username/dashboard-analytics    → تقارير لوحة التحكم
/:username/whatsapp-analytics     → تقارير واتساب
/:username/wallet                 → المحفظة
/:username/subscription           → الاشتراك والباقات
/super-admin                      → لوحة السوبر أدمن
/staff-leads                      → العملاء المحتملون (sales)
```

---

## 9. قواعد الصيانة والتحديث

- قرار معماري جديد → أضفه إلى القسم 4 مع السبب.
- مشكلة حُلّت ويتكرر اقتراحها → أضفها إلى القسم 5.
- Edge Function جديد → القسم 6. تغيير في المسارات → القسم 8.
- لا تُضاف أي مفاتيح أو أسرار في هذا الملف — الأسماء فقط.
- بعض التحذيرات الأمنية (مثل `contact_leads INSERT with true`) قرارات مقبولة ولا تُعدّل دون موافقة صريحة.
