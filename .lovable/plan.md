## الخطة: التحوّل الكامل للاستيراد المباشر + حذف الـ shim

### الهدف
نخلص نهائياً من ملف الـ shim (`src/hooks/useAdminMutations.ts`) ونخلّي كل الصفحات تستورد مباشرةً من الملفات المخصصة لكل domain. النتيجة: كود أنضف، مفيش ملف وسيط، والمسار بيوضح الـ domain فوراً.

---

### تحليل الوضع الحالي

عندنا **6 صفحات** بتستورد من الـ shim، وكل واحدة بتستورد من **domain واحد بس**:

| الصفحة | الـ hooks المستوردة | الـ domain |
|--------|---------------------|-----------|
| `WhatsAppOrders.tsx` | `useUpdateOrderStatus` | Orders |
| `DashboardOrders.tsx` | `useUpdateOrderStatus` | Orders |
| `BranchesManagement.tsx` | `useSaveBranch`, `useDeleteBranch`, `useToggleBranchActive`, `useSaveDeliveryArea`, `useDeleteDeliveryArea`, `useReorderBranches`, `useReorderDeliveryAreas` | Branches |
| `MenuManagement.tsx` | `useSaveCategory`, `useDeleteCategory`, `useSaveMenuItem`, `useDeleteMenuItem`, `useSaveSize`, `useDeleteSize`, `useSaveExtra`, `useDeleteExtra`, `useReorderCategories`, `useReorderMenuItems`, `useReorderExtras` | Menu |
| `FooterManagement.tsx` | `useSaveRestaurant` | Restaurant |
| `RestaurantInfo.tsx` | `useSaveRestaurant` | Restaurant |

**نقطة مهمة**: مفيش صفحة بتستورد من أكتر من domain → كل صفحة سطر import واحد بس بيتغير.

---

### التغييرات المقترحة

#### 1) تحديث الـ imports في الـ 6 صفحات

| الملف | قبل | بعد |
|-------|-----|-----|
| `src/pages/WhatsAppOrders.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useOrderMutations"` |
| `src/pages/DashboardOrders.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useOrderMutations"` |
| `src/pages/BranchesManagement.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useBranchMutations"` |
| `src/pages/MenuManagement.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useMenuMutations"` |
| `src/pages/FooterManagement.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useRestaurantMutations"` |
| `src/pages/RestaurantInfo.tsx` | `from "@/hooks/useAdminMutations"` | `from "@/hooks/admin-mutations/useRestaurantMutations"` |

**أسماء الـ hooks المستوردة لا تتغيّر** — بس مسار الـ `from` بيتغيّر.

#### 2) حذف ملف الـ shim نهائياً
- حذف `src/hooks/useAdminMutations.ts` (4 أسطر)

#### 3) (اختياري) تبسيط `index.ts`
- نسيب `src/hooks/admin-mutations/index.ts` كـ barrel للاستخدام المستقبلي (مثلاً لو حد عاوز يستورد من `@/hooks/admin-mutations` مباشرةً). أو نحذفه كمان لو مش هنحتاجه.
- **التوصية**: نسيبه. مفيد لو ظهر use case مستقبلي.

---

### خطوات التنفيذ

1. تحديث الـ import في كل صفحة من الـ 6 (سطر واحد لكل ملف).
2. حذف `src/hooks/useAdminMutations.ts`.
3. تشغيل `npx tsc --noEmit` للتأكد من خلو المشروع من أي خطأ.
4. التحقق إن مفيش ملف تاني في المشروع لسه بيستورد من المسار القديم (rg search).

---

### الفوائد بعد التنفيذ

| البند | قبل | بعد |
|-------|-----|-----|
| **عدد محطات الـ import** | 3 ملفات (shim → barrel → الملف الفعلي) | 1 ملف مباشر |
| **وضوح الـ domain** | غير واضح من سطر الـ import | واضح فوراً من المسار |
| **حجم ملفات الـ wrapper** | shim (4 أسطر) + index (4 أسطر) = 8 أسطر زيادة | بس index (4 أسطر) |
| **سهولة الـ refactor المستقبلي** | لو حذفت hook، صعب تتبّع مين بيستخدمه | المسار المباشر بيقول الـ domain فوراً |

---

### المخاطر

**صفر**. الأسباب:
- الـ exports من الملفات الجديدة موجودة فعلاً (تم التحقق).
- TypeScript compiler هيمسك أي خطأ فوراً.
- مفيش تغيير في الـ logic أو الـ runtime behavior.
- مفيش تغيير في الـ React Query cache keys ولا الـ DB.

---

### ما الذي **لن** يتغيّر

- محتوى ملفات `admin-mutations/` (الكود الفعلي).
- أسماء أو signatures الـ hooks.
- React Query cache keys.
- أي صفحة من غير الـ 6 المذكورة.
- `src/hooks/admin-mutations/index.ts` (يفضل barrel للاستخدام المستقبلي).

---

### الملفات المتأثرة

| ملف | تغيير |
|-----|-------|
| `src/pages/WhatsAppOrders.tsx` | تعديل سطر import واحد |
| `src/pages/DashboardOrders.tsx` | تعديل سطر import واحد |
| `src/pages/BranchesManagement.tsx` | تعديل سطر import واحد |
| `src/pages/MenuManagement.tsx` | تعديل سطر import واحد |
| `src/pages/FooterManagement.tsx` | تعديل سطر import واحد |
| `src/pages/RestaurantInfo.tsx` | تعديل سطر import واحد |
| `src/hooks/useAdminMutations.ts` | **حذف نهائي** |

**الإجمالي**: 6 أسطر تتعدّل + ملف واحد يتحذف.
