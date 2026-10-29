import type { Exercise } from '../types'

/** Crossfit: see ../types.ts for every field's rules. */
export const CROSSFIT: readonly Exercise[] = [
  {
    id: 'x-wallball',
    style: 'crossfit',
    area: 'legs',
    name: {
      en: 'Wall ball',
      ar: 'رمي الكرة على الحائط (Wall ball)',
    },
    sets: 4,
    work: {
      en: '15 reps',
      ar: '15 تكرارًا',
    },
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
    name: {
      en: 'Box step-up',
      ar: 'الصعود على الصندوق',
    },
    sets: 3,
    work: {
      en: '10 each leg',
      ar: '10 لكل ساق',
    },
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
    name: {
      en: 'Kettlebell swing',
      ar: 'كيتلبل سوينغ',
    },
    sets: 4,
    work: {
      en: '15 reps',
      ar: '15 تكرارًا',
    },
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
    name: {
      en: 'Kettlebell deadlift',
      ar: 'الرفعة الميتة بالكيتلبل',
    },
    sets: 4,
    work: {
      en: '12 reps',
      ar: '12 تكرارًا',
    },
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
    name: {
      en: 'Sit-up',
      ar: 'تمرين الجلوس (Sit-up)',
    },
    sets: 3,
    work: {
      en: '20 reps',
      ar: '20 تكرارًا',
    },
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
    name: {
      en: 'Hanging knee raise',
      ar: 'رفع الركبتين معلّقًا',
    },
    sets: 3,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
    name: {
      en: 'Bike EMOM',
      ar: 'دراجة كل دقيقة (EMOM)',
    },
    sets: 1,
    work: {
      en: '10 min: 12 cal each minute',
      ar: '10 دقائق: 12 سعرة كل دقيقة',
    },
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
    name: {
      en: 'Jump rope',
      ar: 'نط الحبل',
    },
    sets: 5,
    work: {
      en: '50 skips',
      ar: '50 قفزة',
    },
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
    name: {
      en: 'Push press',
      ar: 'الضغط بالدفع (Push press)',
    },
    sets: 4,
    work: {
      en: '8 reps',
      ar: '8 تكرارات',
    },
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
    name: {
      en: 'Ring row',
      ar: 'التجديف بالحلقات',
    },
    sets: 3,
    work: {
      en: '10 reps',
      ar: '10 تكرارات',
    },
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
  // Legs
  {
    id: 'x-airsquat',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Air squat', ar: 'سكوات بوزن الجسم (Air squat)' },
    sets: 4,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Feet shoulder-width, toes slightly out',
        'Hips back and down until they pass below the knees',
        'Chest up, weight in the heels and mid-foot',
        'Stand all the way up and squeeze the glutes',
      ],
      ar: [
        'القدمان بعرض الكتفين وأصابع القدمين للخارج قليلًا',
        'ادفع الوركين للخلف وللأسفل حتى ينزلا تحت مستوى الركبتين',
        'الصدر مرفوع والوزن على الكعبين ومنتصف القدم',
        'قِف مستقيمًا تمامًا واضغط الأرداف',
      ],
    },
    avoid: {
      en: [
        'Knees caving inward',
        'Heels lifting off the floor',
        'Rounding the lower back at the bottom',
      ],
      ar: ['انهيار الركبتين للداخل', 'ارتفاع الكعبين عن الأرض', 'تدوير أسفل الظهر في الأسفل'],
    },
  },
  {
    id: 'x-gobletsquat',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Kettlebell goblet squat', ar: 'جوبلت سكوات بالكيتلبل' },
    sets: 4,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hold the bell by the horns at the chest',
        'Elbows track inside the knees at the bottom',
        'Drive through the whole foot to stand',
      ],
      ar: [
        'أمسك الكيتلبل من جانبَي المقبض عند الصدر',
        'المرفقان داخل الركبتين في الأسفل',
        'ادفع بقدمك كاملة لتقف',
      ],
    },
    avoid: {
      en: [
        'Letting the bell pull the chest forward',
        'Knees caving inward',
        'Cutting the squat short',
      ],
      ar: ['ترك الكيتلبل يسحب الصدر للأمام', 'انهيار الركبتين للداخل', 'عدم النزول بعمق كافٍ'],
    },
  },
  {
    id: 'x-lunge',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Walking lunge', ar: 'الطعن بالمشي (Walking lunge)' },
    sets: 3,
    work: { en: '10 each leg', ar: '10 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Long step, back knee kisses the floor',
        'Front shin vertical, torso tall',
        'Push through the front heel into the next step',
      ],
      ar: [
        'خطوة طويلة والركبة الخلفية تلامس الأرض بخفة',
        'الساق الأمامية عمودية والجذع مستقيم',
        'ادفع بالكعب الأمامي إلى الخطوة التالية',
      ],
    },
    avoid: {
      en: [
        'Slamming the back knee into the floor',
        'Front knee drifting past the toes',
        'Leaning forward from the hips',
      ],
      ar: [
        'ارتطام الركبة الخلفية بالأرض',
        'انزلاق الركبة الأمامية بعيدًا أمام أصابع القدم',
        'الميل للأمام من الوركين',
      ],
    },
  },
  {
    id: 'x-dbthruster',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Dumbbell thruster', ar: 'ثراستر بالدمبل (Thruster)' },
    sets: 4,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Dumbbells on the shoulders, elbows forward',
        'Full squat, then drive straight into the press',
        'Lock out overhead with biceps by the ears',
      ],
      ar: [
        'الدمبلان على الكتفين والمرفقان للأمام',
        'سكوات كامل ثم اندفع مباشرة إلى الضغط',
        'ثبّت الذراعين فوق الرأس بجانب الأذنين',
      ],
    },
    avoid: {
      en: [
        'Pausing between the squat and the press',
        'Pressing before the legs finish driving',
        'Heels lifting at the bottom',
      ],
      ar: [
        'التوقف بين السكوات والضغط',
        'الضغط قبل أن تكمل الساقان الدفع',
        'ارتفاع الكعبين في الأسفل',
      ],
    },
  },
  {
    id: 'x-frontsquat',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Front squat', ar: 'فرونت سكوات بالبار (Front squat)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Bar on the shoulders, elbows high',
        'Fingertips under the bar, loose grip',
        'Sit straight down, chest up, below parallel',
      ],
      ar: [
        'البار على الكتفين والمرفقان مرفوعان',
        'أطراف الأصابع تحت البار والقبضة مرخية',
        'انزل مستقيمًا والصدر مرفوع إلى ما تحت المستوى الموازي',
      ],
    },
    avoid: {
      en: [
        'Elbows dropping so the bar rolls forward',
        'Chest falling forward out of the bottom',
        'Knees caving inward',
      ],
      ar: [
        'هبوط المرفقين فينزلق البار للأمام',
        'سقوط الصدر للأمام عند الصعود من الأسفل',
        'انهيار الركبتين للداخل',
      ],
    },
  },
  {
    id: 'x-boxjump',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Box jump', ar: 'القفز على الصندوق' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Swing the arms and jump from both feet',
        'Land softly with the whole foot on the box',
        'Stand up fully on top, then step down',
      ],
      ar: [
        'أرجح ذراعيك واقفز بالقدمين معًا',
        'اهبط بهدوء وقدمك كاملة على الصندوق',
        'قِف مستقيمًا تمامًا في الأعلى ثم انزل بالخطو',
      ],
    },
    avoid: {
      en: [
        'Landing stiff with locked knees',
        'Jumping down off the box when tired',
        'A box so high you land in a deep squat',
      ],
      ar: [
        'الهبوط بركبتين مقفلتين ومتصلبتين',
        'القفز نزولًا من الصندوق عند التعب',
        'صندوق مرتفع جدًا تهبط عليه في سكوات عميق',
      ],
    },
  },
  {
    id: 'x-ohsquat',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Overhead squat', ar: 'سكوات فوق الرأس (Overhead squat)' },
    sets: 4,
    work: { en: '6 reps', ar: '6 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Wide grip, bar over the middle of the foot',
        'Push up into the bar and keep the armpits forward',
        'Sit down slowly, chest tall, with a PVC pipe first',
      ],
      ar: [
        'قبضة واسعة والبار فوق منتصف القدم',
        'ادفع البار للأعلى ووجّه الإبطين للأمام',
        'انزل ببطء والصدر مرفوع، وابدأ بأنبوب بلاستيكي',
      ],
    },
    avoid: {
      en: [
        'Bar drifting forward over the toes',
        'Elbows bending overhead',
        'Adding weight before the mobility is there',
      ],
      ar: [
        'انزلاق البار للأمام فوق أصابع القدم',
        'ثني المرفقين فوق الرأس',
        'إضافة وزن قبل امتلاك المرونة الكافية',
      ],
    },
  },
  {
    id: 'x-pistol',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Pistol squat progression', ar: 'تدرّج سكوات الرجل الواحدة (Pistol)' },
    sets: 3,
    work: { en: '6 each leg', ar: '6 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Start by squatting to a box on one leg',
        'Free leg straight out in front, arms forward',
        'Lower slowly, heel stays down',
      ],
      ar: [
        'ابدأ بالنزول على ساق واحدة إلى صندوق',
        'الساق الحرة ممدودة للأمام والذراعان للأمام',
        'انزل ببطء والكعب ثابت على الأرض',
      ],
    },
    avoid: {
      en: [
        'Knee caving inward',
        'Dropping into the bottom without control',
        'Rounding the back to reach depth',
      ],
      ar: ['انهيار الركبة للداخل', 'السقوط إلى الأسفل دون تحكم', 'تدوير الظهر للوصول إلى العمق'],
    },
  },
  {
    id: 'x-thruster',
    style: 'crossfit',
    area: 'legs',
    name: { en: 'Barbell thruster', ar: 'ثراستر بالبار (Thruster)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Front rack, elbows high',
        'Full front squat straight into a push press',
        'Breathe at the top, bar locked out over the mid-foot',
      ],
      ar: [
        'البار على الكتفين والمرفقان مرفوعان',
        'فرونت سكوات كامل يتحول مباشرة إلى ضغط بالدفع',
        'تنفّس في الأعلى والبار مثبت فوق منتصف القدم',
      ],
    },
    avoid: {
      en: [
        'Stopping the bar on the shoulders before pressing',
        'Chest dropping out of the squat',
        'Bar drifting forward overhead',
      ],
      ar: [
        'إيقاف البار على الكتفين قبل الضغط',
        'سقوط الصدر عند الصعود من السكوات',
        'انزلاق البار للأمام فوق الرأس',
      ],
    },
  },
  // Glutes
  {
    id: 'x-goodmorning',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Good morning', ar: 'غود مورنينغ بالبار (Good morning)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Light bar on the upper back, soft knees',
        'Push the hips back until the hamstrings stretch',
        'Squeeze the glutes to stand tall',
      ],
      ar: [
        'بار خفيف على أعلى الظهر والركبتان مرنتان',
        'ادفع الوركين للخلف حتى تشعر بشد في العضلات الخلفية',
        'اضغط الأرداف لتقف مستقيمًا',
      ],
    },
    avoid: {
      en: [
        'Rounding the back under load',
        'Bending the knees into a squat',
        'Going heavy before the hinge is solid',
      ],
      ar: [
        'تدوير الظهر تحت الحمل',
        'ثني الركبتين حتى تصبح سكوات',
        'زيادة الوزن قبل إتقان ثني الورك',
      ],
    },
  },
  {
    id: 'x-slrdl',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Single-leg Romanian deadlift', ar: 'الرفعة الرومانية بساق واحدة' },
    sets: 3,
    work: { en: '8 each leg', ar: '8 لكل ساق' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Dumbbell in the hand opposite the standing leg',
        'Hinge forward as the back leg rises behind you',
        'Hips square to the floor, back flat',
      ],
      ar: [
        'الدمبل في اليد المقابلة للساق الثابتة',
        'انحنِ من الورك للأمام بينما ترتفع الساق الخلفية',
        'الوركان متوازيان مع الأرض والظهر مستقيم',
      ],
    },
    avoid: {
      en: [
        'Hip opening out to the side',
        'Rounding the back to reach lower',
        'Standing knee locked straight',
      ],
      ar: ['انفتاح الورك إلى الجانب', 'تدوير الظهر للنزول أكثر', 'قفل ركبة الساق الثابتة'],
    },
  },
  {
    id: 'x-hipthrust',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Barbell hip thrust', ar: 'دفع الورك بالبار (Hip thrust)' },
    sets: 4,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Upper back on the bench, bar padded across the hips',
        'Drive through the heels until the hips lock out',
        'Chin tucked, ribs down at the top',
      ],
      ar: [
        'أعلى الظهر على المقعد والبار بوسادة فوق الوركين',
        'ادفع بالكعبين حتى ينبسط الوركان تمامًا',
        'الذقن للداخل والضلوع للأسفل في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Over-arching the lower back at the top',
        'Feet too far forward',
        'Bouncing the hips off the floor',
      ],
      ar: [
        'تقويس أسفل الظهر بشدة في الأعلى',
        'وضع القدمين بعيدًا جدًا للأمام',
        'ارتداد الوركين من الأرض',
      ],
    },
  },
  {
    id: 'x-sdhp',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Sumo deadlift high pull', ar: 'رفعة سومو مع سحب عالٍ (SDHP)' },
    sets: 4,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Wide stance, narrow grip on the kettlebell or bar',
        'Stand explosively with hips and legs, then shrug',
        'Elbows high and outside, bell to the collarbone',
      ],
      ar: [
        'وقفة واسعة وقبضة ضيقة على الكيتلبل أو البار',
        'قِف بانفجارية بالوركين والساقين ثم ارفع الكتفين',
        'المرفقان مرتفعان وللخارج والكيتلبل حتى الترقوة',
      ],
    },
    avoid: {
      en: [
        'Pulling with the arms before the hips open',
        'Rounding the back at the bottom',
        'Letting the weight crash down from the top',
      ],
      ar: [
        'السحب بالذراعين قبل انبساط الوركين',
        'تدوير الظهر في الأسفل',
        'ترك الوزن يسقط دون تحكم من الأعلى',
      ],
    },
  },
  {
    id: 'x-deadlift',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Barbell deadlift', ar: 'الرفعة الميتة بالبار' },
    sets: 4,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Bar over the middle of the foot, shins touching it',
        'Chest up, back flat, pull the slack out of the bar',
        'Push the floor away, hips and shoulders rise together',
        'Finish tall, then push the hips back to lower',
      ],
      ar: [
        'البار فوق منتصف القدم والساقان تلامسانه',
        'الصدر مرفوع والظهر مستقيم، وشدّ البار قبل الرفع',
        'ادفع الأرض بعيدًا ليرتفع الوركان والكتفان معًا',
        'قِف مستقيمًا ثم ادفع الوركين للخلف للنزول',
      ],
    },
    avoid: {
      en: [
        'Rounding the back under load',
        'Hips shooting up first',
        'Leaning back at the top',
        'Bar drifting away from the legs',
      ],
      ar: [
        'تدوير الظهر تحت الحمل',
        'ارتفاع الوركين أولًا قبل الكتفين',
        'الميل للخلف في الأعلى',
        'ابتعاد البار عن الساقين',
      ],
    },
  },
  {
    id: 'x-rdl',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Romanian deadlift', ar: 'الرفعة الرومانية بالبار' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Start standing, bar against the thighs',
        'Push the hips back, bar sliding down the legs',
        'Stop just below the knees, then drive the hips forward',
      ],
      ar: [
        'ابدأ واقفًا والبار ملاصق للفخذين',
        'ادفع الوركين للخلف والبار ينزلق على الساقين',
        'توقف تحت الركبتين بقليل ثم ادفع الوركين للأمام',
      ],
    },
    avoid: {
      en: [
        'Rounding the back as the bar lowers',
        'Bending the knees too much',
        'Bar drifting away from the legs',
      ],
      ar: [
        'تدوير الظهر أثناء نزول البار',
        'ثني الركبتين أكثر من اللازم',
        'ابتعاد البار عن الساقين',
      ],
    },
  },
  {
    id: 'x-ghdhipext',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'GHD hip extension', ar: 'مدّ الورك على جهاز (GHD)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hips just in front of the pad, feet locked in',
        'Lower with a flat back until the torso hangs',
        'Squeeze the glutes to rise to a straight line',
      ],
      ar: [
        'الوركان أمام الوسادة بقليل والقدمان مثبتتان',
        'انزل والظهر مستقيم حتى يتدلى الجذع',
        'اضغط الأرداف لترتفع إلى خط مستقيم',
      ],
    },
    avoid: {
      en: [
        'Arching past a straight line at the top',
        'Pulling up with the lower back instead of the glutes',
        'Rushing the lowering',
      ],
      ar: [
        'التقويس أبعد من الخط المستقيم في الأعلى',
        'الرفع بأسفل الظهر بدل الأرداف',
        'النزول بسرعة',
      ],
    },
  },
  {
    id: 'x-amswing',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'American kettlebell swing', ar: 'كيتلبل سوينغ أمريكي (American swing)' },
    sets: 4,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Same hinge as the Russian swing',
        'Let the hip snap carry the bell overhead',
        'Finish with the bell stacked over the shoulders',
      ],
      ar: [
        'ثني الورك نفسه كما في السوينغ العادي',
        'دع دفعة الوركين تحمل الكيتلبل فوق الرأس',
        'أنهِ والكيتلبل فوق الكتفين مباشرة',
      ],
    },
    avoid: {
      en: [
        'Lifting with the shoulders to finish overhead',
        'Arching the lower back at the top',
        'Going overhead without the shoulder mobility',
      ],
      ar: [
        'الرفع بالكتفين لإكمال الحركة فوق الرأس',
        'تقويس أسفل الظهر في الأعلى',
        'الذهاب فوق الرأس دون مرونة كافية في الكتفين',
      ],
    },
  },
  {
    id: 'x-sandbag',
    style: 'crossfit',
    area: 'glutes',
    name: { en: 'Sandbag over shoulder', ar: 'رفع كيس الرمل فوق الكتف' },
    sets: 3,
    work: { en: '6 reps', ar: '6 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Straddle the bag, hug it with the arms, hips low',
        'Stand with the legs, then lap it on the thighs',
        'Drive the hips through to throw it over one shoulder',
        'Alternate shoulders each rep',
      ],
      ar: [
        'قف فوق الكيس واحتضنه بذراعيك والوركان منخفضان',
        'قِف بالساقين ثم اسنده على الفخذين',
        'ادفع الوركين للأمام لترميه فوق كتف واحد',
        'بدّل الكتف في كل تكرار',
      ],
    },
    avoid: {
      en: [
        'Rounding the back off the floor',
        'Lifting with the arms instead of the hips',
        'Dropping the bag so it bounces into your legs',
      ],
      ar: [
        'تدوير الظهر عند الرفع من الأرض',
        'الرفع بالذراعين بدل الوركين',
        'إسقاط الكيس بحيث يرتد نحو ساقيك',
      ],
    },
  },
  // Core
  {
    id: 'x-plank',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Plank hold', ar: 'ثبات البلانك' },
    sets: 3,
    work: { en: '30 s hold', ar: '30 ث ثبات' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Elbows under the shoulders',
        'Squeeze glutes and quads, one straight line',
        'Breathe steadily',
      ],
      ar: ['المرفقان تحت الكتفين', 'اضغط الأرداف والفخذين لتكوّن خطًا مستقيمًا', 'تنفّس بانتظام'],
    },
    avoid: {
      en: ['Hips sagging', 'Hips piking up', 'Holding the breath'],
      ar: ['هبوط الوركين', 'رفع الوركين عاليًا', 'حبس النفس'],
    },
  },
  {
    id: 'x-hollowhold',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Hollow hold', ar: 'ثبات الجسم المقعّر (Hollow hold)' },
    sets: 3,
    work: { en: '20 s hold', ar: '20 ث ثبات' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lower back pressed into the floor',
        'Shoulders and legs lifted, arms by the ears',
        'Bend the knees to scale it',
      ],
      ar: [
        'أسفل الظهر مضغوط على الأرض',
        'الكتفان والساقان مرفوعان والذراعان بجانب الأذنين',
        'اثنِ الركبتين لتسهيل التمرين',
      ],
    },
    avoid: {
      en: ['Lower back lifting off the floor', 'Chin jammed into the chest', 'Holding the breath'],
      ar: ['ارتفاع أسفل الظهر عن الأرض', 'ضغط الذقن على الصدر', 'حبس النفس'],
    },
  },
  {
    id: 'x-hollowrock',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Hollow rock', ar: 'أرجحة الجسم المقعّر (Hollow rock)' },
    sets: 3,
    work: { en: '15 reps', ar: '15 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Set a tight hollow position first',
        'Rock from shoulders to hips without changing shape',
        'Small, smooth rocks',
      ],
      ar: [
        'ثبّت وضع الجسم المقعّر بإحكام أولًا',
        'تأرجح من الكتفين إلى الوركين دون تغيير الشكل',
        'أرجحة صغيرة وسلسة',
      ],
    },
    avoid: {
      en: [
        'Bending at the hips to create the rock',
        'Lower back arching off the floor',
        'Kicking the legs',
      ],
      ar: ['ثني الوركين لإحداث الأرجحة', 'تقويس أسفل الظهر بعيدًا عن الأرض', 'ركل الساقين'],
    },
  },
  {
    id: 'x-vup',
    style: 'crossfit',
    area: 'core',
    name: { en: 'V-up', ar: 'رفع الساقين والجذع معًا (V-up)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Start in a hollow position',
        'Lift legs and torso together, reach for the toes',
        'Lower slowly back to the hollow',
      ],
      ar: [
        'ابدأ من وضع الجسم المقعّر',
        'ارفع الساقين والجذع معًا ومدّ يديك نحو أصابع القدمين',
        'انزل ببطء إلى الوضع المقعّر',
      ],
    },
    avoid: {
      en: ['Yanking the neck forward', 'Dropping the legs fast', 'Bending the knees to reach'],
      ar: ['شدّ الرقبة للأمام بقوة', 'إسقاط الساقين بسرعة', 'ثني الركبتين للوصول'],
    },
  },
  {
    id: 'x-twist',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Russian twist', ar: 'الالتفاف الروسي (Russian twist)' },
    sets: 3,
    work: { en: '20 reps', ar: '20 تكرارًا' },
    restSeconds: 45,
    strength: true,
    cues: {
      en: [
        'Lean back with a straight spine, heels light on the floor',
        'Rotate the shoulders, not just the arms',
        'Hold a light plate or wall ball',
      ],
      ar: [
        'مِل للخلف والعمود الفقري مستقيم والكعبان بخفة على الأرض',
        'لفّ الكتفين وليس الذراعين فقط',
        'أمسك قرصًا خفيفًا أو كرة الحائط',
      ],
    },
    avoid: {
      en: [
        'Rounding the lower back',
        'Swinging the weight fast with the arms',
        'Holding the breath',
      ],
      ar: ['تدوير أسفل الظهر', 'أرجحة الوزن بسرعة بالذراعين', 'حبس النفس'],
    },
  },
  {
    id: 'x-ghdsitup',
    style: 'crossfit',
    area: 'core',
    name: { en: 'GHD sit-up', ar: 'تمرين الجلوس على جهاز (GHD)' },
    sets: 3,
    work: { en: '10 reps', ar: '10 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hips just behind the pad, knees slightly bent',
        'Lean back only to parallel at first',
        'Kick the legs straight to snap up and touch the pad',
      ],
      ar: [
        'الوركان خلف الوسادة بقليل والركبتان مثنيتان قليلًا',
        'مِل للخلف حتى المستوى الموازي فقط في البداية',
        'افرد الساقين بقوة لتنهض وتلمس الوسادة',
      ],
    },
    avoid: {
      en: [
        'Going to full range in your first sessions',
        'High reps before you have built up to them',
        'Rounding the back and yanking with the neck',
      ],
      ar: [
        'الذهاب إلى المدى الكامل في الجلسات الأولى',
        'تكرارات كثيرة قبل التدرج إليها',
        'تدوير الظهر وشدّ الرقبة',
      ],
    },
  },
  {
    id: 'x-k2e',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Knees to elbows', ar: 'الركبتان إلى المرفقين' },
    sets: 3,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hang from the bar with active shoulders',
        'Swing hollow to arch, then drive the knees up',
        'Touch the elbows, then push back into the hollow',
      ],
      ar: [
        'تعلّق بالعقلة والكتفان مشدودان',
        'تأرجح من المقعّر إلى المقوّس ثم ادفع الركبتين للأعلى',
        'المس المرفقين ثم ادفع للعودة إلى الوضع المقعّر',
      ],
    },
    avoid: {
      en: [
        'Big loose swing with no midline tension',
        'Kipping without shoulder strength',
        'Dropping off the bar at the end of the set',
      ],
      ar: [
        'أرجحة كبيرة ومرتخية دون شدّ الجذع',
        'الأرجحة بدون قوة كافية في الكتفين',
        'القفز نزولًا من العقلة في نهاية المجموعة',
      ],
    },
  },
  {
    id: 'x-t2b',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Toes to bar', ar: 'القدمان إلى البار (Toes to bar)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Tight hollow and arch swings, shoulders active',
        'Push down on the bar as the toes rise',
        'Lift the toes to the bar, then pull back into the hollow',
      ],
      ar: [
        'أرجحة محكمة بين المقعّر والمقوّس والكتفان مشدودان',
        'ادفع البار للأسفل بينما ترتفع القدمان',
        'ارفع القدمين إلى البار ثم ارجع إلى الوضع المقعّر',
      ],
    },
    avoid: {
      en: [
        'Piking from the hips with no swing',
        'Kipping without shoulder strength',
        'Letting the back arch hard at the bottom',
      ],
      ar: [
        'الثني من الوركين فقط دون أرجحة',
        'الأرجحة بدون قوة كافية في الكتفين',
        'السماح للظهر بالتقويس بشدة في الأسفل',
      ],
    },
  },
  {
    id: 'x-tgu',
    style: 'crossfit',
    area: 'core',
    name: { en: 'Turkish get-up', ar: 'النهوض التركي بالكيتلبل (Turkish get-up)' },
    sets: 3,
    work: { en: '3 each side', ar: '3 لكل جانب' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Press the bell up and keep your eyes on it',
        'Roll to the elbow, then the hand, then lift the hips',
        'Sweep the leg under, kneel, and stand',
        'Reverse each step slowly to come down',
      ],
      ar: [
        'ادفع الكيتلبل للأعلى وثبّت نظرك عليه',
        'تدحرج إلى المرفق ثم اليد ثم ارفع الوركين',
        'اسحب الساق تحتك، ثم اركع، ثم قِف',
        'اعكس كل خطوة ببطء للنزول',
      ],
    },
    avoid: {
      en: [
        'Arm bending under the weight',
        'Rushing through the steps',
        'Looking away from the bell',
      ],
      ar: ['ثني الذراع تحت الوزن', 'التسرّع في الخطوات', 'تحويل النظر عن الكيتلبل'],
    },
  },
  // Upper
  {
    id: 'x-pushup',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Push-up', ar: 'تمرين الضغط (Push-up)' },
    sets: 3,
    work: { en: '12 reps', ar: '12 تكرارًا' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Hands under the shoulders, body one straight line',
        'Chest to the floor, elbows at about 45°',
        'Scale with the hands on a box, not on the knees',
      ],
      ar: [
        'اليدان تحت الكتفين والجسم خط مستقيم',
        'الصدر إلى الأرض والمرفقان بزاوية نحو 45°',
        'سهّل التمرين بوضع اليدين على صندوق بدل النزول على الركبتين',
      ],
    },
    avoid: {
      en: ['Hips sagging or piking', 'Elbows flaring wide', 'Half reps'],
      ar: ['هبوط الوركين أو رفعهما', 'فتح المرفقين للخارج بشدة', 'تكرارات نصفية'],
    },
  },
  {
    id: 'x-strictpress',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Strict press', ar: 'الضغط العسكري (Strict press)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Bar on the shoulders, grip just outside them',
        'Squeeze glutes and quads, no leg drive',
        'Press straight up, head through at the top',
      ],
      ar: [
        'البار على الكتفين والقبضة خارجهما بقليل',
        'اضغط الأرداف والفخذين دون دفع بالساقين',
        'اضغط للأعلى مباشرة وأدخل الرأس تحت البار في الأعلى',
      ],
    },
    avoid: {
      en: [
        'Arching the back to get the bar up',
        'Bar drifting forward around the face',
        'Sneaking in a leg dip',
      ],
      ar: ['تقويس الظهر لرفع البار', 'انزلاق البار للأمام حول الوجه', 'ثني الساقين خفية للمساعدة'],
    },
  },
  {
    id: 'x-bench',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Bench press', ar: 'الضغط على المقعد (Bench press)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Shoulder blades pulled back and down',
        'Lower the bar to the lower chest',
        'Feet flat, and use a spotter when it gets heavy',
      ],
      ar: [
        'لوحا الكتف مسحوبان للخلف وللأسفل',
        'أنزل البار إلى أسفل الصدر',
        'القدمان على الأرض، ومع وزن ثقيل اطلب مساعدًا',
      ],
    },
    avoid: {
      en: [
        'Bouncing the bar off the chest',
        'Elbows flaring straight out',
        'Lifting the hips off the bench',
      ],
      ar: ['ارتداد البار من الصدر', 'فتح المرفقين للخارج بشدة', 'رفع الوركين عن المقعد'],
    },
  },
  {
    id: 'x-pushjerk',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Push jerk', ar: 'الدفع والهبوط تحت البار (Push jerk)' },
    sets: 4,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Dip and drive like a push press',
        'Punch under the bar into a quarter squat',
        'Catch with locked arms, then stand',
      ],
      ar: [
        'انزل قليلًا واندفع كما في الضغط بالدفع',
        'ادفع نفسك تحت البار في ربع سكوات',
        'استقبل البار بذراعين مقفلتين ثم قِف',
      ],
    },
    avoid: {
      en: [
        'Pressing the bar out instead of catching it locked',
        'Dipping forward onto the toes',
        'Going heavy before the push press is solid',
      ],
      ar: [
        'إكمال الرفع بالضغط بدل استقبال البار بذراعين مقفلتين',
        'الميل للأمام على أصابع القدمين أثناء النزول',
        'زيادة الوزن قبل إتقان الضغط بالدفع',
      ],
    },
  },
  {
    id: 'x-pullup',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Pull-up', ar: 'العقلة (Pull-up)' },
    sets: 4,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Full hang, shoulders active',
        'Pull the chin over the bar with no swing',
        'Use a band under the feet to scale',
      ],
      ar: [
        'تعلّق كاملًا والكتفان مشدودان',
        'اسحب الذقن فوق البار دون أرجحة',
        'استخدم شريط مقاومة تحت القدمين للتسهيل',
      ],
    },
    avoid: {
      en: [
        'Kicking or swinging to get up',
        'Half reps that stop below the bar',
        'Dropping off the bar at the bottom',
      ],
      ar: ['الركل أو الأرجحة للصعود', 'تكرارات نصفية تتوقف تحت البار', 'السقوط من البار في الأسفل'],
    },
  },
  {
    id: 'x-kippullup',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Kipping pull-up', ar: 'العقلة بالأرجحة (Kipping pull-up)' },
    sets: 4,
    work: { en: '8 reps', ar: '8 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Swing hollow to arch from the shoulders',
        'Push down on the bar and drive the hips up',
        'Chin over, then push away into the next swing',
      ],
      ar: [
        'تأرجح من المقعّر إلى المقوّس بالكتفين',
        'ادفع البار للأسفل وارفع الوركين للأعلى',
        'الذقن فوق البار ثم ادفع نفسك بعيدًا للأرجحة التالية',
      ],
    },
    avoid: {
      en: [
        'Kipping before you have strict pull-ups',
        'Big loose swing with bent knees',
        'Letting the shoulders go slack at the bottom',
      ],
      ar: [
        'الأرجحة قبل إتقان العقلة الثابتة',
        'أرجحة كبيرة ومرتخية بركبتين مثنيتين',
        'ارتخاء الكتفين في الأسفل',
      ],
    },
  },
  {
    id: 'x-ringdip',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Ring dip', ar: 'الغطس على الحلقات (Ring dip)' },
    sets: 3,
    work: { en: '6 reps', ar: '6 تكرارات' },
    restSeconds: 75,
    strength: true,
    cues: {
      en: [
        'Start locked out, rings turned slightly out',
        'Lower until the shoulder passes the elbow',
        'Press up and turn the rings out at the top',
        'Scale with a band or a foot on a box',
      ],
      ar: [
        'ابدأ بذراعين مقفلتين والحلقات مائلة للخارج قليلًا',
        'انزل حتى يتجاوز الكتف مستوى المرفق',
        'ادفع للأعلى ولفّ الحلقات للخارج في الأعلى',
        'سهّل التمرين بشريط مقاومة أو بوضع قدم على صندوق',
      ],
    },
    avoid: {
      en: [
        'Rings swinging wide',
        'Shrugging the shoulders to the ears',
        'Diving too deep before you are strong enough',
      ],
      ar: [
        'تباعد الحلقات للخارج بشدة',
        'رفع الكتفين نحو الأذنين',
        'النزول عميقًا جدًا قبل اكتساب القوة الكافية',
      ],
    },
  },
  {
    id: 'x-hshold',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Handstand hold', ar: 'ثبات الوقوف على اليدين' },
    sets: 3,
    work: { en: '20 s hold', ar: '20 ث ثبات' },
    restSeconds: 60,
    strength: true,
    cues: {
      en: [
        'Walk up the wall or kick up, hands shoulder-width',
        'Push the floor away, ribs in, legs together',
        'Look at the floor between the hands',
      ],
      ar: [
        'امشِ بقدميك على الحائط أو اقفز للأعلى واليدان بعرض الكتفين',
        'ادفع الأرض بعيدًا والضلوع للداخل والساقان معًا',
        'انظر إلى الأرض بين يديك',
      ],
    },
    avoid: {
      en: ['Arching the back into a banana', 'Shoulders sinking', 'Kicking up hard into the wall'],
      ar: ['تقويس الظهر على شكل موزة', 'هبوط الكتفين', 'الاندفاع بقوة نحو الحائط'],
    },
  },
  {
    id: 'x-hspu',
    style: 'crossfit',
    area: 'upper',
    name: { en: 'Handstand push-up', ar: 'الضغط واقفًا على اليدين (Handstand push-up)' },
    sets: 3,
    work: { en: '5 reps', ar: '5 تكرارات' },
    restSeconds: 90,
    strength: true,
    cues: {
      en: [
        'Hands shoulder-width, close to the wall',
        'Lower the head to a mat in a tripod',
        'Press back to lockout with the ribs in',
        'Scale with a box pike push-up',
      ],
      ar: [
        'اليدان بعرض الكتفين وقريبتان من الحائط',
        'أنزل الرأس إلى سجادة في وضع مثلث',
        'ادفع للعودة إلى القفل والضلوع للداخل',
        'سهّل التمرين بالضغط المقلوب على الصندوق',
      ],
    },
    avoid: {
      en: [
        'Dropping the head onto the floor',
        'Over-arching the lower back',
        'Kipping before the strict version is solid',
      ],
      ar: ['إسقاط الرأس على الأرض', 'تقويس أسفل الظهر بشدة', 'الأرجحة قبل إتقان النسخة الثابتة'],
    },
  },
  // Cardio
  {
    id: 'x-row',
    style: 'crossfit',
    area: 'cardio',
    name: { en: 'Rowing intervals', ar: 'فترات على جهاز التجديف' },
    sets: 1,
    work: { en: '8 rounds: 250 m hard, 1 min easy', ar: '8 جولات: 250 م بقوة، دقيقة واحدة خفيفة' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Legs, then body, then arms',
        'Return arms first, then lean forward, then bend the knees',
        'Damper around 4 to 5',
      ],
      ar: [
        'الساقان ثم الجذع ثم الذراعان',
        'أعد الذراعين أولًا ثم مِل للأمام ثم اثنِ الركبتين',
        'المقاومة بين 4 و5',
      ],
    },
    avoid: {
      en: [
        'Pulling with the arms before the legs finish',
        'Rounding the back at the catch',
        'Rushing the slide back to the catch',
      ],
      ar: [
        'السحب بالذراعين قبل أن تكمل الساقان الدفع',
        'تدوير الظهر في بداية السحب',
        'التسرّع في العودة إلى وضع البداية',
      ],
    },
  },
  {
    id: 'x-burpee',
    style: 'crossfit',
    area: 'cardio',
    name: { en: 'Burpee', ar: 'بيربي (Burpee)' },
    sets: 1,
    work: { en: '8 rounds: 20 s work, 10 s rest', ar: '8 جولات: 20 ث عمل، 10 ث راحة' },
    restSeconds: 0,
    strength: false,
    cues: {
      en: [
        'Hands down, jump the feet back, chest to the floor',
        'Jump the feet in, then jump and clap overhead',
        'Find a steady rhythm you can hold',
      ],
      ar: [
        'ضع يديك على الأرض واقفز بقدميك للخلف والصدر إلى الأرض',
        'اقفز بقدميك للأمام ثم اقفز وصفّق فوق رأسك',
        'اعثر على إيقاع ثابت تستطيع الحفاظ عليه',
      ],
    },
    avoid: {
      en: [
        'Dropping to the floor with no control',
        'Hips sagging in the push-up',
        'Starting at a sprint you cannot hold',
      ],
      ar: [
        'السقوط على الأرض دون تحكم',
        'هبوط الوركين في وضع الضغط',
        'البدء بسرعة لا تستطيع الحفاظ عليها',
      ],
    },
  },
]
