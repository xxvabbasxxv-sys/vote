# Elite State — موقع التصويت

## النشر على Vercel (اسم المشروع: elite-state)
1. ارفع مجلد `elite-state-vote` على GitHub (أو شغّل `npx vercel` داخل المجلد).
2. في Vercel: New Project → اختر المستودع → اكتب اسم المشروع `elite-state` → Deploy.
3. من تبويب Storage في المشروع: Create → Upstash Redis (مجاني) → اربطه بالمشروع.
   هذا يضيف متغيرات البيئة تلقائياً.
4. اعمل Redeploy مرة وحدة، وبعدها التصويت يشتغل.

الرابط يصير غالباً: https://elite-state.vercel.app (لو الاسم متاح).

## تعديل التصويتات
عدّل ملف `polls.json`: أضف تصويت جديد أو غيّر الخيارات، و`"closed": true` يقفل التصويت ويعرض النتائج.
(لا تغيّر `id` تصويت شغّال، لأن الأصوات مربوطة فيه.)

## الصور (assets)
مجلد `assets` فيه صور الجانبين (Elite State يسار، Respect Club يمين). ارفعه مع باقي الملفات.
وقت بداية التصويت ونهايته في `polls.json` (`startsAt` و`endsAt`)، ومنها تتحرك الصور: اليسار يخفت واليمين يتضح.
