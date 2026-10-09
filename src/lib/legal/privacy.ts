import type { Locale } from '@/lib/i18n/locale'
import { EMAIL_LINK, LEGAL_OPERATOR, LEGAL_PATHS, type LegalDocument } from './document'

const en: LegalDocument = {
  title: 'Privacy policy',
  description: 'What Fridge Check collects, why, who receives it, and how to delete it.',
  intro: `Fridge Check works without an account, and then we store nothing about you on our servers. This policy explains what happens when you search, when you sign in and when you buy Pro. Questions: ${EMAIL_LINK}.`,
  sections: [
    {
      id: 'who',
      heading: 'Who we are',
      blocks: [
        `${LEGAL_OPERATOR} (“we”, “us”) is a website that suggests recipes from the ingredients you have. We are responsible for the data described here, and you can contact us at ${EMAIL_LINK}.`,
      ],
    },
    {
      id: 'without-account',
      heading: 'Using Fridge Check without an account',
      blocks: [
        'You can search, open recipes, save favorites and keep a shopping list without signing in.',
        {
          list: [
            'Your favorites, shopping list and settings (language and theme) are kept only in your browser. They never reach our servers, and clearing your browser data deletes them.',
            'The ingredients you search for are sent to our server to find recipes. When a search uses Spoonacular or TheMealDB, we send them the ingredient names only, never anything that identifies you.',
            'We use your IP address for a few minutes at most, to stop abuse (a limit on searches per minute). Vercel, which hosts the site, keeps short-lived technical logs of requests (such as IP address, page address and time) to run and protect the service.',
            'Recipe photos load directly from TheMealDB’s and Spoonacular’s servers, so they also receive your IP address and browser details.',
            'One cookie remembers your language. We use no analytics, advertising or tracking cookies.',
          ],
        },
      ],
    },
    {
      id: 'account',
      heading: 'When you sign in with Google',
      blocks: [
        'An account is needed only for Pro. You sign in with Google; we never see your Google password.',
        {
          list: [
            'From Google we receive your name, email address, profile picture and Google account ID. We also store the sign-in tokens Google issues, and never use them to access anything else in your Google account.',
            'Each sign-in creates a session that ends when you sign out or after 30 days without a visit. We store it with the IP address and browser it came from, to recognise and protect sessions, and a cookie keeps you signed in.',
          ],
        },
      ],
    },
    {
      id: 'health',
      heading: 'Your nutrition profile (health data)',
      blocks: [
        'Pro calculates your daily calorie and nutrient targets from a nutrition profile. Because this is health information, we store it only after you tick the consent box.',
        {
          list: [
            'What we store: weight, height, birth year, sex, activity level, goal, how you split your day’s meals, the targets calculated from them, and when you gave consent.',
            'What we use it for: only to calculate your targets and your portions on recipe pages.',
            'We don’t share it with anyone, sell it or use it for advertising. It is stored on our database provider’s servers (see “Who receives data”).',
          ],
        },
        'You can change it at any time on your profile page. To withdraw your consent, delete your account, or email us and we’ll delete the nutrition profile and keep your account.',
      ],
    },
    {
      id: 'payments',
      heading: 'Payments',
      blocks: [
        'Pro is paid through XPay, an Egyptian payment company. You enter your card details on XPay’s own page; they never reach us.',
        {
          list: [
            'We send XPay your name, email address and what you’re buying, and XPay tells us whether the payment succeeded.',
            'We keep a record of each payment: XPay’s reference numbers, the amount, date and status, and the Pro days it paid for. We also keep the payment notifications XPay sends us, which can include your name and email address.',
            'XPay handles your payment details under its own privacy policy.',
          ],
        },
      ],
    },
    {
      id: 'sharing',
      heading: 'Who receives data',
      blocks: [
        'We never sell personal data. These companies process it for us, only to run Fridge Check:',
        {
          list: [
            'Vercel (hosting): every request to the site. Our server code runs in Frankfurt, Germany.',
            'Neon (database): your account, sessions, nutrition profile and payment records, stored in Frankfurt, Germany.',
            'Google (sign-in).',
            'XPay (payments, Egypt).',
            'Spoonacular and TheMealDB (recipes): ingredient names from searches, and the IP address of browsers that load their photos.',
          ],
        },
        'This means your data is stored outside Egypt, in the European Union. We may also disclose data when Egyptian law or a court order requires it.',
      ],
    },
    {
      id: 'retention',
      heading: 'How long we keep it',
      blocks: [
        {
          list: [
            'Account, nutrition profile and Pro status: until you delete your account.',
            'Sessions: until you sign out, or 30 days without a visit.',
            'Payment records: as long as the law requires for financial records, even after you delete your account, but no longer linked to it.',
            'Hosting logs: for a short time, under Vercel’s own policy.',
          ],
        },
      ],
    },
    {
      id: 'rights',
      heading: 'Your choices and rights',
      blocks: [
        {
          list: [
            `See your data: your profile and Pro status are on your [account page](/account). Email us for a copy of everything we hold about you.`,
            'Correct it: edit your nutrition profile at any time. Your name and email address come from Google, so change them there.',
            'Delete it: the Delete account button on your account page removes your account, sessions, Google link, nutrition profile and Pro access at once.',
            'Questions or objections about how we use your data: email us. We reply within 30 days at most.',
          ],
        },
      ],
    },
    {
      id: 'age',
      heading: 'Age',
      blocks: [
        'Accounts, the nutrition profile and Pro are for people aged 18 and over. Anyone can use the recipe search without an account.',
      ],
    },
    {
      id: 'security',
      heading: 'Security',
      blocks: [
        'Connections to the site and to our database are encrypted, payment and sign-in secrets stay on the server, and only the people who run Fridge Check can access the database.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      blocks: [
        `We update the date at the top of this page whenever this policy changes, and announce important changes on the site before they take effect. See also our [terms of use](${LEGAL_PATHS.terms}).`,
      ],
    },
  ],
}

const ar: LegalDocument = {
  title: 'سياسة الخصوصية',
  description: 'ما يجمعه Fridge Check، ولماذا، ومن يتلقاه، وكيف تحذفه.',
  intro: `يعمل Fridge Check دون حساب، وفي هذه الحالة لا نخزّن عنك شيئًا على خوادمنا. توضح هذه السياسة ما يحدث عندما تبحث، وعندما تسجّل الدخول، وعندما تشتري Pro. للأسئلة: ${EMAIL_LINK}.`,
  sections: [
    {
      id: 'who',
      heading: 'من نحن',
      blocks: [
        `${LEGAL_OPERATOR} («نحن») موقع يقترح وصفات من المكونات المتوفرة لديك. نحن المسؤولون عن البيانات الموضحة هنا، ويمكنك التواصل معنا على ${EMAIL_LINK}.`,
      ],
    },
    {
      id: 'without-account',
      heading: 'استخدام Fridge Check دون حساب',
      blocks: [
        'يمكنك البحث وفتح الوصفات وحفظ المفضلة والاحتفاظ بقائمة تسوّق دون تسجيل الدخول.',
        {
          list: [
            'تُحفظ المفضلة وقائمة التسوّق وإعداداتك (اللغة والمظهر) في متصفحك فقط. لا تصل إلى خوادمنا أبدًا، ويحذفها مسح بيانات المتصفح.',
            'تُرسَل المكونات التي تبحث عنها إلى خادمنا للعثور على الوصفات. وعندما يستخدم البحث Spoonacular أو TheMealDB نرسل إليهما أسماء المكونات فقط، ولا نرسل أبدًا ما يدل على هويتك.',
            'نستخدم عنوان IP الخاص بك لبضع دقائق على الأكثر لمنع إساءة الاستخدام (حدّ لعدد عمليات البحث في الدقيقة). وتحتفظ Vercel، التي تستضيف الموقع، بسجلات تقنية قصيرة الأمد للطلبات (مثل عنوان IP وعنوان الصفحة والوقت) لتشغيل الخدمة وحمايتها.',
            'تُحمَّل صور الوصفات مباشرةً من خوادم TheMealDB وSpoonacular، لذا تتلقى هي أيضًا عنوان IP وبيانات متصفحك.',
            'ملف تعريف ارتباط (كوكي) واحد يتذكر لغتك. لا نستخدم أي ملفات تعريف ارتباط للتحليلات أو الإعلانات أو التتبّع.',
          ],
        },
      ],
    },
    {
      id: 'account',
      heading: 'عند تسجيل الدخول بحساب Google',
      blocks: [
        'الحساب مطلوب لـ Pro فقط. تسجّل الدخول عبر Google، ولا نرى كلمة مرور Google أبدًا.',
        {
          list: [
            'نتلقى من Google اسمك وبريدك الإلكتروني وصورة ملفك الشخصي ومعرّف حسابك في Google. ونخزّن أيضًا رموز الدخول التي تصدرها Google، ولا نستخدمها أبدًا للوصول إلى أي شيء آخر في حسابك على Google.',
            'ينشئ كل تسجيل دخول جلسةً تنتهي عند تسجيل خروجك أو بعد 30 يومًا دون زيارة. نخزّنها مع عنوان IP والمتصفح اللذين جاءت منهما لنتعرّف على الجلسات ونحميها، ويُبقيك ملف تعريف ارتباط مسجّلًا الدخول.',
          ],
        },
      ],
    },
    {
      id: 'health',
      heading: 'ملفك الغذائي (بيانات صحية)',
      blocks: [
        'يحسب Pro أهدافك اليومية من السعرات والعناصر الغذائية انطلاقًا من ملف غذائي. ولأنها معلومات صحية، لا نخزّنها إلا بعد أن تضع علامة في خانة الموافقة.',
        {
          list: [
            'ما نخزّنه: الوزن والطول وسنة الميلاد والجنس ومستوى النشاط والهدف وطريقة توزيع وجبات يومك، والأهداف المحسوبة منها، ووقت موافقتك.',
            'فيمَ نستخدمه: لحساب أهدافك وحصصك في صفحات الوصفات فقط.',
            'لا نشاركه مع أحد ولا نبيعه ولا نستخدمه للإعلانات. ويُخزَّن على خوادم مزوّد قاعدة البيانات لدينا (انظر «من يتلقى البيانات»).',
          ],
        },
        'يمكنك تعديله في أي وقت من صفحة ملفك. ولسحب موافقتك احذف حسابك، أو راسلنا لنحذف الملف الغذائي ونُبقي حسابك.',
      ],
    },
    {
      id: 'payments',
      heading: 'المدفوعات',
      blocks: [
        'يُدفع اشتراك Pro عبر XPay، وهي شركة مدفوعات مصرية. تُدخل بيانات بطاقتك في صفحة XPay نفسها، ولا تصل إلينا أبدًا.',
        {
          list: [
            'نرسل إلى XPay اسمك وبريدك الإلكتروني وما تشتريه، وتُبلغنا XPay بنجاح الدفع أو فشله.',
            'نحتفظ بسجل لكل عملية دفع: أرقام XPay المرجعية والمبلغ والتاريخ والحالة، وأيام Pro التي دُفعت مقابلها. ونحتفظ أيضًا بإشعارات الدفع التي ترسلها XPay إلينا، وقد تتضمن اسمك وبريدك الإلكتروني.',
            'تتعامل XPay مع بيانات دفعك وفق سياسة الخصوصية الخاصة بها.',
          ],
        },
      ],
    },
    {
      id: 'sharing',
      heading: 'من يتلقى البيانات',
      blocks: [
        'لا نبيع البيانات الشخصية أبدًا. تعالجها الشركات التالية نيابةً عنا، ولتشغيل Fridge Check فقط:',
        {
          list: [
            'Vercel (الاستضافة): كل طلب يصل إلى الموقع. وتعمل برمجيات خادمنا في فرانكفورت بألمانيا.',
            'Neon (قاعدة البيانات): حسابك وجلساتك وملفك الغذائي وسجلات الدفع، مخزّنة في فرانكفورت بألمانيا.',
            'Google (تسجيل الدخول).',
            'XPay (المدفوعات، مصر).',
            'Spoonacular وTheMealDB (الوصفات): أسماء المكونات من عمليات البحث، وعنوان IP للمتصفحات التي تحمّل صورهما.',
          ],
        },
        'هذا يعني أن بياناتك تُخزَّن خارج مصر، في الاتحاد الأوروبي. وقد نكشف البيانات أيضًا إذا طلب ذلك القانون المصري أو أمر قضائي.',
      ],
    },
    {
      id: 'retention',
      heading: 'مدة الاحتفاظ',
      blocks: [
        {
          list: [
            'الحساب والملف الغذائي وحالة Pro: حتى تحذف حسابك.',
            'الجلسات: حتى تسجّل الخروج، أو 30 يومًا دون زيارة.',
            'سجلات الدفع: المدة التي يفرضها القانون للسجلات المالية، حتى بعد حذف حسابك، لكنها لا تعود مرتبطة به.',
            'سجلات الاستضافة: لفترة قصيرة وفق سياسة Vercel.',
          ],
        },
      ],
    },
    {
      id: 'rights',
      heading: 'خياراتك وحقوقك',
      blocks: [
        {
          list: [
            `الاطلاع على بياناتك: ملفك وحالة Pro في [صفحة حسابك](/account). وراسلنا للحصول على نسخة من كل ما نحتفظ به عنك.`,
            'تصحيحها: عدّل ملفك الغذائي في أي وقت. اسمك وبريدك الإلكتروني يأتيان من Google، فغيّرهما هناك.',
            'حذفها: زر حذف الحساب في صفحة حسابك يحذف حسابك وجلساتك وربطه بـ Google وملفك الغذائي واشتراك Pro دفعةً واحدة.',
            'الأسئلة أو الاعتراض على طريقة استخدامنا لبياناتك: راسلنا، وسنرد خلال 30 يومًا على الأكثر.',
          ],
        },
      ],
    },
    {
      id: 'age',
      heading: 'السن',
      blocks: [
        'الحسابات والملف الغذائي واشتراك Pro مخصصة لمن بلغوا 18 عامًا فأكثر. ويمكن لأي شخص استخدام البحث عن الوصفات دون حساب.',
      ],
    },
    {
      id: 'security',
      heading: 'الأمان',
      blocks: [
        'الاتصال بالموقع وبقاعدة بياناتنا مشفّر، وتبقى أسرار الدفع وتسجيل الدخول على الخادم، ولا يصل إلى قاعدة البيانات إلا القائمون على Fridge Check.',
      ],
    },
    {
      id: 'changes',
      heading: 'تغييرات هذه السياسة',
      blocks: [
        `نحدّث التاريخ أعلى هذه الصفحة كلما تغيّرت هذه السياسة، ونعلن عن التغييرات المهمة على الموقع قبل سريانها. انظر أيضًا [شروط الاستخدام](${LEGAL_PATHS.terms}).`,
      ],
    },
  ],
}

export const privacyPolicy: Record<Locale, LegalDocument> = { en, ar }
