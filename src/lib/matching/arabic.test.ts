import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema } from '@/types/recipe'
import {
  arabicAliasEntries,
  buildArabicAliasIndex,
  foldArabic,
  hasArabic,
  normalizeArabicIngredient,
} from './arabic'
import { isCanonicalName } from './canonical'
import { ARABIC_ALIASES } from './config/arabic-aliases'
import { normalizeEnglishIngredient } from './english'

describe('hasArabic', () => {
  it.each([
    ['طماطم', true],
    ['2 كوب أرز', true],
    ['٣', true],
    ['۳', true],
    ['ﻻ', true],
    ['ݐ', true],
    ['tomato', false],
    ['', false],
    ['\uFEFF', false],
    ['crème fraîche', false],
  ])('%j → %s', (text, expected) => {
    expect(hasArabic(text)).toBe(expected)
  })
})

describe('foldArabic', () => {
  it.each([
    ['hamza alefs', 'أرز إبريق آيس', 'ارز ابريق ايس'],
    ['hamza on waw and yeh', 'رؤوس مائدة', 'رووس مايده'],
    ['taa marbuta', 'فرخة', 'فرخه'],
    ['alef maqsura', 'كمثرى', 'كمثري'],
    ['tashkeel and shadda', 'بَصَلٌ مُقَطَّعٌ', 'بصل مقطع'],
    ['superscript alef', 'هٰذا', 'هذا'],
    ['tatweel', 'طمــاطـــم', 'طماطم'],
    ['Arabic-Indic digits', '٠١٢٣٤٥٦٧٨٩', '0123456789'],
    ['Persian digits', '۰۱۲۳۴۵۶۷۸۹', '0123456789'],
    ['Arabic comma, semicolon, question mark', 'بصل، ثوم؛ ملح؟', 'بصل, ثوم; ملح?'],
    ['Arabic decimal separator', '١٫٥ كيلو', '1.5 كيلو'],
    ['presentation forms', 'ﻃﻤﺎﻃﻢ', 'طماطم'],
    ['lam-alef ligature', 'ﻻ', 'لا'],
    ['loanword letters veh, peh, tcheh, gaf', 'ڤانيليا پاستا چبنة گاتو', 'فانيليا باستا جبنه جاتو'],
    ['hamza after a word-final alef', 'فاصولياء ماء، بازلاء', 'فاصوليا ما, بازلا'],
    ['hamza after alef inside a word kept', 'قراءة', 'قراءه'],
    ['Persian yeh and keheh', 'کیلو', 'كيلو'],
    ['direction marks', '\u200Fبصل\u200E', 'بصل'],
    ['whitespace', '  بصل \t\n  أحمر  ', 'بصل احمر'],
    ['Latin accents, case kept', 'Crème Fraîche', 'Creme Fraiche'],
  ])('%s', (_label, input, expected) => {
    expect(foldArabic(input)).toBe(expected)
  })

  it('is idempotent', () => {
    const once = foldArabic('  الْبَصَلُ الأَخْضَرُ، ٣ حبّات ')
    expect(foldArabic(once)).toBe(once)
  })
})

describe('normalizeArabicIngredient', () => {
  it.each([
    // Everyday names
    ['طماطم', 'tomato'],
    ['بصل', 'onion'],
    ['ثوم', 'garlic'],
    ['جزر', 'carrot'],
    ['خيار', 'cucumber'],
    ['ليمون', 'lemon'],
    ['ليمون أخضر', 'lime'],
    ['ملح', 'salt'],
    ['ماء', 'water'],
    ['مية', 'water'],
    ['زيت زيتون', 'olive oil'],
    ['زيت', 'oil'],
    ['سكر بودرة', 'powdered sugar'],
    ['طحينة', 'tahini'],
    ['ملوخية', 'molokhia'],
    ['ورق عنب', 'vine leaf'],
    ['حمص', 'chickpea'],
    ['حمص بطحينة', 'hummus'],
    ['فول', 'fava bean'],
    ['فول سوداني', 'peanut'],
    ['عسل', 'honey'],
    ['عسل أسود', 'molasses'],
    ['جوز هند', 'coconut'],
    ['لبن جوز الهند', 'coconut milk'],
    ['جوزة الطيب', 'nutmeg'],
    ['راس الحانوت', 'ras el hanout'],
    ['جرام ماسالا', 'garam masala'],
    // Literally "seven spices", the name English gives the same blend (a FAMILIES child of baharat).
    ['سبع بهارات', 'seven spice'],
    ['بهارات مشكلة', 'baharat'],
    ['بهارات كبسة', 'kabsa spice'],
    ['بهارات الكبسة', 'kabsa spice'],
    ['حبة البركة', 'nigella seed'],
    ['فلفل', 'black pepper'],
    ['فلفل أسود', 'black pepper'],
    ['فلفل رومي', 'bell pepper'],
    ['فلفل أحمر', 'bell pepper'],
    ['فلفل حار', 'chili'],
    ['فلفل أحمر حار', 'chili powder'],
    ['فلفل أحمر حلو', 'paprika'],
    ['بابريكا مدخنة', 'smoked paprika'],
    ['كزبرة', 'coriander'],
    ['كسبرة ناشفة', 'ground coriander'],
    ['زنجبيل', 'ginger'],
    ['زنجبيل مطحون', 'ground ginger'],
    ['زعتر', 'thyme'],
    ['خلطة زعتر', "za'atar"],
    ['لبن', 'milk'],
    ['زبادي', 'yogurt'],
    ['زبادي يوناني', 'greek yogurt'],
    ['جبنة', 'cheese'],
    ['جبنة شيدر', 'cheddar'],
    ['جبنة بيضاء', 'feta'],
    ['جبنة قريش', 'cottage cheese'],
    ['صلصة', 'tomato paste'],
    ['صلصة الصويا', 'soy sauce'],
    ['صدور فراخ', 'chicken breast'],
    ['أوراك دجاج', 'chicken thigh'],
    ['كبدة فراخ', 'chicken liver'],
    ['لحم ضاني مفروم', 'ground lamb'],
    ['رز بسمتي', 'basmati rice'],
    ['عدس أصفر', 'red lentil'],
    ['شعرية', 'vermicelli'],
    ['مكرونة اسباجتي', 'spaghetti'],
    ['عيش بلدي', 'pita'],
    ['عيش', 'bread'],
    ['عيش الغراب', 'mushroom'],
    ['دقيق ذرة', 'cornmeal'],
    ['نشا', 'cornstarch'],
    ['بيكنج بودر', 'baking powder'],
    ['عين جمل', 'walnut'],
    ['رنجة', 'herring'],
    ['قهوة', 'coffee'],
    ['بن', 'coffee'],
    ['ثلج', 'ice'],
    ['مكعبات ثلج', 'ice'],
    ['رز بني', 'brown rice'],
    ['أرز أسمر', 'brown rice'],
    ['لازانيا', 'lasagna sheet'],
    ['ورق لازانيا', 'lasagna sheet'],
    ['هريسة حارة', 'harissa'],
    ['عيش شمسي', 'bread'],
    ['بلح عجوة', 'date'],
    ['سباجتي', 'spaghetti'],
    ['مكرونة سباجتي', 'spaghetti'],
    ['معكرونة سباغيتي', 'spaghetti'],
    ['عدس', 'lentil'],
    ['عدس بجبة', 'brown lentil'],
    ['عدس أبو جبة', 'brown lentil'],
    ['عدس بني', 'brown lentil'],
    ['عدس أخضر', 'green lentil'],
    ['بتلو', 'veal'],
    ['لحم بتلو', 'veal'],
    ['لحمة بتلو', 'veal'],
    ['بلطي', 'tilapia'],
    ['سمك بلطي فيليه', 'tilapia'],
    ['فيليه بلطي', 'tilapia'],
    ['هوت دوج', 'hot dog'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['طماطم', 'بندورة', 'tomato'],
    ['طماطم', 'قوطة', 'tomato'],
    ['بطاطس', 'بطاطا', 'potato'],
    ['فراخ', 'دجاج', 'chicken'],
    ['باذنجان', 'بتنجان', 'eggplant'],
    ['كوسة', 'كوسا', 'zucchini'],
    ['قرنبيط', 'قرنابيط', 'cauliflower'],
    ['بسلة', 'بازلاء', 'pea'],
    ['كرنب', 'ملفوف', 'cabbage'],
    ['جمبري', 'روبيان', 'shrimp'],
    ['جمبري', 'قريدس', 'shrimp'],
    ['دقيق', 'طحين', 'flour'],
    ['لبن', 'حليب', 'milk'],
    ['أرز', 'رز', 'rice'],
    ['خبز', 'عيش', 'bread'],
    ['مكرونة', 'معكرونة', 'pasta'],
    ['حبهان', 'هيل', 'cardamom'],
    ['برغل', 'بلغور', 'bulgur'],
    ['كسكسي', 'كسكس', 'couscous'],
    ['بنجر', 'شمندر', 'beet'],
    ['عين جمل', 'جوز', 'walnut'],
    ['فول سوداني', 'فستق عبيد', 'peanut'],
    // Egyptians write ث as ت, as in تلاتة for ثلاثة.
    ['توم', 'ثوم', 'garlic'],
    ['تومة', 'ثومة', 'garlic'],
    ['فص توم', 'فص ثوم', 'garlic'],
    ['٤ فصوص توم', '٤ فصوص ثوم', 'garlic'],
    ['راس توم', 'رأس ثوم', 'garlic'],
    ['توم معمر', 'ثوم معمر', 'chive'],
    ['بازلا', 'بازلاء', 'pea'],
    ['كستنا', 'كستناء', 'chestnut'],
    ['مية ورد', 'ماء ورد', 'rose water'],
  ])('%s and %s are both %s', (egyptian, other, expected) => {
    expect(normalizeArabicIngredient(egyptian)).toBe(expected)
    expect(normalizeArabicIngredient(other)).toBe(expected)
  })

  it.each([
    ['٣ فصوص ثوم', 'garlic'],
    ['فص ثوم', 'garlic'],
    ['2 كوب أرز', 'rice'],
    ['كوبين دقيق', 'flour'],
    ['نص كيلو طماطم', 'tomato'],
    ['كيلو ونص بطاطس', 'potato'],
    ['ملعقة كبيرة زيت زيتون', 'olive oil'],
    ['ملعقة صغيرة ملح', 'salt'],
    ['م.ك سكر', 'sugar'],
    ['م ص كمون', 'cumin'],
    ['معلقتين سكر', 'sugar'],
    ['رشة فلفل أسود', 'black pepper'],
    ['٥٠٠ جرام لحمة مفرومة', 'ground beef'],
    ['200جم جبنة موتزاريلا', 'mozzarella'],
    ['١/٢ كوب لبن', 'milk'],
    ['½ كوب زبادي', 'yogurt'],
    ['١٫٥ كيلو فراخ', 'chicken'],
    ['2-3 حبات طماطم', 'tomato'],
    ['علبة تونة', 'tuna'],
    ['ربطة بقدونس', 'parsley'],
    ['حزمة كزبرة خضراء', 'coriander'],
    ['شوية ملح', 'salt'],
    ['قليل من الملح', 'salt'],
    ['كوب من الأرز', 'rice'],
    ['مية جرام دقيق', 'flour'],
    ['عود قرفة', 'cinnamon'],
    ['٣ ورقات لورا', 'bay leaf'],
    ['١ ملعقة حبة البركة', 'nigella seed'],
    ['رغيف عيش بلدي', 'pita'],
    ['بيض ٦ حبات', 'egg'],
    ['طماطم ٢ كيلو', 'tomato'],
    ['مكعب مرقة', 'stock'],
    ['مكعب مرقة فراخ', 'chicken stock'],
  ])('strips quantities and units: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['٢ أو ٣ فصوص ثوم', 'garlic'],
    ['2 او 3 بصلات', 'onion'],
    ['2 إلى 3 حبات طماطم', 'tomato'],
    ['٣ إلى ٤ أكواب مية', 'water'],
    ['حبة أو حبتين بطاطس', 'potato'],
    ['ملعقة أو ملعقتين سكر', 'sugar'],
  ])('reads a quantity range joined by أو / إلى: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['خمسمية جرام لحمة', 'beef'],
    ['خمسمائة جرام لحم مفروم', 'ground beef'],
    ['ربعمية جرام زبدة', 'butter'],
    ['تلتمية جرام جبنة', 'cheese'],
    ['خمسين جرام زبدة', 'butter'],
    ['عشرين جرام خميرة', 'yeast'],
    ['ثلاثون جرام سكر', 'sugar'],
    ['مية وخمسين جرام سكر', 'sugar'],
    ['اتناشر بيضة', 'egg'],
    ['عدد ٣ حبات طماطم', 'tomato'],
    ['عدد 2 بصل', 'onion'],
    ['كمية من الزيت للقلي', 'oil'],
    ['كمية قليلة من الملح', 'salt'],
  ])('reads tens, hundreds, عدد and كمية as quantities: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['كوبايتين رز', 'rice'],
    ['كبايتين لبن', 'milk'],
    ['كرتونة بيض', 'egg'],
    ['طبق بيض', 'egg'],
    ['دستة بيض', 'egg'],
    ['قالب زبدة', 'butter'],
    ['حتة جبنة رومي', 'roumi'],
    ['إزازة زيت', 'oil'],
    ['شكارة رز', 'rice'],
    ['باكتة زبدة', 'butter'],
    ['عبوة لبن', 'milk'],
  ])('strips Egyptian count and container units: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['الطماطم', 'tomato'],
    ['البصل الأخضر', 'green onion'],
    ['الليمون', 'lemon'],
    ['اللحمة المفرومة', 'ground beef'],
    ['زيت الزيتون', 'olive oil'],
    ['الجوزة الطيب', 'nutmeg'],
    ['صفار البيض', 'egg yolk'],
  ])('removes the definite article: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['بصل مفروم', 'onion'],
    ['لحمة مفرومة', 'ground beef'],
    ['لحم مفروم', 'ground beef'],
    ['مفروم', 'ground beef'],
    ['فراخ مفرومة', 'ground chicken'],
    ['فراخ مقطعة', 'chicken'],
    ['طماطم مقشرة ومفرومة', 'tomato'],
    ['بقدونس طازج مفروم ناعم', 'parsley'],
    ['جبنة شيدر مبشورة', 'cheddar'],
    ['جزر مبشور', 'carrot'],
    ['بطاطس مكعبات', 'potato'],
    ['بصل كبير', 'onion'],
    ['بصلة صغيرة', 'onion'],
    ['بصل أحمر مفروم', 'red onion'],
    ['فلفل أسود مطحون', 'black pepper'],
    ['كزبرة مطحونة', 'ground coriander'],
    ['قرفة مطحونة', 'cinnamon'],
    ['ملح حسب الرغبة', 'salt'],
    ['بقدونس للتزيين', 'parsley'],
    ['زيت للقلي', 'oil'],
    ['زبدة غير مملحة', 'butter'],
    ['لبن كامل الدسم', 'milk'],
    ['فراخ منزوعة الجلد', 'chicken'],
    ['زبدة أو سمنة', 'butter'],
    ['تفاح أحمر', 'apple'],
    ['فاصوليا حمراء معلبة', 'kidney bean'],
    ['زيت زيتون بكر ممتاز', 'olive oil'],
    ['جبنة بيضاء قليلة الملح', 'feta'],
    ['حبة البركة مطحونة', 'nigella seed'],
    ['بسلة مجمدة', 'pea'],
    ['طماطم (مقشرة)', 'tomato'],
    ['بصل، مقطع شرائح', 'onion'],
    ['ثوم اختياري', 'garlic'],
    ['بصل المفروم', 'onion'],
    ['لحمة ٢ كيلو مفرومة', 'ground beef'],
    ['٢ قرن فلفل مفروم', 'bell pepper'],
    ['جبنة مبشورة شيدر', 'cheddar'],
    ['طماطم مفرومة 2 كوب', 'tomato'],
  ])('strips descriptors unless they are part of a name: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['شيكولاتة بيضا', 'white chocolate'],
    ['شوكولا بيضاء', 'white chocolate'],
    ['شوكولاتة سودا', 'dark chocolate'],
    ['شيكولاتة سوداء', 'dark chocolate'],
    ['جبن أبيض', 'feta'],
    ['الجبن الأبيض', 'feta'],
    ['جبنة صفراء', 'cheese'],
    ['بصلة حمرا', 'red onion'],
    ['فاصولياء حمراء', 'kidney bean'],
    ['فاصولياء بيضاء', 'white bean'],
    ['فاصولياء', 'green bean'],
    ['ليمون أسود', 'dried lime'],
    ['عنب أحمر', 'grape'],
    ['فلفل أحمر مجفف', 'bell pepper'],
    // A colour only stays bound right after the head it changes (صلصة, لحم…).
    ['صوص صويا أسود', 'soy sauce'],
    ['صلصة طماطم حمراء', 'tomato paste'],
    ['لحم فراخ أبيض', 'chicken'],
  ])('reads every spelling of a colour alike: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['حليب جاف', 'milk powder'],
    ['لبن جاف', 'milk powder'],
    ['حليب ناشف', 'milk powder'],
    ['لبن ناشف', 'milk powder'],
    ['حليب مجفف', 'milk powder'],
    ['طماطم مجففة بالشمس', 'sun-dried tomato'],
    ['ليمون مجفف', 'dried lime'],
    ['لومي', 'dried lime'],
    // Generic "dried" still drops, mirroring English "dried tomatoes" → tomato.
    ['طماطم مجففة', 'tomato'],
  ])('keeps dried products that are sold as their own item: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['ڤانيليا', 'vanilla'],
    ['پاستا', 'pasta'],
    ['چبنة', 'cheese'],
    ['ڤيليه', 'white fish'],
  ])('reads loanword letters: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['بيضة', 'egg'],
    ['بيضتين', 'egg'],
    ['٣ بيضات', 'egg'],
    ['بصلتين', 'onion'],
    ['طماطماية', 'tomato'],
    ['خياراية', 'cucumber'],
    ['بتنجاناية', 'eggplant'],
    ['جزرات', 'carrot'],
    ['ليمونتين', 'lemon'],
    ['فرختين', 'chicken'],
    ['صدر فرخة', 'chicken breast'],
    ['خسة', 'lettuce'],
  ])('handles singular, dual and plural forms: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['tashkeel', 'بَصَلٌ', 'onion'],
    ['tatweel', 'ثـــوم', 'garlic'],
    ['hamza-less alef', 'ارز', 'rice'],
    ['ه for ة', 'كوسه', 'zucchini'],
    ['ي for ى', 'كمثري', 'pear'],
    ['alef maqsura kept', 'كمثرى', 'pear'],
    ['presentation forms', 'ﺛﻮﻡ', 'garlic'],
  ])('tolerates spelling variation (%s): %s → %s', (_label, input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['جبنة mozzarella', 'cheese'],
    ['2 cups أرز', 'rice'],
    ['500g لحمة مفرومة', 'ground beef'],
    ['طماطم (tomato)', 'tomato'],
    ['TBSP زيت زيتون', 'olive oil'],
  ])('handles mixed Latin text: %s → %s', (input, expected) => {
    expect(normalizeArabicIngredient(input)).toBe(expected)
  })

  it.each([
    ['unknown word', 'كمبيوتر'],
    ['unknown phrase', 'سيارة حمراء'],
    ['only a quantity', '٣'],
    ['only units', 'كوب ملعقة'],
    ['only descriptors', 'طازج ناعم'],
    ['empty', ''],
    ['whitespace', '   '],
    ['tatweel only', 'ـــ'],
    ['Latin only', 'tomato'],
    ['digits only', '200'],
    ['punctuation only', '،؛؟'],
    // A colour names another product after these heads; guessing the head would be wrong.
    ['white sauce (béchamel), not tomato paste', 'صلصة بيضاء'],
    ['white sauce with articles', 'الصلصة البيضاء'],
    ['white sauce after a spoon size', 'ملعقة كبيرة صلصة بيضاء'],
    ['white sauce after a range', '2 او 3 ملاعق صلصة بيضاء'],
    ['green sauce', 'صلصة خضراء'],
    ['white sauce (صوص)', 'صوص أبيض'],
    ['white meat (poultry), not beef', 'لحم أبيض'],
    ['red lemon', 'ليمون أحمر'],
    ['Thai green curry paste, not curry powder', 'كاري أخضر'],
    // Egyptian هريسة is a semolina dessert; only the explicit chili-paste names are harissa.
    ['bare هريسة', 'هريسة'],
  ])('returns null for %s', (_label, input) => {
    expect(normalizeArabicIngredient(input)).toBeNull()
  })
})

describe('Arabic and English name the same ingredient alike', () => {
  it.each([
    ['عدس بجبة', 'Brown Lentils'],
    ['عدس أخضر', 'green lentils'],
    ['لحم بتلو', 'veal'],
    ['سمك بلطي فيليه', 'tilapia fillets'],
    ['هوت دوج', 'hot dogs'],
    ['سبع بهارات', 'Lebanese seven spice'],
    ['طماطم مجففة بالشمس', 'sun-dried tomatoes'],
    ['ليمون مجفف', 'dried limes'],
    ['ليمون أسود', 'black limes'],
    ['لومي', 'loomi'],
    ['حليب جاف', 'milk powder'],
    ['رنجة', 'herring'],
    ['بهارات كبسة', 'Kabse Spice'],
    ['قهوة', 'coffee'],
    ['ثلج', 'ice cubes'],
    ['رز بني', 'brown rice'],
    ['لازانيا', 'lasagne sheets'],
    ['هريسة حارة', 'harissa spice'],
    ['مكرونة سباجتي', 'spaghetti'],
    ['بلح عجوة', 'medjool dates'],
    ['شيكولاتة بيضا', 'white chocolate'],
  ])('%s ≡ %s', (arabic, english) => {
    const canonical = normalizeEnglishIngredient(english)
    expect(isCanonicalName(canonical)).toBe(true)
    expect(normalizeArabicIngredient(arabic)).toBe(canonical)
  })
})

describe('Arabic alias table', () => {
  const entries = arabicAliasEntries()

  it('has at least 180 distinct folded phrases', () => {
    expect(entries.length).toBeGreaterThanOrEqual(180)
  })

  it.each(Object.keys(ARABIC_ALIASES))('target %j is a canonical name', (target) => {
    expect(target).toMatch(/^[a-z0-9][a-z0-9 '-]*$/)
    expect(CanonicalNameSchema.safeParse(target).success).toBe(true)
  })

  it('round-trips every alias through the normalizer', () => {
    const mismatches = entries.filter(
      ([phrase, canonical]) => normalizeArabicIngredient(phrase) !== canonical,
    )
    expect(mismatches).toEqual([])
  })

  it('lists folded keys only', () => {
    for (const [phrase] of entries) expect(foldArabic(phrase)).toBe(phrase)
  })

  it('returns a frozen list', () => {
    expect(Object.isFrozen(entries)).toBe(true)
    expect(arabicAliasEntries()).toBe(entries)
  })
})

describe('buildArabicAliasIndex', () => {
  it('folds keys and indexes them without the article', () => {
    const index = buildArabicAliasIndex({ 'green onion': ['البَصَل الأخضر'] })
    expect(index.exact.get('البصل الاخضر')).toBe('green onion')
    expect(index.articleFree.get('بصل اخضر')).toBe('green onion')
  })

  it('accepts the same phrase twice for the same target', () => {
    expect(() => buildArabicAliasIndex({ tomato: ['طماطم', 'طَمَاطِم'] })).not.toThrow()
  })

  it('throws when two phrases fold together but disagree', () => {
    expect(() => buildArabicAliasIndex({ tomato: ['طماطم'], potato: ['طَمَاطِم'] })).toThrow(
      /already mapped to "tomato"/,
    )
  })

  it('throws when two phrases only differ by the article but disagree', () => {
    expect(() => buildArabicAliasIndex({ onion: ['البصل'], leek: ['بصل'] })).toThrow(
      /already mapped to "onion"/,
    )
  })

  it.each([
    ['upper case', { Tomato: ['طماطم'] }],
    ['accented', { purée: ['صلصة'] }],
    ['empty', { '': ['طماطم'] }],
  ])('throws on a non-canonical target (%s)', (_label, groups) => {
    expect(() => buildArabicAliasIndex(groups)).toThrow(/not a canonical name/)
  })

  it.each([
    ['empty', ''],
    ['marks only', 'َُ'],
    ['Latin', 'tomato'],
  ])('throws on an alias without Arabic text (%s)', (_label, phrase) => {
    expect(() => buildArabicAliasIndex({ tomato: [phrase] })).toThrow(/has no Arabic text/)
  })
})
