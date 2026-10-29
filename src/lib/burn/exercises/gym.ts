import type { Exercise } from '../types'

/** Gym: see ../types.ts for every field's rules. */
export const GYM: readonly Exercise[] = [
  {
    id: 'g-goblet',
    style: 'gym',
    area: 'legs',
    name: {
      en: 'Goblet squat',
      ar: 'جوبلت سكوات',
    },
    sets: 4,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
    name: {
      en: 'Leg press',
      ar: 'دفع الأرجل بالجهاز (Leg press)',
    },
    sets: 3,
    work: {
      en: '12 reps',
      ar: '12 تكرارًا',
    },
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
    name: {
      en: 'Barbell hip thrust',
      ar: 'دفع الورك بالبار (Hip thrust)',
    },
    sets: 4,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
    name: {
      en: 'Romanian deadlift',
      ar: 'الرفعة الميتة الرومانية',
    },
    sets: 3,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
    name: {
      en: 'Cable woodchop',
      ar: 'تقطيع الخشب بالكابل (Woodchop)',
    },
    sets: 3,
    work: {
      en: '12 each side',
      ar: '12 لكل جانب',
    },
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
    name: {
      en: 'Dead bug',
      ar: 'الحشرة الميتة (Dead bug)',
    },
    sets: 3,
    work: {
      en: '10 each side',
      ar: '10 لكل جانب',
    },
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
    name: {
      en: 'Incline treadmill walk',
      ar: 'المشي على السير المائل',
    },
    sets: 1,
    work: {
      en: '20 min at 8–10 % incline',
      ar: '20 دقيقة بميل 8–10 %',
    },
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
    name: {
      en: 'Rowing machine intervals',
      ar: 'فترات على جهاز التجديف',
    },
    sets: 1,
    work: {
      en: '8 rounds: 1 min hard, 1 min easy',
      ar: '8 جولات: دقيقة بجهد عالٍ ودقيقة سهلة',
    },
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
    name: {
      en: 'Lat pulldown',
      ar: 'السحب العلوي للظهر (Lat pulldown)',
    },
    sets: 3,
    work: {
      en: '12 reps',
      ar: '12 تكرارًا',
    },
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
    name: {
      en: 'Dumbbell shoulder press',
      ar: 'ضغط الكتفين بالدمبل',
    },
    sets: 3,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
    name: {
      en: 'Seated cable row',
      ar: 'التجديف بالكابل جالسًا',
    },
    sets: 3,
    work: {
      en: '12 reps',
      ar: '12 تكرارًا',
    },
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
  // Legs
  {
    id: 'g-legext',
    style: 'gym',
    area: 'legs',
    name: { en: 'Leg extension machine', ar: 'جهاز تمديد الأرجل (Leg extension)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Set the back pad so the knees line up with the machine pivot',
        'Shin pad just above the ankles',
        'Extend until the legs are straight, pause, then lower slowly',
      ],
      ar: [
        'اضبط مسند الظهر بحيث تحاذي الركبتان محور الجهاز',
        'وسادة الساق فوق الكاحلين مباشرة',
        'مدّ ساقيك حتى تستقيما، توقف لحظة، ثم أنزل ببطء',
      ],
    },
    avoid: {
      en: [
        'Kicking the weight up fast',
        'Letting the stack slam at the bottom',
        'Lifting the hips off the seat',
      ],
      ar: ['ركل الوزن للأعلى بسرعة', 'ترك الأوزان تصطدم في الأسفل', 'رفع الوركين عن المقعد'],
    },
  },
  {
    id: 'g-legcurl',
    style: 'gym',
    area: 'legs',
    name: { en: 'Seated leg curl', ar: 'ثني الأرجل جالسًا (Seated leg curl)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Thigh pad snug, knees aligned with the pivot',
        'Curl the heels under the seat',
        'Return slowly over 2–3 seconds',
      ],
      ar: [
        'وسادة الفخذ مثبتة بإحكام والركبتان بمحاذاة محور الجهاز',
        'اثنِ ساقيك وأنزل الكعبين تحت المقعد',
        'عُد ببطء خلال 2–3 ثوانٍ',
      ],
    },
    avoid: {
      en: [
        'Hips lifting off the seat',
        'Swinging the weight with momentum',
        'Stopping short of a full curl',
      ],
      ar: ['ارتفاع الوركين عن المقعد', 'أرجحة الوزن بالاندفاع', 'التوقف قبل الثني الكامل'],
    },
  },
  {
    id: 'g-calf',
    style: 'gym',
    area: 'legs',
    name: { en: 'Standing calf raise machine', ar: 'رفع السمانة واقفًا بالجهاز' },
    sets: 4,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Balls of the feet on the edge, heels hanging',
        'Lower the heels fully and feel the stretch',
        'Rise as high as you can and pause at the top',
      ],
      ar: [
        'مقدمة القدمين على الحافة والكعبان متدليان',
        'أنزل الكعبين تمامًا واشعر بالتمدد',
        'ارتفع لأقصى حد وتوقف لحظة في الأعلى',
      ],
    },
    avoid: {
      en: ['Bouncing out of the bottom', 'Bending the knees to help', 'Short, fast half reps'],
      ar: ['الارتداد من الوضع السفلي', 'ثني الركبتين للمساعدة', 'تكرارات نصفية قصيرة وسريعة'],
    },
  },
  {
    id: 'g-seatedcalf',
    style: 'gym',
    area: 'legs',
    name: { en: 'Seated calf raise machine', ar: 'رفع السمانة جالسًا بالجهاز' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Knee pad snug on the lower thighs',
        'Full stretch at the bottom, full squeeze at the top',
        'Keep the reps slow and controlled',
      ],
      ar: [
        'وسادة الركبة مثبتة على أسفل الفخذين',
        'تمدد كامل في الأسفل وضغط كامل في الأعلى',
        'أبقِ التكرارات بطيئة ومتحكَّمًا بها',
      ],
    },
    avoid: {
      en: ['Bouncing the weight', 'Rocking the torso', 'Loading so heavy the range shrinks'],
      ar: ['ارتداد الوزن', 'أرجحة الجذع', 'تحميل وزن ثقيل يقلّص مدى الحركة'],
    },
  },
  {
    id: 'g-hack',
    style: 'gym',
    area: 'legs',
    name: { en: 'Hack squat', ar: 'هاك سكوات (Hack squat)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Shoulders under the pads, back flat on the sled',
        'Feet shoulder-width, slightly up the platform',
        'Lower until the thighs are parallel, then drive up',
      ],
      ar: [
        'الكتفان تحت الوسادتين والظهر مستوٍ على المسند',
        'القدمان بعرض الكتفين وفوق منتصف المنصة قليلًا',
        'انزل حتى يوازي الفخذان الأرض ثم ادفع للأعلى',
      ],
    },
    avoid: {
      en: [
        'Locking the knees at the top',
        'Heels lifting off the platform',
        'Lower back peeling off the pad',
      ],
      ar: ['قفل الركبتين في الأعلى', 'ارتفاع الكعبين عن المنصة', 'انفصال أسفل الظهر عن المسند'],
    },
  },
  {
    id: 'g-smithsquat',
    style: 'gym',
    area: 'legs',
    name: { en: 'Smith machine squat', ar: 'سكوات على جهاز سميث' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Bar across the upper back, feet slightly in front of the bar',
        'Unhook, then sit the hips down and back',
        'Drive through the whole foot to stand',
      ],
      ar: [
        'البار على أعلى الظهر والقدمان أمام البار قليلًا',
        'حرّر البار ثم أنزل الوركين للأسفل والخلف',
        'ادفع بالقدم كاملة للوقوف',
      ],
    },
    avoid: {
      en: ['Feet directly under the bar', 'Knees caving inward', 'Bouncing out of the bottom'],
      ar: ['وضع القدمين تحت البار مباشرة', 'انهيار الركبتين للداخل', 'الارتداد من الوضع السفلي'],
    },
  },
  {
    id: 'g-stepup',
    style: 'gym',
    area: 'legs',
    name: { en: 'Dumbbell step-up', ar: 'صعود الدرجة بالدمبل' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Box at knee height, whole foot on the box',
        'Drive through the top foot and stand tall',
        'Lower back down slowly',
      ],
      ar: [
        'الصندوق بارتفاع الركبة والقدم كاملة عليه',
        'ادفع بالقدم العليا وقِف مستقيمًا',
        'انزل ببطء',
      ],
    },
    avoid: {
      en: [
        'Pushing off the bottom foot',
        'Knee caving inward on the step',
        'Dropping down instead of lowering under control',
      ],
      ar: [
        'الدفع بالقدم السفلية',
        'انهيار الركبة للداخل أثناء الصعود',
        'الهبوط بسقوط بدل النزول بتحكم',
      ],
    },
  },
  {
    id: 'g-lunge',
    style: 'gym',
    area: 'legs',
    name: { en: 'Walking lunges with dumbbells', ar: 'لانجز بالمشي مع الدمبل' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Dumbbells at your sides, chest up',
        'Step long enough that both knees reach 90°',
        'Push through the front heel into the next step',
      ],
      ar: [
        'الدمبل بجانبيك والصدر مرفوع',
        'خطوة طويلة بما يكفي لتصل الركبتان إلى 90°',
        'ادفع بكعب القدم الأمامية إلى الخطوة التالية',
      ],
    },
    avoid: {
      en: ['Front knee collapsing inward', 'Leaning forward from the waist', 'Short, rushed steps'],
      ar: ['انهيار الركبة الأمامية للداخل', 'الميل للأمام من الخصر', 'خطوات قصيرة ومتعجلة'],
    },
  },
  {
    id: 'g-bulgarian',
    style: 'gym',
    area: 'legs',
    name: { en: 'Dumbbell Bulgarian split squat', ar: 'سكوات بلغاري بالدمبل' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Rear foot on a bench, front foot about a stride ahead',
        'Lower straight down, torso slightly forward',
        'Drive through the front heel',
      ],
      ar: [
        'القدم الخلفية على المقعد والأمامية على بُعد خطوة تقريبًا',
        'انزل عموديًا مع ميل خفيف للجذع للأمام',
        'ادفع بكعب القدم الأمامية',
      ],
    },
    avoid: {
      en: ['Front foot too close to the bench', 'Pushing off the back foot', 'Knee caving inward'],
      ar: [
        'وضع القدم الأمامية قريبة جدًا من المقعد',
        'الدفع بالقدم الخلفية',
        'انهيار الركبة للداخل',
      ],
    },
  },
  // Glutes
  {
    id: 'g-abduction',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Hip abduction machine', ar: 'جهاز فتح الوركين (Hip abduction)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Sit tall with the back against the pad',
        'Push the knees out wide and pause at the end',
        'Return slowly without letting the pads touch',
      ],
      ar: [
        'اجلس مستقيمًا والظهر ملاصق للمسند',
        'ادفع الركبتين للخارج بعيدًا وتوقف لحظة في النهاية',
        'عُد ببطء دون أن تتلامس الوسادتان',
      ],
    },
    avoid: {
      en: ['Bouncing the knees in and out', 'Leaning away from the pad', 'Letting the stack slam'],
      ar: ['ارتداد الركبتين للداخل والخارج', 'الميل بعيدًا عن المسند', 'ترك الأوزان تصطدم'],
    },
  },
  {
    id: 'g-kickback',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Cable glute kickback', ar: 'ركلة الأرداف بالكابل' },
    sets: 3,
    work: { en: '12 each leg', ar: '12 لكل ساق' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Ankle strap on, hold the frame, slight forward lean',
        'Kick the leg back and slightly up, squeeze the glute',
        'Return slowly without touching the floor',
      ],
      ar: [
        'ثبّت حزام الكاحل وأمسك الإطار مع ميل خفيف للأمام',
        'اركل الساق للخلف وللأعلى قليلًا واضغط الأرداف',
        'عُد ببطء دون لمس الأرض',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back to kick higher',
        'Swinging the leg with momentum',
        'Rotating the hips open',
      ],
      ar: ['تقويس أسفل الظهر لرفع الساق أعلى', 'أرجحة الساق بالاندفاع', 'فتح الوركين بالدوران'],
    },
  },
  {
    id: 'g-pullthrough',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Cable pull-through', ar: 'السحب بين الساقين بالكابل (Pull-through)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Rope between the legs, face away from the machine',
        'Push the hips back with soft knees',
        'Stand tall by squeezing the glutes, not by arching',
      ],
      ar: [
        'الحبل بين الساقين وظهرك للجهاز',
        'ادفع الوركين للخلف مع ثني خفيف للركبتين',
        'قِف مستقيمًا بضغط الأرداف لا بتقويس الظهر',
      ],
    },
    avoid: {
      en: ['Rounding the back', 'Pulling with the arms', 'Squatting instead of hinging'],
      ar: ['تدوير الظهر', 'السحب بالذراعين', 'أداء سكوات بدل ثني الورك'],
    },
  },
  {
    id: 'g-dbrdl',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Dumbbell Romanian deadlift', ar: 'ديدلفت روماني بالدمبل' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Dumbbells in front of the thighs, shoulders back',
        'Hinge at the hips, dumbbells slide down the legs',
        'Drive the hips forward to stand',
      ],
      ar: [
        'الدمبل أمام الفخذين والكتفان للخلف',
        'اثنِ من الوركين والدمبل ينزلق على الساقين',
        'ادفع الوركين للأمام للوقوف',
      ],
    },
    avoid: {
      en: [
        'Rounding the back',
        'Dumbbells drifting away from the legs',
        'Going lower than the hamstrings allow',
      ],
      ar: ['تدوير الظهر', 'ابتعاد الدمبل عن الساقين', 'النزول أكثر مما تسمح به العضلات الخلفية'],
    },
  },
  {
    id: 'g-slrdl',
    style: 'gym',
    area: 'glutes',
    name: {
      en: 'Single-leg Romanian deadlift with dumbbell',
      ar: 'ديدلفت روماني على ساق واحدة بالدمبل',
    },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Dumbbell in the hand opposite the standing leg',
        'Hinge forward as the back leg reaches behind you',
        'Hips square to the floor the whole time',
      ],
      ar: [
        'الدمبل في اليد المقابلة للساق الثابتة',
        'انحنِ من الورك والساق الخلفية تمتد خلفك',
        'الوركان متوازيان مع الأرض طوال الوقت',
      ],
    },
    avoid: {
      en: ['Hip opening to the side', 'Rounding the back', 'Rushing and losing balance'],
      ar: ['انفتاح الورك للجانب', 'تدوير الظهر', 'التسرع وفقدان التوازن'],
    },
  },
  {
    id: 'g-dbbridge',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Dumbbell glute bridge', ar: 'جسر الأرداف بالدمبل' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lie on your back, dumbbell across the hips',
        'Heels close to the glutes',
        'Lift the hips until the body is a straight line, squeeze at the top',
      ],
      ar: [
        'استلقِ على ظهرك والدمبل فوق الوركين',
        'الكعبان قريبان من الأرداف',
        'ارفع الوركين حتى يستقيم الجسم واضغط في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Arching the lower back at the top',
        'Pushing through the toes',
        'Bouncing the hips off the floor',
      ],
      ar: ['تقويس أسفل الظهر في الأعلى', 'الدفع بأصابع القدمين', 'ارتداد الوركين عن الأرض'],
    },
  },
  {
    id: 'g-sumo',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Dumbbell sumo squat', ar: 'سومو سكوات بالدمبل' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Wide stance, toes turned out',
        'Hold the dumbbell vertically between the legs',
        'Knees track over the toes, drive up through the heels',
      ],
      ar: [
        'وقفة واسعة وأصابع القدمين للخارج',
        'أمسك الدمبل عموديًا بين الساقين',
        'الركبتان في اتجاه أصابع القدمين وادفع للأعلى بالكعبين',
      ],
    },
    avoid: {
      en: ['Knees caving inward', 'Rounding the back as the dumbbell lowers', 'Heels lifting'],
      ar: ['انهيار الركبتين للداخل', 'تدوير الظهر عند نزول الدمبل', 'ارتفاع الكعبين'],
    },
  },
  {
    id: 'g-revlunge',
    style: 'gym',
    area: 'glutes',
    name: { en: 'Dumbbell reverse lunge', ar: 'لانجز عكسي بالدمبل' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Step back far enough to keep the front shin vertical',
        'Lower the back knee toward the floor',
        'Drive through the front heel to return',
      ],
      ar: [
        'ارجع بخطوة طويلة بما يكفي لتبقى الساق الأمامية عمودية',
        'أنزل الركبة الخلفية نحو الأرض',
        'ادفع بكعب القدم الأمامية للعودة',
      ],
    },
    avoid: {
      en: [
        'Front knee caving inward',
        'Slamming the back knee into the floor',
        'Leaning forward from the waist',
      ],
      ar: [
        'انهيار الركبة الأمامية للداخل',
        'ارتطام الركبة الخلفية بالأرض',
        'الميل للأمام من الخصر',
      ],
    },
  },
  {
    id: 'g-backext',
    style: 'gym',
    area: 'glutes',
    name: { en: '45-degree back extension', ar: 'تمديد الظهر على جهاز 45 درجة (Back extension)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Pad just below the hip bones',
        'Hinge down with a flat back',
        'Squeeze the glutes to come up to a straight line',
      ],
      ar: [
        'الوسادة أسفل عظمتي الورك مباشرة',
        'انزل من الورك والظهر مستوٍ',
        'اضغط الأرداف للصعود حتى الاستقامة',
      ],
    },
    avoid: {
      en: [
        'Hyperextending past straight at the top',
        'Rounding the back',
        'Swinging up with momentum',
      ],
      ar: ['تجاوز الاستقامة بتقويس الظهر في الأعلى', 'تدوير الظهر', 'الصعود بالأرجحة والاندفاع'],
    },
  },
  // Core
  {
    id: 'g-abmachine',
    style: 'gym',
    area: 'core',
    name: { en: 'Ab crunch machine', ar: 'جهاز تمرين البطن (Ab crunch)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Set the seat so the pad sits on the upper chest',
        'Curl the ribs toward the hips',
        'Breathe out as you crunch, return slowly',
      ],
      ar: [
        'اضبط المقعد بحيث تستقر الوسادة على أعلى الصدر',
        'اثنِ القفص الصدري نحو الوركين',
        'ازفر أثناء الثني وعُد ببطء',
      ],
    },
    avoid: {
      en: [
        'Pulling with the arms on the handles',
        'Bending from the hips instead of the spine',
        'Letting the stack slam',
      ],
      ar: [
        'السحب بالذراعين على المقابض',
        'الثني من الوركين بدل العمود الفقري',
        'ترك الأوزان تصطدم',
      ],
    },
  },
  {
    id: 'g-cablecrunch',
    style: 'gym',
    area: 'core',
    name: { en: 'Cable crunch', ar: 'كرنش بالكابل (Cable crunch)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Kneel facing the stack, rope held at the forehead',
        'Crunch the ribs down toward the thighs',
        'Keep the hips still and let the abs do the work',
      ],
      ar: [
        'اركع في مواجهة الأوزان والحبل عند الجبهة',
        'اثنِ القفص الصدري للأسفل نحو الفخذين',
        'أبقِ الوركين ثابتين ودع عضلات البطن تعمل',
      ],
    },
    avoid: {
      en: [
        'Pulling the rope with the arms',
        'Sitting back onto the heels on each rep',
        'Using a weight that yanks you up',
      ],
      ar: ['سحب الحبل بالذراعين', 'الجلوس على الكعبين في كل تكرار', 'استخدام وزن يشدّك للأعلى'],
    },
  },
  {
    id: 'g-pallof',
    style: 'gym',
    area: 'core',
    name: { en: 'Pallof press', ar: 'ضغط بالوف (Pallof press)' },
    sets: 3,
    work: { en: '10 each side', ar: '10 لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Stand side-on to the cable at chest height',
        'Press the handle straight out and hold for 2 seconds',
        'Brace the abs; hips and shoulders stay square',
      ],
      ar: [
        'قِف بجانبك إلى الكابل عند مستوى الصدر',
        'ادفع المقبض للأمام مباشرة وثبّت لمدة ثانيتين',
        'شدّ عضلات البطن وأبقِ الوركين والكتفين مستقيمين للأمام',
      ],
    },
    avoid: {
      en: [
        'Letting the cable twist you toward the stack',
        'Leaning away from the machine',
        'Holding your breath',
      ],
      ar: ['ترك الكابل يلويك نحو الأوزان', 'الميل بعيدًا عن الجهاز', 'حبس النفس'],
    },
  },
  {
    id: 'g-kneeraise',
    style: 'gym',
    area: 'core',
    name: { en: 'Hanging knee raise', ar: 'رفع الركبتين معلقًا' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hang from the bar with the shoulders pulled down',
        'Pull the knees up toward the chest and tilt the pelvis',
        'Lower slowly without swinging',
      ],
      ar: [
        'تعلّق بالبار مع شدّ الكتفين للأسفل',
        'ارفع الركبتين نحو الصدر مع إمالة الحوض',
        'أنزل ببطء دون أرجحة',
      ],
    },
    avoid: {
      en: [
        'Swinging the body to lift the legs',
        'Arching the lower back at the bottom',
        'Shrugging the shoulders to the ears',
      ],
      ar: ['أرجحة الجسم لرفع الساقين', 'تقويس أسفل الظهر في الأسفل', 'رفع الكتفين نحو الأذنين'],
    },
  },
  {
    id: 'g-captain',
    style: 'gym',
    area: 'core',
    name: { en: "Captain's chair leg raise", ar: 'رفع الساقين على كرسي الكابتن' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Forearms on the pads, back against the rest',
        'Lift the knees, then curl the hips up at the top',
        'Lower slowly and stop before swinging',
      ],
      ar: [
        'الساعدان على الوسادتين والظهر ملاصق للمسند',
        'ارفع الركبتين ثم لفّ الوركين للأعلى في النهاية',
        'أنزل ببطء وتوقف قبل الأرجحة',
      ],
    },
    avoid: {
      en: [
        'Swinging the legs with momentum',
        'Shoulders shrugged up to the ears',
        'Arching the back away from the pad',
      ],
      ar: ['أرجحة الساقين بالاندفاع', 'رفع الكتفين نحو الأذنين', 'تقويس الظهر بعيدًا عن المسند'],
    },
  },
  {
    id: 'g-abwheel',
    style: 'gym',
    area: 'core',
    name: { en: 'Ab wheel rollout', ar: 'عجلة البطن (Ab wheel)' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Kneel with the wheel under the shoulders',
        'Tuck the pelvis and roll out as far as you can hold a flat back',
        'Pull back with the abs, not the arms',
      ],
      ar: [
        'اركع والعجلة تحت الكتفين',
        'أمِل الحوض للداخل ودحرج للأمام بقدر ما تحافظ على ظهر مستوٍ',
        'ارجع بعضلات البطن لا بالذراعين',
      ],
    },
    avoid: {
      en: [
        'Lower back sagging as you roll out',
        'Hips piking up on the way back',
        'Rolling further than you can control',
      ],
      ar: [
        'تدلّي أسفل الظهر أثناء الدحرجة للأمام',
        'رفع الوركين للأعلى أثناء العودة',
        'الدحرجة أبعد مما تستطيع التحكم فيه',
      ],
    },
  },
  {
    id: 'g-declinesitup',
    style: 'gym',
    area: 'core',
    name: { en: 'Decline bench sit-up', ar: 'تمرين البطن على المقعد المائل' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Hook the feet under the pads and set a moderate decline',
        'Curl up one vertebra at a time',
        'Lower slowly, keep the chin tucked',
      ],
      ar: [
        'ثبّت القدمين تحت الوسادتين واضبط ميلًا متوسطًا',
        'اصعد بثني الظهر فقرة فقرة',
        'انزل ببطء والذقن للداخل',
      ],
    },
    avoid: {
      en: [
        'Yanking the head with the hands',
        'Arching the lower back at the bottom',
        'Dropping down fast between reps',
      ],
      ar: ['شدّ الرأس باليدين', 'تقويس أسفل الظهر في الأسفل', 'السقوط بسرعة بين التكرارات'],
    },
  },
  {
    id: 'g-russian',
    style: 'gym',
    area: 'core',
    name: { en: 'Russian twist with weight plate', ar: 'التواء روسي بقرص الوزن' },
    sets: 3,
    work: { en: '12 each side', ar: '12 لكل جانب' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Sit back with a straight spine, feet light or lifted',
        'Turn the ribs and let the plate follow',
        'Pause briefly at each side',
      ],
      ar: [
        'اجلس مائلًا للخلف وعمودك الفقري مستقيم والقدمان خفيفتان أو مرفوعتان',
        'لُفّ القفص الصدري ودع القرص يتبعه',
        'توقف لحظة عند كل جانب',
      ],
    },
    avoid: {
      en: ['Rounding the back', 'Swinging only the arms side to side', 'Rushing the reps'],
      ar: ['تدوير الظهر', 'تحريك الذراعين فقط يمينًا ويسارًا', 'التسرع في التكرارات'],
    },
  },
  {
    id: 'g-plank',
    style: 'gym',
    area: 'core',
    name: { en: 'Forearm plank', ar: 'بلانك على الساعدين' },
    sets: 3,
    work: { en: '30–45 s', ar: '30–45 ثانية' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Elbows under the shoulders',
        'Squeeze the glutes and tuck the pelvis',
        'Breathe steadily, one straight line from head to heels',
      ],
      ar: [
        'المرفقان تحت الكتفين',
        'اضغط الأرداف وأمِل الحوض للداخل',
        'تنفّس بانتظام وحافظ على خط مستقيم من الرأس إلى الكعبين',
      ],
    },
    avoid: {
      en: ['Hips sagging', 'Hips piking up', 'Holding your breath'],
      ar: ['تدلّي الوركين', 'رفع الوركين للأعلى', 'حبس النفس'],
    },
  },
  // Upper
  {
    id: 'g-chestpress',
    style: 'gym',
    area: 'upper',
    name: { en: 'Chest press machine', ar: 'جهاز ضغط الصدر (Chest press)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Set the seat so the handles sit at mid-chest',
        'Shoulder blades back and down against the pad',
        'Press out without locking the elbows, return slowly',
      ],
      ar: [
        'اضبط المقعد بحيث تكون المقابض عند منتصف الصدر',
        'لوحا الكتفين للخلف والأسفل على المسند',
        'ادفع للأمام دون قفل المرفقين وعُد ببطء',
      ],
    },
    avoid: {
      en: [
        'Shoulders rolling forward off the pad',
        'Locking the elbows hard at the end',
        'Letting the stack slam',
      ],
      ar: ['انحراف الكتفين للأمام عن المسند', 'قفل المرفقين بقوة في النهاية', 'ترك الأوزان تصطدم'],
    },
  },
  {
    id: 'g-dbbench',
    style: 'gym',
    area: 'upper',
    name: { en: 'Dumbbell bench press', ar: 'ضغط الصدر بالدمبل على البنش' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Feet flat, shoulder blades pinched into the bench',
        'Lower the dumbbells to chest level, elbows about 45°',
        'Press up and slightly in',
      ],
      ar: [
        'القدمان مستويتان ولوحا الكتفين مضغوطان في البنش',
        'أنزل الدمبل إلى مستوى الصدر والمرفقان بزاوية نحو 45°',
        'ادفع للأعلى وللداخل قليلًا',
      ],
    },
    avoid: {
      en: [
        'Elbows flared straight out',
        'Bouncing the dumbbells off the chest',
        'Arching the lower back off the bench',
      ],
      ar: [
        'فتح المرفقين بشكل مستقيم للخارج',
        'ارتداد الدمبل عن الصدر',
        'تقويس أسفل الظهر ورفعه عن البنش',
      ],
    },
  },
  {
    id: 'g-inclinepress',
    style: 'gym',
    area: 'upper',
    name: { en: 'Incline dumbbell press', ar: 'ضغط الصدر بالدمبل على بنش مائل' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Bench at about 30°',
        'Dumbbells over the upper chest, elbows under the wrists',
        'Lower under control until the elbows pass the bench',
      ],
      ar: [
        'البنش بزاوية نحو 30°',
        'الدمبل فوق أعلى الصدر والمرفقان تحت المعصمين',
        'أنزل بتحكم حتى يتجاوز المرفقان مستوى البنش',
      ],
    },
    avoid: {
      en: [
        'Setting the bench too steep (shoulders take over)',
        'Dumbbells clanking together at the top',
        'Lower back arching off the bench',
      ],
      ar: [
        'رفع ميل البنش كثيرًا (يتولى الكتفان الحمل)',
        'ارتطام الدمبلين معًا في الأعلى',
        'تقويس أسفل الظهر ورفعه عن البنش',
      ],
    },
  },
  {
    id: 'g-assistedpullup',
    style: 'gym',
    area: 'upper',
    name: { en: 'Assisted pull-up machine', ar: 'العقلة بجهاز المساعدة' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Knees on the pad, pick an assist that gives you 8 clean reps',
        'Pull the chest to the bar, elbows down to the ribs',
        'Lower all the way until the arms are straight',
      ],
      ar: [
        'الركبتان على الوسادة واختر مساعدة تمنحك 8 تكرارات نظيفة',
        'اسحب الصدر نحو البار والمرفقان نحو الضلوع',
        'انزل حتى تستقيم الذراعان تمامًا',
      ],
    },
    avoid: {
      en: ['Half reps at the bottom', 'Shrugging the shoulders up', 'Kicking or swinging the legs'],
      ar: ['تكرارات نصفية في الأسفل', 'رفع الكتفين للأعلى', 'ركل الساقين أو أرجحتهما'],
    },
  },
  {
    id: 'g-lateral',
    style: 'gym',
    area: 'upper',
    name: { en: 'Dumbbell lateral raise', ar: 'رفع جانبي بالدمبل' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Slight bend in the elbows, lead with them',
        'Raise to shoulder height, no higher',
        'Lower slowly over 2 seconds',
      ],
      ar: [
        'ثني خفيف للمرفقين والحركة تبدأ منهما',
        'ارفع حتى مستوى الكتفين لا أعلى',
        'أنزل ببطء خلال ثانيتين',
      ],
    },
    avoid: {
      en: [
        'Swinging the dumbbells up with the body',
        'Shrugging the shoulders to the ears',
        'Going too heavy',
      ],
      ar: ['أرجحة الدمبل للأعلى بالجسم', 'رفع الكتفين نحو الأذنين', 'استخدام وزن ثقيل جدًا'],
    },
  },
  {
    id: 'g-facepull',
    style: 'gym',
    area: 'upper',
    name: { en: 'Face pull', ar: 'السحب نحو الوجه بالكابل (Face pull)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Rope at face height, thumbs toward you',
        'Pull to the face with the elbows high and wide',
        'Squeeze the rear shoulders, release slowly',
      ],
      ar: [
        'الحبل عند مستوى الوجه والإبهامان نحوك',
        'اسحب نحو الوجه والمرفقان عاليان ومتباعدان',
        'اضغط خلفية الكتفين وأرخِ ببطء',
      ],
    },
    avoid: {
      en: [
        'Leaning back to move the weight',
        'Elbows dropping below the shoulders',
        'Shrugging the shoulders to the ears',
      ],
      ar: [
        'الميل للخلف لتحريك الوزن',
        'نزول المرفقين تحت مستوى الكتفين',
        'رفع الكتفين نحو الأذنين',
      ],
    },
  },
  {
    id: 'g-pushdown',
    style: 'gym',
    area: 'upper',
    name: { en: 'Tricep rope pushdown', ar: 'دفع الحبل للأسفل لعضلة الترايسبس' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Elbows pinned to your sides',
        'Push down and split the rope at the bottom',
        'Return slowly without letting the elbows rise',
      ],
      ar: [
        'المرفقان ملتصقان بجانبيك',
        'ادفع للأسفل وافصل طرفي الحبل في النهاية',
        'عُد ببطء دون أن يرتفع المرفقان',
      ],
    },
    avoid: {
      en: [
        'Elbows flaring forward',
        'Leaning over the cable to push with bodyweight',
        'Rounding the shoulders forward',
      ],
      ar: ['تحرك المرفقين للأمام', 'الميل فوق الكابل للدفع بوزن الجسم', 'تدوير الكتفين للأمام'],
    },
  },
  {
    id: 'g-curl',
    style: 'gym',
    area: 'upper',
    name: { en: 'Dumbbell bicep curl', ar: 'ثني الذراعين بالدمبل (Bicep curl)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Stand tall, elbows close to the body',
        'Curl up, turning the palms up as you lift',
        'Lower slowly until the arms are straight',
      ],
      ar: [
        'قِف مستقيمًا والمرفقان قريبان من الجسم',
        'اثنِ للأعلى مع لفّ راحتي اليدين للأعلى أثناء الرفع',
        'أنزل ببطء حتى تستقيم الذراعان',
      ],
    },
    avoid: {
      en: [
        'Swinging the torso to lift the weight',
        'Elbows drifting forward',
        'Half reps at the bottom',
      ],
      ar: ['أرجحة الجذع لرفع الوزن', 'انحراف المرفقين للأمام', 'تكرارات نصفية في الأسفل'],
    },
  },
  // Cardio
  {
    id: 'g-stairs',
    style: 'gym',
    area: 'cardio',
    name: { en: 'Stair climber', ar: 'جهاز صعود الدرج' },
    sets: 1,
    work: { en: '15 min at a steady pace', ar: '15 دقيقة بوتيرة ثابتة' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Stand tall with a light touch on the rails',
        'Whole foot on each step, push through the heel',
        'Pick a speed you can hold for the whole time',
      ],
      ar: [
        'قِف مستقيمًا مع لمسة خفيفة على المقابض',
        'القدم كاملة على كل درجة وادفع بالكعب',
        'اختر سرعة تستطيع الحفاظ عليها طوال المدة',
      ],
    },
    avoid: {
      en: [
        'Leaning on the rails with locked arms',
        'Hunching forward over the console',
        'Toes only on the edge of the steps',
      ],
      ar: [
        'الاتكاء على المقابض بذراعين مقفلتين',
        'الانحناء للأمام فوق الشاشة',
        'وضع أصابع القدمين فقط على حافة الدرجات',
      ],
    },
  },
  {
    id: 'g-bike',
    style: 'gym',
    area: 'cardio',
    name: { en: 'Stationary bike intervals', ar: 'فترات على الدراجة الثابتة' },
    sets: 1,
    work: {
      en: '10 rounds: 30 s hard, 60 s easy',
      ar: '10 جولات: 30 ثانية بجهد عالٍ و60 ثانية سهلة',
    },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Seat height: a slight knee bend at the bottom of the pedal stroke',
        'Add resistance for the hard 30 seconds, not just speed',
        'Warm up 3 minutes easy first',
      ],
      ar: [
        'ارتفاع المقعد: ثني خفيف للركبة عند أدنى نقطة للدواسة',
        'زِد المقاومة في الثواني الصعبة لا السرعة فقط',
        'أحمِ لمدة 3 دقائق بسهولة أولًا',
      ],
    },
    avoid: {
      en: [
        'Seat too low (knees stay bent)',
        'Bouncing in the saddle at high cadence',
        'Gripping the bars with locked elbows',
      ],
      ar: [
        'مقعد منخفض جدًا (تبقى الركبتان مثنيتين)',
        'الارتداد على المقعد عند السرعة العالية',
        'قبض المقود بمرفقين مقفلين',
      ],
    },
  },
]
