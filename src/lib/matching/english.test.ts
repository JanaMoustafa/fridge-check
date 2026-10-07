import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema } from '@/types/recipe'
import { normalizeEnglishIngredient } from './english'

const SPEC_EXAMPLES = [
  ['2 large ripe tomatoes, diced', 'tomato'],
  ['Minced Beef', 'ground beef'],
  ['Spring Onions', 'green onion'],
  ['Coriander Leaves', 'coriander'],
  ['Red Pepper Flakes', 'chili flakes'],
  ['Red Pepper', 'bell pepper'],
  ['Egg Plants', 'eggplant'],
  ['Freshly Chopped Parsley', 'parsley'],
  ['Tomato Purée', 'tomato paste'],
  ['Jalapeño', 'jalapeno'],
  ['Crème Fraîche', 'creme fraiche'],
  ['Garlic Clove', 'garlic'],
  ['Plain Flour', 'flour'],
  ['plain flour', 'flour'],
  ['Cloves', 'clove'],
] as const

const PLURALS = [
  ['Tomatoes', 'tomato'],
  ['Potatoes', 'potato'],
  ['Mangoes', 'mango'],
  ['Peaches', 'peach'],
  ['Radishes', 'radish'],
  ['Blueberries', 'blueberry'],
  ['Anchovies', 'anchovy'],
  ['Bay Leaves', 'bay leaf'],
  ['Chicken Thighs', 'chicken thigh'],
  ['Cherry Tomatoes', 'cherry tomato'],
  ['Brussels Sprouts', 'brussels sprout'],
  ['Tinned Tomatos', 'tomato'],
  ['Jalapeños', 'jalapeno'],
  ['chillis', 'chili'],
  ['Chilis', 'chili'],
  ['2 red chillis', 'chili'],
  ['green chillis', 'chili'],
  ['Kiwis', 'kiwi'],
  ['2 kiwis', 'kiwi'],
  ['zucchinis', 'zucchini'],
  ['brussel sprouts', 'brussels sprout'],
] as const

const KEEPS_ITS_S = [
  ['Hummus', 'hummus'],
  ['Couscous', 'couscous'],
  ['asparagus', 'asparagus'],
  ['Molasses', 'molasses'],
  ['Pomegranate Molasses', 'pomegranate molasses'],
  ['Swiss Chard', 'swiss chard'],
  ['Swiss Cheese', 'swiss cheese'],
  ['Oats', 'oats'],
  ['Grits', 'grits'],
  ['Sea Bass Fillets', 'sea bass'],
  ['Fromage Frais', 'fromage frais'],
  ['petit pois', 'pea'],
  ['Pastis', 'pastis'],
  ['Raspberry Coulis', 'raspberry coulis'],
  ['Foie Gras', 'foie gras'],
  ['Cos', 'romaine lettuce'],
  ['Haggis', 'haggis'],
  ['patis', 'patis'],
  ['kecap manis', 'kecap manis'],
  ['propolis', 'propolis'],
  ['fromage de brebis', 'fromage de brebis'],
  ['jelly babies', 'jelly baby'],
] as const

const QUANTITIES_AND_UNITS = [
  ['1 1/2 cups milk', 'milk'],
  ['1.5 l vegetable stock', 'vegetable stock'],
  ['2-3 cloves garlic, minced', 'garlic'],
  ['2 to 3 cloves garlic', 'garlic'],
  ['1 or 2 eggs', 'egg'],
  ['2 x 400g tins chickpeas, drained', 'chickpea'],
  ['1,000 g flour', 'flour'],
  ['a pinch of salt', 'salt'],
  ['half a lemon', 'lemon'],
  ['about 2 tbsp honey', 'honey'],
  ['up to 1 tsp chilli flakes', 'chili flakes'],
  ['1 heaped tbsp flour', 'flour'],
  ['2 large cloves garlic', 'garlic'],
  ['4 sprigs thyme', 'thyme'],
  ['handful of basil leaves', 'basil'],
  ['1 bunch fresh coriander', 'coriander'],
  ['1 tin coconut milk', 'coconut milk'],
  ['Can of chickpeas', 'chickpea'],
  ['8 oz cream cheese, softened', 'cream cheese'],
  ['1 lb ground beef', 'ground beef'],
  ['2.5cm piece ginger', 'ginger'],
  ['flour 200 g', 'flour'],
  ['eggs x 2', 'egg'],
  ['7g sachet fast-action dried yeast', 'yeast'],
  ['1 cup plus 2 tablespoons flour', 'flour'],
  ['1 and 1/2 cups flour', 'flour'],
  ['one and a half cups flour', 'flour'],
  ['2 and a half cups milk', 'milk'],
  ['a cup and a half of rice', 'rice'],
  ['1 and 1/8 cup Water', 'water'],
  ['250 gm flour', 'flour'],
  ['250 gms flour', 'flour'],
  ['1 c. sugar', 'sugar'],
  ['2 ribs celery', 'celery'],
  ['1 rib celery', 'celery'],
  ['1 rib of celery', 'celery'],
  ['1 pkt yeast', 'yeast'],
  ['1 pk cream cheese', 'cream cheese'],
  ['1 doz eggs', 'egg'],
  ['1 gal milk', 'milk'],
  ['1 teaspoonful salt', 'salt'],
  ['1 lg onion', 'onion'],
  ['1 med onion', 'onion'],
  ['2 sm onions', 'onion'],
  ['rib roast', 'rib roast'],
  ['Rib Steak', 'rib steak'],
] as const

const UNICODE_AND_GLUED = [
  ['½ teaspoon salt', 'salt'],
  ['1½ cups plain flour', 'flour'],
  ['¾ cup sugar', 'sugar'],
  ['⅓ cup olive oil', 'olive oil'],
  ['1⁄2 tsp ground cinnamon', 'cinnamon'],
  ['100g butter', 'butter'],
  ['2tbsp olive oil', 'olive oil'],
  ['1kg potatoes', 'potato'],
  ['400g/14oz chopped tomatoes', 'tomato'],
  ['1–2 tbsp lemon juice', 'lemon'],
] as const

const ASIDES_AND_CLAUSES = [
  ['1 (400g) can chopped tomatoes', 'tomato'],
  ['1 (14.5 oz) can diced tomatoes', 'tomato'],
  ['Hispi (sweetheart) Cabbage', 'cabbage'],
  ['parsley [optional]', 'parsley'],
  ['flour (plain', 'flour'],
  ['Free-range Egg, Beaten', 'egg'],
  ['red onion, finely chopped', 'red onion'],
  ['butter; softened', 'butter'],
  ['oil for frying', 'oil'],
  ['lemon wedges, to serve', 'lemon'],
  ['lemon wedges to serve', 'lemon'],
  ['salt to taste', 'salt'],
  ['tuna in brine', 'tuna'],
  ['Sazon Goya With Azafran', 'sazon'],
  ['juice of 1 lemon', 'lemon'],
  ['zest and juice of 2 limes', 'lime'],
  ['the juice of half a lemon', 'lemon'],
  ['4 skinless, boneless chicken breasts', 'chicken breast'],
  ['boneless, skinless chicken breasts', 'chicken breast'],
  ['skinless, boneless chicken thighs', 'chicken thigh'],
  ['1 large, ripe avocado', 'avocado'],
  ['2 medium, ripe tomatoes', 'tomato'],
  ['fresh, chopped parsley', 'parsley'],
  ['1 small, finely chopped onion', 'onion'],
  ['salt, to taste', 'salt'],
  ['4 cloves, crushed', 'clove'],
] as const

const ALTERNATIVES = [
  ['chicken or vegetable stock', 'chicken stock'],
  ['butter or margarine', 'butter'],
  ['red or white wine vinegar', 'red wine vinegar'],
  ['cheddar or monterey jack cheese', 'cheddar'],
  ['2 tbsp olive or vegetable oil', 'olive oil'],
] as const

const DESCRIPTORS = [
  ['boneless skinless chicken breasts', 'chicken breast'],
  ['1 large egg, beaten', 'egg'],
  ['large free-range eggs', 'egg'],
  ['Full fat sour cream', 'sour cream'],
  ['Semi-skimmed Milk', 'milk'],
  ['Whole Milk', 'milk'],
  ['whole chicken', 'chicken'],
  ['Melted Butter', 'butter'],
  ['Boiling Water', 'water'],
  ['baby spinach', 'spinach'],
  ['Frozen Peas', 'pea'],
  ['Dried Oregano', 'oregano'],
  ['Unsweetened Cocoa', 'cocoa powder'],
  ['Ready rolled shortcrust pastry', 'shortcrust pastry'],
  ['Hot Smoked Flaked Salmon', 'smoked salmon'],
  ['butter at room temperature', 'butter'],
  ['bone-in chicken thighs', 'chicken thigh'],
  ['bone in chicken thighs', 'chicken thigh'],
  ['chicken thighs bone in', 'chicken thigh'],
  ['skin-on chicken thighs', 'chicken thigh'],
  ['skin on salmon fillets', 'salmon'],
  ['freshly squeezed lemon juice', 'lemon'],
  ['squeezed lime', 'lime'],
  ['part-skim mozzarella', 'mozzarella'],
  ['low-sodium chicken broth', 'chicken stock'],
  ['low sodium chicken broth', 'chicken stock'],
  ['nonfat milk', 'milk'],
] as const

/** Phrases where a descriptor word changes what you buy and must survive stripping. */
const PROTECTED = [
  ['lean minced beef', 'ground beef'],
  ['Lean Minced Steak', 'ground beef'],
  ['crushed red pepper flakes', 'chili flakes'],
  ['3 large hot peppers', 'chili'],
  ['hot sauce', 'hot sauce'],
  ['hot water', 'water'],
  ['whole wheat flour', 'whole wheat flour'],
  ['Dried Apricots', 'dried apricot'],
  ['Dried Shrimp', 'dried shrimp'],
  ['dried chillies', 'chili'],
  ['baby plum tomatoes', 'cherry tomato'],
  ['Baby Aubergine', 'eggplant'],
  ['Five Spice Powder', 'five spice powder'],
] as const

const SYNONYMS_UK_US = [
  ['Aubergine', 'eggplant'],
  ['Courgettes', 'zucchini'],
  ['Scallions', 'green onion'],
  ['Cilantro', 'coriander'],
  ['garbanzo beans', 'chickpea'],
  ['chick peas', 'chickpea'],
  ['King Prawns', 'shrimp'],
  ['Double Cream', 'heavy cream'],
  ['Icing Sugar', 'powdered sugar'],
  ['Corn Flour', 'cornstarch'],
  ['Natural Yoghurt', 'yogurt'],
  ['Broad Beans', 'fava bean'],
  ['Beetroot', 'beet'],
  ['Rocket', 'arugula'],
  ['Swede', 'rutabaga'],
  ['Lamb Mince', 'ground lamb'],
  ['Self-raising Flour', 'self-raising flour'],
  ['self raising flour', 'self-raising flour'],
  ['Extra Virgin Olive Oil', 'olive oil'],
  ['extra-virgin olive oil', 'olive oil'],
  ['Pita Bread', 'pita'],
  ['Mulukhiyah', 'molokhia'],
  ['Pickled Grape Leaves', 'vine leaf'],
  ["za'atar", "za'atar"],
  ['Zaatar', "za'atar"],
] as const

const PEPPERS_AND_CHILIES = [
  ['Pepper', 'black pepper'],
  ['freshly ground black pepper', 'black pepper'],
  ['freshly ground pepper', 'black pepper'],
  ['Whole black peppercorns', 'black pepper'],
  ['Green Pepper', 'bell pepper'],
  ['red bell peppers, seeded', 'bell pepper'],
  ['Cayenne Pepper', 'cayenne pepper'],
  ['Red Chilli', 'chili'],
  ['2 green chillies, slit', 'chili'],
  ['Chilli Powder', 'chili powder'],
  ['Hot Chilli Powder', 'chili powder'],
  ['sweet chilli sauce', 'sweet chili sauce'],
  ['Birds-eye Chillies', "bird's eye chili"],
  ['jalapeño pepper', 'jalapeno'],
  ['peppers', 'bell pepper'],
  ['Peppers', 'bell pepper'],
  ['2 peppers', 'bell pepper'],
  ['3 peppers, deseeded and sliced', 'bell pepper'],
  ['large peppers', 'bell pepper'],
  ['black peppers', 'black pepper'],
  ['Peppercorns', 'black pepper'],
  ['hot peppers', 'chili'],
] as const

const CLOVES_AND_BULBS = [
  ['3 cloves', 'clove'],
  ['Ground Clove', 'clove'],
  ['2 cloves garlic', 'garlic'],
  ['2 garlic cloves, crushed', 'garlic'],
  ['Garlic Bulb', 'garlic'],
  ['1 bulb garlic', 'garlic'],
  ['Fennel Bulb', 'fennel'],
  ['Bulb', 'bulb'],
  ['Mars Bar', 'mars bar'],
] as const

const HEADS_AND_CHEESES = [
  ['Cheddar Cheese', 'cheddar'],
  ['Mature Cheddar', 'cheddar'],
  ['Parmigiano-Reggiano', 'parmesan'],
  ['Gruyère', 'gruyere'],
  ['Goats Cheese', 'goat cheese'],
  ['Cream Cheese', 'cream cheese'],
  ['Mozzarella Balls', 'mozzarella'],
  ['Linguine Pasta', 'linguine'],
  ['salmon fillets', 'salmon'],
  ['Anchovy Fillet', 'anchovy'],
  ['Cinnamon Stick', 'cinnamon'],
  ['Pineapple Chunks', 'pineapple'],
  ['Lemon Zest', 'lemon'],
  ['Chicken Stock Cube', 'chicken stock'],
  ['Ice Cubes', 'ice'],
  ['Green Cardamom Pods', 'cardamom'],
  ['8 green cardamom pods', 'cardamom'],
  ['cilantro sprigs', 'coriander'],
  ['rocket leaves', 'arugula'],
  ['flat-leaf parsley leaves', 'parsley'],
  ['aubergine slices', 'eggplant'],
  ['spring onion stalks', 'green onion'],
  ['pak choi leaves', 'bok choy'],
  ['lemon grass stalks', 'lemongrass'],
  ['sweetcorn kernels', 'corn'],
  ['sharp cheddar cheese', 'cheddar'],
  ['parmigiano reggiano cheese', 'parmesan'],
  ['pecorino romano cheese', 'pecorino'],
  ['buffalo mozzarella cheese', 'mozzarella'],
] as const

const FOLDING = [
  ['  OLIVE   OIL  ', 'olive oil'],
  ['jamón ibérico', 'prosciutto'],
  ['Smoky Aïoli', 'smoky aioli'],
  ['baker’s yeast', "baker's yeast"],
  ['Weißwurst', 'weisswurst'],
  ['Salt & pepper', 'salt'],
  ['Mozarella', 'mozzarella'],
  ['Hazlenuts', 'hazelnut'],
] as const

/** TheMealDB keeps the amount in strMeasure; providers may prepend it to the name. */
const MEASURE_FIRST = [
  ['To serve Rice', 'rice'],
  ['For frying Vegetable Oil', 'vegetable oil'],
  ['Garnish with Mint', 'mint'],
  ['as required salt', 'salt'],
  ['Dusting Icing Sugar', 'powdered sugar'],
  ['6 parts Thyme', 'thyme'],
  ['3 Pods Cardamom', 'cardamom'],
  ['12 florets Broccoli', 'broccoli'],
  ['5 chopped cloves Garlic', 'garlic'],
  ['2 cloves peeled and chopped garlic', 'garlic'],
  ['Sliced and Seeded Jalapeno', 'jalapeno'],
  ['3rd Cucumber', 'cucumber'],
  ['Ground Red Pepper', 'cayenne pepper'],
  ['Dried Leaves Of Summer Savoury', 'savory'],
  ['100g, plus extra for greasing Butter', 'butter'],
  ['1 cup plus extra for dusting flour', 'flour'],
  ['2 tbsp plus more to serve olive oil', 'olive oil'],
] as const

/** "Ground X" is X unless the tables know the ground form as its own product. */
const GROUND = [
  ['ground sumac', 'sumac'],
  ['ground white pepper', 'white pepper'],
  ['ground paprika', 'paprika'],
  ['ground smoked paprika', 'smoked paprika'],
  ['ground fenugreek', 'fenugreek'],
  ['ground cayenne pepper', 'cayenne pepper'],
  ['ground star anise', 'star anise'],
  ['ground cumin seeds', 'cumin seed'],
  ['ground cardamom seeds', 'cardamom'],
  ['ground caraway', 'caraway seed'],
  ['ground fennel', 'fennel seed'],
  ['ground chilli', 'chili powder'],
  ['freshly ground sea salt', 'salt'],
  ['ground rice', 'rice flour'],
  ['ground veal', 'ground veal'],
  ['ground cherries', 'ground cherry'],
  ['ground venison', 'ground venison'],
  ['Ground Beef', 'ground beef'],
  ['Ground Coriander', 'ground coriander'],
  ['Ground Ginger', 'ground ginger'],
  ['ground almonds', 'ground almond'],
] as const

/** Products bought separately from the ingredient a descriptor word would reduce them to. */
const PRODUCTS = [
  ['hot chocolate', 'hot chocolate'],
  ['frozen yogurt', 'frozen yogurt'],
  ['dried limes', 'dried lime'],
  ['black lime', 'dried lime'],
  ['loomi', 'dried lime'],
  ['dry milk', 'milk powder'],
  ['dried milk', 'milk powder'],
  ['powdered milk', 'milk powder'],
  ['nonfat dry milk', 'milk powder'],
  ['little gem', 'little gem lettuce'],
  ['2 baby gems', 'little gem lettuce'],
  ['fish sticks', 'fish stick'],
  ['fish fingers', 'fish stick'],
  ['crab sticks', 'crab stick'],
  ['Fresh Pasta', 'fresh pasta'],
  ['fresh egg pasta', 'egg pasta'],
  ['egg noodles', 'egg noodle'],
] as const

/** Two staples on one line ("salt and pepper") are one assumed staple. */
const STAPLE_PAIRS = [
  ['salt and black pepper', 'salt'],
  ['sea salt and black pepper', 'salt'],
  ['salt and freshly ground black pepper', 'salt'],
  ['kosher salt and freshly ground pepper', 'salt'],
  ['salt and vinegar crisps', 'salt and vinegar crisp'],
  ['oil and vinegar', 'oil and vinegar'],
] as const

/** Egyptian English spellings of local staples. */
const EGYPTIAN_SPELLINGS = [
  ['foul medames', 'fava bean'],
  ['Fool Medames', 'fava bean'],
  ['Foul', 'fava bean'],
  ['basterma', 'pastirma'],
  ['rumi cheese', 'roumi'],
  ['romy cheese', 'roumi'],
  ['roumy cheese', 'roumi'],
  ['dibs', 'date molasses'],
  ['gooseberry fool', 'gooseberry fool'],
] as const

const EMPTY = [
  '',
  '   ',
  '2 tbsp',
  'Pinch',
  '123',
  'fresh',
  'to taste',
  '(optional)',
  'كمون',
] as const

const ALL_CASES = [
  ...SPEC_EXAMPLES,
  ...PLURALS,
  ...KEEPS_ITS_S,
  ...QUANTITIES_AND_UNITS,
  ...UNICODE_AND_GLUED,
  ...ASIDES_AND_CLAUSES,
  ...ALTERNATIVES,
  ...DESCRIPTORS,
  ...PROTECTED,
  ...SYNONYMS_UK_US,
  ...PEPPERS_AND_CHILIES,
  ...CLOVES_AND_BULBS,
  ...HEADS_AND_CHEESES,
  ...FOLDING,
  ...MEASURE_FIRST,
  ...GROUND,
  ...PRODUCTS,
  ...STAPLE_PAIRS,
  ...EGYPTIAN_SPELLINGS,
]

describe('normalizeEnglishIngredient', () => {
  it.each(SPEC_EXAMPLES)('spec: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(PLURALS)('plural: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(KEEPS_ITS_S)('keeps its s: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(QUANTITIES_AND_UNITS)('quantity/unit: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(UNICODE_AND_GLUED)('fraction/glued unit: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(ASIDES_AND_CLAUSES)('aside/clause: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(ALTERNATIVES)('alternative: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(DESCRIPTORS)('descriptor: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(PROTECTED)('protected phrase: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(SYNONYMS_UK_US)('synonym: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(PEPPERS_AND_CHILIES)('pepper/chili: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(CLOVES_AND_BULBS)('clove/bulb: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(HEADS_AND_CHEESES)('redundant head: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(FOLDING)('folding: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(MEASURE_FIRST)('measure first: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(GROUND)('ground: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(PRODUCTS)('separate product: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(STAPLE_PAIRS)('staple pair: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(EGYPTIAN_SPELLINGS)('Egyptian spelling: %s → %s', (raw, canonical) =>
    expect(normalizeEnglishIngredient(raw)).toBe(canonical),
  )
  it.each(EMPTY)('only amounts or descriptors: %j → empty', (raw) =>
    expect(normalizeEnglishIngredient(raw)).toBe(''),
  )

  it('covers at least 70 distinct inputs', () => {
    expect(new Set([...ALL_CASES.map(([raw]) => raw), ...EMPTY]).size).toBeGreaterThanOrEqual(70)
  })

  it('is idempotent and always returns a valid canonical name', () => {
    for (const [raw] of ALL_CASES) {
      const once = normalizeEnglishIngredient(raw)
      expect(CanonicalNameSchema.safeParse(once).success).toBe(true)
      expect(normalizeEnglishIngredient(once)).toBe(once)
    }
  })

  it('never lets a portion head turn an alias into a staple ("pepper strips" are not black pepper)', () => {
    for (const raw of ['pepper strips', 'pepper halves', 'pepper wedges']) {
      expect(normalizeEnglishIngredient(raw)).not.toBe('black pepper')
    }
  })

  it('merges the case and spelling variants TheMealDB uses for one ingredient', () => {
    const variants = ['Basmati Rice', 'Basmati rice', 'basmati rice']
    expect(new Set(variants.map(normalizeEnglishIngredient))).toEqual(new Set(['basmati rice']))
  })

  it('keeps distinct ingredients distinct', () => {
    const distinct = [
      'Coriander',
      'Ground Coriander',
      'Coriander Seeds',
      'Ginger',
      'Ground Ginger',
      'Tomato',
      'Tomato Puree',
      'Potatoes',
      'Sweet Potatoes',
      'Chicken',
      'Chicken Breast',
      'Red Onions',
      'Onion',
      'Green Onion',
    ]
    expect(new Set(distinct.map(normalizeEnglishIngredient)).size).toBe(distinct.length)
  })

  it('clamps very long names to 60 characters at a word boundary', () => {
    const long = normalizeEnglishIngredient(
      'imported artisanal smallbatch heritage handpicked wildflower meadow honeycomb',
    )
    expect(long.length).toBeLessThanOrEqual(60)
    expect(long).toBe('imported artisanal smallbatch heritage handpicked wildflower')
    expect(normalizeEnglishIngredient('x'.repeat(80))).toBe('x'.repeat(60))
  })
})
