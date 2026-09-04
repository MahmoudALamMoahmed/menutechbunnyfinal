# إضافة ملف الذاكرة PROJECT_CONTEXT.md وتحديثه ليطابق المشروع الحالي

نعم، الملف مفيد جدًا — فيه قرارات معمارية ومشاكل محلولة لا يمكن استنتاجها من الكود. لكنه قديم في عدة نقاط تم تغييرها في هذا المشروع. الخطة: إضافته إلى جذر المشروع بعد تصحيح ما تغيّر، ثم تسجيل القواعد الجوهرية في ذاكرة المشروع الدائمة.

## ما سيتم

1. إنشاء `PROJECT_CONTEXT.md` في جذر المشروع بنفس هيكل الملف المرفوع (9 أقسام، عربي).
2. تصحيح الأقسام التي لم تعد مطابقة للواقع (تم التحقق منها في الكود).
3. إضافة القرارات الجديدة التي لم تكن في الملف القديم.
4. تسجيل أهم القواعد في ذاكرة المشروع الدائمة حتى تُطبَّق تلقائيًا في كل جلسة.

## التصحيحات المطلوبة (مؤكدة من الكود)

| في الملف القديم | الواقع الحالي |
| --- | --- |
| مسار موظف الفرع `/{username}/branch-orders` | حُذف. الموظف يسجّل دخول من `/:username/branch-staff-login` ويرى `dashboard` + `dashboard-orders` + `whatsapp-orders` لفرعه فقط |
| خريطة الصفحات في القسم 8 | المسارات الفعلية: `restaurant-info`, `menu-management`, `footer-management`, `branches-management`, `dashboard-orders`, `whatsapp-orders`, `dashboard-analytics`, `whatsapp-analytics`, `wallet`, `subscription`, `/staff-leads`, `/forgot-password`, `/reset-password` |
| `useAdminMutations.ts` ملف واحد | مقسّم إلى `src/hooks/admin-mutations/` (menu / branches / orders / restaurant / offers + `_shared.ts` + barrel `index.ts`) |
| `orders INSERT with true` قرار مقبول | لم يعد صحيحًا: سُحبت صلاحية INSERT من `anon`/`authenticated` وحُذفت السياسة العامة؛ إنشاء الطلب يمرّ حصريًا عبر RPC `create_order` الذي يحسب الأسعار على السيرفر |
| لا ذكر لجلب بيانات المنيو | RPC `get_public_restaurant_data` يجلب كل بيانات المنيو العامة في استعلام واحد؛ view `public_restaurants` أصبح SELECT فقط للأدوار العامة |

## إضافات جديدة للقسم 4 و5

- العروض (`offers`) + إدارتها بالسحب والإفلات + `OffersStrip` في صفحة المطعم ودمجها بالسلة.
- الأحجام والأنواع: جدول `item_variants` بجانب `sizes` داخل ديالوج واحد بتابات.
- غلاف المطعم بنسبة ثابتة 16:9 عبر الرفع والعرض والـ Skeleton (لا تُعاد صور blur).
- حذف `PageTransition` نهائيًا — لا انيميشن انتقال بين الصفحات.
- الشريط السفلي في صفحة المطعم يستخدم Scroll Spy لتحديد القسم النشط.
- ملف `README.md` الحالي هو الشرح العام للمشروع؛ `PROJECT_CONTEXT.md` مخصص لقواعد العمل الداخلية.

## تفاصيل تقنية

- الملف الجديد: `PROJECT_CONTEXT.md` (جذر المشروع) — بدون أي مفاتيح سرية، يُشار إلى `.env` بالأسماء فقط.
- لا تعديل على أي كود أو قاعدة بيانات في هذه الخطة — إنشاء توثيق فقط.
- تسجيل في الذاكرة الدائمة: قاعدة "لا إنشاء طلب مباشر — فقط RPC create_order"، وقاعدة "بيانات المنيو العامة عبر get_public_restaurant_data"، وقاعدة "الأدوار في user_roles + has_role"، مع إشارة إلى `PROJECT_CONTEXT.md` كمصدر السياق الكامل.
