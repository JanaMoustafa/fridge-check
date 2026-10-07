import { describe, expect, it } from 'vitest'
import { ARABIC_ALIASES } from './config/arabic-aliases'
import { ingredientCategories } from './dietClassifier'
import { normalizeEnglishIngredient } from './english'
import { ancestorsOf, FAMILIES, parentOf } from './families'
import { isCanonicalName, normalizeIngredient, resolveIngredient } from './normalize'
import { scoreRecipe } from './score'
import { STAPLES, isStaple } from './staples'
import { CANONICAL_NAMES, CORE_CANONICALS, SYNONYMS } from './synonyms'

/**
 * Cross-module invariants. The English pipeline, the Arabic alias table, families, staples and
 * the diet classifier were written separately but must speak one vocabulary: a name any of them
 * produces has to mean the same thing to all the others.
 */

const unique = (names: Iterable<string>): string[] => [...new Set(names)].sort()

const ARABIC_TARGETS = Object.keys(ARABIC_ALIASES)
const ARABIC_PHRASES: ReadonlyArray<readonly [string, string]> = Object.entries(
  ARABIC_ALIASES,
).flatMap(([canonical, phrases]) => phrases.map((phrase) => [phrase, canonical] as const))

/** Every name a table hands to the rest of the engine. */
const PRODUCED_NAMES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['SYNONYMS values', unique(Object.values(SYNONYMS))],
  ['FAMILIES children', unique(Object.keys(FAMILIES))],
  ['FAMILIES parents', unique(Object.values(FAMILIES))],
  ['STAPLES', unique(STAPLES)],
  ['Arabic alias targets', unique(ARABIC_TARGETS)],
]

/** The core canonical names fixed by the shared API contract (spec spelling). */
const CONTRACT_CORE_NAMES =
  `chicken, chicken breast, chicken thigh, chicken wing, ground beef, beef,
steak, ground lamb, lamb, ground pork, pork, bacon, sausage, ham, chorizo, turkey, duck, egg,
egg yolk, egg white, tofu, salmon, tuna, cod, white fish, shrimp, mussel, squid, anchovy, sardine,
haddock, mackerel, milk, butter, cream, heavy cream, sour cream, creme fraiche, yogurt,
greek yogurt, cheese, cheddar, mozzarella, parmesan, feta, halloumi, ricotta, cream cheese,
goat cheese, gruyere, ghee, onion, red onion, shallot, green onion, garlic, tomato, cherry tomato,
tomato paste, potato, sweet potato, carrot, celery, cucumber, bell pepper, chili, jalapeno,
eggplant, zucchini, mushroom, spinach, lettuce, cabbage, cauliflower, broccoli, green bean, pea,
corn, okra, leek, pumpkin, butternut squash, beet, avocado, lemon, lime, orange, apple, banana,
molokhia, vine leaf, coriander, ground coriander, parsley, mint, dill, basil, oregano, thyme,
rosemary, bay leaf, cumin, paprika, smoked paprika, turmeric, cinnamon, cardamom, clove, nutmeg,
ginger, ground ginger, garam masala, curry powder, sumac, za'atar, allspice, saffron, chili powder,
chili flakes, black pepper, salt, sesame seed, tahini, rice, basmati rice, pasta, spaghetti,
macaroni, noodle, lentil, red lentil, chickpea, kidney bean, black bean, fava bean, bulgur,
couscous, freekeh, oats, bread, pita, breadcrumb, flour, self-raising flour, cornstarch, sugar,
brown sugar, powdered sugar, honey, olive oil, vegetable oil, oil, vinegar, soy sauce,
chicken stock, vegetable stock, beef stock, coconut milk, yeast, baking powder, water, almond,
walnut, pistachio, pine nut, peanut, raisin, date`
    .split(',')
    .map((name) => name.trim())

describe('every name the tables produce', () => {
  it.each(PRODUCED_NAMES)('%s are canonical names and fixed points', (_table, names) => {
    const broken = names.filter(
      (name) => !isCanonicalName(name) || normalizeIngredient(name) !== name,
    )
    expect(broken).toEqual([])
  })

  it.each(PRODUCED_NAMES)(
    '%s survive provider casing and padding ("Chicken Breast", "SALT ")',
    (_table, names) => {
      const titled = (name: string) => name.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
      const broken = names.filter(
        (name) =>
          normalizeIngredient(titled(name)) !== name ||
          normalizeIngredient(` ${name.toUpperCase()} `) !== name,
      )
      expect(broken).toEqual([])
    },
  )

  it('includes every core name of the shared contract', () => {
    expect(CONTRACT_CORE_NAMES.length).toBeGreaterThan(150)
    expect(CONTRACT_CORE_NAMES.filter((name) => !CANONICAL_NAMES.has(name))).toEqual([])
  })

  it('never lets a synonym key shadow a canonical name', () => {
    const shadowing = Object.entries(SYNONYMS).filter(
      ([alias, canonical]) => CANONICAL_NAMES.has(alias) && alias !== canonical,
    )
    expect(shadowing).toEqual([])
  })
})

describe('Arabic alias targets belong to the English vocabulary', () => {
  /**
   * The vocabulary is what the English side declares: names its tables produce plus its own core
   * list (CORE_CANONICALS, owned by synonyms.ts). That core list is the only allow-list, and it
   * lives with the English pipeline, so Arabic can never introduce a name English cannot produce.
   */
  const ENGLISH_VOCABULARY: ReadonlySet<string> = new Set([
    ...Object.values(SYNONYMS),
    ...Object.keys(FAMILIES),
    ...Object.values(FAMILIES),
    ...STAPLES,
    ...CORE_CANONICALS,
  ])

  it('every target is a name the English pipeline declares', () => {
    expect(ARABIC_TARGETS.filter((target) => !ENGLISH_VOCABULARY.has(target))).toEqual([])
  })

  it('every target is what English makes of its own spelling', () => {
    const broken = ARABIC_TARGETS.filter((target) => normalizeEnglishIngredient(target) !== target)
    expect(broken).toEqual([])
  })

  it('every Arabic phrase, as written in the table, resolves to its target via the public API', () => {
    const broken = ARABIC_PHRASES.filter(
      ([phrase, target]) => normalizeIngredient(phrase) !== target,
    )
    expect(broken).toEqual([])
  })

  it('every contract core name and every staple can be typed in Arabic', () => {
    const targets = new Set(ARABIC_TARGETS)
    const untypeable = unique([...CONTRACT_CORE_NAMES, ...STAPLES]).filter(
      (name) => !targets.has(name),
    )
    expect(untypeable).toEqual([])
  })
})

describe('FAMILIES graph', () => {
  it('has no self-parents', () => {
    expect(Object.entries(FAMILIES).filter(([child, parent]) => child === parent)).toEqual([])
  })

  it('has no cycles: every chain of parents ends at a root', () => {
    // Walks parentOf directly: ancestorsOf is cycle-safe by design and would hide a loop.
    const cyclic = Object.keys(FAMILIES).filter((child) => {
      const seen = new Set<string>()
      let current: string | undefined = child
      while (current !== undefined) {
        if (seen.has(current)) return true
        seen.add(current)
        current = parentOf(current)
      }
      return false
    })
    expect(cyclic).toEqual([])
  })

  it('keeps chains short enough to read (at most 3 levels)', () => {
    const deep = Object.keys(FAMILIES).filter((child) => ancestorsOf(child).length > 3)
    expect(deep).toEqual([])
  })
})

describe('STAPLES and FAMILIES', () => {
  /**
   * Upward closure: a staple stands in for its parent ("olive oil" where "oil" is asked for), so
   * a parent of a staple must be a staple too, or a recipe asking for plain "oil" would list it
   * missing while the user is assumed to hold olive oil.
   */
  it('every ancestor of a staple is a staple', () => {
    const gaps = [...STAPLES].flatMap((staple) =>
      ancestorsOf(staple)
        .filter((ancestor) => !isStaple(ancestor))
        .map((ancestor) => `${staple} → ${ancestor}`),
    )
    expect(gaps).toEqual([])
  })

  /**
   * No downward inference (contract): a specific form of a staple is not assumed on hand, because
   * it changes what you buy. These children of staples must stay off the list.
   */
  it.each(['brown sugar', 'powdered sugar', 'self-raising flour', 'ghee'])(
    '%s is a family child of a staple but not itself a staple',
    (name) => {
      expect(ancestorsOf(name).some(isStaple)).toBe(true)
      expect(isStaple(name)).toBe(false)
    },
  )
})

describe('diet categories agree with FAMILIES', () => {
  /**
   * A family child is a kind of its parent, so it carries the parent's animal-product categories:
   * a cheese is dairy, a sausage is meat. Gluten is left out on purpose (rice noodle and corn
   * tortilla are the gluten-free forms of their parents), and so is the generic "stock", which the
   * classifier conservatively treats as meat although its vegetable child is not.
   */
  const INHERITED = ['meat', 'fish', 'dairy', 'egg'] as const
  const CONSERVATIVE_PARENTS: ReadonlySet<string> = new Set(['stock'])

  it('every family child carries the animal-product categories of its parent', () => {
    const lost = Object.entries(FAMILIES)
      .filter(([, parent]) => !CONSERVATIVE_PARENTS.has(parent))
      .flatMap(([child, parent]) => {
        const own = new Set(ingredientCategories(child))
        return ingredientCategories(parent)
          .filter((category) => (INHERITED as readonly string[]).includes(category))
          .filter((category) => !own.has(category))
          .map((category) => `${child} (child of ${parent}) is not ${category}`)
      })
    expect(lost).toEqual([])
  })
})

describe('English and Arabic inputs meet on the same canonical name', () => {
  it.each([
    ['spring onions', 'بصل أخضر', 'green onion'],
    ['Scallions', 'عرق بصل أخضر', 'green onion'],
    ['aubergine', 'باذنجان', 'eggplant'],
    ['Egg Plants', 'باذنجانة', 'eggplant'],
    ['minced beef', 'لحمة مفرومة', 'ground beef'],
    ['beef mince', 'لحم بقري مفروم', 'ground beef'],
    ['lamb mince', 'لحم ضأن مفروم', 'ground lamb'],
    ['garbanzo beans', 'حمص', 'chickpea'],
    ['chick peas', 'حمص حب', 'chickpea'],
    ['cilantro', 'كزبرة خضراء', 'coriander'],
    ['ground coriander', 'كزبرة ناشفة', 'ground coriander'],
    ['chicken breasts', 'صدور فراخ', 'chicken breast'],
    ['chicken breast fillets', 'فيليه فراخ', 'chicken breast'],
    ['Chicken Thighs', 'أوراك دجاج', 'chicken thigh'],
    ['whole chicken', 'دجاجة كاملة', 'chicken'],
    ['2 large ripe tomatoes, diced', '٢ طماطم كبيرة مقطعة', 'tomato'],
    ['Tomato Purée', 'صلصة طماطم', 'tomato paste'],
    ['courgettes', 'كوسة', 'zucchini'],
    ['king prawns', 'جمبري', 'shrimp'],
    ['cornflour', 'نشا', 'cornstarch'],
    ['double cream', 'كريمة خفق', 'heavy cream'],
    ['icing sugar', 'سكر بودرة', 'powdered sugar'],
    ['Red Pepper Flakes', 'شطة مجروشة', 'chili flakes'],
    ['Red Pepper', 'فلفل رومي أحمر', 'bell pepper'],
    ['green chillies', 'فلفل أخضر حار', 'chili'],
    ['Garlic Clove', 'فص ثوم', 'garlic'],
    ['Cloves', 'قرنفل', 'clove'],
    ['freshly ground black pepper', 'فلفل أسود', 'black pepper'],
    ['salt and pepper', 'ملح وفلفل', 'salt'],
    ['Plain Flour', 'دقيق', 'flour'],
    ['3 eggs, beaten', '٣ بيضات', 'egg'],
    ['natural yoghurt', 'زبادي', 'yogurt'],
    ['Greek Yogurt', 'زبادي يوناني', 'greek yogurt'],
    ['basmati rice', 'أرز بسمتي', 'basmati rice'],
    ['red lentils', 'عدس أحمر', 'red lentil'],
    ['ground cumin', 'كمون', 'cumin'],
    ['cumin seeds', 'بذور كمون', 'cumin seed'],
    ['fresh ginger', 'زنجبيل طازج', 'ginger'],
    ['ground ginger', 'زنجبيل مطحون', 'ground ginger'],
    ['extra virgin olive oil', 'زيت زيتون', 'olive oil'],
    ['chicken stock cube', 'مكعب مرقة فراخ', 'chicken stock'],
    ['Cheddar Cheese', 'جبنة شيدر', 'cheddar'],
    ['feta cheese', 'جبنة فيتا', 'feta'],
    ['salmon fillets', 'فيليه سلمون', 'salmon'],
    ['sweet potatoes', 'بطاطا حلوة', 'sweet potato'],
    ['lemon juice', 'عصير ليمون', 'lemon'],
    ['vine leaves', 'ورق عنب', 'vine leaf'],
    ['broad beans', 'فول أخضر', 'fava bean'],
    ['bulgur wheat', 'برغل', 'bulgur'],
    ['Pitta Bread', 'عيش شامي', 'pita'],
    ['filo pastry', 'جلاش', 'phyllo dough'],
    ['filo', 'عجينة جلاش', 'phyllo dough'],
    ['vanilla', 'فانيليا', 'vanilla'],
    ['vanilla essence', 'خلاصة فانيليا', 'vanilla extract'],
    ['cardamom pods', 'حبهان', 'cardamom'],
    ['bay leaves', 'ورق لورا', 'bay leaf'],
    ['pine nuts', 'صنوبر', 'pine nut'],
    ['sweetcorn', 'ذرة', 'corn'],
    ['pasta', 'مكرونة', 'pasta'],
  ])('%j and %j → %j', (english, arabic, canonical) => {
    expect(resolveIngredient(english).canonical).toBe(canonical)
    expect(resolveIngredient(arabic).canonical).toBe(canonical)
  })
})

describe('end to end: TheMealDB lines against an Arabic pantry', () => {
  const toRecipe = (lines: readonly string[]) => ({
    ingredients: lines.map((line) => ({ name: normalizeIngredient(line) })),
  })

  it('scores Koshari-style lines typed in English against the same pantry typed in Arabic', () => {
    const recipe = toRecipe([
      'Brown Lentils',
      'Rice',
      'Macaroni',
      'Chickpeas',
      'Onions',
      'Tomato Purée',
      'Garlic Clove',
      'Cumin',
      'Vegetable Oil',
      'Salt',
    ])
    const pantry = ['عدس', 'أرز', 'مكرونة', 'حمص', 'بصل', 'صلصة', 'فص ثوم', 'كمون'].map(
      (raw) => resolveIngredient(raw).canonical as string,
    )

    const result = scoreRecipe(pantry, recipe, { assumeStaples: true })

    expect(result.missingIngredients).toEqual([])
    // brown lentil ← lentil and macaroni ← pasta are family hits (0.8); the other six are exact.
    expect(result.matchScore).toBe(0.95)
    expect(result.matchedUserIngredients).toEqual(pantry)
  })

  it('reports a missing ingredient by the same name in both languages', () => {
    const recipe = toRecipe(['Minced Beef', 'Aubergine', 'Spring Onions', 'Salt'])
    const english = ['minced beef', 'aubergine'].map((raw) => normalizeIngredient(raw))
    const arabic = ['لحمة مفرومة', 'باذنجان'].map((raw) => normalizeIngredient(raw))

    const fromEnglish = scoreRecipe(english, recipe, { assumeStaples: true })
    const fromArabic = scoreRecipe(arabic, recipe, { assumeStaples: true })

    expect(fromArabic).toEqual(fromEnglish)
    expect(fromArabic.missingIngredients).toEqual(['green onion'])
  })
})
