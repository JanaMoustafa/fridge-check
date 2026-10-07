import { describe, expect, it } from 'vitest'
import { type Diet, DIETS } from '@/types/recipe'
import {
  DIET_CATEGORIES,
  DIET_KEYWORDS,
  type DietCategory,
  MEAT_STAND_INS,
} from './config/diet-keywords'
import {
  classifyDiets,
  DIET_RULES,
  dietBlockers,
  type IngredientLine,
  ingredientCategories,
  toMatchText,
} from './dietClassifier'
import { normalizeIngredient } from './normalize'

const ALL_DIETS: Diet[] = [...DIETS]

/** One ingredient → the categories it must fall into (canonical names unless noted). */
const INGREDIENT_CASES: Array<[string, DietCategory[]]> = [
  // Meat, poultry, offal, fats, gelatin.
  ['chicken', ['meat']],
  ['chicken breast', ['meat']],
  ['chicken thigh', ['meat']],
  ['chicken wing', ['meat']],
  ['ground beef', ['meat']],
  ['ground lamb', ['meat']],
  ['ground pork', ['meat']],
  ['steak', ['meat']],
  ['veal', ['meat']],
  ['duck', ['meat']],
  ['turkey', ['meat']],
  ['rabbit', ['meat']],
  ['bacon', ['meat']],
  ['ham', ['meat']],
  ['chorizo', ['meat']],
  ['salami', ['meat']],
  ['pepperoni', ['meat']],
  ['pastirma', ['meat']],
  ['sausage', ['meat', 'gluten']],
  ['liver', ['meat']],
  ['kidney', ['meat']],
  ['lamb kidney', ['meat']],
  ['tripe', ['meat']],
  ['lard', ['meat']],
  ['suet', ['meat', 'gluten']],
  ['mince', ['meat']],
  ['goat', ['meat']],
  ['gelatin', ['meat']],
  ['gelatine', ['meat']],
  ['marshmallow', ['meat']],
  ['chicken stock', ['meat', 'gluten']],
  ['beef stock', ['meat', 'gluten']],
  ['stock cube', ['meat', 'gluten']],
  ['chicken bouillon', ['meat', 'gluten']],
  ['broth', ['meat', 'gluten']],
  ['foie gras', ['meat']],
  ['andouille', ['meat']],
  ['char siu', ['meat']],
  ['lap cheong', ['meat']],
  ['spam', ['meat']],
  ['linguica', ['meat']],
  ['sobrasada', ['meat']],
  ['lardo', ['meat']],
  ['demi-glace', ['meat']],
  ['refried bean', ['meat']],
  ['kofta', ['meat']],
  ['shawarma', ['meat']],
  ['kibbeh', ['meat', 'gluten']],
  ['gyro', ['meat', 'gluten']],
  ['doner meat', ['meat', 'gluten']],
  ['gummy bear', ['meat']],
  ['jelly baby', ['meat']],
  // Fish and seafood.
  ['fish', ['fish']],
  ['white fish', ['fish']],
  ['salmon', ['fish']],
  ['tuna', ['fish']],
  ['cod', ['fish']],
  ['haddock', ['fish']],
  ['mackerel', ['fish']],
  ['sardine', ['fish']],
  ['anchovy', ['fish']],
  ['shrimp', ['fish']],
  ['mussel', ['fish']],
  ['squid', ['fish']],
  ['lobster', ['fish']],
  ['caviar', ['fish']],
  ['fish sauce', ['fish']],
  ['shrimp paste', ['fish']],
  ['dashi', ['fish']],
  ['bonito flake', ['fish']],
  ['isinglass', ['fish']],
  ['oyster sauce', ['fish', 'gluten']],
  ['worcestershire sauce', ['fish', 'gluten']],
  ['green curry paste', ['fish', 'gluten']],
  ['fish stock', ['fish', 'gluten']],
  ['crab meat', ['fish']],
  ['tuna steak', ['fish']],
  ['cod liver oil', ['fish']],
  ['kimchi', ['fish']],
  ['tapenade', ['fish']],
  ['nuoc cham', ['fish']],
  ['hondashi', ['fish']],
  ['caesar dressing', ['fish', 'dairy', 'egg']],
  ['caesar salad dressing', ['fish', 'dairy', 'egg']],
  // Dairy.
  ['milk', ['dairy']],
  ['butter', ['dairy']],
  ['cream', ['dairy']],
  ['heavy cream', ['dairy']],
  ['sour cream', ['dairy']],
  ['creme fraiche', ['dairy']],
  ['yogurt', ['dairy']],
  ['greek yogurt', ['dairy']],
  ['cheese', ['dairy']],
  ['cheddar', ['dairy']],
  ['mozzarella', ['dairy']],
  ['parmesan', ['dairy']],
  ['feta', ['dairy']],
  ['halloumi', ['dairy']],
  ['ricotta', ['dairy']],
  ['cream cheese', ['dairy']],
  ['goat cheese', ['dairy']],
  ['gruyere', ['dairy']],
  ['roumi', ['dairy']],
  ['vasterbottensost', ['dairy']],
  ['ghee', ['dairy']],
  ['buttermilk', ['dairy']],
  ['whey', ['dairy']],
  ['condensed milk', ['dairy']],
  ['evaporated milk', ['dairy']],
  ['labneh', ['dairy']],
  ['kefir', ['dairy']],
  ['pesto', ['dairy']],
  ['milk chocolate', ['dairy']],
  ['non-dairy creamer', ['dairy']],
  ['ice cream', ['dairy', 'egg']],
  ['custard', ['dairy', 'egg']],
  ['lemon curd', ['dairy', 'egg']],
  ['puff pastry', ['dairy', 'gluten']],
  ['buttered toast', ['dairy', 'gluten']],
  ['buttery cracker', ['dairy', 'gluten']],
  ['pain au chocolat', ['dairy', 'gluten']],
  ['tortellini', ['dairy', 'egg', 'gluten']],
  ['ravioli', ['dairy', 'egg', 'gluten']],
  ['cappelletti', ['dairy', 'egg', 'gluten']],
  ['agnolotti', ['dairy', 'egg', 'gluten']],
  ['spinach and ricotta ravioli', ['dairy', 'egg', 'gluten']],
  // Egg.
  ['egg', ['egg']],
  ['egg yolk', ['egg']],
  ['egg white', ['egg']],
  ['duck egg', ['egg']],
  ['quail egg', ['egg']],
  ['mayonnaise', ['egg']],
  ['aioli', ['egg']],
  ['meringue', ['egg']],
  ['macaron', ['egg']],
  ['egg noodle', ['egg', 'gluten']],
  ['egg pasta', ['egg', 'gluten']],
  ['fresh pasta', ['egg', 'gluten']],
  ['fresh lasagne sheet', ['egg', 'gluten']],
  ['fresh tagliatelle', ['egg', 'gluten']],
  ['fresh fettuccine', ['egg', 'gluten']],
  ['ladyfinger', ['egg', 'gluten']],
  // Was [] ("okra"): okra's English names are "okra", "bamia" and "lady's finger"; the biscuit
  // must not depend on how a provider spaces it.
  ['lady finger', ['egg', 'gluten']],
  ['royal icing', ['egg']],
  ['swiss roll', ['egg', 'gluten']],
  // Other animal products (vegan only).
  ['honey', ['animal']],
  ['carmine', ['animal']],
  ['beeswax', ['animal']],
  // Gluten.
  ['flour', ['gluten']],
  ['self-raising flour', ['gluten']],
  ['wheat', ['gluten']],
  ['bread', ['gluten']],
  ['pita', ['gluten']],
  ['breadcrumb', ['gluten']],
  ['panko', ['gluten']],
  ['pasta', ['gluten']],
  ['spaghetti', ['gluten']],
  ['macaroni', ['gluten']],
  ['vermicelli', ['gluten']],
  ['noodle', ['gluten']],
  ['soba', ['gluten']],
  ['couscous', ['gluten']],
  ['bulgur', ['gluten']],
  ['freekeh', ['gluten']],
  ['semolina', ['gluten']],
  ['barley', ['gluten']],
  ['rye', ['gluten']],
  ['oats', ['gluten']],
  ['oat milk', ['gluten']],
  ['seitan', ['gluten']],
  ['filo', ['gluten']],
  ['tortilla', ['gluten']],
  ['beer', ['gluten']],
  ['malt vinegar', ['gluten']],
  ['soy sauce', ['gluten']],
  ['teriyaki sauce', ['gluten']],
  ['vegetable stock', ['gluten']],
  ['hamburger bun', ['gluten']],
  ['guinness', ['gluten']],
  ['marmite', ['gluten']],
  ['vegemite', ['gluten']],
  ['ginger nut', ['gluten']],
  ['gingernut', ['gluten']],
  // Plants that must stay clear of every category.
  ['tomato', []],
  ['rice', []],
  ['basmati rice', []],
  ['lentil', []],
  ['chickpea', []],
  ['fava bean', []],
  ['tahini', []],
  ['olive oil', []],
  ['molokhia', []],
  ['vine leaf', []],
  ['nutmeg', []],
  ['kale', []],
  ['brandy', []],
  ['tofu', []],
  // Exception traps.
  ['eggplant', []],
  ['egg plant', []],
  ['flax egg', []],
  ['chia egg', []],
  ['egg replacer', []],
  ['butter bean', []],
  ['butternut squash', []],
  ['butter lettuce', []],
  ['peanut butter', []],
  ['almond butter', []],
  ['cocoa butter', []],
  ['coconut milk', []],
  ['coconut cream', []],
  ['almond milk', []],
  ['soy milk', []],
  ['cream of tartar', []],
  ['custard powder', []],
  ['bean curd', []],
  ['kidney bean', []],
  ['red kidney bean', []],
  ['pigeon pea', []],
  ['beef tomato', []],
  ['chicken of the woods', []],
  ['oyster mushroom', []],
  ['crab apple', []],
  ['coconut meat', []],
  ['duck sauce', []],
  ['gluten-free flour', []],
  ['gluten-free oats', []],
  ['gluten-free soy sauce', []],
  ['tamari', []],
  ['tamari soy sauce', []],
  ['rice flour', []],
  ['chickpea flour', []],
  ['corn flour', []],
  ['cornstarch', []],
  ['buckwheat', []],
  ['buckwheat flour', []],
  ['glutinous rice', []],
  ['rice noodle', []],
  ['rice vermicelli', []],
  ['rice stick noodle', []],
  ['corn tortilla', []],
  ['spaghetti squash', []],
  ['ginger ale', []],
  ['root beer', []],
  ['gingerbread spice', []],
  ['honeydew melon', []],
  ['shawarma spice', []],
  ['shawarma seasoning', []],
  ['gyro seasoning', []],
  ['shawarma bread', ['gluten']],
  ['gyro bread', ['gluten']],
  ["lady's finger", []],
  // Plant-based versions of animal products.
  ['vegan cheese', []],
  ['vegan butter', []],
  ['vegan mayonnaise', []],
  ['dairy-free yogurt', []],
  ['soy mince', []],
  ['vegan kimchi', []],
  ['vegan sausage', ['gluten']],
  ['plant-based burger', ['gluten']],
  ['vegetarian refried bean', []],
  ['vegetarian stock', ['gluten']],
  ['veggie stock', ['gluten']],
  ['vegetarian gravy', ['gluten']],
  ['vegetarian worcestershire sauce', ['gluten']],
  // Vegetarian is not vegan: a meat or fish stand-in may hold egg, cheese or wheat. Was
  // ['vegetarian sausage', ['gluten']], which let 'vegetarian sausage' claim vegan.
  ['vegetarian sausage', ['dairy', 'egg', 'gluten']],
  ['veggie burger', ['dairy', 'egg', 'gluten']],
  ['vegetarian bacon', ['dairy', 'egg', 'gluten']],
  ['meat-free mince', ['dairy', 'egg', 'gluten']],
  ['meatless meatball', ['dairy', 'egg', 'gluten']],
  ['fish-free tuna', ['dairy', 'egg', 'gluten']],
  ['quorn mince', ['dairy', 'egg', 'gluten']],
  ['bean burger', ['dairy', 'egg', 'gluten']],
  ['meat substitute', ['dairy', 'egg', 'gluten']],
  ['dairy-free veggie burger', ['egg', 'gluten']],
  ['gluten-free vegetarian sausage', ['dairy', 'egg']],
  ['vegetarian parmesan', ['dairy']],
  ['mixed veggies', []],
]

/** Whole dishes → expected diets (DIETS order). */
const RECIPE_CASES: Array<[string, string[], Diet[]]> = [
  [
    'koshari',
    [
      'rice',
      'lentil',
      'macaroni',
      'chickpea',
      'tomato paste',
      'onion',
      'garlic',
      'vinegar',
      'cumin',
      'vegetable oil',
    ],
    ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
  ],
  [
    'ful medames',
    ['fava bean', 'olive oil', 'garlic', 'lemon', 'cumin', 'salt', 'parsley', 'tomato'],
    ALL_DIETS,
  ],
  [
    'shakshuka',
    [
      'egg',
      'tomato',
      'bell pepper',
      'onion',
      'garlic',
      'cumin',
      'paprika',
      'chili',
      'olive oil',
      'salt',
      'black pepper',
    ],
    ['vegetarian', 'gluten-free', 'dairy-free', 'pescatarian'],
  ],
  [
    'chicken shawarma wrap',
    [
      'chicken thigh',
      'yogurt',
      'garlic',
      'lemon',
      'cumin',
      'paprika',
      'turmeric',
      'black pepper',
      'olive oil',
      'pita',
      'tahini',
    ],
    [],
  ],
  [
    'chicken shawarma plate (no pita)',
    ['chicken thigh', 'yogurt', 'garlic', 'lemon', 'cumin', 'paprika', 'olive oil', 'tahini'],
    ['gluten-free'],
  ],
  [
    'tuna & egg brik',
    [
      'brik pastry',
      'tuna',
      'egg',
      'parsley',
      'caper',
      'onion',
      'harissa',
      'lemon',
      'vegetable oil',
    ],
    ['dairy-free', 'pescatarian'],
  ],
  ['baba ganoush', ['eggplant', 'tahini', 'lemon', 'garlic', 'olive oil', 'salt'], ALL_DIETS],
  [
    'fattoush',
    ['lettuce', 'tomato', 'cucumber', 'radish', 'green onion', 'mint', 'sumac', 'pita', 'lemon'],
    ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
  ],
  ['mujaddara', ['lentil', 'rice', 'onion', 'cumin', 'olive oil', 'salt'], ALL_DIETS],
  [
    'mahshi',
    ['vine leaf', 'rice', 'tomato', 'onion', 'parsley', 'dill', 'mint', 'lemon', 'olive oil'],
    ALL_DIETS,
  ],
  [
    'molokhia with chicken',
    ['molokhia', 'chicken', 'chicken stock', 'garlic', 'ground coriander', 'ghee'],
    [],
  ],
  [
    'baklava',
    ['filo', 'walnut', 'pistachio', 'butter', 'sugar', 'honey'],
    ['vegetarian', 'pescatarian'],
  ],
  [
    'om ali',
    ['puff pastry', 'milk', 'heavy cream', 'sugar', 'raisin', 'almond', 'pistachio'],
    ['vegetarian', 'pescatarian'],
  ],
  ['spaghetti carbonara', ['spaghetti', 'egg', 'bacon', 'parmesan', 'black pepper'], []],
  [
    'fish and chips',
    ['cod', 'flour', 'beer', 'potato', 'vegetable oil', 'salt'],
    ['dairy-free', 'pescatarian'],
  ],
  [
    'thai green curry',
    ['chicken thigh', 'green curry paste', 'coconut milk', 'fish sauce', 'eggplant', 'basil'],
    ['dairy-free'],
  ],
  [
    'pad thai',
    ['rice noodle', 'shrimp', 'egg', 'peanut', 'fish sauce', 'tamarind', 'green onion', 'lime'],
    ['gluten-free', 'dairy-free', 'pescatarian'],
  ],
  [
    'macaroni cheese',
    ['macaroni', 'cheddar', 'milk', 'butter', 'flour'],
    ['vegetarian', 'pescatarian'],
  ],
  [
    'vegan chocolate cake',
    ['flour', 'sugar', 'cocoa', 'flax egg', 'almond milk', 'vegetable oil', 'baking powder'],
    ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
  ],
  [
    'bean chili (stock may hide wheat)',
    ['kidney bean', 'black bean', 'tomato', 'onion', 'chili powder', 'cumin', 'vegetable stock'],
    ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
  ],
  [
    'caesar salad',
    ['lettuce', 'parmesan', 'anchovy', 'egg yolk', 'lemon', 'garlic', 'olive oil', 'bread'],
    ['pescatarian'],
  ],
  ['panna cotta', ['heavy cream', 'milk', 'sugar', 'gelatin', 'vanilla'], ['gluten-free']],
  [
    'tofu stir-fry with tamari',
    ['tofu', 'broccoli', 'tamari', 'garlic', 'ginger', 'sesame oil', 'rice'],
    ALL_DIETS,
  ],
  [
    'honey-glazed carrots',
    ['carrot', 'honey', 'olive oil', 'thyme'],
    ['vegetarian', 'gluten-free', 'dairy-free', 'pescatarian'],
  ],
]

/** Single-ingredient diet traps from the spec, checked at the diet level. */
const DIET_TRAP_CASES: Array<[string, Diet[]]> = [
  ['eggplant', ALL_DIETS],
  ['butter bean', ALL_DIETS],
  ['butternut squash', ALL_DIETS],
  ['peanut butter', ALL_DIETS],
  ['coconut milk', ALL_DIETS],
  ['almond milk', ALL_DIETS],
  ['cocoa butter', ALL_DIETS],
  ['kidney bean', ALL_DIETS],
  ['kidney', ['gluten-free', 'dairy-free']],
  ['cream of tartar', ALL_DIETS],
  ['gluten-free flour', ALL_DIETS],
  ['rice flour', ALL_DIETS],
  ['cornstarch', ALL_DIETS],
  ['tamari', ALL_DIETS],
  ['flax egg', ALL_DIETS],
  ['worcestershire sauce', ['dairy-free', 'pescatarian']],
  ['fish sauce', ['gluten-free', 'dairy-free', 'pescatarian']],
  ['gelatin', ['gluten-free', 'dairy-free']],
  ['honey', ['vegetarian', 'gluten-free', 'dairy-free', 'pescatarian']],
  ['chicken stock', ['dairy-free']],
  ['vegetable stock', ['vegetarian', 'vegan', 'dairy-free', 'pescatarian']],
  ['foie gras', ['gluten-free', 'dairy-free']],
  ['vegetarian sausage', ['vegetarian', 'pescatarian']],
  ['veggie burger', ['vegetarian', 'pescatarian']],
  ['meat-free mince', ['vegetarian', 'pescatarian']],
  ['vegan sausage', ['vegetarian', 'vegan', 'dairy-free', 'pescatarian']],
  ['lady finger', ['vegetarian', 'dairy-free', 'pescatarian']],
  ['refried bean', ['gluten-free', 'dairy-free']],
  ['guinness', ['vegetarian', 'vegan', 'dairy-free', 'pescatarian']],
]

/** A TheMealDB line as the seed script builds it: raw = measure + ingredient, name = canonical. */
function mealLine([measure, ingredient]: [string, string]): IngredientLine {
  return { raw: `${measure} ${ingredient}`.trim(), name: normalizeIngredient(ingredient) }
}

/**
 * Lines whose canonical name lost the blocker that the raw text names ("with …" clauses, ", …"
 * asides, the "fresh" descriptor, a broken singular) → diets they must NOT claim. Names are given
 * explicitly, as the normalizer produced them when the review found the gap.
 */
const LINE_CASES: Array<[string, string, Diet[]]> = [
  ['2 Corn Arepa Filled With Mozarella Cheese', 'corn arepa', ['vegan', 'dairy-free']],
  ['rice with butter', 'rice', ['vegan', 'dairy-free']],
  ['potatoes with butter', 'potato', ['vegan', 'dairy-free']],
  ['lettuce with bacon', 'lettuce', ['vegetarian', 'vegan', 'pescatarian']],
  ['bread, buttered', 'bread', ['vegan', 'dairy-free']],
  ['toast, buttered', 'bread', ['vegan', 'dairy-free']],
  ['500g Fresh Pasta', 'pasta', ['vegan', 'gluten-free']],
  ['Foie Gras', 'foie gra', ['vegetarian', 'vegan', 'pescatarian']],
  ['24 Lady Fingers', 'lady finger', ['vegan', 'gluten-free']],
  ['8 Kabanos Sausages', 'kabanos', ['vegetarian', 'vegan', 'gluten-free', 'pescatarian']],
]

/** Real TheMealDB meals ([measure, ingredient] pairs) the review found mislabelled. */
const MEAL_CASES: Array<[string, Array<[string, string]>, Diet[]]> = [
  [
    '53334 Arepa Pabellón (arepas filled with mozzarella: not dairy-free)',
    [
      ['2', 'Corn Arepa Filled With Mozarella Cheese'],
      ['1', 'Fried Ripe Bananas'],
      ['1 Can', 'Black Beans'],
      ['1', 'Pico De Gallo Sauce'],
      ['2kg', 'Shredded Meat'],
      ['1 chopped', 'Tomato'],
      ['Pinch', 'Salt'],
      ['Pinch', 'Pepper'],
    ],
    ['gluten-free'],
  ],
  [
    '52769 Kapsalon (doner meat is bound with wheat: not gluten-free)',
    [
      ['250 Grams', 'Fries'],
      ['500 Grams', 'Doner Meat'],
      ['Topping', 'Garlic sauce'],
      ['Topping', 'Hotsauce'],
      ['1 Bulb', 'Lettuce'],
      ['1', 'Tomato'],
      ['3rd', 'Cucumber'],
      ['100 Grams', 'Gouda cheese'],
    ],
    [],
  ],
]

/** Raw provider spellings (TheMealDB) still classify after case, accent and plural folding. */
const RAW_NAME_CASES: Array<[string, DietCategory[]]> = [
  ['Plain Flour', ['gluten']],
  ['Egg Plants', []],
  ['Flax Eggs', []],
  ['Gruyère', ['dairy']],
  ['Crème Fraîche', ['dairy']],
  ["Goat's Cheese", ['dairy']],
  ['Goats Cheese', ['dairy']],
  ['Kidney Beans', []],
  ['Butter Beans', []],
  ['Anchovies', ['fish']],
  ['Chicken Wings', ['meat']],
  ['Free-range Eggs, Beaten', ['egg']],
  ['Gluten-Free Flour', []],
  ['Vermicelli Rice Noodles', []],
  ['Rice Stick Noodles', []],
  ['Sesame Seed Burger Buns', ['gluten']],
  ['Vegetable Stock Cube', ['gluten']],
  ['Beef Stock Cubes', ['meat', 'gluten']],
  ['Gelatine Leafs', ['meat']],
  ['Miniature Marshmallows', ['meat']],
  ['Thai Chilli Jam', ['fish']],
  ['Prahok', ['fish']],
  ['Duck Sauce', []],
  ['Beef tomatoes', []],
  ['Oyster Mushrooms', []],
  ['Pigs Trotters', ['meat']],
  ['Frogs Legs', ['meat']],
  ['jamón ibérico', ['meat']],
  ['Minced Garlic', []],
  ['Palm Butter', []],
]

function expectDietImplications(diets: readonly Diet[]): void {
  const has = (diet: Diet) => diets.includes(diet)
  if (has('vegan')) expect(has('vegetarian')).toBe(true)
  if (has('vegetarian')) expect(has('pescatarian')).toBe(true)
  if (has('vegan')) expect(has('dairy-free')).toBe(true)
  expect(diets).toEqual(DIETS.filter(has))
}

describe('ingredientCategories', () => {
  it.each(INGREDIENT_CASES)('%s → %j', (name, expected) => {
    expect(ingredientCategories(name)).toEqual(expected)
  })

  it.each(RAW_NAME_CASES)('raw "%s" → %j', (name, expected) => {
    expect(ingredientCategories(name)).toEqual(expected)
  })

  it('returns nothing for blank names', () => {
    expect(ingredientCategories('')).toEqual([])
    expect(ingredientCategories('  - ')).toEqual([])
  })

  it('does not let one ingredient phrase hide a real keyword elsewhere in the name', () => {
    expect(ingredientCategories('kidney bean and chorizo')).toEqual(['meat'])
  })
})

describe('classifyDiets', () => {
  it.each(DIET_TRAP_CASES)('%s alone → %j', (name, expected) => {
    expect(classifyDiets([name])).toEqual(expected)
  })

  it.each(RECIPE_CASES)('%s', (_title, ingredients, expected) => {
    expect(classifyDiets(ingredients)).toEqual(expected)
  })

  it('claims nothing for a recipe without usable ingredient names', () => {
    expect(classifyDiets([])).toEqual([])
    expect(classifyDiets(['', '   '])).toEqual([])
  })

  it('claims every diet for plain plant ingredients', () => {
    expect(classifyDiets(['tomato', 'onion', 'salt'])).toEqual(ALL_DIETS)
  })

  it('keeps vegan ⇒ vegetarian ⇒ pescatarian and vegan ⇒ dairy-free for every table case', () => {
    const lists = [
      ...INGREDIENT_CASES.map(([name]) => [name]),
      ...RAW_NAME_CASES.map(([name]) => [name]),
      ...DIET_TRAP_CASES.map(([name]) => [name]),
      ...RECIPE_CASES.map(([, ingredients]) => ingredients),
      ...LINE_CASES.map(([raw, name]) => [{ raw, name }]),
      ...MEAL_CASES.map(([, pairs]) => pairs.map(mealLine)),
    ]
    for (const list of lists) expectDietImplications(classifyDiets(list))
  })

  it('agrees with dietBlockers for every table case', () => {
    const lists = [
      ...RECIPE_CASES.map(([, ingredients]) => ingredients),
      ...MEAL_CASES.map(([, pairs]) => pairs.map(mealLine)),
    ]
    for (const ingredients of lists) {
      const blockers = dietBlockers(ingredients)
      const diets = classifyDiets(ingredients)
      for (const diet of DIETS) expect(diets.includes(diet)).toBe(blockers[diet].length === 0)
    }
  })
})

describe('classifyDiets with ingredient lines', () => {
  it.each(LINE_CASES)('"%s" (name "%s") does not claim %j', (raw, name, excluded) => {
    const diets = classifyDiets([{ raw, name }])
    for (const diet of excluded) expect(diets).not.toContain(diet)
  })

  it.each(MEAL_CASES)('%s', (_title, pairs, expected) => {
    expect(classifyDiets(pairs.map(mealLine))).toEqual(expected)
  })

  it('does not let the raw text add anything a plain plant line does not have', () => {
    const lines = [
      { raw: '2 large ripe tomatoes, diced', name: 'tomato' },
      { raw: '1 Can Black Beans', name: 'black bean' },
      { raw: 'Pinch Salt', name: 'salt' },
    ]
    expect(classifyDiets(lines)).toEqual(ALL_DIETS)
  })

  it('still counts what only the canonical name reveals', () => {
    // Arabic raw text has no English keyword in it; the canonical name carries the category.
    expect(classifyDiets([{ raw: 'جبنة', name: 'cheese' }])).not.toContain('dairy-free')
  })

  it('accepts bare names and lines together', () => {
    expect(classifyDiets(['tomato', { raw: 'rice with butter', name: 'rice' }])).toEqual([
      'vegetarian',
      'gluten-free',
      'pescatarian',
    ])
  })

  it('claims nothing for lines without usable text', () => {
    expect(classifyDiets([{ raw: ' ', name: '' }])).toEqual([])
  })
})

describe('dietBlockers', () => {
  it('lists the names that block each diet, de-duplicated and in input order', () => {
    expect(dietBlockers(['chicken', 'butter', 'chicken', 'flour', 'tomato', 'honey'])).toEqual({
      vegetarian: ['chicken'],
      vegan: ['chicken', 'butter', 'honey'],
      'gluten-free': ['flour'],
      'dairy-free': ['butter'],
      pescatarian: ['chicken'],
    })
  })

  it('names fish as a vegetarian blocker but not a pescatarian one', () => {
    const blockers = dietBlockers(['salmon', 'rice'])
    expect(blockers.vegetarian).toEqual(['salmon'])
    expect(blockers.pescatarian).toEqual([])
  })

  it('returns the names exactly as given', () => {
    expect(dietBlockers(['Plain Flour'])['gluten-free']).toEqual(['Plain Flour'])
  })

  it('names a line by its raw text, which shows why it blocks', () => {
    const arepa = { raw: '2 Corn Arepa Filled With Mozarella Cheese', name: 'corn arepa' }
    const blockers = dietBlockers([arepa, arepa, { raw: '1 chopped Tomato', name: 'tomato' }])
    expect(blockers['dairy-free']).toEqual(['2 Corn Arepa Filled With Mozarella Cheese'])
    expect(blockers.vegetarian).toEqual([])
  })

  it('has an empty list for every diet when nothing blocks', () => {
    expect(dietBlockers([])).toEqual({
      vegetarian: [],
      vegan: [],
      'gluten-free': [],
      'dairy-free': [],
      pescatarian: [],
    })
  })
})

describe('DIET_RULES', () => {
  const blocks = (diet: Diet) => new Set<DietCategory>(DIET_RULES[diet])
  const isSubset = (a: Set<DietCategory>, b: Set<DietCategory>) => [...a].every((c) => b.has(c))

  it('lists every diet in DIETS order (the classifier returns diets in this order)', () => {
    expect(Object.keys(DIET_RULES)).toEqual([...DIETS])
  })

  it('makes the diet implications hold by construction', () => {
    expect(isSubset(blocks('pescatarian'), blocks('vegetarian'))).toBe(true)
    expect(isSubset(blocks('vegetarian'), blocks('vegan'))).toBe(true)
    expect(isSubset(blocks('dairy-free'), blocks('vegan'))).toBe(true)
  })

  it('uses every category for at least one diet', () => {
    const used = new Set(DIETS.flatMap((diet) => [...DIET_RULES[diet]]))
    expect([...used].sort()).toEqual([...DIET_CATEGORIES].sort())
  })
})

describe('toMatchText', () => {
  it.each([
    ['Crème Fraîche', 'creme fraiche'],
    ["Goat's Cheese", 'goats cheese'],
    ['Self-Raising  Flour', 'self raising flour'],
    ["za'atar", 'zaatar'],
    ['  Free-range Eggs, Beaten ', 'free range eggs beaten'],
  ])('%s → %s', (input, expected) => {
    expect(toMatchText(input)).toBe(expected)
  })
})

describe('diet keyword config', () => {
  const pluralOf = (phrase: string) =>
    /[^aeiou]y$/.test(phrase) ? `${phrase.slice(0, -1)}ies` : `${phrase}s`

  it.each(DIET_CATEGORIES)('%s phrases are in match form and unique', (category) => {
    const { keywords, exceptions, neutralizers } = DIET_KEYWORDS[category]
    for (const list of [keywords, exceptions, neutralizers]) {
      for (const phrase of list) expect(toMatchText(phrase)).toBe(phrase)
      expect(new Set(list).size).toBe(list.length)
    }
  })

  /**
   * Keywords that only ever match raw provider text, which ingredient lines carry: the normalizer
   * strips the "fresh" descriptor, so the canonical name is just the pasta shape.
   */
  const RAW_ONLY_KEYWORDS: ReadonlySet<string> = new Set([
    'fresh lasagne',
    'fresh lasagna',
    'fresh tagliatelle',
    'fresh fettuccine',
  ])

  /**
   * Keywords the normalizer currently mangles (english.ts / singularize.ts, not this module):
   * "patis" → "pati", "propolis" → "propoli", "kecap manis" → "kecap mani", "jelly baby" →
   * "jelly". Ingredient lines still catch them from the raw text. Remove each entry once the
   * normalizer keeps it; the test then guards it like every other keyword.
   */

  it.each(DIET_CATEGORIES)('every %s keyword survives normalization', (category) => {
    for (const keyword of DIET_KEYWORDS[category].keywords) {
      if (RAW_ONLY_KEYWORDS.has(keyword)) continue
      const name = normalizeIngredient(keyword)
      expect(ingredientCategories(name), `${keyword} → ${name}`).toContain(category)
    }
  })

  it.each(DIET_CATEGORIES)('every %s keyword is detected alone and in the plural', (category) => {
    for (const keyword of DIET_KEYWORDS[category].keywords) {
      expect(ingredientCategories(keyword), keyword).toContain(category)
      expect(ingredientCategories(pluralOf(keyword)), pluralOf(keyword)).toContain(category)
    }
  })

  it.each(DIET_CATEGORIES)('every %s exception clears the category on its own', (category) => {
    for (const exception of DIET_KEYWORDS[category].exceptions) {
      expect(ingredientCategories(exception), exception).not.toContain(category)
    }
  })

  it.each(DIET_CATEGORIES)('every %s neutralizer clears any keyword it modifies', (category) => {
    const { keywords, neutralizers } = DIET_KEYWORDS[category]
    for (const neutralizer of neutralizers) {
      for (const keyword of keywords) {
        const name = `${neutralizer} ${keyword}`
        expect(ingredientCategories(name), name).not.toContain(category)
      }
    }
  })

  it('meat stand-in phrases are in match form and the labels neutralize meat or fish', () => {
    const { labels, products } = MEAT_STAND_INS
    for (const phrase of [...labels, ...products]) expect(toMatchText(phrase)).toBe(phrase)
    for (const label of labels) {
      const neutralizes = [DIET_KEYWORDS.meat, DIET_KEYWORDS.fish].some((config) =>
        (config.neutralizers as readonly string[]).includes(label),
      )
      expect(neutralizes, label).toBe(true)
    }
  })

  it('every labelled meat word and every stand-in product falls into exactly the stand-in categories', () => {
    const expected = DIET_CATEGORIES.filter((c) =>
      (MEAT_STAND_INS.categories as readonly string[]).includes(c),
    )
    for (const label of ['vegetarian', 'veggie', 'meat free', 'meatless'] as const) {
      expect(MEAT_STAND_INS.labels).toContain(label)
      for (const meat of ['bacon', 'chicken', 'mince', 'pepperoni']) {
        expect(ingredientCategories(`${label} ${meat}`), `${label} ${meat}`).toEqual(expected)
      }
    }
    for (const product of MEAT_STAND_INS.products) {
      expect(ingredientCategories(product), product).toEqual(expected)
    }
  })
})
