## الخطة: تقسيم `useAdminMutations.ts` حسب الـ domain

### ما هي الفائدة الفعلية؟ (إجابة صريحة)

الملف الحالي **521 سطر** بيجمع 7 domains مختلفة (categories, menu items, sizes, extras, branches, delivery areas, restaurant info, orders, reorder). الفوائد الحقيقية:

1. **سهولة التنقّل**: لما تشتغل على صفحة Menu Management، بتفتح ملف واحد صغير بدل ما تلفّ في 521 سطر.
2. **تقليل احتمال الخطأ**: تعديلات مختلفة (فرع + قائمة) بتبقى في ملفات منفصلة، فمفيش تعارضات أو أخطاء غير مقصودة.
3. **Code splitting أفضل**: Vite يقدر يحمّل الـ mutations الخاصة بصفحة معيّنة بس.
4. **اختبار أسهل** (لو بعدين حبيت تكتب unit tests لكل domain).

**متى الفكرة دي *مش* مفيدة؟** لو الملف صغير (< 200 سطر) أو بتتعامل مع domain واحد. هنا الملف وصل لـ 521 سطر ومقسّم فعلاً بـ comments داخلية لـ 7 أقسام — ده مؤشر واضح إنه كبر أوي ومحتاج تقسيم.

---

### الهيكل المقترح (مرتّب ومفهوم)

```text
src/hooks/admin-mutations/
├── index.ts                       ← Re-exports (backward compatibility)
├── _shared.ts                     ← Helpers مشتركة (invalidate, isLimitError, reorder)
├── useMenuMutations.ts            ← Categories + Menu Items + Sizes + Extras
├── useBranchMutations.ts          ← Branches + Delivery Areas
├── useOrderMutations.ts           ← Order status updates
└── useRestaurantMutations.ts      ← Restaurant info (logo, cover, social)
```

**لماذا هذا التقسيم تحديداً؟**

- **Menu domain واحد** (categories + items + sizes + extras) لأنهم بيشاركوا نفس الـ `useInvalidateMenu` helper، ومستخدمين كلهم في صفحة `MenuManagement.tsx` الوحيدة.
- **Branches domain واحد** (branches + delivery areas) لأن delivery areas تابعة للفروع logically، ومشاركين `useInvalidateBranches`، ومستخدمين في صفحة `BranchesManagement.tsx`.
- **Orders منفصل** لأنه مستخدم في 3 صفحات مختلفة (Dashboard / Branch / WhatsApp orders) وله منطقه الخاص (isBranch flag).
- **Restaurant منفصل** لأنه بيأثّر على cache مختلف تماماً (`['restaurant', username]`) ومستخدم في صفحتين منفصلتين عن القائمة والفروع (`RestaurantInfo` و `FooterManagement`).

---

### تفاصيل الملفات

#### 1) `_shared.ts` (الحدّ من التكرار)

يحتوي على:

- `useInvalidateMenu(restaurantId)` — مشترك بين 4 hooks في menu.
- `useInvalidateBranches(restaurantId)` — مشترك بين 5 hooks في branches.
- `isLimitError(error)` — helper معالجة أخطاء الـ triggers.
- `useReorderMutation(tableName, cacheKeys)` — Generic helper للـ batch reorder (يستخدمه كلاً من menu و branches).

#### 2) `useMenuMutations.ts`

- `useSaveCategory` / `useDeleteCategory` / `useReorderCategories`
- `useSaveMenuItem` / `useDeleteMenuItem` / `useReorderMenuItems`
- `useSaveSize` / `useDeleteSize`
- `useSaveExtra` / `useDeleteExtra` / `useReorderExtras`
- تعريف `SaveItemData` interface داخل نفس الملف.

#### 3) `useBranchMutations.ts`

- `useSaveBranch` / `useDeleteBranch` / `useToggleBranchActive` / `useReorderBranches`
- `useSaveDeliveryArea` / `useDeleteDeliveryArea` / `useReorderDeliveryAreas`
- تعريف `SaveBranchData` و `SaveAreaData` داخل نفس الملف.
- ملاحظة: `useReorderDeliveryAreas` الحالي فيه duplication للـ logic بدل استخدام `useReorderMutation` helper — هنستفيد من الفرصة ونوحّده مع الـ generic helper (clean code).

#### 4) `useOrderMutations.ts`

- `useUpdateOrderStatus(idOrBranch, isBranch)` فقط.

#### 5) `useRestaurantMutations.ts`

- `useSaveRestaurant(username)` فقط.

#### 6) `index.ts` — Backward Compatibility

Re-export كل الـ hooks بنفس أسمائها الحالية:

```ts
export * from './useMenuMutations';
export * from './useBranchMutations';
export * from './useOrderMutations';
export * from './useRestaurantMutations';
```

---

### استراتيجية عدم الكسر (Backward Compatibility)

**المشكلة**: 7 ملفات بتعمل `import { ... } from '@/hooks/useAdminMutations'`.

**الحل**: الملف القديم `src/hooks/useAdminMutations.ts` هيتحوّل لـ **re-export shim** سطر واحد:

```ts
export * from './admin-mutations';
```

وبكدا:

- **كل الـ imports الموجودة بتفضل شغّالة بدون أي تعديل** في الصفحات الـ 7.
- لو حبيت تحدّث الـ imports لاحقاً لتستورد مباشرةً من الملفات الجديدة (أنظف)، تقدر — لكن مش إجباري دلوقتي.

---

### Clean Code Improvements خلال التقسيم

1. **استخراج helpers مكررة**: كل helper يُستخدم أكثر من مرة بنقله لـ `_shared.ts`.
2. **توحيد `useReorderDeliveryAreas**`: بيستخدم الـ generic `useReorderMutation` بدل تكرار الكود (يحذف ~20 سطر مكرر).
3. **توحيد التسميات**: كل ملف يبدأ بـ imports، helpers خاصة (لو فيه)، interfaces، ثم hooks بالترتيب: Save → Delete → Toggle → Reorder.
4. **JSDoc قصير**: سطر توضيحي فوق كل hook (اختياري، لكن يُساعد IntelliSense).

---

### ما الذي **لن** يتغيّر

- أسماء كل الـ exports (backward compatible).
- منطق الـ mutations (حرفياً نفسه).
- Cache keys في React Query.
- Toast messages.
- Database / RLS / RPC.
- أي ملف تاني في المشروع.

---

### خطوات التنفيذ

1. إنشاء مجلد `src/hooks/admin-mutations/` مع 6 ملفات.
2. نقل الكود حسب الـ domain مع استخراج الـ helpers المشتركة.
3. تحويل `src/hooks/useAdminMutations.ts` لـ re-export shim.
4. تشغيل `npx tsc --noEmit` للتأكد من نجاح الـ build.
5. (اختياري لاحقاً) تحديث الـ imports في الصفحات الـ 7 لتستورد من الملفات المباشرة.  
  
ملحوظه : لا تنسى تنظيف الاكواد القديمه

---

### الملفات المتأثرة


| ملف                                                   | تغيير                           |
| ----------------------------------------------------- | ------------------------------- |
| `src/hooks/admin-mutations/_shared.ts`                | **جديد**                        |
| `src/hooks/admin-mutations/useMenuMutations.ts`       | **جديد**                        |
| `src/hooks/admin-mutations/useBranchMutations.ts`     | **جديد**                        |
| `src/hooks/admin-mutations/useOrderMutations.ts`      | **جديد**                        |
| `src/hooks/admin-mutations/useRestaurantMutations.ts` | **جديد**                        |
| `src/hooks/admin-mutations/index.ts`                  | **جديد** (barrel file)          |
| `src/hooks/useAdminMutations.ts`                      | يصير re-export shim من سطر واحد |
| باقي الملفات (7 صفحات)                                | **لا تتغيّر**                   |
