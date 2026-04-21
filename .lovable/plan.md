

## الخطة: توحيد بيانات الفروع بدون تكرار طلبات

### الفكرة

`Restaurant.tsx` خلاص جايبة كل الفروع من الـ RPC (`usePublicRestaurantData`)، لكن جواه:
- `<RestaurantFooter />` بيستدعي `useBranches` تاني (طلب إضافي عند تحميل الصفحة).
- `<BranchesDialog />` بيستدعي `useBranches` لما يفتح المستخدم الـ dialog (طلب تالت).

الحل: نمرّر الـ `branches` (اللي جاية أصلاً من الـ RPC) كـ **prop** للمكوّنين، ونلغي استدعاء `useBranches` من جواهم. وبما إن مفيش حد تاني في المشروع بيستخدم `useBranches`، نحذفها كلياً من `useRestaurantData.ts` كتنظيف للكود القديم.

---

### التغييرات

#### 1) `src/components/RestaurantFooter.tsx`
- إضافة prop `branches: Branch[]` للـ interface.
- حذف `import { useBranches }` وحذف سطر `const { data: branches = [] } = useBranches(...)`.
- استخدام `branches` القادمة من props مباشرة.

#### 2) `src/components/BranchesDialog.tsx`
- إضافة prop `branches: Branch[]` (و `loading?: boolean` اختياري — لكن البيانات بقت جاهزة فلن نحتاجها، نشيل الـ loader).
- حذف `useState` الخاص بـ `open` يفضل زي ما هو لأنه للـ Dialog control.
- حذف `import { useBranches }` و `useBranches(...)`.
- حذف الـ loading spinner branch لأن البيانات جاهزة من البداية.

#### 3) `src/pages/Restaurant.tsx`
- تمرير `branches={branches}` لكل من `<BranchesDialog />` (في الموضعين) و `<RestaurantFooter />`.

> ملاحظة: نمرّر `branches` المُقيّدة بحدود الباقة (نفس اللي بتظهر في الكارت) عشان يكون السلوك متّسق في كل مكان في الصفحة.

#### 4) `src/hooks/useRestaurantData.ts` — تنظيف الكود القديم
- **حذف دالة `useBranches`** بالكامل (لم تعد مستخدمة في أي مكان).
- باقي الـ hooks تفضل زي ما هي (مستخدمة في أماكن تانية أو محتفظ بيها لـ utility).

---

### ضمانات عدم الكسر

| المكوّن | الأثر |
|---------|------|
| `Restaurant.tsx` | يمرّر prop واحد إضافي — لا تغيير سلوكي |
| `RestaurantFooter` | نفس العرض، بيانات من نفس المصدر (الـ RPC) |
| `BranchesDialog` | نفس العرض، بدون loader (البيانات جاهزة من قبل ما يفتح الـ dialog) |
| `ProtectedRoute` و باقي الكود | لا يستخدمون `useBranches` — تأكدنا بـ search شامل |
| RLS / Schema / RPC | لا تغيير |
| Cart / Limits / Realtime | لا تغيير |

---

### الفائدة

- **قبل:** عند فتح `/:username` = طلب RPC + طلب `useBranches` للفوتر (= 2 طلبات لنفس بيانات الفروع). + طلب ثالث عند فتح الـ BranchesDialog.
- **بعد:** طلب RPC واحد فقط، والفروع مشتركة في كل المكوّنات.
- تنظيف: حذف ~20 سطر من hook لم يعد له استخدام، وحذف loading state غير ضروري من الـ Dialog.

---

### الملفات المتأثرة

1. `src/components/RestaurantFooter.tsx` — قبول `branches` كـ prop
2. `src/components/BranchesDialog.tsx` — قبول `branches` كـ prop + إزالة الـ loader
3. `src/pages/Restaurant.tsx` — تمرير الـ prop
4. `src/hooks/useRestaurantData.ts` — حذف `useBranches` غير المستخدمة

