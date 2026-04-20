## خطة إصلاح Build Errors

كل الأخطاء سببها واحد: **TypeScript الصارم** يرفض الـ generic types (`Record<string, any>`, `Record<string, string>`, `unknown`) عند تمريرها لدوال Supabase أو `error.message`. الحل بسيط ومحدود — **بدون أي تغيير في سلوك الكود**.

### 1) `src/hooks/useAdminMutations.ts` — سطر 389 و 424

المشكلة: `supabase.from('restaurants').update(data)` و `supabase.from('orders').update(updateData)` يستقبلان نوع صارم، والـ `data` الوارد عنده index signature `[key: string]: any` اللي مش متوافق.

الإصلاح:

- **سطر 387**: تغيير نوع `data` من `{ name: string; username: string; [key: string]: any }` إلى استخدام `TablesUpdate<'restaurants'> & { name: string; username: string }` المستورد من `@/integrations/supabase/types`.
- **سطر 422**: تغيير `Record<string, any>` إلى `TablesUpdate<'orders'>`.

هذا يحافظ على نفس السلوك 100% — الفرق الوحيد أن الأنواع أصبحت متوافقة مع schema الفعلي.

### 2) `src/hooks/useStaffLeadsData.ts` — سطر 25

المشكلة: `Record<string, string>` غير متوافق مع `TablesUpdate<'contact_leads'>`.

الإصلاح: تغيير `Record<string, string>` إلى `TablesUpdate<'contact_leads'>` (مع import من types).

### 3) `supabase/functions/auto-renew-subscriptions/index.ts` — سطر 108 و 135

المشكلة: في `catch (err)` و `catch (error)` يكون النوع `unknown` في Deno strict mode، فلا يمكن الوصول إلى `.message` مباشرة.

الإصلاح:

- **سطر 108**: `err instanceof Error ? err.message : String(err)`
- **سطر 135**: `error instanceof Error ? error.message : String(error)`

هذا هو النمط القياسي الآمن ولا يغير سلوك الكود.

### ضمان عدم التأثير على باقي المشروع

- كل التعديلات **محلية** (4 أسطر فقط موزعة على 3 ملفات).
- الاستيرادات الجديدة (`TablesUpdate`) من نفس الملف الموجود `src/integrations/supabase/types.ts` بدون أي تعديل عليه.
- لا تغيير في أي function signature عامة، ولا في الـ mutations behavior، ولا في الـ Edge Function logic.
- Edge Function سيُنشر تلقائياً بعد التعديل وسيمر Type checking.

### الملفات المتأثرة فقط

1. `src/hooks/useAdminMutations.ts` (تعديل سطرين + import واحد)
2. `src/hooks/useStaffLeadsData.ts` (تعديل سطر + import واحد)
3. `supabase/functions/auto-renew-subscriptions/index.ts` (تعديل سطرين)

وافق على الخطة وسأنفذها فوراً.  
  
بعد انجازك للمهمه اشرح لي المشكله رقم 1 وما كان الضرر منها وما الفائدة بعد اصلاحها ؟  
واشرح ماذا تقصد ب `TablesUpdate<'restaurants'>`