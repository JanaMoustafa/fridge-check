import type { Exercise } from '../types'

/** Pilates: see ../types.ts for every field's rules. */
export const PILATES: readonly Exercise[] = [
  {
    id: 'p-hundred',
    style: 'pilates',
    area: 'core',
    name: {
      en: 'The Hundred',
      ar: 'تمرين المئة',
    },
    sets: 1,
    work: {
      en: '100 pumps (10 breaths)',
      ar: '100 نبضة بالذراعين (10 أنفاس)',
    },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Breathe in for 5 pumps, out for 5',
        'Pump the arms from the shoulders, small and quick',
        'Bend the knees to 90° if your back lifts',
      ],
      ar: [
        'شهيق مع 5 نبضات وزفير مع 5',
        'حرّك الذراعين من الكتفين بحركات صغيرة وسريعة',
        'اثنِ الركبتين إلى 90° إذا ارتفع ظهرك',
      ],
    },
    avoid: {
      en: [
        'Chin jutting forward and straining the neck',
        'Lower back arching off the mat',
        'Holding your breath',
      ],
      ar: ['اندفاع الذقن للأمام وإجهاد الرقبة', 'ارتفاع أسفل الظهر عن الحصيرة', 'حبس النفس'],
    },
  },
  {
    id: 'p-rollup',
    style: 'pilates',
    area: 'core',
    name: {
      en: 'Roll-up',
      ar: 'النهوض الملفوف (Roll-up)',
    },
    sets: 2,
    work: {
      en: '8 reps',
      ar: '8 تكرارات',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Peel up one vertebra at a time',
        'Reach the arms forward as you curl up',
        'Bend the knees if you cannot roll up smoothly',
      ],
      ar: [
        'ارتفع فقرة بعد فقرة',
        'مدّ ذراعيك للأمام وأنت تنهض',
        'اثنِ ركبتيك إن لم تستطع النهوض بسلاسة',
      ],
    },
    avoid: {
      en: [
        'Using momentum to throw yourself up',
        'Feet lifting off the mat',
        'Dropping back down quickly',
      ],
      ar: ['استخدام الاندفاع لرمي جسمك للأعلى', 'ارتفاع القدمين عن الحصيرة', 'السقوط للخلف بسرعة'],
    },
  },
  {
    id: 'p-criss',
    style: 'pilates',
    area: 'core',
    name: {
      en: 'Criss-cross',
      ar: 'التقاطع (Criss-cross)',
    },
    sets: 2,
    work: {
      en: '10 each side',
      ar: '10 لكل جانب',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Rotate from the ribs, not the elbows',
        'Keep the lower back pressed into the mat',
        'Reach the straight leg long and low',
      ],
      ar: [
        'استدر من القفص الصدري لا من المرفقين',
        'أبقِ أسفل ظهرك ملتصقًا بالحصيرة',
        'مدّ الساق المستقيمة طويلة ومنخفضة',
      ],
    },
    avoid: {
      en: [
        'Pulling on the neck with the hands',
        'Elbows collapsing inward',
        'Rocking the hips side to side',
      ],
      ar: ['شدّ الرقبة باليدين', 'انطباق المرفقين للداخل', 'تأرجح الوركين من جانب لآخر'],
    },
  },
  {
    id: 'p-sidelift',
    style: 'pilates',
    area: 'glutes',
    name: {
      en: 'Side-lying leg lift series',
      ar: 'سلسلة رفع الساق على الجانب',
    },
    sets: 2,
    work: {
      en: '15 each side',
      ar: '15 لكل جانب',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Stack hips on top of each other',
        'Lift from the outer hip',
        'Keep the toes pointing forward',
      ],
      ar: [
        'ضع الوركين فوق بعضهما',
        'ارفع الساق من جانب الورك الخارجي',
        'أبقِ أصابع القدم متجهة للأمام',
      ],
    },
    avoid: {
      en: [
        'Rolling the top hip backward',
        'Lifting higher than you can control',
        'Turning the toes up to the ceiling',
      ],
      ar: ['ميل الورك العلوي للخلف', 'رفع الساق أعلى مما تتحكم فيه', 'توجيه أصابع القدم نحو السقف'],
    },
  },
  {
    id: 'p-shoulderbridge',
    style: 'pilates',
    area: 'glutes',
    name: {
      en: 'Shoulder bridge',
      ar: 'جسر الكتفين',
    },
    sets: 3,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Roll up through the spine',
        'Long line from knees to shoulders',
        'Roll down one vertebra at a time',
      ],
      ar: ['ارفع ظهرك فقرة بعد فقرة', 'خط طويل من الركبتين إلى الكتفين', 'انزل فقرة بعد فقرة'],
    },
    avoid: {
      en: ['Over-arching at the top', 'Knees falling apart', 'Pressing your weight into the neck'],
      ar: ['تقويس الظهر بشدة في الأعلى', 'تباعد الركبتين', 'الضغط بوزن الجسم على الرقبة'],
    },
  },
  {
    id: 'p-circles',
    style: 'pilates',
    area: 'legs',
    name: {
      en: 'Single-leg circles',
      ar: 'دوائر الساق الواحدة',
    },
    sets: 2,
    work: {
      en: '8 each direction',
      ar: '8 في كل اتجاه',
    },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Keep the pelvis still and heavy',
        'Draw the circle with the whole leg from the hip',
        'Bend the floor leg if your hamstrings are tight',
      ],
      ar: [
        'أبقِ الحوض ثابتًا وثقيلًا على الحصيرة',
        'ارسم الدائرة بالساق كلها من مفصل الورك',
        'اثنِ الساق التي على الأرض إذا كانت عضلاتك الخلفية مشدودة',
      ],
    },
    avoid: {
      en: [
        'Pelvis rocking side to side',
        'Circles bigger than you can control',
        'Lifting the head and tensing the neck',
      ],
      ar: ['تأرجح الحوض من جانب لآخر', 'دوائر أكبر مما تتحكم فيه', 'رفع الرأس وشدّ الرقبة'],
    },
  },
  {
    id: 'p-squat',
    style: 'pilates',
    area: 'legs',
    name: {
      en: 'Standing pulse squat',
      ar: 'سكوات النبض واقفًا (Pulse squat)',
    },
    sets: 3,
    work: {
      en: '20 pulses',
      ar: '20 نبضة',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: ['Small range, steady tempo', 'Sit back into the heels', 'Chest lifted, core engaged'],
      ar: ['مدى صغير وإيقاع ثابت', 'اجلس للخلف على الكعبين', 'الصدر مرفوع والبطن مشدود'],
    },
    avoid: {
      en: ['Knees falling inward', 'Weight shifting onto the toes', 'Rounding the upper back'],
      ar: ['سقوط الركبتين للداخل', 'انتقال الوزن إلى أصابع القدمين', 'تدوير أعلى الظهر للأمام'],
    },
  },
  {
    id: 'p-swimming',
    style: 'pilates',
    area: 'cardio',
    name: {
      en: 'Swimming',
      ar: 'تمرين السباحة',
    },
    sets: 3,
    work: {
      en: '30 s',
      ar: '30 ث',
    },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Long arms and legs, small fast flutters',
        'Lift the belly button away from the mat',
        'Eyes down, neck long',
      ],
      ar: [
        'ذراعان وساقان ممدودتان، ورفرفة صغيرة وسريعة',
        'اسحب السرة بعيدًا عن الحصيرة',
        'النظر للأسفل والرقبة ممدودة',
      ],
    },
    avoid: {
      en: [
        'Lifting the head high and pinching the neck',
        'Squeezing the lower back',
        'Kicking from the knees instead of the hips',
      ],
      ar: [
        'رفع الرأس عاليًا وضغط الرقبة',
        'ضغط أسفل الظهر وتقويسه',
        'الرفرفة من الركبتين بدل الوركين',
      ],
    },
  },
  {
    id: 'p-plankjack',
    style: 'pilates',
    area: 'cardio',
    name: {
      en: 'Plank jacks',
      ar: 'قفزات البلانك',
    },
    sets: 3,
    work: {
      en: '30 s',
      ar: '30 ث',
    },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Hold a strong plank on straight arms',
        'Step or hop the feet wide, then back together',
        'Keep the hips level as the feet move',
      ],
      ar: [
        'ثبّت وضع البلانك على ذراعين ممدودتين',
        'افتح قدميك بخطوة أو قفزة ثم أعدهما معًا',
        'أبقِ الوركين ثابتين أثناء حركة القدمين',
      ],
    },
    avoid: {
      en: [
        'Hips bouncing up and down',
        'Lower back sagging',
        'Shoulders drifting behind the wrists',
      ],
      ar: ['ارتداد الوركين لأعلى وأسفل', 'هبوط أسفل الظهر', 'رجوع الكتفين خلف المعصمين'],
    },
  },
  {
    id: 'p-pushup',
    style: 'pilates',
    area: 'upper',
    name: {
      en: 'Pilates push-up',
      ar: 'ضغط البيلاتس',
    },
    sets: 2,
    work: {
      en: '6 reps',
      ar: '6 تكرارات',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Walk out to plank, 3 push-ups, walk back',
        'Elbows close to the ribs on the way down',
        'Roll up through the spine to stand',
      ],
      ar: [
        'امشِ بيديك إلى البلانك، ثم 3 ضغطات، ثم عُد',
        'المرفقان قريبان من الضلوع أثناء النزول',
        'ارفع ظهرك فقرة بعد فقرة لتقف',
      ],
    },
    avoid: {
      en: [
        'Letting the hips sag',
        'Elbows flaring wide',
        'Rushing the walk-out and losing the plank',
      ],
      ar: [
        'ترك الوركين يهبطان',
        'فتح المرفقين للخارج كثيرًا',
        'الاستعجال في المشي باليدين وفقدان وضع البلانك',
      ],
    },
  },
  {
    id: 'p-swan',
    style: 'pilates',
    area: 'upper',
    name: {
      en: 'Swan',
      ar: 'البجعة (Swan)',
    },
    sets: 3,
    work: {
      en: '8 reps',
      ar: '8 تكرارات',
    },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie face down, hands under the shoulders',
        'Lift the chest by drawing the shoulder blades down',
        'Keep the pubic bone pressed into the mat',
      ],
      ar: [
        'استلقِ على بطنك واليدان تحت الكتفين',
        'ارفع صدرك بسحب لوحَي الكتفين للأسفل',
        'أبقِ عظم العانة ملتصقًا بالحصيرة',
      ],
    },
    avoid: {
      en: [
        'Pushing up with the arms and crunching the lower back',
        'Tipping the head back',
        'Shrugging the shoulders to the ears',
      ],
      ar: ['الدفع بالذراعين وضغط أسفل الظهر', 'إمالة الرأس للخلف', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'p-legpull',
    style: 'pilates',
    area: 'upper',
    name: {
      en: 'Leg pull front',
      ar: 'بلانك مع رفع الساق (Leg pull front)',
    },
    sets: 2,
    work: {
      en: '6 each leg',
      ar: '6 لكل ساق',
    },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Start in a high plank, hands under the shoulders',
        'Lift one leg a little without moving the hips',
        'Push the floor away to keep the shoulders strong',
      ],
      ar: [
        'ابدأ في وضع البلانك على اليدين، واليدان تحت الكتفين',
        'ارفع ساقًا قليلًا دون تحريك الوركين',
        'ادفع الأرض بيديك لتبقى الكتفان قويتين',
      ],
    },
    avoid: {
      en: [
        'Hips rocking or rotating as the leg lifts',
        'Lower back sagging',
        'Sinking between the shoulder blades',
      ],
      ar: [
        'تأرجح الوركين أو دورانهما عند رفع الساق',
        'هبوط أسفل الظهر',
        'الهبوط بين لوحَي الكتفين',
      ],
    },
  },

  // Legs
  {
    id: 'p-calf-raise',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Standing calf raise', ar: 'رفع الكعبين واقفًا' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Heels together, toes slightly apart in Pilates stance',
        'Rise slowly onto the balls of the feet',
        'Lower the heels for 3 counts',
        'Stand tall, crown of the head reaching up',
      ],
      ar: [
        'الكعبان متلاصقان وأصابع القدمين متباعدة قليلًا في وقفة البيلاتس',
        'ارتفع ببطء على مقدمة القدمين',
        'أنزل الكعبين على 3 عدّات',
        'قِف منتصبًا وقمة الرأس تمتد للأعلى',
      ],
    },
    avoid: {
      en: [
        'Ankles rolling outward at the top',
        'Bouncing off the floor',
        'Leaning forward from the hips',
      ],
      ar: ['ميل الكاحلين للخارج في الأعلى', 'الارتداد عن الأرض', 'الميل للأمام من الوركين'],
    },
  },
  {
    id: 'p-plie-squat',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Plié squat', ar: 'سكوات البليه (Plié)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Wide stance, toes turned out from the hips',
        'Bend the knees straight over the toes',
        'Squeeze the inner thighs to stand',
        'Spine upright, tailbone pointing down',
      ],
      ar: [
        'وقفة واسعة وأصابع القدمين للخارج من الوركين',
        'اثنِ الركبتين فوق أصابع القدمين مباشرة',
        'اضغط الفخذين الداخليين لتقف',
        'العمود الفقري منتصب وعظم الذيل يتجه للأسفل',
      ],
    },
    avoid: {
      en: [
        'Knees collapsing inward',
        'Pelvis tipping and lower back arching',
        'Heels lifting off the mat',
      ],
      ar: ['انهيار الركبتين للداخل', 'ميل الحوض وتقويس أسفل الظهر', 'ارتفاع الكعبين عن الحصيرة'],
    },
  },
  {
    id: 'p-reverse-lunge',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Reverse lunge', ar: 'لانج خلفي' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Step one foot back, lower the back knee toward the mat',
        'Front knee stays over the ankle',
        'Exhale and press through the front heel to return',
      ],
      ar: [
        'ارجع بقدم للخلف وأنزل الركبة الخلفية نحو الحصيرة',
        'الركبة الأمامية تبقى فوق الكاحل',
        'ازفر وادفع بالكعب الأمامي للعودة',
      ],
    },
    avoid: {
      en: [
        'Torso tipping forward',
        'Front knee drifting past the toes',
        'Dropping the back knee onto the mat',
      ],
      ar: [
        'ميل الجذع للأمام',
        'تجاوز الركبة الأمامية لأصابع القدم',
        'إسقاط الركبة الخلفية على الحصيرة',
      ],
    },
  },
  {
    id: 'p-inner-thigh',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Inner thigh lifts', ar: 'رفع الفخذ الداخلي' },
    sets: 2,
    work: { en: '15 each side', ar: '15 لكل جانب' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Lie on your side, top foot planted in front of the bottom knee',
        'Lift the bottom leg with the heel leading',
        'Lower slowly without resting it on the mat',
      ],
      ar: [
        'استلقِ على جانبك والقدم العلوية مثبتة أمام الركبة السفلية',
        'ارفع الساق السفلية والكعب يقود الحركة',
        'أنزلها ببطء دون أن ترتاح على الحصيرة',
      ],
    },
    avoid: {
      en: [
        'Rolling the hips backward',
        'Swinging the leg with momentum',
        'Collapsing the waist into the mat',
      ],
      ar: ['ميل الوركين للخلف', 'تأرجح الساق بالاندفاع', 'هبوط الخصر على الحصيرة'],
    },
  },
  {
    id: 'p-side-circles',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Side-lying leg circles', ar: 'دوائر الساق على الجانب' },
    sets: 2,
    work: { en: '10 each direction', ar: '10 في كل اتجاه' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Top leg lifted to hip height, toes long',
        'Draw small circles the size of a plate',
        'Keep the waist lifted off the mat',
      ],
      ar: [
        'الساق العلوية مرفوعة بمستوى الورك وأصابع القدم ممدودة',
        'ارسم دوائر صغيرة بحجم الطبق',
        'أبقِ الخصر مرفوعًا عن الحصيرة',
      ],
    },
    avoid: {
      en: [
        'Hips rocking back and forth',
        'Circles growing bigger than you can control',
        'Letting the leg drop below hip height',
      ],
      ar: [
        'تأرجح الوركين للأمام والخلف',
        'دوائر أكبر مما تتحكم فيه',
        'ترك الساق تنزل تحت مستوى الورك',
      ],
    },
  },
  {
    id: 'p-side-bicycle',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Side-lying bicycle', ar: 'الدراجة على الجانب' },
    sets: 2,
    work: { en: '8 each direction', ar: '8 في كل اتجاه' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Kick the top leg forward, bend the knee, sweep it back',
        'Reverse the circle after the set',
        'Keep the ribs and pelvis stacked and still',
      ],
      ar: [
        'اركل بالساق العلوية للأمام ثم اثنِ الركبة ثم امسحها للخلف',
        'اعكس اتجاه الدائرة بعد المجموعة',
        'أبقِ الضلوع والحوض فوق بعضهما وثابتين',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back as the leg goes behind',
        'Rushing and losing the shape of the pedal',
        'Top shoulder rolling forward',
      ],
      ar: [
        'تقويس أسفل الظهر عند مرور الساق للخلف',
        'الاستعجال وفقدان شكل الدوّاسة',
        'ميل الكتف العلوي للأمام',
      ],
    },
  },
  {
    id: 'p-single-leg-kick',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Single leg kick', ar: 'ركلة الساق الواحدة' },
    sets: 2,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Prop on the forearms, chest lifted, belly drawn in',
        'Kick the heel toward the seat with 2 quick pulses',
        'Keep both thighs pressed into the mat',
      ],
      ar: [
        'استند على الساعدين والصدر مرفوع والبطن مسحوب للداخل',
        'اركل بالكعب نحو المؤخرة بنبضتين سريعتين',
        'أبقِ الفخذين مضغوطين على الحصيرة',
      ],
    },
    avoid: {
      en: [
        'Sinking into the lower back',
        'Hips lifting as you kick',
        'Shoulders creeping up to the ears',
      ],
      ar: ['الهبوط في أسفل الظهر', 'ارتفاع الوركين عند الركل', 'تسلّل الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'p-thigh-stretch',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Thigh stretch', ar: 'إطالة الفخذ راكعًا (Thigh stretch)' },
    sets: 2,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Kneel tall, arms forward at shoulder height',
        'Hinge back from the knees in one straight line',
        'Squeeze the glutes and front of the thighs to return',
      ],
      ar: [
        'اركع منتصبًا والذراعان للأمام بمستوى الكتفين',
        'مِل للخلف من الركبتين في خط مستقيم واحد',
        'اضغط عضلات المؤخرة ومقدمة الفخذين للعودة',
      ],
    },
    avoid: {
      en: [
        'Bending at the hips instead of leaning as one line',
        'Arching the lower back',
        'Leaning further than you can come back from',
      ],
      ar: [
        'الانثناء من الوركين بدل الميل كخط واحد',
        'تقويس أسفل الظهر',
        'الميل أبعد مما تستطيع العودة منه',
      ],
    },
  },
  {
    id: 'p-curtsy-lunge',
    style: 'pilates',
    area: 'legs',
    name: { en: 'Curtsy lunge', ar: 'لانج الانحناءة (Curtsy lunge)' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Step one foot back and across behind the other',
        'Lower until the front thigh is near parallel',
        'Push through the front foot to stand tall',
      ],
      ar: [
        'ارجع بقدم للخلف وبشكل متقاطع خلف الأخرى',
        'انزل حتى يقترب الفخذ الأمامي من التوازي مع الأرض',
        'ادفع بالقدم الأمامية لتقف منتصبًا',
      ],
    },
    avoid: {
      en: [
        'Front knee rolling inward',
        'Twisting the hips toward the back leg',
        'Rounding the back as you lower',
      ],
      ar: [
        'ميل الركبة الأمامية للداخل',
        'لفّ الوركين نحو الساق الخلفية',
        'تدوير الظهر أثناء النزول',
      ],
    },
  },

  // Glutes
  {
    id: 'p-clam',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Clam', ar: 'المحار (Clam)' },
    sets: 2,
    work: { en: '15 each side', ar: '15 لكل جانب' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Lie on your side, knees bent, heels in line with the hips',
        'Open the top knee while keeping the heels together',
        'Exhale as you lift, inhale as you close',
      ],
      ar: [
        'استلقِ على جانبك والركبتان مثنيتان والكعبان بمحاذاة الوركين',
        'افتح الركبة العلوية مع إبقاء الكعبين متلاصقين',
        'ازفر عند الرفع وخذ شهيقًا عند الإغلاق',
      ],
    },
    avoid: {
      en: ['Top hip rolling backward to lift higher', 'Heels separating', 'Rushing the reps'],
      ar: ['ميل الورك العلوي للخلف للرفع أعلى', 'انفصال الكعبين', 'الاستعجال في التكرارات'],
    },
  },
  {
    id: 'p-side-kick',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Side kick series', ar: 'سلسلة الركلات الجانبية' },
    sets: 2,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie on your side with the legs slightly forward of the hips',
        'Kick the top leg forward with 2 pulses, then sweep it back',
        'Keep the torso still as the leg moves',
      ],
      ar: [
        'استلقِ على جانبك والساقان للأمام قليلًا من الوركين',
        'اركل بالساق العلوية للأمام بنبضتين ثم امسحها للخلف',
        'أبقِ الجذع ثابتًا أثناء حركة الساق',
      ],
    },
    avoid: {
      en: [
        'Rolling the hips as the leg swings',
        'Arching the lower back on the backward sweep',
        'Letting the leg sag toward the floor',
      ],
      ar: [
        'تأرجح الوركين مع حركة الساق',
        'تقويس أسفل الظهر عند المسح للخلف',
        'ترك الساق تهبط نحو الأرض',
      ],
    },
  },
  {
    id: 'p-donkey-kick',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Donkey kicks', ar: 'ركلات الحمار (Donkey kicks)' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'On all fours, wrists under shoulders, knees under hips',
        'Press the bent leg up with the sole toward the ceiling',
        'Squeeze the glute at the top for a count',
      ],
      ar: [
        'على أربع، المعصمان تحت الكتفين والركبتان تحت الوركين',
        'ادفع الساق المثنية للأعلى وباطن القدم نحو السقف',
        'اضغط عضلة المؤخرة في الأعلى لعدّة واحدة',
      ],
    },
    avoid: {
      en: ['Lower back arching to lift higher', 'Hips twisting open', 'Sinking into the shoulders'],
      ar: ['تقويس أسفل الظهر للرفع أعلى', 'لفّ الوركين للخارج', 'الهبوط في الكتفين'],
    },
  },
  {
    id: 'p-fire-hydrant',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Fire hydrant', ar: 'صنبور الإطفاء (Fire hydrant)' },
    sets: 2,
    work: { en: '12 each side', ar: '12 لكل جانب' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'On all fours, spine long and neutral',
        'Lift the bent knee out to the side to hip height',
        'Lower with control, knee hovering off the mat',
      ],
      ar: [
        'على أربع والعمود الفقري ممدود ومحايد',
        'ارفع الركبة المثنية جانبًا إلى مستوى الورك',
        'أنزلها بتحكم والركبة معلّقة فوق الحصيرة',
      ],
    },
    avoid: {
      en: [
        'Shifting all the weight onto the supporting side',
        'Rounding or arching the spine',
        'Swinging the leg up',
      ],
      ar: [
        'نقل الوزن كله إلى الجانب الداعم',
        'تدوير العمود الفقري أو تقويسه',
        'تأرجح الساق للأعلى',
      ],
    },
  },
  {
    id: 'p-single-leg-bridge',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Single-leg bridge', ar: 'الجسر بساق واحدة' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lift into a bridge, then extend one leg to the ceiling',
        'Keep both hips level',
        'Lower and lift the pelvis with the standing leg only',
      ],
      ar: [
        'ارفع جسرًا ثم مدّ ساقًا نحو السقف',
        'أبقِ الوركين بمستوى واحد',
        'أنزل الحوض وارفعه بالساق الثابتة فقط',
      ],
    },
    avoid: {
      en: [
        'Hip of the lifted leg dropping',
        'Arching the lower back at the top',
        'Pushing into the neck',
      ],
      ar: ['هبوط ورك الساق المرفوعة', 'تقويس أسفل الظهر في الأعلى', 'الضغط على الرقبة'],
    },
  },
  {
    id: 'p-prone-leg-lift',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Prone leg lifts', ar: 'رفع الساق على البطن' },
    sets: 2,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Lie face down, forehead on your hands',
        'Draw the belly in and lift one straight leg a few centimetres',
        'Hold for a breath, then lower slowly',
      ],
      ar: [
        'استلقِ على بطنك والجبهة على يديك',
        'اسحب البطن للداخل وارفع ساقًا مستقيمة بضعة سنتيمترات',
        'اثبت لنفس واحد ثم أنزلها ببطء',
      ],
    },
    avoid: {
      en: [
        'Lifting so high the lower back pinches',
        'Hip bone lifting off the mat',
        'Bending the knee to cheat the lift',
      ],
      ar: [
        'الرفع عاليًا حتى ينضغط أسفل الظهر',
        'ارتفاع عظم الورك عن الحصيرة',
        'ثني الركبة للغش في الرفع',
      ],
    },
  },
  {
    id: 'p-marching-bridge',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Marching bridge', ar: 'الجسر مع المشي' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Hold a bridge with the hips lifted',
        'Float one knee up to tabletop, then place it down',
        'Keep the pelvis level as the legs alternate',
      ],
      ar: [
        'اثبت في وضع الجسر والوركان مرفوعان',
        'ارفع ركبة إلى وضع الطاولة ثم أعدها',
        'أبقِ الحوض بمستوى واحد أثناء التبديل بين الساقين',
      ],
    },
    avoid: {
      en: [
        'Hips dipping toward the lifted side',
        'Ribs flaring and lower back arching',
        'Stamping the foot down',
      ],
      ar: [
        'هبوط الوركين نحو الجانب المرفوع',
        'بروز الضلوع وتقويس أسفل الظهر',
        'ضرب القدم على الأرض',
      ],
    },
  },
  {
    id: 'p-kneeling-side-kick',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Kneeling side kick', ar: 'الركلة الجانبية راكعًا' },
    sets: 2,
    work: { en: '8 each side', ar: '8 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Kneel, place one hand on the mat, the other behind the head',
        'Extend the top leg to hip height',
        'Swing it forward and back with the torso still',
      ],
      ar: [
        'اركع وضع يدًا على الحصيرة والأخرى خلف الرأس',
        'مدّ الساق العلوية إلى مستوى الورك',
        'أرجحها للأمام والخلف والجذع ثابت',
      ],
    },
    avoid: {
      en: [
        'Sinking into the supporting shoulder',
        'Hips tipping back as the leg goes forward',
        'Momentum swinging the whole body',
      ],
      ar: ['الهبوط في الكتف الداعم', 'ميل الوركين للخلف عند تقدم الساق', 'اندفاع يحرّك الجسم كله'],
    },
  },
  {
    id: 'p-heel-squeeze',
    style: 'pilates',
    area: 'glutes',
    name: { en: 'Prone heel squeeze', ar: 'ضم الكعبين على البطن' },
    sets: 2,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Lie face down, knees bent and apart, heels touching',
        'Squeeze the heels together and lift the knees slightly',
        'Exhale on the squeeze, inhale to release',
      ],
      ar: [
        'استلقِ على بطنك والركبتان مثنيتان ومتباعدتان والكعبان متلامسان',
        'اضغط الكعبين معًا وارفع الركبتين قليلًا',
        'ازفر عند الضغط وخذ شهيقًا عند الإرخاء',
      ],
    },
    avoid: {
      en: [
        'Lifting the knees so high the back arches',
        'Gripping the hamstrings instead of the glutes',
        'Holding your breath',
      ],
      ar: [
        'رفع الركبتين عاليًا حتى يتقوس الظهر',
        'شدّ عضلات الفخذ الخلفية بدل المؤخرة',
        'حبس النفس',
      ],
    },
  },

  // Core
  {
    id: 'p-single-leg-stretch',
    style: 'pilates',
    area: 'core',
    name: { en: 'Single leg stretch', ar: 'مدّ الساق الواحدة' },
    sets: 2,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Curl the head and shoulders up, one knee hugged in',
        'Switch legs, outside hand on the ankle, inside hand on the knee',
        'Reach the straight leg long at a 45° angle',
      ],
      ar: [
        'ارفع الرأس والكتفين واحتضن ركبة واحدة',
        'بدّل الساقين، اليد الخارجية على الكاحل والداخلية على الركبة',
        'مدّ الساق المستقيمة طويلة بزاوية 45°',
      ],
    },
    avoid: {
      en: [
        'Lower back lifting off the mat',
        'Pulling the knee in with the shoulders tensed',
        'Head dropping back between switches',
      ],
      ar: [
        'ارتفاع أسفل الظهر عن الحصيرة',
        'سحب الركبة مع شدّ الكتفين',
        'سقوط الرأس للخلف بين التبديلات',
      ],
    },
  },
  {
    id: 'p-double-leg-stretch',
    style: 'pilates',
    area: 'core',
    name: { en: 'Double leg stretch', ar: 'مدّ الساقين' },
    sets: 2,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Curl up and hug both knees to the chest',
        'Inhale: reach the arms back and legs forward',
        'Exhale: circle the arms around and hug the knees in',
      ],
      ar: [
        'ارفع الجذع واحتضن الركبتين إلى الصدر',
        'شهيق: مدّ الذراعين للخلف والساقين للأمام',
        'زفير: دوّر الذراعين واحتضن الركبتين',
      ],
    },
    avoid: {
      en: [
        'Lower back arching as the legs reach out',
        'Head and shoulders dropping down',
        'Legs so low you lose control',
      ],
      ar: [
        'تقويس أسفل الظهر عند مدّ الساقين',
        'سقوط الرأس والكتفين للأسفل',
        'خفض الساقين حتى تفقد التحكم',
      ],
    },
  },
  {
    id: 'p-dead-bug',
    style: 'pilates',
    area: 'core',
    name: { en: 'Dead bug', ar: 'الحشرة الميتة (Dead bug)' },
    sets: 2,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie on your back, knees over hips, arms to the ceiling',
        'Exhale and lower the opposite arm and leg',
        'Keep the ribs down and the back heavy on the mat',
      ],
      ar: [
        'استلقِ على ظهرك والركبتان فوق الوركين والذراعان نحو السقف',
        'ازفر وأنزل الذراع والساق المتعاكستين',
        'أبقِ الضلوع منخفضة والظهر ثقيلًا على الحصيرة',
      ],
    },
    avoid: {
      en: [
        'Lower back arching off the mat',
        'Moving fast and losing the breath rhythm',
        'Neck tensing or head lifting',
      ],
      ar: [
        'تقويس أسفل الظهر وارتفاعه عن الحصيرة',
        'التحرك بسرعة وفقدان إيقاع التنفس',
        'شدّ الرقبة أو رفع الرأس',
      ],
    },
  },
  {
    id: 'p-rolling-ball',
    style: 'pilates',
    area: 'core',
    name: { en: 'Rolling like a ball', ar: 'التدحرج كالكرة' },
    sets: 2,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Sit balanced behind the sit bones, knees hugged in',
        'Round the spine into a C-curve, chin toward the chest',
        'Inhale to roll back to the shoulder blades, exhale to roll up and balance',
      ],
      ar: [
        'اجلس متوازنًا خلف عظمَي الجلوس واحتضن الركبتين',
        'دوّر العمود الفقري على شكل قوس والذقن نحو الصدر',
        'شهيق للتدحرج للخلف حتى لوحَي الكتفين وزفير للعودة والتوازن',
      ],
    },
    avoid: {
      en: [
        'Rolling onto the neck or head',
        'Throwing the head back for momentum',
        'Feet slamming onto the mat',
      ],
      ar: ['التدحرج على الرقبة أو الرأس', 'رمي الرأس للخلف للاندفاع', 'ضرب القدمين على الحصيرة'],
    },
  },
  {
    id: 'p-spine-twist',
    style: 'pilates',
    area: 'core',
    name: { en: 'Spine twist', ar: 'لفّ العمود الفقري' },
    sets: 2,
    work: { en: '8 each side', ar: '8 لكل جانب' },
    restSeconds: 20,
    strength: false,
    cues: {
      en: [
        'Sit tall, legs long, arms out to the sides',
        'Exhale and rotate the ribcage with 2 pulses',
        'Grow taller through the crown on every twist',
      ],
      ar: [
        'اجلس منتصبًا والساقان ممدودتان والذراعان جانبًا',
        'ازفر ولفّ القفص الصدري بنبضتين',
        'ازدد طولًا من قمة الرأس مع كل لفّة',
      ],
    },
    avoid: {
      en: [
        'Hips shifting or one sit bone lifting',
        'Rounding the back and slumping',
        'Twisting from the arms instead of the spine',
      ],
      ar: [
        'انزياح الوركين أو ارتفاع أحد عظمَي الجلوس',
        'تدوير الظهر والتهدل',
        'اللفّ من الذراعين بدل العمود الفقري',
      ],
    },
  },
  {
    id: 'p-saw',
    style: 'pilates',
    area: 'core',
    name: { en: 'Saw', ar: 'المنشار (Saw)' },
    sets: 2,
    work: { en: '6 each side', ar: '6 لكل جانب' },
    restSeconds: 20,
    strength: false,
    cues: {
      en: [
        'Sit tall with the legs wider than the hips, arms out',
        'Twist, then reach the little finger past the opposite little toe',
        'Exhale as you saw forward, inhale to sit tall again',
      ],
      ar: [
        'اجلس منتصبًا والساقان أوسع من الوركين والذراعان جانبًا',
        'لفّ ثم مدّ الخنصر إلى ما بعد إصبع القدم الصغير المقابل',
        'ازفر وأنت تنشر للأمام وخذ شهيقًا لتجلس منتصبًا مجددًا',
      ],
    },
    avoid: {
      en: [
        'Opposite hip lifting off the mat',
        'Bouncing to reach further',
        'Collapsing the chest toward the knee',
      ],
      ar: ['ارتفاع الورك المقابل عن الحصيرة', 'الارتداد للوصول أبعد', 'انهيار الصدر نحو الركبة'],
    },
  },
  {
    id: 'p-scissors',
    style: 'pilates',
    area: 'core',
    name: { en: 'Scissors', ar: 'المقص' },
    sets: 2,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Curl up with both legs toward the ceiling',
        'Hold one leg and pulse it toward you twice as the other lowers',
        'Switch with a scissor action, legs straight',
      ],
      ar: [
        'ارفع الجذع والساقان نحو السقف',
        'أمسك ساقًا وانبضها نحوك مرتين بينما تنزل الأخرى',
        'بدّل بحركة المقص والساقان مستقيمتان',
      ],
    },
    avoid: {
      en: [
        'Lower back lifting as the leg lowers',
        'Pulling the leg with the shoulders hunched',
        'Bending the knees to reach',
      ],
      ar: ['ارتفاع أسفل الظهر عند نزول الساق', 'سحب الساق مع تقوّس الكتفين', 'ثني الركبتين للوصول'],
    },
  },
  {
    id: 'p-teaser',
    style: 'pilates',
    area: 'core',
    name: { en: 'Teaser', ar: 'التيزر (Teaser)' },
    sets: 2,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Legs at 45°, roll up to balance in a V on the sit bones',
        'Reach the arms toward the toes, chest open',
        'Roll down slowly, keeping the legs still',
        'Start with bent knees until the full version is smooth',
      ],
      ar: [
        'الساقان بزاوية 45°، انهض لتتوازن على عظمَي الجلوس والجسم على شكل حرف (V)',
        'مدّ الذراعين نحو أصابع القدمين والصدر مفتوح',
        'انزل ببطء مع إبقاء الساقين ثابتتين',
        'ابدأ بركبتين مثنيتين حتى تصبح النسخة الكاملة سلسة',
      ],
    },
    avoid: {
      en: [
        'Jerking up with momentum',
        'Rounding and collapsing the chest at the top',
        'Legs dropping as you roll down',
        'Straining the neck and hip flexors',
      ],
      ar: [
        'الانتفاض للأعلى بالاندفاع',
        'تدوير الظهر وانهيار الصدر في الأعلى',
        'سقوط الساقين أثناء النزول',
        'إجهاد الرقبة وثانيات الورك',
      ],
    },
  },

  // Upper
  {
    id: 'p-kneeling-pushup',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Kneeling push-up', ar: 'الضغط على الركبتين' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Hands under the shoulders, knees behind the hips',
        'Long line from head to knees',
        'Elbows close to the ribs, lower for 2 counts',
      ],
      ar: [
        'اليدان تحت الكتفين والركبتان خلف الوركين',
        'خط طويل من الرأس إلى الركبتين',
        'المرفقان قريبان من الضلوع وانزل على عدّتين',
      ],
    },
    avoid: {
      en: ['Hips sagging or piking up', 'Head dropping toward the mat', 'Shrugging the shoulders'],
      ar: ['هبوط الوركين أو ارتفاعهما', 'سقوط الرأس نحو الحصيرة', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'p-arm-circles',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Arm circles', ar: 'دوائر الذراعين' },
    sets: 2,
    work: { en: '15 each direction', ar: '15 في كل اتجاه' },
    restSeconds: 20,
    strength: true,
    cues: {
      en: [
        'Stand tall, arms out at shoulder height, palms down',
        'Draw small, steady circles from the shoulder',
        'Keep the shoulder blades drawn down the back',
      ],
      ar: [
        'قِف منتصبًا والذراعان جانبًا بمستوى الكتفين وراحتا اليدين للأسفل',
        'ارسم دوائر صغيرة وثابتة من الكتف',
        'أبقِ لوحَي الكتفين مسحوبين للأسفل',
      ],
    },
    avoid: {
      en: [
        'Shoulders creeping up to the ears',
        'Arching the lower back to lift the arms',
        'Circles growing fast and sloppy',
      ],
      ar: [
        'تسلّل الكتفين نحو الأذنين',
        'تقويس أسفل الظهر لرفع الذراعين',
        'دوائر سريعة وغير منضبطة',
      ],
    },
  },
  {
    id: 'p-tricep-dips',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Tricep dips', ar: 'تمرين الترايسبس الخلفي (Tricep dips)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Sit with the hands behind you, fingers pointing forward',
        'Lift the hips off the mat into a tabletop',
        'Bend the elbows straight back, then press up',
      ],
      ar: [
        'اجلس واليدان خلفك وأصابعهما للأمام',
        'ارفع الوركين عن الحصيرة إلى وضع الطاولة',
        'اثنِ المرفقين للخلف مباشرة ثم ادفع للأعلى',
      ],
    },
    avoid: {
      en: [
        'Elbows flaring out to the sides',
        'Shoulders rolling forward and up',
        'Hips dropping to the mat between reps',
      ],
      ar: [
        'فتح المرفقين للجانبين',
        'ميل الكتفين للأمام والأعلى',
        'سقوط الوركين على الحصيرة بين التكرارات',
      ],
    },
  },
  {
    id: 'p-double-leg-kick',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Double leg kick', ar: 'ركلة الساقين' },
    sets: 2,
    work: { en: '6 reps', ar: '6 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Lie face down, hands clasped behind the back, one cheek on the mat',
        'Kick both heels to the seat 3 times',
        'Stretch the arms back and lift the chest, then switch the cheek',
      ],
      ar: [
        'استلقِ على بطنك واليدان متشابكتان خلف الظهر وخدّ على الحصيرة',
        'اركل بالكعبين نحو المؤخرة 3 مرات',
        'مدّ الذراعين للخلف وارفع الصدر ثم بدّل الخد',
      ],
    },
    avoid: {
      en: [
        'Lifting the chest by crunching the lower back',
        'Hips rising off the mat during the kicks',
        'Yanking the arms and straining the shoulders',
      ],
      ar: [
        'رفع الصدر بضغط أسفل الظهر',
        'ارتفاع الوركين عن الحصيرة أثناء الركل',
        'شدّ الذراعين بعنف وإجهاد الكتفين',
      ],
    },
  },
  {
    id: 'p-side-bend',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Side bend', ar: 'الانحناء الجانبي (Side bend)' },
    sets: 2,
    work: { en: '6 each side', ar: '6 لكل جانب' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Sit on one hip, hand under the shoulder, feet stacked or staggered',
        'Press the hips up into a long side arc',
        'Reach the top arm overhead, then lower with control',
      ],
      ar: [
        'اجلس على ورك واليد تحت الكتف والقدمان فوق بعضهما أو متباعدتان قليلًا',
        'ادفع الوركين للأعلى في قوس جانبي طويل',
        'مدّ الذراع العلوية فوق الرأس ثم انزل بتحكم',
      ],
    },
    avoid: {
      en: [
        'Sinking into the supporting shoulder',
        'Hips sagging toward the mat',
        'Rolling the chest toward the floor',
      ],
      ar: ['الهبوط في الكتف الداعم', 'هبوط الوركين نحو الحصيرة', 'ميل الصدر نحو الأرض'],
    },
  },
  {
    id: 'p-swan-dive',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Swan dive', ar: 'غطسة البجعة (Swan dive)' },
    sets: 2,
    work: { en: '6 reps', ar: '6 تكرارات' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Press up into Swan with a long, even arch',
        'Release the hands and rock forward onto the chest as the legs lift',
        'Rock back up, keeping the body one firm curve',
      ],
      ar: [
        'ادفع للأعلى إلى وضع البجعة بقوس طويل ومتساوٍ',
        'حرّر اليدين وتأرجح للأمام على الصدر بينما ترتفع الساقان',
        'تأرجح للخلف للأعلى مع إبقاء الجسم قوسًا واحدًا ثابتًا',
      ],
    },
    avoid: {
      en: [
        'Collapsing the chin to the mat',
        'Pinching the lower back instead of lifting the whole spine',
        'Attempting it before Swan feels easy',
      ],
      ar: [
        'انهيار الذقن على الحصيرة',
        'ضغط أسفل الظهر بدل رفع العمود الفقري كله',
        'تجربته قبل أن يصبح تمرين البجعة سهلًا',
      ],
    },
  },
  {
    id: 'p-leg-pull-back',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Leg pull back', ar: 'البلانك العكسي مع رفع الساق (Leg pull back)' },
    sets: 2,
    work: { en: '6 each leg', ar: '6 لكل ساق' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Sit with the hands behind you, press up into a reverse plank',
        'Kick one leg up without letting the hips drop',
        'Chest open, shoulders pressing down away from the ears',
      ],
      ar: [
        'اجلس واليدان خلفك وادفع للأعلى إلى بلانك عكسي',
        'اركل بساق للأعلى دون أن يهبط الوركان',
        'الصدر مفتوح والكتفان مضغوطتان للأسفل بعيدًا عن الأذنين',
      ],
    },
    avoid: {
      en: [
        'Hips sagging as the leg lifts',
        'Head dropping back and straining the neck',
        'Wrists collapsing under the shoulders',
      ],
      ar: [
        'هبوط الوركين عند رفع الساق',
        'سقوط الرأس للخلف وإجهاد الرقبة',
        'انهيار المعصمين تحت الكتفين',
      ],
    },
  },
  {
    id: 'p-plank-pike',
    style: 'pilates',
    area: 'upper',
    name: { en: 'Plank to pike', ar: 'من البلانك إلى البايك (Plank to pike)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 30,
    strength: true,
    cues: {
      en: [
        'Start in a high plank, hands under the shoulders',
        'Exhale and lift the hips high, pressing the chest toward the thighs',
        'Lower back to plank slowly without sagging',
      ],
      ar: [
        'ابدأ في بلانك مرتفع واليدان تحت الكتفين',
        'ازفر وارفع الوركين عاليًا مع دفع الصدر نحو الفخذين',
        'عُد إلى البلانك ببطء دون هبوط',
      ],
    },
    avoid: {
      en: [
        'Rounding the upper back at the top',
        'Hips sagging in the plank',
        'Shoulders rolling forward over the wrists',
      ],
      ar: [
        'تدوير أعلى الظهر في الأعلى',
        'هبوط الوركين في البلانك',
        'ميل الكتفين للأمام فوق المعصمين',
      ],
    },
  },

  // Cardio
  {
    id: 'p-mountain-climber',
    style: 'pilates',
    area: 'cardio',
    name: { en: 'Mountain climbers', ar: 'متسلق الجبال' },
    sets: 3,
    work: { en: '30 s', ar: '30 ث' },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'High plank, shoulders over the wrists',
        'Draw one knee toward the chest, then switch at a steady pace',
        'Keep the hips low and level the whole time',
      ],
      ar: [
        'بلانك مرتفع والكتفان فوق المعصمين',
        'اسحب ركبة نحو الصدر ثم بدّل بإيقاع ثابت',
        'أبقِ الوركين منخفضين وبمستوى واحد طوال الوقت',
      ],
    },
    avoid: {
      en: ['Hips bouncing up', 'Lower back sagging', 'Shoulders drifting back behind the wrists'],
      ar: ['ارتداد الوركين للأعلى', 'هبوط أسفل الظهر', 'رجوع الكتفين خلف المعصمين'],
    },
  },
  {
    id: 'p-rollup-standing',
    style: 'pilates',
    area: 'cardio',
    name: { en: 'Roll-up to standing flow', ar: 'تدفق النهوض إلى الوقوف' },
    sets: 3,
    work: { en: '45 s', ar: '45 ث' },
    restSeconds: 30,
    strength: false,
    cues: {
      en: [
        'Roll up from lying, rock forward and stand without using the hands',
        'Reach the arms up, then roll down through the spine to lie back',
        'Keep breathing: exhale on every roll',
      ],
      ar: [
        'انهض من الاستلقاء ثم تأرجح للأمام وقِف دون استخدام اليدين',
        'مدّ الذراعين للأعلى ثم انزل عبر العمود الفقري لتستلقي',
        'استمر في التنفس: ازفر مع كل لفّة',
      ],
    },
    avoid: {
      en: [
        'Dropping to the mat instead of rolling down',
        'Jerking up with momentum and straining the back',
        'Locking the knees when standing',
      ],
      ar: [
        'السقوط على الحصيرة بدل النزول بالتدرج',
        'الانتفاض بالاندفاع وإجهاد الظهر',
        'قفل الركبتين عند الوقوف',
      ],
    },
  },
]
