/**
 * BurnToReturn's exercise library: every style has at least two exercises in each of the five
 * areas. `sets`, `work` and `restSeconds` are the "maintain" prescription.
 */
import type { Exercise } from './types'

export const EXERCISES: readonly Exercise[] = [
  // Calisthenics
  {
    id: 'c-squat',
    style: 'calisthenics',
    area: 'legs',
    name: { en: 'Bodyweight squat', ar: 'سكوات بوزن الجسم' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
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
    name: { en: 'Reverse lunge', ar: 'لانج خلفي' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
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
    name: { en: 'Glute bridge', ar: 'جسر الأرداف' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
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
    name: { en: 'Single-leg glute bridge', ar: 'جسر الأرداف بساق واحدة' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
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
    name: { en: 'Forearm plank', ar: 'بلانك على الساعدين' },
    sets: 3,
    work: { en: '30 s', ar: '30 ث' },
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
    name: { en: 'Hollow body hold', ar: 'ثبات الجسم المقعّر (Hollow hold)' },
    sets: 3,
    work: { en: '20 s', ar: '20 ث' },
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
    name: { en: 'Burpee', ar: 'بيربي (Burpee)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
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
    name: { en: 'Mountain climbers', ar: 'متسلق الجبال' },
    sets: 4,
    work: { en: '30 s', ar: '30 ث' },
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
    name: { en: 'Push-up (knees to full)', ar: 'تمرين الضغط (من الركبتين إلى الكامل)' },
    sets: 3,
    work: { en: '8–12 reps', ar: '8–12 تكرارًا' },
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
    name: { en: 'Table row', ar: 'سحب مقلوب تحت الطاولة' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
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

  // Pilates
  {
    id: 'p-hundred',
    style: 'pilates',
    area: 'core',
    name: { en: 'The Hundred', ar: 'تمرين المئة' },
    sets: 1,
    work: { en: '100 pumps (10 breaths)', ar: '100 نبضة بالذراعين (10 أنفاس)' },
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
    name: { en: 'Roll-up', ar: 'النهوض الملفوف (Roll-up)' },
    sets: 2,
    work: { en: '8 reps', ar: '8 تكرارات' },
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
    name: { en: 'Criss-cross', ar: 'التقاطع (Criss-cross)' },
    sets: 2,
    work: { en: '10 each side', ar: '10 لكل جانب' },
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
    name: { en: 'Side-lying leg lift series', ar: 'سلسلة رفع الساق على الجانب' },
    sets: 2,
    work: { en: '15 each side', ar: '15 لكل جانب' },
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
    name: { en: 'Shoulder bridge', ar: 'جسر الكتفين' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
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
    name: { en: 'Single-leg circles', ar: 'دوائر الساق الواحدة' },
    sets: 2,
    work: { en: '8 each direction', ar: '8 في كل اتجاه' },
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
    name: { en: 'Standing pulse squat', ar: 'سكوات النبض واقفًا (Pulse squat)' },
    sets: 3,
    work: { en: '20 pulses', ar: '20 نبضة' },
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
    name: { en: 'Swimming', ar: 'تمرين السباحة' },
    sets: 3,
    work: { en: '30 s', ar: '30 ث' },
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
    name: { en: 'Plank jacks', ar: 'قفزات البلانك' },
    sets: 3,
    work: { en: '30 s', ar: '30 ث' },
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
    name: { en: 'Pilates push-up', ar: 'ضغط البيلاتس' },
    sets: 2,
    work: { en: '6 reps', ar: '6 تكرارات' },
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
    name: { en: 'Swan', ar: 'البجعة (Swan)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
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
    name: { en: 'Leg pull front', ar: 'بلانك مع رفع الساق (Leg pull front)' },
    sets: 2,
    work: { en: '6 each leg', ar: '6 لكل ساق' },
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

  // Gym
  {
    id: 'g-goblet',
    style: 'gym',
    area: 'legs',
    name: { en: 'Goblet squat', ar: 'جوبلت سكوات' },
    sets: 4,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Hold the dumbbell at your chest',
        'Elbows track inside the knees',
        'Stand up by driving through the whole foot',
      ],
      ar: ['أمسك الدمبل عند صدرك', 'المرفقان يتحركان داخل الركبتين', 'قِف بالدفع بقدمك كاملة'],
    },
    avoid: {
      en: ['Knees caving inward', 'Heels lifting', 'Letting the dumbbell pull you forward'],
      ar: ['انهيار الركبتين للداخل', 'ارتفاع الكعبين', 'ترك الدمبل يسحبك للأمام'],
    },
  },
  {
    id: 'g-press',
    style: 'gym',
    area: 'legs',
    name: { en: 'Leg press', ar: 'دفع الأرجل بالجهاز (Leg press)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Feet mid-platform, shoulder-width',
        'Lower until the knees reach about 90°',
        'Press through the heels and mid-foot',
      ],
      ar: [
        'القدمان في منتصف المنصة بعرض الكتفين',
        'انزل حتى تصل الركبتان إلى نحو 90°',
        'ادفع بالكعبين ومنتصف القدم',
      ],
    },
    avoid: {
      en: [
        'Locking the knees straight at the top',
        'Hips lifting off the seat at the bottom',
        'Feet set too low on the platform',
      ],
      ar: [
        'قفل الركبتين مستقيمتين في الأعلى',
        'ارتفاع الوركين عن المقعد في الأسفل',
        'وضع القدمين منخفضتين جدًا على المنصة',
      ],
    },
  },
  {
    id: 'g-thrust',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Barbell hip thrust', ar: 'دفع الورك بالبار (Hip thrust)' },
    sets: 4,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Upper back on the bench edge',
        'Pad the bar across the hip crease',
        'Shins vertical at the top',
        'Chin tucked, ribs down at the top',
      ],
      ar: [
        'أعلى الظهر على حافة المقعد',
        'ضع وسادة على البار فوق ثنية الورك',
        'الساقان عموديتان في الأعلى',
        'الذقن للداخل والضلوع للأسفل في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Over-arching the lower back at the top',
        'Feet too far forward (hamstrings take over)',
        'Pushing through the toes',
      ],
      ar: [
        'تقويس أسفل الظهر بشدة في الأعلى',
        'وضع القدمين بعيدًا جدًا للأمام (تتولى العضلات الخلفية الحمل)',
        'الدفع بأصابع القدمين',
      ],
    },
  },
  {
    id: 'g-rdl',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Romanian deadlift', ar: 'الرفعة الميتة الرومانية' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Push the hips back, soft knees',
        'Bar slides down the thighs',
        'Stop when you feel a stretch in the hamstrings',
      ],
      ar: [
        'ادفع الوركين للخلف مع ثني خفيف للركبتين',
        'البار ينزلق على الفخذين',
        'توقّف عندما تشعر بشدّ في العضلات الخلفية للفخذ',
      ],
    },
    avoid: {
      en: [
        'Rounding the back',
        'Bar drifting away from the legs',
        'Bending the knees into a squat',
      ],
      ar: ['تدوير الظهر', 'ابتعاد البار عن الساقين', 'ثني الركبتين كأنها سكوات'],
    },
  },
  {
    id: 'g-woodchop',
    style: 'gym',
    area: 'core',
    name: { en: 'Cable woodchop', ar: 'تقطيع الخشب بالكابل (Woodchop)' },
    sets: 3,
    work: { en: '12 each side', ar: '12 لكل جانب' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Turn through the ribs and hips together',
        'Pivot the back foot as you turn',
        'Keep the arms long and move the cable diagonally',
      ],
      ar: [
        'استدر بالقفص الصدري والوركين معًا',
        'لُفّ القدم الخلفية مع الدوران',
        'أبقِ ذراعيك ممدودتين وحرّك الكابل بشكل قطري',
      ],
    },
    avoid: {
      en: [
        'Twisting only from the lower back',
        'Arms doing all the work',
        'Using a weight that yanks you back',
      ],
      ar: ['الالتواء من أسفل الظهر فقط', 'قيام الذراعين بكل العمل', 'استخدام وزن يشدّك للخلف'],
    },
  },
  {
    id: 'g-deadbug',
    style: 'gym',
    area: 'core',
    name: { en: 'Dead bug', ar: 'الحشرة الميتة (Dead bug)' },
    sets: 3,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lower back pressed into the floor',
        'Lower the opposite arm and leg slowly',
        'Breathe out as the arm and leg reach away',
      ],
      ar: [
        'أسفل الظهر ملتصق بالأرض',
        'أنزل الذراع والساق المتقابلتين ببطء',
        'ازفر وأنت تمدّ الذراع والساق',
      ],
    },
    avoid: {
      en: ['Back arching as the leg lowers', 'Moving too fast', 'Holding your breath'],
      ar: ['تقويس الظهر عند إنزال الساق', 'الحركة بسرعة كبيرة', 'حبس النفس'],
    },
  },
  {
    id: 'g-incline',
    style: 'gym',
    area: 'cardio',
    name: { en: 'Incline treadmill walk', ar: 'المشي على السير المائل' },
    sets: 1,
    work: { en: '20 min at 8–10 % incline', ar: '20 دقيقة بميل 8–10 %' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Brisk pace you can still talk at',
        'Stand tall and swing the arms naturally',
        'Start lower and raise the incline once warm',
      ],
      ar: [
        'سرعة نشطة تستطيع معها الكلام',
        'قِف مستقيمًا وحرّك ذراعيك بشكل طبيعي',
        'ابدأ بميل أقل وزِده بعد الإحماء',
      ],
    },
    avoid: {
      en: [
        'Holding onto the rails',
        'Leaning back against the incline',
        'Stepping on or off the moving belt',
      ],
      ar: [
        'التمسك بالمقابض',
        'الميل للخلف عكس الانحدار',
        'الصعود على السير أو النزول عنه وهو يتحرك',
      ],
    },
  },
  {
    id: 'g-row',
    style: 'gym',
    area: 'cardio',
    name: { en: 'Rowing machine intervals', ar: 'فترات على جهاز التجديف' },
    sets: 1,
    work: { en: '8 rounds: 1 min hard, 1 min easy', ar: '8 جولات: دقيقة بجهد عالٍ ودقيقة سهلة' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Strap the feet across the widest part of the foot',
        'Legs, then body, then arms',
        'Reverse it on the way back: arms, body, legs',
      ],
      ar: [
        'ثبّت الحزام على أعرض جزء من القدم',
        'الساقان، ثم الجسم، ثم الذراعان',
        'وفي العودة بالعكس: الذراعان، ثم الجسم، ثم الساقان',
      ],
    },
    avoid: {
      en: [
        'Pulling with the arms first',
        'Rounding the back at the catch',
        'Bending the knees before the hands pass them on the way back',
      ],
      ar: [
        'السحب بالذراعين أولًا',
        'تدوير الظهر في بداية السحب',
        'ثني الركبتين قبل أن تتجاوزهما اليدان في العودة',
      ],
    },
  },
  {
    id: 'g-pulldown',
    style: 'gym',
    area: 'upper',
    name: { en: 'Lat pulldown', ar: 'السحب العلوي للظهر (Lat pulldown)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Pull the bar to the top of the chest',
        'Lead with the elbows, driving them down to the ribs',
        'Control the bar on the way up',
      ],
      ar: [
        'اسحب البار إلى أعلى الصدر',
        'قُد الحركة بالمرفقين وأنزلهما نحو الضلوع',
        'تحكّم في البار أثناء الصعود',
      ],
    },
    avoid: {
      en: [
        'Leaning far back to swing the weight',
        'Pulling the bar behind the neck',
        'Shrugging the shoulders to the ears',
      ],
      ar: ['الميل كثيرًا للخلف لأرجحة الوزن', 'سحب البار خلف الرقبة', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'g-ohp',
    style: 'gym',
    area: 'upper',
    name: { en: 'Dumbbell shoulder press', ar: 'ضغط الكتفين بالدمبل' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Start with the dumbbells at shoulder height, palms forward',
        'Ribs down, glutes tight',
        'Press until the arms are straight over the shoulders',
      ],
      ar: [
        'ابدأ والدمبل عند مستوى الكتفين وراحتا اليدين للأمام',
        'الضلوع للأسفل والأرداف مشدودة',
        'ادفع حتى تستقيم ذراعاك فوق الكتفين',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back',
        'Dumbbells drifting forward',
        'Lowering the dumbbells too fast',
      ],
      ar: ['تقويس أسفل الظهر', 'انحراف الدمبل للأمام', 'إنزال الدمبل بسرعة دون تحكم'],
    },
  },
  {
    id: 'g-cablerow',
    style: 'gym',
    area: 'upper',
    name: { en: 'Seated cable row', ar: 'التجديف بالكابل جالسًا' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Sit tall with a slight bend in the knees',
        'Pull the handle to your lower ribs',
        'Squeeze the shoulder blades together, then let them slide forward',
      ],
      ar: [
        'اجلس مستقيمًا مع ثني خفيف للركبتين',
        'اسحب المقبض نحو أسفل ضلوعك',
        'اضغط لوحَي الكتفين معًا ثم دعهما ينزلقان للأمام',
      ],
    },
    avoid: {
      en: [
        'Rocking the torso back and forth to move the weight',
        'Rounding the back as the handle returns',
        'Shrugging the shoulders to the ears',
      ],
      ar: [
        'أرجحة الجذع للأمام والخلف لتحريك الوزن',
        'تدوير الظهر عند عودة المقبض',
        'رفع الكتفين نحو الأذنين',
      ],
    },
  },

  // CrossFit
  {
    id: 'x-wallball',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Wall ball', ar: 'رمي الكرة على الحائط (Wall ball)' },
    sets: 4,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hold the ball at chest height, elbows under it',
        'Squat deep, drive up, throw at the top',
        'Catch and sink straight into the next squat',
      ],
      ar: [
        'أمسك الكرة عند الصدر والمرفقان تحتها',
        'انزل عميقًا، ثم اندفع للأعلى، وارمِ الكرة في القمة',
        'التقط الكرة وانزل مباشرة في السكوات التالي',
      ],
    },
    avoid: {
      en: [
        'Holding the ball far from the chest',
        'Knees caving on the way up',
        'Throwing with the arms instead of the legs',
      ],
      ar: [
        'حمل الكرة بعيدًا عن الصدر',
        'انهيار الركبتين للداخل أثناء الصعود',
        'الرمي بالذراعين بدل الدفع بالساقين',
      ],
    },
  },
  {
    id: 'x-stepup',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Box step-up', ar: 'الصعود على الصندوق' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: ['Whole foot on the box', 'Stand up fully at the top', 'Step down with control'],
      ar: ['ضع قدمك كاملة على الصندوق', 'قِف مستقيمًا تمامًا في الأعلى', 'انزل بتحكم'],
    },
    avoid: {
      en: [
        'Pushing off the back leg',
        'Knee collapsing inward',
        'A box so high your knee rises above your hip',
      ],
      ar: [
        'الدفع بالساق الخلفية',
        'انهيار الركبة للداخل',
        'صندوق مرتفع جدًا ترتفع معه الركبة فوق الورك',
      ],
    },
  },
  {
    id: 'x-swing',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Kettlebell swing', ar: 'كيتلبل سوينغ' },
    sets: 4,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hike the bell back between the thighs',
        'Snap the hips, arms just guide the bell',
        'Squeeze the glutes and stand tall at the top',
      ],
      ar: [
        'أرجع الكيتلبل للخلف بين الفخذين',
        'ادفع الوركين بقوة، والذراعان توجّهان الكيتلبل فقط',
        'اضغط الأرداف وقِف مستقيمًا في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Squatting the swing instead of hinging',
        'Lifting with the arms',
        'Leaning back at the top',
      ],
      ar: ['تحويل الأرجحة إلى سكوات بدل ثني الورك', 'الرفع بالذراعين', 'الميل للخلف في الأعلى'],
    },
  },
  {
    id: 'x-kbdeadlift',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Kettlebell deadlift', ar: 'الرفعة الميتة بالكيتلبل' },
    sets: 4,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Bell between the feet, under the hips',
        'Push the hips back with a flat back to grip the handle',
        'Drive through the heels and squeeze the glutes to stand',
      ],
      ar: [
        'الكيتلبل بين القدمين تحت الوركين',
        'ادفع الوركين للخلف والظهر مستقيم لتمسك المقبض',
        'ادفع بالكعبين واضغط الأرداف لتقف',
      ],
    },
    avoid: {
      en: [
        'Rounding the back to reach the bell',
        'Squatting down instead of hinging',
        'Leaning back at the top',
      ],
      ar: [
        'تدوير الظهر للوصول إلى الكيتلبل',
        'النزول كأنها سكوات بدل ثني الورك',
        'الميل للخلف في الأعلى',
      ],
    },
  },
  {
    id: 'x-situp',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Sit-up', ar: 'تمرين الجلوس (Sit-up)' },
    sets: 3,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Knees bent, feet flat on the floor',
        'Arms reach overhead and forward',
        'Breathe out as you sit up',
      ],
      ar: [
        'الركبتان مثنيتان والقدمان على الأرض',
        'مدّ ذراعيك فوق رأسك ثم للأمام',
        'ازفر وأنت تنهض',
      ],
    },
    avoid: {
      en: [
        'Yanking the neck forward',
        'Dropping back to the floor without control',
        'Holding your breath',
      ],
      ar: ['شدّ الرقبة للأمام بقوة', 'السقوط على الظهر دون تحكم', 'حبس النفس'],
    },
  },
  {
    id: 'x-kneeraise',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Hanging knee raise', ar: 'رفع الركبتين معلّقًا' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Grip the bar just wider than the shoulders',
        'Shoulders active, knees to chest',
        'Lower the legs slowly to stop the swing',
      ],
      ar: [
        'أمسك البار أوسع قليلًا من الكتفين',
        'شدّ كتفيك للأسفل وارفع ركبتيك نحو الصدر',
        'أنزل ساقيك ببطء لتوقف الأرجحة',
      ],
    },
    avoid: {
      en: [
        'Swinging the body to lift the legs',
        'Hanging loose in the shoulders',
        'Arching the lower back as the legs drop',
      ],
      ar: [
        'أرجحة الجسم لرفع الساقين',
        'التعلّق بكتفين مرتخيتين',
        'تقويس أسفل الظهر عند إنزال الساقين',
      ],
    },
  },
  {
    id: 'x-bike',
    style: 'crossfit',
    area: 'cardio',
    name: { en: 'Bike EMOM', ar: 'دراجة كل دقيقة (EMOM)' },
    sets: 1,
    work: { en: '10 min: 12 cal each minute', ar: '10 دقائق: 12 سعرة كل دقيقة' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Set the seat so the knee stays slightly bent at the bottom',
        'Even pace you can hold every minute',
        'Rest for whatever is left of each minute',
      ],
      ar: [
        'اضبط المقعد لتبقى الركبة مثنية قليلًا في الأسفل',
        'وتيرة ثابتة تستطيع الحفاظ عليها كل دقيقة',
        'استرح في ما يتبقى من كل دقيقة',
      ],
    },
    avoid: {
      en: [
        'Starting so hard you fade by minute 4',
        'Seat so low that the knees ride up high',
        'Gripping the handles hard and hunching the shoulders',
      ],
      ar: [
        'البدء بقوة كبيرة فتنهار قبل الدقيقة 4',
        'مقعد منخفض جدًا ترتفع معه الركبتان كثيرًا',
        'قبض المقابض بشدة وتحديب الكتفين',
      ],
    },
  },
  {
    id: 'x-rope',
    style: 'crossfit',
    area: 'cardio',
    name: { en: 'Jump rope', ar: 'نط الحبل' },
    sets: 5,
    work: { en: '50 skips', ar: '50 قفزة' },
    restSeconds: 45,
    strength: false,
    cues: {
      en: [
        'Small jumps, wrists turn the rope',
        'Elbows close to your sides',
        'Stay on the balls of your feet',
      ],
      ar: [
        'قفزات صغيرة، والمعصمان يديران الحبل',
        'المرفقان قريبان من جانبيك',
        'ابقَ على مقدمة قدميك',
      ],
    },
    avoid: {
      en: ['Jumping too high', 'Landing on the heels', 'Swinging the rope with the whole arm'],
      ar: ['القفز عاليًا جدًا', 'الهبوط على الكعبين', 'تدوير الحبل بالذراع كلها'],
    },
  },
  {
    id: 'x-pushpress',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Push press', ar: 'الضغط بالدفع (Push press)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Dip, drive with the legs, then press',
        'Keep the dip short, with the torso upright',
        'Finish with the bar over the middle of the foot',
      ],
      ar: [
        'انزل قليلًا، اندفع بالساقين، ثم اضغط',
        'اجعل النزول قصيرًا والجذع مستقيمًا',
        'أنهِ الحركة والبار فوق منتصف القدم',
      ],
    },
    avoid: {
      en: [
        'Pressing before the legs drive',
        'Arching the back at the top',
        'Dipping so deep it turns into a squat',
      ],
      ar: ['الضغط قبل اندفاع الساقين', 'تقويس الظهر في الأعلى', 'النزول عميقًا حتى يصبح سكوات'],
    },
  },
  {
    id: 'x-ringrow',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Ring row', ar: 'التجديف بالحلقات' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Body straight like a plank',
        'Pull the rings to the sides of the chest',
        'Walk the feet forward to make it harder',
      ],
      ar: [
        'جسمك مستقيم كالبلانك',
        'اسحب الحلقات إلى جانبَي الصدر',
        'قدّم قدميك للأمام لزيادة الصعوبة',
      ],
    },
    avoid: {
      en: [
        'Hips dropping',
        'Shrugging the shoulders',
        'Dropping fast instead of lowering with control',
      ],
      ar: ['هبوط الوركين', 'رفع الكتفين نحو الأذنين', 'السقوط بسرعة بدل النزول بتحكم'],
    },
  },
]
