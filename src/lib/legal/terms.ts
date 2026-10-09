import { PRO_PERIOD_DAYS, PRO_PRICE_EGP } from '@/lib/billing/plan'
import type { Locale } from '@/lib/i18n/locale'
import {
  EMAIL_LINK,
  LEGAL_OPERATOR,
  LEGAL_PATHS,
  REFUND_WINDOW_DAYS,
  type LegalDocument,
} from './document'

const en: LegalDocument = {
  title: 'Terms of use',
  description: 'The rules for using Fridge Check and buying Fridge Check Pro.',
  intro: `These terms apply when you use Fridge Check, which is run by ${LEGAL_OPERATOR} (“we”, “us”). By using the site, creating an account or paying for Pro, you agree to them. Please also read our [privacy policy](${LEGAL_PATHS.privacy}) and [refund policy](${LEGAL_PATHS.refunds}).`,
  sections: [
    {
      id: 'service',
      heading: 'What Fridge Check is',
      blocks: [
        'Fridge Check suggests recipes based on the ingredients you have, using recipes from TheMealDB and Spoonacular. The free features need no account. Fridge Check Pro adds a nutrition profile, nutrition values for recipes and personal portion sizes.',
      ],
    },
    {
      id: 'recipes',
      heading: 'Recipes and food safety',
      blocks: [
        {
          list: [
            'Recipes, photos and quantities come from other sources. We don’t test them and can’t promise they are accurate or complete.',
            'Diet labels (such as vegetarian or gluten-free) are our best estimate. Always check the ingredients yourself if you have an allergy, an intolerance or a strict diet.',
            'Follow safe food handling and cooking practices. You are responsible for what you cook and eat.',
          ],
        },
      ],
    },
    {
      id: 'nutrition',
      heading: 'Nutrition is not medical advice',
      blocks: [
        {
          list: [
            'Targets, nutrition values and portions are estimates, calculated with standard formulas from average food data published by the USDA. Real values vary with brands, sizes and cooking.',
            'They are general information, not medical or dietary advice. Talk to a doctor or dietitian before changing your diet, especially if you are pregnant or breastfeeding, have a medical condition or a history of eating disorders, or take medication.',
          ],
        },
      ],
    },
    {
      id: 'accounts',
      heading: 'Accounts',
      blocks: [
        {
          list: [
            'You need a Google account to sign in, and you must be 18 or older.',
            'Keep your Google account secure: anyone who can sign in to it can use your Fridge Check account.',
            'You can delete your account at any time from your account page.',
          ],
        },
      ],
    },
    {
      id: 'pro',
      heading: 'Fridge Check Pro',
      blocks: [
        {
          list: [
            `Pro costs ${PRO_PRICE_EGP} EGP for ${PRO_PERIOD_DAYS} days. The price is shown before you pay, and you pay once: nothing renews or charges you automatically.`,
            'Payments are handled by XPay. Pro starts as soon as XPay confirms your payment (with Fawry, once you have paid your reference).',
            `If you pay again while you still have Pro, the new ${PRO_PERIOD_DAYS} days start when your current ones end.`,
            `Refunds follow our [refund policy](${LEGAL_PATHS.refunds}): a full refund if you ask within ${REFUND_WINDOW_DAYS} days of paying.`,
            'If we stop offering Pro, we refund the unused days of any pass that is still running.',
            'We may change the price of Pro, but never for a pass you have already paid for.',
          ],
        },
      ],
    },
    {
      id: 'fair-use',
      heading: 'Fair use',
      blocks: [
        'Please don’t:',
        {
          list: [
            'use automated tools to copy recipes or send large numbers of requests;',
            'try to get around the payment, the limits or the security of the site;',
            'share or resell Pro access, or use someone else’s account;',
            'use Fridge Check for anything illegal.',
          ],
        },
        'We may limit or suspend access for anyone who does. If we suspend a Pro account through no fault of yours, we refund its unused days.',
      ],
    },
    {
      id: 'content',
      heading: 'Content and credits',
      blocks: [
        'The Fridge Check name, design and software belong to us. Recipes and photos belong to their owners and are shown from TheMealDB and Spoonacular. Nutrition values come from USDA FoodData Central, which is in the public domain.',
      ],
    },
    {
      id: 'availability',
      heading: 'Availability and changes',
      blocks: [
        'We work to keep Fridge Check available but can’t promise it always will be. The recipe services we depend on have their own limits: for example, when Spoonacular’s daily limit is reached, searches use our built-in recipes until it resets. We may change or improve features at any time.',
      ],
    },
    {
      id: 'liability',
      heading: 'Liability',
      blocks: [
        'Fridge Check is provided as it is. As far as the law allows, we are not liable for indirect losses, and our total liability to you is limited to what you paid us in the 12 months before the claim. Nothing in these terms limits your rights under Egyptian consumer protection law.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to these terms',
      blocks: [
        'We may update these terms. We will change the date at the top of this page and announce important changes on the site before they take effect. If you keep using Fridge Check after a change takes effect, the new terms apply.',
      ],
    },
    {
      id: 'law',
      heading: 'Law and contact',
      blocks: [
        `These terms are governed by the laws of the Arab Republic of Egypt, and the Egyptian courts have jurisdiction over any dispute. Questions or complaints: ${EMAIL_LINK}.`,
      ],
    },
  ],
}

const ar: LegalDocument = {
  title: 'شروط الاستخدام',
  description: 'قواعد استخدام Fridge Check وشراء اشتراك Fridge Check Pro.',
  intro: `تسري هذه الشروط عند استخدامك Fridge Check، الذي يديره ${LEGAL_OPERATOR} («نحن»). باستخدامك الموقع أو إنشاء حساب أو الدفع مقابل Pro فإنك توافق عليها. يُرجى أيضًا قراءة [سياسة الخصوصية](${LEGAL_PATHS.privacy}) و[سياسة الاسترداد](${LEGAL_PATHS.refunds}).`,
  sections: [
    {
      id: 'service',
      heading: 'ما هو Fridge Check',
      blocks: [
        'يقترح Fridge Check وصفات بناءً على المكونات المتوفرة لديك، مستعينًا بوصفات من TheMealDB وSpoonacular. لا تحتاج الميزات المجانية إلى حساب. ويضيف Fridge Check Pro ملفًا غذائيًا وقيمًا غذائية للوصفات وأحجام حصص شخصية.',
      ],
    },
    {
      id: 'recipes',
      heading: 'الوصفات وسلامة الغذاء',
      blocks: [
        {
          list: [
            'تأتي الوصفات والصور والكميات من مصادر أخرى. لا نجرّبها ولا نضمن دقتها أو اكتمالها.',
            'تصنيفات الأنظمة الغذائية (مثل نباتي أو خالٍ من الغلوتين) هي أفضل تقدير لدينا. تحقّق دائمًا من المكونات بنفسك إذا كانت لديك حساسية أو عدم تحمّل أو نظام غذائي صارم.',
            'اتبع ممارسات التعامل الآمن مع الطعام وطهيه. أنت مسؤول عمّا تطهوه وتأكله.',
          ],
        },
      ],
    },
    {
      id: 'nutrition',
      heading: 'القيم الغذائية ليست نصيحة طبية',
      blocks: [
        {
          list: [
            'الأهداف والقيم الغذائية والحصص تقديرات، محسوبة بمعادلات معتمدة من بيانات متوسطة عن الأطعمة تنشرها وزارة الزراعة الأمريكية (USDA). وتختلف القيم الفعلية باختلاف العلامات التجارية والأحجام وطريقة الطهي.',
            'هي معلومات عامة وليست نصيحة طبية أو غذائية. استشر طبيبًا أو أخصائي تغذية قبل تغيير نظامك الغذائي، خاصةً في حالات الحمل أو الرضاعة، أو إذا كانت لديك حالة صحية أو تاريخ مع اضطرابات الأكل، أو كنت تتناول أدوية.',
          ],
        },
      ],
    },
    {
      id: 'accounts',
      heading: 'الحسابات',
      blocks: [
        {
          list: [
            'تحتاج إلى حساب Google لتسجيل الدخول، ويجب أن يكون عمرك 18 عامًا أو أكثر.',
            'حافظ على أمان حسابك في Google: فكل من يستطيع الدخول إليه يستطيع استخدام حسابك في Fridge Check.',
            'يمكنك حذف حسابك في أي وقت من صفحة حسابك.',
          ],
        },
      ],
    },
    {
      id: 'pro',
      heading: 'Fridge Check Pro',
      blocks: [
        {
          list: [
            `سعر اشتراك Pro هو ${PRO_PRICE_EGP} جنيه مقابل ${PRO_PERIOD_DAYS} يومًا. يظهر السعر قبل الدفع، وتدفع مرة واحدة: لا يتجدد شيء ولا يُخصم منك أي مبلغ تلقائيًا.`,
            'تتولى XPay معالجة المدفوعات. يبدأ Pro فور تأكيد XPay للدفع (وفي حالة فوري، بعد دفع الرقم المرجعي).',
            `إذا دفعت مجددًا وما زال لديك Pro، تبدأ الأيام الـ ${PRO_PERIOD_DAYS} الجديدة عند انتهاء أيامك الحالية.`,
            `يخضع الاسترداد لـ[سياسة الاسترداد](${LEGAL_PATHS.refunds}): استرداد كامل إذا طلبته خلال ${REFUND_WINDOW_DAYS} يومًا من الدفع.`,
            'إذا توقفنا عن تقديم Pro، نرد قيمة الأيام غير المستخدمة من أي اشتراك ما زال ساريًا.',
            'قد نغيّر سعر Pro، لكن ليس لاشتراك دفعت ثمنه بالفعل.',
          ],
        },
      ],
    },
    {
      id: 'fair-use',
      heading: 'الاستخدام العادل',
      blocks: [
        'يُرجى عدم:',
        {
          list: [
            'استخدام أدوات آلية لنسخ الوصفات أو إرسال أعداد كبيرة من الطلبات؛',
            'محاولة التحايل على الدفع أو الحدود أو أمان الموقع؛',
            'مشاركة اشتراك Pro أو إعادة بيعه، أو استخدام حساب شخص آخر؛',
            'استخدام Fridge Check في أي غرض غير قانوني.',
          ],
        },
        'قد نقيّد أو نوقف وصول من يفعل ذلك. وإذا أوقفنا حساب Pro دون خطأ منك، نرد قيمة أيامه غير المستخدمة.',
      ],
    },
    {
      id: 'content',
      heading: 'المحتوى وحقوقه',
      blocks: [
        'اسم Fridge Check وتصميمه وبرمجياته ملك لنا. الوصفات والصور ملك لأصحابها وتُعرض من TheMealDB وSpoonacular. والقيم الغذائية مأخوذة من قاعدة بيانات USDA FoodData Central، وهي ملك عام.',
      ],
    },
    {
      id: 'availability',
      heading: 'التوفر والتغييرات',
      blocks: [
        'نعمل على إبقاء Fridge Check متاحًا، لكن لا نضمن توفره دائمًا. ولخدمات الوصفات التي نعتمد عليها حدودها الخاصة: فمثلًا، عند بلوغ الحد اليومي لـ Spoonacular يعتمد البحث على وصفاتنا المدمجة حتى يُعاد ضبطه. وقد نغيّر الميزات أو نحسّنها في أي وقت.',
      ],
    },
    {
      id: 'liability',
      heading: 'المسؤولية',
      blocks: [
        'يُقدَّم Fridge Check كما هو. وفي الحدود التي يسمح بها القانون، لا نتحمل المسؤولية عن الخسائر غير المباشرة، ولا تتجاوز مسؤوليتنا الإجمالية تجاهك ما دفعته لنا خلال الاثني عشر شهرًا السابقة للمطالبة. ولا يحدّ أي شيء في هذه الشروط من حقوقك بموجب قانون حماية المستهلك المصري.',
      ],
    },
    {
      id: 'changes',
      heading: 'تغيير هذه الشروط',
      blocks: [
        'قد نحدّث هذه الشروط. سنغيّر التاريخ أعلى هذه الصفحة ونعلن عن التغييرات المهمة على الموقع قبل سريانها. وإذا واصلت استخدام Fridge Check بعد سريان التغيير، تسري عليك الشروط الجديدة.',
      ],
    },
    {
      id: 'law',
      heading: 'القانون والتواصل',
      blocks: [
        `تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بنظر أي نزاع. للأسئلة أو الشكاوى: ${EMAIL_LINK}.`,
      ],
    },
  ],
}

export const termsOfUse: Record<Locale, LegalDocument> = { en, ar }
