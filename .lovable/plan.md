
# خطة إعادة تصميم نظام موظف الفرع

## الهدف
- إلغاء صفحة `/branch-orders` المنفصلة وإلغاء دخول موظف الفرع من صفحة `/auth` الرئيسية.
- إنشاء صفحة دخول مستقلة لكل مطعم على المسار: `/:username/branch-staff-login` (دخول بلينك فقط، بدون أي زر).
- بعد الدخول: الموظف يرى نفس صفحة المطعم وزر "إدارة" مثل المالك، لكن داخل لوحة التحكم يقدر يفتح صفحتين فقط:
  - طلبات لوحة التحكم
  - طلبات واتساب
- في هاتين الصفحتين يرى **طلبات فرعه فقط** وليس كل طلبات المطعم.
- الاحتفاظ بقاعدة البيانات (`branch_staff` + RLS + Edge Functions الحالية للإنشاء/الحذف) كما هي — لا تغييرات في الـ schema.

---

## التغييرات بالتفصيل

### 1) صفحة الدخول الجديدة `/:username/branch-staff-login`
- صفحة جديدة `src/pages/BranchStaffLogin.tsx` فيها فورم Email + Password بسيط بنفس ستايل صفحة `Auth.tsx`.
- تستخدم `supabase.auth.signInWithPassword`.
- بعد نجاح الدخول تتحقق:
  - أن المستخدم له سجل في `branch_staff`.
  - أن `branch_staff.restaurant_id` يخص نفس `:username` الموجود في الرابط.
- لو غير ذلك → `signOut` + رسالة خطأ ("هذا الحساب لا يخص هذا المطعم").
- بعد التحقق → `navigate(\`/${username}\`)` ليرى صفحة المطعم.
- إضافة Route في `src/App.tsx`:  
  `<Route path="/:username/branch-staff-login" element={<BranchStaffLogin />} />` (lazy).

### 2) صلاحيات وملاحة موظف الفرع
- في `useAuth.tsx`: الإبقاء على `isBranchStaff` و `branchStaffInfo` كما هو.
- في `Header.tsx`: حذف زر "طلبات فرعي" بالكامل. موظف الفرع يرى نفس زر "الدخول لمطعمك" (لكن للمطعم الذي يخصه — يُحسب من `branchStaffInfo.restaurantUsername`).
- في `src/pages/Restaurant.tsx` (لو فيه منطق يخص branchStaff للظهور الزر) — نتأكد أن زر "إدارة" يظهر للمالك **ولموظف الفرع** ويوجّه إلى `/${username}/dashboard`.

### 3) لوحة التحكم لموظف الفرع
- تعديل `ProtectedRoute.tsx`:
  - إضافة prop جديد `allowBranchStaff?: boolean`.
  - لو `requireOwner` بدون `allowBranchStaff` ومستخدم موظف فرع → يعرض شاشة Unauthorized (بدلاً من التحويل التلقائي لـ `/branch-orders`).
  - لو `requireOwner` + `allowBranchStaff` ومستخدم موظف فرع: يُسمح بالدخول فقط إذا `branchStaffInfo.restaurantUsername === username`.
  - حذف كل منطق إعادة التوجيه إلى `/branch-orders`.
- في `src/pages/Dashboard.tsx`:
  - عند `isBranchStaff` نخفي كل الأزرار ما عدا "طلبات لوحة التحكم" و "طلبات واتساب".
  - نضيف Badge "موظف فرع" بدل Badge الباقة.
- صفحات `DashboardOrders.tsx` و `WhatsAppOrders.tsx`:
  - لو المستخدم موظف فرع → نستبدل `useAdminOrders(restaurant.id, ...)` بـ `useBranchOrders(branchStaffInfo.branch_id, ...)`.
  - نفس الشيء لـ `usePendingOrdersCount` (`branch_id` بدل `restaurant_id`).
  - نفس الشيء لـ `useOrdersRealtime` (filterColumn = `branch_id`).
  - نمرر `isBranchStaff` لـ `OrderStats` (موجود مسبقاً).
  - تمكين هذه الصفحات في `ProtectedRoute` عبر `allowBranchStaff`.

### 4) تنظيف الكود القديم
- حذف الملف: `src/pages/BranchOrders.tsx`.
- حذف Route `/:username/branch-orders` من `src/App.tsx` وحذف الاستيراد.
- حذف خاصية `requireBranchStaff` من `ProtectedRoute` (لم تعد مستخدمة).
- في `src/pages/Auth.tsx`: حذف الفرع الخاص بـ "isBranchStaff → navigate to /branch-orders". موظف الفرع لا يجب أن يدخل عبر `/auth` أصلاً؛ في حال دخل بطريق الخطأ → `signOut` + رسالة "استخدم رابط مطعمك للدخول".
- مراجعة `useAdminData.ts` للإبقاء على `useBranchOrders` (سيُستخدم في الصفحتين بعد التعديل).
- الإبقاء على Edge Functions `create-branch-staff` و `delete-branch-staff` وصفحة `BranchesManagement` كما هي (المالك ما زال يُنشئ/يحذف حسابات الفروع من هناك، وسيُعطي الرابط `/[username]/branch-staff-login` لموظفيه).

### 5) تحسين بسيط في BranchesManagement
- بجوار "إضافة حساب للفرع" نعرض رابط الدخول الكامل ليسهل على المالك نسخه:  
  مثلاً: `https://site/<username>/branch-staff-login` مع زر "نسخ".

---

## ملفات ستتغيّر / تُحذف

```text
حذف:
- src/pages/BranchOrders.tsx

جديد:
- src/pages/BranchStaffLogin.tsx

تعديل:
- src/App.tsx                          (إزالة /branch-orders + إضافة /branch-staff-login)
- src/components/ProtectedRoute.tsx    (إضافة allowBranchStaff + إزالة requireBranchStaff)
- src/components/Header.tsx            (إزالة زر "طلبات فرعي")
- src/pages/Auth.tsx                   (إزالة redirect لموظف الفرع)
- src/pages/Restaurant.tsx             (التأكد أن زر "إدارة" يظهر لموظف الفرع)
- src/pages/Dashboard.tsx              (إخفاء الأزرار غير المسموح بها لموظف الفرع)
- src/pages/DashboardOrders.tsx        (استخدام useBranchOrders + branch_id لو موظف فرع)
- src/pages/WhatsAppOrders.tsx         (نفس الشيء)
- src/components/branches/...          (عرض رابط دخول الفرع + زر نسخ — اختياري)
```

## لا تغييرات في قاعدة البيانات
RLS الحالية لموظف الفرع على `orders` تكفي وتضمن أنه حتى لو حاول التحايل لن يرى إلا طلبات فرعه.

---

هل أبدأ التنفيذ؟
