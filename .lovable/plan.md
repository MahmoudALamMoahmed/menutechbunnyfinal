## الهدف

الكود حالياً **سليم وطبيعي** والـ CLS = 0.01 ممتاز. الخطة دي مجرد **تنضيف تجميلي** لإزالة dead code وتقليل أي layout shift متبقي. **مفيش أي مخاطر** على الموقع.

---

## التعديلات

### 1. حذف `getCoverBlurUrl` من `src/lib/bunny.ts` (dead code)

الدالة دي لسه موجودة بس مفيش حد بيستخدمها (إنت حذفت الـ blur cover من فترة).

**الملف**: `src/lib/bunny.ts` — حذف الأسطر 110-116:
```ts
// نسخة مصغرة جداً لخلفية الـ blur -- بعد التمويه لا فرق بصري
export function getCoverBlurUrl(url: string | null | undefined): string {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=80&quality=30`;
}
```

### 2. توحيد ارتفاع غلاف الـ Skeleton مع الصفحة الفعلية

عشان الانتقال من Skeleton للصفحة يبقى بدون أي shift.

**الملف**: `src/components/restaurant/RestaurantSkeleton.tsx` — السطر 19:
- **قبل**: `h-64 sm:h-72 md:h-96 lg:h-[500px]`
- **بعد**: `h-56 sm:h-64 md:h-80 lg:h-96` (مطابق لـ `Restaurant.tsx:104`)

### 3. تنضيف `@ts-ignore` على `fetchpriority`

استبدال `// @ts-ignore` بطريقة أنظف باستخدام spread (TypeScript 5.5+ بقى يدعمه نيتيف لكن أنظف كده).

**الملف**: `src/pages/Restaurant.tsx` — السطر 107-108:
- **قبل**: `loading="eager" // @ts-ignore` ثم `fetchpriority="high"`
- **بعد**: حذف الكومنت ولفّ الـ attribute بـ spread نظيف

---

## اللي **مش** هنعمله (وليه):

| | السبب |
|---|---|
| ❌ تعديل `index.html` (preload الخطوط) | شغال صح وbest practice |
| ❌ تعديل `RestaurantSkeleton` ككل | بيقلل CLS فعلاً |
| ❌ شيل `fetchpriority="high"` من غلاف المطعم | بيحسّن LCP فعلياً |
| ❌ تعديل `loading="lazy"` على الصور | best practice |

---

## النتيجة المتوقعة

- ✅ صفر dead code
- ✅ CLS أقرب لـ 0.00
- ✅ كود نظيف بدون `@ts-ignore`
- ✅ صفر تأثير سلبي
