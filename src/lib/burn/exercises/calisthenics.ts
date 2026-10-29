import type { Exercise } from '../types'

/** Calisthenics: see ../types.ts for every field's rules. */
export const CALISTHENICS: readonly Exercise[] = [
  {
    id: 'c-squat',
    style: 'calisthenics',
    area: 'legs',
    name: {
      en: 'Bodyweight squat',
      ar: 'سكوات بوزن الجسم',
    },
    sets: 3,
    work: {
      en: '15 reps',
      ar: '15 تكرارًا',
    },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Feet shoulder-width, toes turned out a little',
        'Sit back as if onto a chair, chest up',
        'Push the floor away to stand',
      ],
      ar: [
        'القدمان بعرض الكتفين، وأصابع القدمين للخارج قليلًا',
        'اجلس للخلف كأنك تجلس على كرسي، مع رفع الصدر',
        'ادفع الأرض بقدميك لتقف',
      ],
    },
    avoid: {
      en: [
        'Knees falling inward',
        'Heels lifting off the floor',
        'Rounding the lower back at the bottom',
      ],
      ar: ['سقوط الركبتين للداخل', 'ارتفاع الكعبين عن الأرض', 'تدوير أسفل الظهر في أدنى نقطة'],
    },
  },
  {
    id: 'c-lunge',
    style: 'calisthenics',
    area: 'legs',
    name: {
      en: 'Reverse lunge',
      ar: 'لانج خلفي',
    },
    sets: 3,
    work: {
      en: '10 each leg',
      ar: '10 لكل ساق',
    },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Step back long enough for both knees to bend to 90°',
        'Keep weight in the front heel',
        'Keep the torso tall and the hips facing forward',
      ],
      ar: [
        'ارجع بخطوة طويلة بما يكفي لتنثني الركبتان إلى 90°',
        'أبقِ وزنك على كعب القدم الأمامية',
        'حافظ على الجذع مستقيمًا والوركين متجهين للأمام',
      ],
    },
    avoid: {
      en: [
        'Front knee collapsing inward',
        'Leaning the torso far forward',
        'Dropping the back knee onto the floor',
      ],
      ar: [
        'انهيار الركبة الأمامية للداخل',
        'ميل الجذع كثيرًا للأمام',
        'ارتطام الركبة الخلفية بالأرض',
      ],
    },
  },
  {
    id: 'c-bridge',
    style: 'calisthenics',
    area: 'glutes',
    name: {
      en: 'Glute bridge',
      ar: 'جسر الأرداف',
    },
    sets: 3,
    work: {
      en: '15 reps',
      ar: '15 تكرارًا',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Heels close to your hips',
        'Press through your heels to lift the hips',
        'Squeeze your glutes for one second at the top',
      ],
      ar: [
        'الكعبان قريبان من الوركين',
        'ادفع بكعبيك لترفع الوركين',
        'اضغط عضلات الأرداف لثانية واحدة في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back at the top',
        'Pushing through your toes',
        'Rushing the lowering',
      ],
      ar: ['تقويس أسفل الظهر في الأعلى', 'الدفع بأصابع القدمين', 'النزول بسرعة دون تحكم'],
    },
  },
  {
    id: 'c-slbridge',
    style: 'calisthenics',
    area: 'glutes',
    name: {
      en: 'Single-leg glute bridge',
      ar: 'جسر الأرداف بساق واحدة',
    },
    sets: 3,
    work: {
      en: '10 each leg',
      ar: '10 لكل ساق',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Keep hips level the whole time',
        'Push through the heel of the foot on the floor',
        'Keep the lifted leg still',
      ],
      ar: [
        'حافظ على الوركين في مستوى واحد طوال الوقت',
        'ادفع بكعب القدم التي على الأرض',
        'أبقِ الساق المرفوعة ثابتة',
      ],
    },
    avoid: {
      en: [
        'One hip dropping lower than the other',
        'Pushing from the lower back instead of the glute',
        'Placing the foot too far from the hips',
      ],
      ar: [
        'هبوط أحد الوركين أدنى من الآخر',
        'الدفع من أسفل الظهر بدل عضلة الأرداف',
        'وضع القدم بعيدًا جدًا عن الوركين',
      ],
    },
  },
  {
    id: 'c-plank',
    style: 'calisthenics',
    area: 'core',
    name: {
      en: 'Forearm plank',
      ar: 'بلانك على الساعدين',
    },
    sets: 3,
    work: {
      en: '30 s',
      ar: '30 ث',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Elbows under shoulders',
        'Squeeze glutes and brace like before a cough',
        'Straight line from head to heels',
      ],
      ar: [
        'المرفقان تحت الكتفين',
        'اضغط الأرداف وشدّ بطنك كأنك على وشك السعال',
        'خط مستقيم من الرأس إلى الكعبين',
      ],
    },
    avoid: {
      en: [
        'Hips sagging toward the floor',
        'Holding your breath',
        'Looking up and straining the neck',
      ],
      ar: ['هبوط الوركين نحو الأرض', 'حبس النفس', 'النظر للأعلى وإجهاد الرقبة'],
    },
  },
  {
    id: 'c-hollow',
    style: 'calisthenics',
    area: 'core',
    name: {
      en: 'Hollow body hold',
      ar: 'ثبات الجسم المقعّر (Hollow hold)',
    },
    sets: 3,
    work: {
      en: '20 s',
      ar: '20 ث',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Press the lower back into the floor',
        'Lift the shoulder blades just off the floor',
        'Bend the knees to make it easier',
      ],
      ar: [
        'ألصق أسفل ظهرك بالأرض',
        'ارفع لوحَي الكتفين عن الأرض قليلًا',
        'اثنِ الركبتين لتسهيل التمرين',
      ],
    },
    avoid: {
      en: [
        'Lower back lifting off the floor',
        'Pulling the chin into the chest',
        'Lowering the legs further than you can control',
      ],
      ar: [
        'ارتفاع أسفل الظهر عن الأرض',
        'شدّ الذقن نحو الصدر',
        'إنزال الساقين أكثر مما تستطيع التحكم فيه',
      ],
    },
  },
  {
    id: 'c-burpee',
    style: 'calisthenics',
    area: 'cardio',
    name: {
      en: 'Burpee',
      ar: 'بيربي (Burpee)',
    },
    sets: 4,
    work: {
      en: '8 reps',
      ar: '8 تكرارات',
    },
    restSeconds: 60,
    strength: false,
    cues: {
      en: [
        'Hands flat on the floor under the shoulders',
        'Step back instead of jumping if you need to',
        'Land softly on the balls of your feet',
      ],
      ar: [
        'كفّاك على الأرض تحت الكتفين',
        'ارجع بخطوة بدل القفز إذا احتجت',
        'اهبط بخفة على مقدمة القدمين',
      ],
    },
    avoid: {
      en: [
        'Landing with straight, locked knees',
        'Hips sagging in the plank part',
        'Racing so fast that form breaks',
      ],
      ar: [
        'الهبوط بركبتين مستقيمتين مقفلتين',
        'هبوط الوركين في وضع البلانك',
        'الإسراع حتى يختلّ الأداء',
      ],
    },
  },
  {
    id: 'c-climber',
    style: 'calisthenics',
    area: 'cardio',
    name: {
      en: 'Mountain climbers',
      ar: 'متسلق الجبال',
    },
    sets: 4,
    work: {
      en: '30 s',
      ar: '30 ث',
    },
    restSeconds: 45,
    strength: false,
    cues: {
      en: [
        'Shoulders stacked over wrists',
        'Drive knees toward the chest',
        'Keep a steady rhythm and keep breathing',
      ],
      ar: [
        'الكتفان فوق المعصمين مباشرة',
        'ادفع الركبتين نحو الصدر',
        'حافظ على إيقاع ثابت واستمر في التنفس',
      ],
    },
    avoid: {
      en: ['Hips piking up high', 'Bouncing the hips', 'Shoulders drifting behind the wrists'],
      ar: [
        'ارتفاع الوركين كثيرًا للأعلى',
        'ارتداد الوركين لأعلى وأسفل',
        'رجوع الكتفين خلف المعصمين',
      ],
    },
  },
  {
    id: 'c-pushup',
    style: 'calisthenics',
    area: 'upper',
    name: {
      en: 'Push-up (knees to full)',
      ar: 'تمرين الضغط (من الركبتين إلى الكامل)',
    },
    sets: 3,
    work: {
      en: '8–12 reps',
      ar: '8–12 تكرارًا',
    },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hands just wider than shoulders',
        'Brace your core so the body moves as one',
        'Lower the chest between the hands',
      ],
      ar: [
        'اليدان أوسع قليلًا من الكتفين',
        'شدّ بطنك ليتحرك جسمك كقطعة واحدة',
        'أنزل صدرك بين يديك',
      ],
    },
    avoid: {
      en: ['Elbows flaring straight out to the sides', 'Hips sagging', 'Half reps that stop short'],
      ar: ['فتح المرفقين للجانبين تمامًا', 'هبوط الوركين', 'تكرارات ناقصة لا تكمل المدى'],
    },
  },
  {
    id: 'c-row',
    style: 'calisthenics',
    area: 'upper',
    name: {
      en: 'Table row',
      ar: 'سحب مقلوب تحت الطاولة',
    },
    sets: 3,
    work: {
      en: '8 reps',
      ar: '8 تكرارات',
    },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Use a sturdy table edge',
        'Keep the body straight, heels on the floor',
        'Pull the chest to the edge',
      ],
      ar: ['استخدم حافة طاولة متينة', 'جسمك مستقيم والكعبان على الأرض', 'اسحب صدرك نحو الحافة'],
    },
    avoid: {
      en: [
        'Shrugging the shoulders to the ears',
        'Hips dropping during the pull',
        'Using a table that can tip or slide',
      ],
      ar: [
        'رفع الكتفين نحو الأذنين',
        'هبوط الوركين أثناء السحب',
        'استخدام طاولة قد تنقلب أو تنزلق',
      ],
    },
  },
  // Legs
  {
    id: 'c-wall-sit',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Wall sit', ar: 'الجلوس على الحائط (Wall sit)' },
    sets: 3,
    work: { en: '40 s', ar: '40 ث' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Back flat against the wall, feet shoulder-width',
        'Slide down until the thighs are parallel to the floor',
        'Knees directly above the ankles',
      ],
      ar: [
        'الظهر ملتصق بالحائط والقدمان بعرض الكتفين',
        'انزلق للأسفل حتى يصبح الفخذان موازيين للأرض',
        'الركبتان فوق الكاحلين مباشرة',
      ],
    },
    avoid: {
      en: [
        'Knees drifting past the toes',
        'Resting the hands on the thighs',
        'Holding your breath',
      ],
      ar: ['تجاوز الركبتين لأصابع القدمين', 'إسناد اليدين على الفخذين', 'حبس النفس'],
    },
  },
  {
    id: 'c-split-squat',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Split squat', ar: 'سكوات منفصل (Split squat)' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Take a long stance with the front foot flat',
        'Lower straight down until the back knee nearly touches the floor',
        'Drive through the front heel to stand',
      ],
      ar: [
        'اتخذ وقفة طويلة مع تثبيت القدم الأمامية كاملة',
        'انزل عموديًا حتى تقترب الركبة الخلفية من الأرض',
        'ادفع بكعب القدم الأمامية لتقف',
      ],
    },
    avoid: {
      en: [
        'Front knee caving inward',
        'A stance so short the front heel lifts',
        'Leaning forward over the front knee',
      ],
      ar: [
        'انهيار الركبة الأمامية للداخل',
        'وقفة قصيرة جدًا ترفع الكعب الأمامي',
        'الميل للأمام فوق الركبة الأمامية',
      ],
    },
  },
  {
    id: 'c-bulgarian',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Bulgarian split squat', ar: 'سكوات بلغاري (Bulgarian split squat)' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Rest the back foot on a chair or step behind you',
        'Keep most of your weight on the front leg',
        'Lower until the front thigh is about parallel to the floor',
      ],
      ar: [
        'ضع القدم الخلفية على كرسي أو درجة خلفك',
        'أبقِ معظم وزنك على الساق الأمامية',
        'انزل حتى يصبح الفخذ الأمامي موازيًا للأرض تقريبًا',
      ],
    },
    avoid: {
      en: [
        'Front foot placed too close to the chair',
        'Pushing off the back foot',
        'Twisting the hips toward the lifted leg',
      ],
      ar: [
        'وضع القدم الأمامية قريبًا جدًا من الكرسي',
        'الدفع بالقدم الخلفية',
        'التواء الوركين نحو الساق المرفوعة',
      ],
    },
  },
  {
    id: 'c-stepup',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Step-up', ar: 'صعود الدرجة (Step-up)' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Use a sturdy step at about knee height',
        'Place the whole foot on the step and drive through the heel',
        'Lower slowly under control',
      ],
      ar: [
        'استخدم درجة ثابتة بارتفاع الركبة تقريبًا',
        'ضع القدم كاملة على الدرجة وادفع بالكعب',
        'انزل ببطء وبتحكم',
      ],
    },
    avoid: {
      en: [
        'Pushing off the bottom foot',
        'Knee caving inward on the step',
        'Dropping down instead of lowering with control',
      ],
      ar: [
        'الدفع بالقدم السفلية',
        'انهيار الركبة للداخل على الدرجة',
        'السقوط للأسفل بدل النزول بتحكم',
      ],
    },
  },
  {
    id: 'c-calf-raise',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Calf raise', ar: 'رفع السمانة (Calf raise)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Stand on the edge of a step with the heels hanging off',
        'Rise as high as you can onto the balls of the feet',
        'Lower the heels slowly below the step',
      ],
      ar: [
        'قف على حافة درجة مع تدلّي الكعبين',
        'ارتفع على مقدمة القدمين لأعلى ما تستطيع',
        'أنزل الكعبين ببطء تحت مستوى الدرجة',
      ],
    },
    avoid: {
      en: [
        'Bouncing at the bottom',
        'Bending the knees to help',
        'Rolling onto the outside of the feet',
      ],
      ar: ['الارتداد في أدنى نقطة', 'ثني الركبتين للمساعدة', 'الميل على الجانب الخارجي للقدمين'],
    },
  },
  {
    id: 'c-sl-calf-raise',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Single-leg calf raise', ar: 'رفع السمانة بساق واحدة' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Touch a wall lightly for balance',
        'Push through the big toe',
        'Pause for a second at the top',
      ],
      ar: ['المس الحائط بخفة لحفظ التوازن', 'ادفع بإصبع القدم الكبير', 'توقف لثانية في الأعلى'],
    },
    avoid: {
      en: [
        'Leaning on the wall to take weight off the leg',
        'Short, fast reps',
        'Ankle rolling outward',
      ],
      ar: [
        'الاتكاء على الحائط لتخفيف الحمل عن الساق',
        'تكرارات قصيرة وسريعة',
        'انثناء الكاحل للخارج',
      ],
    },
  },
  {
    id: 'c-jump-squat',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Jump squat', ar: 'سكوات بالقفز (Jump squat)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Squat to about half depth, then jump',
        'Swing the arms to help',
        'Land softly, toes then heels, straight into the next squat',
      ],
      ar: [
        'انزل في سكوات إلى نصف العمق تقريبًا ثم اقفز',
        'أرجح الذراعين للمساعدة',
        'اهبط بخفة على أصابع القدمين ثم الكعبين مباشرة إلى السكوات التالي',
      ],
    },
    avoid: {
      en: [
        'Landing with locked knees',
        'Knees caving inward on landing',
        'Doing these on a slippery floor',
      ],
      ar: [
        'الهبوط بركبتين مقفلتين',
        'انهيار الركبتين للداخل عند الهبوط',
        'أداء التمرين على أرضية زلقة',
      ],
    },
  },
  {
    id: 'c-nordic',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Nordic curl', ar: 'ثني الركبة النوردي (Nordic curl)' },
    sets: 3,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Kneel on a mat with the heels anchored under a sofa or held by a partner',
        'Lower forward as slowly as you can',
        'Catch yourself with your hands and push back up',
      ],
      ar: [
        'اركع على الحصيرة مع تثبيت الكعبين تحت أريكة أو بمساعدة شريك',
        'انزل للأمام بأبطأ ما تستطيع',
        'استقبل الأرض بيديك وادفع نفسك للأعلى',
      ],
    },
    avoid: {
      en: [
        'Bending at the hips instead of the knees',
        'Dropping fast in the last part of the lowering',
        'Adding reps too quickly before the hamstrings adapt',
      ],
      ar: [
        'الانثناء من الوركين بدل الركبتين',
        'السقوط بسرعة في الجزء الأخير من النزول',
        'زيادة التكرارات بسرعة قبل أن تتعود عضلات الفخذ الخلفية',
      ],
    },
  },
  {
    id: 'c-pistol',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Pistol squat', ar: 'سكوات بساق واحدة (Pistol squat)' },
    sets: 3,
    work: { en: '5 each leg', ar: '5 لكل ساق' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Hold a doorframe or pole for assistance at first',
        'Extend the free leg forward and sit back slowly',
        'Keep the heel of the working foot on the floor',
      ],
      ar: [
        'أمسك بإطار باب أو عمود للمساعدة في البداية',
        'مدّ الساق الحرة للأمام واجلس للخلف ببطء',
        'أبقِ كعب القدم العاملة على الأرض',
      ],
    },
    avoid: {
      en: [
        'Knee collapsing inward',
        'Heel lifting at the bottom',
        'Rounding the back to get lower',
      ],
      ar: ['انهيار الركبة للداخل', 'ارتفاع الكعب في أدنى نقطة', 'تدوير الظهر للنزول أكثر'],
    },
  },
  // Glutes
  {
    id: 'c-donkey-kick',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Donkey kick', ar: 'ركلة الحمار (Donkey kick)' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'On all fours, hands under the shoulders and knees under the hips',
        'Keep the knee bent and push the heel toward the ceiling',
        'Squeeze the glute at the top',
      ],
      ar: [
        'على أربع، اليدان تحت الكتفين والركبتان تحت الوركين',
        'أبقِ الركبة مثنية وادفع الكعب نحو السقف',
        'اضغط عضلة الأرداف في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back to lift higher',
        'Twisting the hips open',
        'Swinging the leg with momentum',
      ],
      ar: [
        'تقويس أسفل الظهر لرفع الساق أعلى',
        'التواء الوركين وانفتاحهما',
        'أرجحة الساق بقوة الدفع',
      ],
    },
  },
  {
    id: 'c-hydrant',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Fire hydrant', ar: 'صنبور الحريق (Fire hydrant)' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'On all fours with a flat back',
        'Lift the bent knee out to the side',
        'Stop when the hips start to tilt',
      ],
      ar: ['على أربع مع ظهر مستوٍ', 'ارفع الركبة المثنية جانبًا', 'توقف عندما يبدأ الوركان بالميل'],
    },
    avoid: {
      en: [
        'Leaning the torso away from the lifting leg',
        'Shifting the weight onto one hand',
        'Dropping the head',
      ],
      ar: ['ميل الجذع بعيدًا عن الساق المرفوعة', 'نقل الوزن إلى يد واحدة', 'إسقاط الرأس للأسفل'],
    },
  },
  {
    id: 'c-clamshell',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Clamshell', ar: 'المحارة (Clamshell)' },
    sets: 3,
    work: { en: '15 each side', ar: '15 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie on your side with the knees bent and heels together',
        'Open the top knee like a clam shell',
        'Keep the feet touching',
      ],
      ar: [
        'استلقِ على جانبك مع ثني الركبتين وضمّ الكعبين',
        'افتح الركبة العلوية كأنها صدفة',
        'أبقِ القدمين متلامستين',
      ],
    },
    avoid: {
      en: ['Rolling the top hip backward', 'Opening fast with momentum', 'Lifting the feet apart'],
      ar: ['تدحرج الورك العلوي للخلف', 'الفتح بسرعة بقوة الدفع', 'رفع القدمين عن بعضهما'],
    },
  },
  {
    id: 'c-side-leg-raise',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Side-lying leg raise', ar: 'رفع الساق جانبًا من الاستلقاء' },
    sets: 3,
    work: { en: '15 each side', ar: '15 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie on your side with the body in a straight line',
        'Lift the top leg to about 45° with the toes pointing forward',
        'Lower slowly',
      ],
      ar: [
        'استلقِ على جانبك وجسمك في خط مستقيم',
        'ارفع الساق العلوية نحو 45° مع توجيه أصابع القدم للأمام',
        'أنزلها ببطء',
      ],
    },
    avoid: {
      en: ['Toes turning up toward the ceiling', 'Leaning the hips back', 'Swinging the leg'],
      ar: ['اتجاه أصابع القدم نحو السقف', 'ميل الوركين للخلف', 'أرجحة الساق'],
    },
  },
  {
    id: 'c-hinge',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Bodyweight hip hinge', ar: 'ثني الورك بوزن الجسم (Hip hinge)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Hands on the hips or across the chest, knees soft',
        'Push the hips back as if closing a door with them',
        'Stand up by squeezing the glutes',
      ],
      ar: [
        'اليدان على الوركين أو على الصدر مع ليونة الركبتين',
        'ادفع الوركين للخلف كأنك تغلق بابًا بهما',
        'قِف بضغط عضلات الأرداف',
      ],
    },
    avoid: {
      en: [
        'Rounding the back',
        'Bending the knees into a squat',
        'Leaning back past upright at the top',
      ],
      ar: [
        'تدوير الظهر',
        'ثني الركبتين وتحويل الحركة إلى سكوات',
        'الميل للخلف أكثر من الوقوف المستقيم في الأعلى',
      ],
    },
  },
  {
    id: 'c-frog-pump',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Frog pump', ar: 'ضخّ الضفدع (Frog pump)' },
    sets: 3,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie on your back with the soles of the feet together and knees out',
        'Tuck the chin and pump the hips up quickly',
        'Squeeze the glutes hard at the top',
      ],
      ar: [
        'استلقِ على ظهرك مع ضمّ باطني القدمين وفتح الركبتين',
        'اضمم الذقن وارفع الوركين بسرعة',
        'اضغط عضلات الأرداف بقوة في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back',
        'Pushing with the neck',
        'Feet drifting too far from the hips',
      ],
      ar: ['تقويس أسفل الظهر', 'الدفع بالرقبة', 'ابتعاد القدمين كثيرًا عن الوركين'],
    },
  },
  {
    id: 'c-elevated-bridge',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Feet-elevated glute bridge', ar: 'جسر الأرداف بالقدمين المرتفعتين' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Heels on a chair or step, knees bent to about 90°',
        'Drive through the heels until the hips are in line with the knees',
        'Hold for a second at the top',
      ],
      ar: [
        'الكعبان على كرسي أو درجة والركبتان مثنيتان نحو 90°',
        'ادفع بالكعبين حتى يصبح الوركان في خط واحد مع الركبتين',
        'اثبت ثانية في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Overarching the lower back at the top',
        'Using a chair that slides',
        'Placing the feet so far away the hamstrings cramp',
      ],
      ar: [
        'المبالغة في تقويس أسفل الظهر في الأعلى',
        'استخدام كرسي ينزلق',
        'وضع القدمين بعيدًا جدًا حتى يتشنّج الفخذ الخلفي',
      ],
    },
  },
  {
    id: 'c-hip-thrust',
    style: 'calisthenics',
    area: 'glutes',
    name: { en: 'Hip thrust', ar: 'دفع الورك (Hip thrust)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Upper back on the edge of a sofa or sturdy chair',
        'Feet flat, shins vertical at the top',
        'Tuck the chin and drive the hips up until the body is flat',
      ],
      ar: [
        'أعلى الظهر على حافة أريكة أو كرسي متين',
        'القدمان مسطحتان والساقان عموديتان في الأعلى',
        'اضمم الذقن وادفع الوركين للأعلى حتى يستقيم الجسم',
      ],
    },
    avoid: {
      en: [
        'Arching the back instead of lifting with the glutes',
        'Looking up at the ceiling',
        'Feet placed too far forward',
      ],
      ar: [
        'تقويس الظهر بدل الرفع بعضلات الأرداف',
        'النظر إلى السقف',
        'وضع القدمين بعيدًا جدًا للأمام',
      ],
    },
  },
  {
    id: 'c-sl-rdl',
    style: 'calisthenics',
    area: 'glutes',
    name: {
      en: 'Single-leg Romanian deadlift',
      ar: 'الرفعة الرومانية بساق واحدة (Single-leg RDL)',
    },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Stand on one leg with a soft knee',
        'Hinge forward and send the free leg straight back',
        'Keep the hips square to the floor',
        'Return by squeezing the standing glute',
      ],
      ar: [
        'قف على ساق واحدة مع ليونة الركبة',
        'انحنِ من الورك ومدّ الساق الحرة للخلف',
        'أبقِ الوركين متوازيين مع الأرض',
        'عد بضغط عضلة أرداف الساق الواقفة',
      ],
    },
    avoid: {
      en: [
        'Rounding the back',
        'Hip of the lifted leg opening upward',
        'Reaching lower than your balance allows',
      ],
      ar: ['تدوير الظهر', 'انفتاح ورك الساق المرفوعة للأعلى', 'النزول أكثر مما يسمح به توازنك'],
    },
  },
  // Core
  {
    id: 'c-dead-bug',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Dead bug', ar: 'الحشرة الميتة (Dead bug)' },
    sets: 3,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lie on your back with the arms up and knees over the hips',
        'Lower the opposite arm and leg slowly',
        'Keep the lower back pressed into the floor',
      ],
      ar: [
        'استلقِ على ظهرك مع رفع الذراعين والركبتين فوق الوركين',
        'أنزل الذراع والساق المعاكستين ببطء',
        'أبقِ أسفل الظهر ملتصقًا بالأرض',
      ],
    },
    avoid: {
      en: ['Lower back arching off the floor', 'Holding your breath', 'Rushing the reps'],
      ar: ['ارتفاع أسفل الظهر عن الأرض', 'حبس النفس', 'الإسراع في التكرارات'],
    },
  },
  {
    id: 'c-bird-dog',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Bird dog', ar: 'الطائر والكلب (Bird dog)' },
    sets: 3,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'On all fours with a flat back',
        'Reach the opposite arm and leg out long',
        'Pause for two seconds, then return',
      ],
      ar: ['على أربع مع ظهر مستوٍ', 'مدّ الذراع والساق المعاكستين بعيدًا', 'توقف لثانيتين ثم عد'],
    },
    avoid: {
      en: [
        'Lifting the leg above hip height and arching',
        'Hips rotating open',
        'Looking up and extending the neck',
      ],
      ar: [
        'رفع الساق فوق مستوى الورك وتقويس الظهر',
        'دوران الوركين وانفتاحهما',
        'النظر للأعلى وشدّ الرقبة',
      ],
    },
  },
  {
    id: 'c-side-plank',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Side plank', ar: 'بلانك جانبي' },
    sets: 3,
    work: { en: '20 s each side', ar: '20 ث لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Elbow directly under the shoulder',
        'Lift the hips until the body is a straight line',
        'Drop the bottom knee to make it easier',
      ],
      ar: [
        'المرفق تحت الكتف مباشرة',
        'ارفع الوركين حتى يصبح الجسم خطًا مستقيمًا',
        'أنزل الركبة السفلية لتسهيل التمرين',
      ],
    },
    avoid: {
      en: [
        'Hips sagging toward the floor',
        'Rolling the chest toward the floor',
        'Shoulder collapsing up into the ear',
      ],
      ar: ['هبوط الوركين نحو الأرض', 'ميل الصدر نحو الأرض', 'انهيار الكتف نحو الأذن'],
    },
  },
  {
    id: 'c-bicycle',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Bicycle crunch', ar: 'كرنش الدراجة (Bicycle crunch)' },
    sets: 3,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Hands lightly behind the head',
        'Bring the opposite elbow toward the knee by rotating the ribcage',
        'Extend the other leg long, just off the floor',
      ],
      ar: [
        'اليدان خلف الرأس بخفة',
        'قرّب المرفق المعاكس من الركبة بتدوير القفص الصدري',
        'مدّ الساق الأخرى بعيدًا فوق الأرض قليلًا',
      ],
    },
    avoid: {
      en: [
        'Pulling on the neck',
        'Moving only the elbow without turning the torso',
        'Going so fast the movement becomes a bounce',
      ],
      ar: [
        'شدّ الرقبة باليدين',
        'تحريك المرفق فقط دون دوران الجذع',
        'الإسراع حتى يتحول التمرين إلى ارتداد',
      ],
    },
  },
  {
    id: 'c-leg-raise',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Lying leg raise', ar: 'رفع الساقين من الاستلقاء' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Hands under the hips, lower back pressed down',
        'Raise the legs together to vertical',
        'Lower slowly, stopping just before the back arches',
      ],
      ar: [
        'اليدان تحت الوركين وأسفل الظهر مضغوط على الأرض',
        'ارفع الساقين معًا إلى الوضع العمودي',
        'أنزلهما ببطء وتوقف قبل أن يتقوس الظهر',
      ],
    },
    avoid: {
      en: [
        'Lower back lifting off the floor',
        'Letting the legs drop',
        'Lifting the head and straining the neck',
      ],
      ar: ['ارتفاع أسفل الظهر عن الأرض', 'ترك الساقين تسقطان', 'رفع الرأس وإجهاد الرقبة'],
    },
  },
  {
    id: 'c-twist',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Russian twist', ar: 'الالتفاف الروسي (Russian twist)' },
    sets: 3,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Sit back to a 45° lean with a tall chest',
        'Rotate the shoulders, not just the arms',
        'Keep the feet on the floor to make it easier',
      ],
      ar: [
        'اجلس مائلًا للخلف نحو 45° مع رفع الصدر',
        'دوّر الكتفين وليس الذراعين فقط',
        'أبقِ القدمين على الأرض لتسهيل التمرين',
      ],
    },
    avoid: {
      en: ['Rounding the back', 'Swinging the arms fast with no control', 'Holding your breath'],
      ar: ['تدوير الظهر', 'أرجحة الذراعين بسرعة دون تحكم', 'حبس النفس'],
    },
  },
  {
    id: 'c-shoulder-tap',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Plank shoulder taps', ar: 'بلانك مع لمس الكتفين' },
    sets: 3,
    work: { en: '20 taps', ar: '20 لمسة' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'High plank with the feet a little wider for balance',
        'Tap the opposite shoulder without moving the hips',
        'Keep the body as still as a table',
      ],
      ar: [
        'بلانك على اليدين مع فتح القدمين قليلًا للتوازن',
        'المس الكتف المعاكس دون تحريك الوركين',
        'أبقِ الجسم ثابتًا كالطاولة',
      ],
    },
    avoid: {
      en: ['Hips swaying side to side', 'Hips piking up', 'Shoulders rounding forward'],
      ar: ['تأرجح الوركين يمينًا ويسارًا', 'ارتفاع الوركين للأعلى', 'تدوير الكتفين للأمام'],
    },
  },
  {
    id: 'c-knee-raise',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Hanging knee raise', ar: 'رفع الركبتين بالتعلق' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hang from the bar with straight arms',
        'Raise the knees to hip height, then curl them a little higher',
        'Lower slowly without swinging',
      ],
      ar: [
        'تعلق بالبار بذراعين مستقيمتين',
        'ارفع الركبتين إلى مستوى الورك ثم لفّهما أعلى قليلًا',
        'أنزلهما ببطء دون أرجحة',
      ],
    },
    avoid: {
      en: [
        'Swinging to build momentum',
        'Arching the back at the bottom',
        'Shrugging the shoulders to the ears',
      ],
      ar: ['الأرجحة لاكتساب قوة الدفع', 'تقويس الظهر في أدنى نقطة', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'c-hanging-leg-raise',
    style: 'calisthenics',
    area: 'core',
    name: { en: 'Hanging leg raise', ar: 'رفع الساقين بالتعلق' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Start from a still hang',
        'Lift the straight legs to hip height or higher by tucking the pelvis',
        'Control the way down',
      ],
      ar: [
        'ابدأ من تعلّق ثابت',
        'ارفع الساقين مستقيمتين إلى مستوى الورك أو أعلى مع ضمّ الحوض',
        'تحكم في النزول',
      ],
    },
    avoid: {
      en: ['Kipping or swinging', 'Arching the lower back', 'Losing the grip as you tire'],
      ar: ['الأرجحة أو استخدام الدفع', 'تقويس أسفل الظهر', 'فقدان القبضة مع التعب'],
    },
  },
  // Upper
  {
    id: 'c-incline-pushup',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Incline push-up', ar: 'تمرين الضغط المائل (Incline push-up)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hands on a sturdy table or step, shoulder-width',
        'Body straight from head to heels',
        'Lower the chest to the edge, then press',
      ],
      ar: [
        'اليدان على طاولة أو درجة ثابتة بعرض الكتفين',
        'الجسم مستقيم من الرأس إلى الكعبين',
        'أنزل صدرك نحو الحافة ثم ادفع',
      ],
    },
    avoid: {
      en: ['Hips sagging or piking', 'Elbows flaring wide', 'Using a surface that can slide'],
      ar: ['هبوط الوركين أو ارتفاعهما', 'فتح المرفقين للجانبين', 'استخدام سطح قد ينزلق'],
    },
  },
  {
    id: 'c-superman',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Superman', ar: 'سوبرمان (Superman)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lie face down with the arms extended',
        'Lift the arms, chest and legs together',
        'Hold for two seconds, then lower',
      ],
      ar: [
        'استلقِ على بطنك مع مدّ الذراعين',
        'ارفع الذراعين والصدر والساقين معًا',
        'اثبت ثانيتين ثم انزل',
      ],
    },
    avoid: {
      en: [
        'Jerking up with momentum',
        'Craning the neck to look forward',
        'Pinching the lower back by lifting too high',
      ],
      ar: [
        'الارتفاع بحركة مفاجئة',
        'شدّ الرقبة للنظر للأمام',
        'الضغط على أسفل الظهر بالرفع أعلى من اللازم',
      ],
    },
  },
  {
    id: 'c-bench-dip',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Bench dip', ar: 'غطس على الكرسي (Bench dip)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hands on the edge of a sturdy chair, fingers forward',
        'Lower until the elbows reach about 90°',
        'Keep the hips close to the chair',
      ],
      ar: [
        'اليدان على حافة كرسي متين والأصابع للأمام',
        'انزل حتى يصل المرفقان إلى نحو 90°',
        'أبقِ الوركين قريبين من الكرسي',
      ],
    },
    avoid: {
      en: [
        'Dropping below 90° and straining the shoulders',
        'Shoulders rolling forward',
        'Elbows flaring out',
      ],
      ar: ['النزول تحت 90° وإجهاد الكتفين', 'تدوير الكتفين للأمام', 'فتح المرفقين للخارج'],
    },
  },
  {
    id: 'c-pike',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Pike push-up', ar: 'ضغط الهرم (Pike push-up)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hips high, body in an inverted V',
        'Lower the top of the head toward the floor between the hands',
        'Press back up until the arms are straight',
      ],
      ar: [
        'الوركان مرتفعان والجسم على شكل مثلث مقلوب',
        'أنزل قمة الرأس نحو الأرض بين اليدين',
        'ادفع للأعلى حتى تستقيم الذراعان',
      ],
    },
    avoid: {
      en: [
        'Letting the hips drop into a normal push-up',
        'Elbows flaring straight out',
        'Hitting the head on the floor',
      ],
      ar: [
        'هبوط الوركين فيتحول إلى ضغط عادي',
        'فتح المرفقين للجانبين تمامًا',
        'ارتطام الرأس بالأرض',
      ],
    },
  },
  {
    id: 'c-diamond',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Diamond push-up', ar: 'ضغط الماسة (Diamond push-up)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Thumbs and index fingers form a diamond under the chest',
        'Keep the elbows tucked close to the body',
        'Lower the chest to the hands',
      ],
      ar: [
        'الإبهامان والسبابتان يشكّلان ماسة تحت الصدر',
        'أبقِ المرفقين قريبين من الجسم',
        'أنزل الصدر إلى اليدين',
      ],
    },
    avoid: {
      en: [
        'Hands placed too far forward',
        'Hips sagging',
        'Wrists bending painfully; use fists if needed',
      ],
      ar: [
        'وضع اليدين بعيدًا جدًا للأمام',
        'هبوط الوركين',
        'انثناء المعصمين بشكل مؤلم؛ استخدم القبضتين إذا لزم',
      ],
    },
  },
  {
    id: 'c-decline',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Decline push-up', ar: 'تمرين الضغط المنحدر (Decline push-up)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Feet on a chair or step, hands on the floor',
        'Brace the core so the body stays straight',
        'Lower the forehead toward the floor just ahead of the hands',
      ],
      ar: [
        'القدمان على كرسي أو درجة واليدان على الأرض',
        'شدّ بطنك ليبقى الجسم مستقيمًا',
        'أنزل جبهتك نحو الأرض أمام اليدين قليلًا',
      ],
    },
    avoid: {
      en: ['Hips sagging', 'Elbows flaring wide', 'Using a chair that can tip'],
      ar: ['هبوط الوركين', 'فتح المرفقين للجانبين', 'استخدام كرسي قد ينقلب'],
    },
  },
  {
    id: 'c-negative-pullup',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Negative pull-up', ar: 'العقلة السلبية (Negative pull-up)' },
    sets: 3,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Jump or step up so the chin is over the bar',
        'Lower yourself as slowly as you can, 3–5 seconds',
        'Finish with straight arms before the next rep',
      ],
      ar: [
        'اقفز أو اصعد على درجة حتى يتجاوز ذقنك البار',
        'انزل بأبطأ ما تستطيع، 3–5 ثوانٍ',
        'انتهِ بذراعين مستقيمتين قبل التكرار التالي',
      ],
    },
    avoid: {
      en: [
        'Dropping fast at the bottom',
        'Shoulders shrugging into the ears',
        'Letting the body swing',
      ],
      ar: ['السقوط بسرعة في الأسفل', 'رفع الكتفين نحو الأذنين', 'ترك الجسم يتأرجح'],
    },
  },
  {
    id: 'c-pullup',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Pull-up', ar: 'العقلة (Pull-up)' },
    sets: 3,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Grip just wider than the shoulders, palms facing away',
        'Pull the elbows down toward the ribs',
        'Chin over the bar, then lower under control',
      ],
      ar: [
        'القبضة أوسع قليلًا من الكتفين والكفان للخارج',
        'اسحب المرفقين للأسفل نحو الأضلاع',
        'الذقن فوق البار ثم انزل بتحكم',
      ],
    },
    avoid: {
      en: [
        'Kicking or swinging to get up',
        'Half reps that stop below the bar',
        'Shrugging the shoulders',
      ],
      ar: ['الركل أو الأرجحة للصعود', 'تكرارات ناقصة تتوقف تحت البار', 'رفع الكتفين'],
    },
  },
  {
    id: 'c-handstand',
    style: 'calisthenics',
    area: 'upper',
    name: { en: 'Wall handstand hold', ar: 'الوقوف على اليدين على الحائط' },
    sets: 3,
    work: { en: '20 s', ar: '20 ث' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Kick up with your back to the wall',
        'Push the floor away and reach tall through the shoulders',
        'Squeeze the glutes and keep the ribs tucked',
      ],
      ar: [
        'ارفع ساقيك بالركل وظهرك نحو الحائط',
        'ادفع الأرض بعيدًا ومدّ الكتفين لأعلى',
        'اضغط الأرداف وضمّ الأضلاع',
      ],
    },
    avoid: {
      en: [
        'Arching the back into a banana shape',
        'Bending the elbows',
        'Kicking up too hard and losing control',
      ],
      ar: ['تقويس الظهر على شكل موزة', 'ثني المرفقين', 'الركل بقوة زائدة وفقدان التحكم'],
    },
  },
  // Cardio
  {
    id: 'c-jacks',
    style: 'calisthenics',
    area: 'cardio',
    name: { en: 'Jumping jacks', ar: 'القفز مع فتح الذراعين (Jumping jacks)' },
    sets: 4,
    work: { en: '40 s', ar: '40 ث' },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Jump the feet wide as the arms go overhead',
        'Land softly on the balls of the feet',
        'Keep a steady rhythm',
      ],
      ar: [
        'افتح القدمين بالقفز مع رفع الذراعين فوق الرأس',
        'اهبط بخفة على مقدمة القدمين',
        'حافظ على إيقاع ثابت',
      ],
    },
    avoid: {
      en: [
        'Landing flat on the heels',
        'Knees caving inward',
        'Shrugging the shoulders to the ears',
      ],
      ar: ['الهبوط على الكعبين مباشرة', 'انهيار الركبتين للداخل', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'c-high-knees',
    style: 'calisthenics',
    area: 'cardio',
    name: { en: 'High knees', ar: 'رفع الركبتين عاليًا (High knees)' },
    sets: 4,
    work: { en: '30 s', ar: '30 ث' },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Run on the spot, driving the knees to hip height',
        'Stay tall and pump the arms',
        'Land on the balls of the feet',
      ],
      ar: [
        'اجرِ في مكانك مع رفع الركبتين إلى مستوى الورك',
        'ابقَ مستقيمًا وحرّك الذراعين',
        'اهبط على مقدمة القدمين',
      ],
    },
    avoid: {
      en: ['Leaning back', 'Pounding the heels into the floor', 'Holding your breath'],
      ar: ['الميل للخلف', 'ضرب الكعبين بالأرض', 'حبس النفس'],
    },
  },
]
