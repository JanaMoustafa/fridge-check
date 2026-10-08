import { http, HttpResponse } from 'msw'

export const SPOONACULAR_BASE = 'https://api.spoonacular.com'
export const TEST_SPOONACULAR_KEY = 'test-spoonacular-key-0123456789'

/** An ingredient line as Spoonacular sends it (extendedIngredients / used / missed). */
function line(name: string, original: string, amount: number, unit: string) {
  return {
    id: 1000 + name.length,
    aisle: 'Produce',
    image: `${name.replace(/ /g, '-')}.jpg`,
    name,
    nameClean: name,
    original,
    originalName: name,
    amount,
    unit,
    unitLong: unit,
    unitShort: unit,
    meta: [],
  }
}

/**
 * Three recipes shaped like Spoonacular's documented responses: a vegetarian pasta with analyzed
 * steps, a vegan jambalaya whose steps exist only as HTML, and a pork salad.
 */
export const spoonacularRecipes = {
  pasta: {
    id: 716429,
    title: 'Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs',
    image: 'https://img.spoonacular.com/recipes/716429-556x370.jpg',
    imageType: 'jpg',
    readyInMinutes: 45,
    servings: 2,
    sourceUrl: 'https://fullbellysisters.blogspot.com/2012/06/pasta-with-garlic-scallions.html',
    sourceName: 'Full Belly Sisters',
    vegetarian: true,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    diets: ['lacto ovo vegetarian'],
    cuisines: [],
    instructions: null,
    analyzedInstructions: [
      {
        name: '',
        steps: [
          { number: 1, step: 'Cook the pasta in salted water until al dente.', ingredients: [] },
          { number: 2, step: '  Brown the  garlic and scallions in butter. ', ingredients: [] },
          { number: 3, step: 'Toss with cauliflower, breadcrumbs and parmesan.', ingredients: [] },
        ],
      },
    ],
    extendedIngredients: [
      line('butter', '1 tbsp butter', 1, 'tbsp'),
      line('cauliflower florets', '2 cups cauliflower florets', 2, 'cups'),
      line('garlic', '5 cloves garlic, minced', 5, 'cloves'),
      line('pasta', '6 ounces pasta', 6, 'ounces'),
      line('scallions', '3 scallions, sliced', 3, ''),
      line('parmesan cheese', '2 tbsp grated parmesan cheese', 2, 'tbsp'),
      line('breadcrumbs', '0.3333333333333333 cup breadcrumbs', 0.3333333333333333, 'cup'),
      line('salt', 'salt to taste', 0, ''),
    ],
  },
  jambalaya: {
    id: 782601,
    title: 'Red Kidney Bean Jambalaya',
    image: '782601-312x231.jpg',
    readyInMinutes: 45,
    servings: 6,
    sourceUrl: 'http://www.foodandspice.com/2016/05/red-kidney-bean-jambalaya.html',
    vegetarian: true,
    vegan: true,
    glutenFree: true,
    dairyFree: true,
    diets: ['gluten free', 'dairy free', 'lacto ovo vegetarian', 'vegan'],
    cuisines: ['Cajun', 'Creole'],
    instructions:
      '<ol><li>Rinse the kidney beans &amp; drain.</li><li>Fry the onion,&nbsp;celery and pepper.</li><li>Add the rice and simmer for 20&#8211;25 minutes.</li></ol>',
    analyzedInstructions: [],
    extendedIngredients: [
      line('kidney beans', '2 cups red kidney beans', 2, 'cups'),
      line('onion', '1 onion, diced', 1, ''),
      line('celery', '2 stalks celery', 2, 'stalks'),
      line('red bell pepper', '1 red bell pepper', 1, ''),
      line('rice', '1 cup long grain rice', 1, 'cup'),
      line('vegetable broth', '3 cups vegetable broth', 3, 'cups'),
    ],
  },
  salad: {
    id: 715538,
    title: 'Bruschetta Style Pork & Pasta Salad',
    image: 'https://img.spoonacular.com/recipes/715538-312x231.jpg',
    readyInMinutes: 35,
    servings: 2,
    sourceUrl: 'https://www.pinkwhen.com/bruschetta-style-pork-pasta-salad/',
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: true,
    diets: ['dairy free'],
    cuisines: ['Italian'],
    analyzedInstructions: [
      { name: '', steps: [{ number: 1, step: 'Grill the pork, then toss with the pasta.' }] },
    ],
    extendedIngredients: [
      line('pork tenderloin', '1 pork tenderloin', 1, ''),
      line('pasta', '8 oz fusilli pasta', 8, 'oz'),
      line('tomato', '2 tomatoes, diced', 2, ''),
      line('red onion', '0.5 red onion', 0.5, ''),
      line('basil', '0.25 cup fresh basil', 0.25, 'cup'),
    ],
  },
} as const

type FixtureRecipe = (typeof spoonacularRecipes)[keyof typeof spoonacularRecipes]

/**
 * complexSearch with fillIngredients: the full ingredient list moves into usedIngredients /
 * missedIngredients, as Spoonacular sends it (no extendedIngredients in search results).
 */
export function asSearchResult(recipe: FixtureRecipe, have: readonly string[]) {
  const { extendedIngredients, ...rest } = recipe
  const used = extendedIngredients.filter((entry) => have.some((name) => entry.name.includes(name)))
  const missed = extendedIngredients.filter((entry) => !used.includes(entry))
  return {
    ...rest,
    usedIngredientCount: used.length,
    missedIngredientCount: missed.length,
    usedIngredients: used,
    missedIngredients: missed,
    unusedIngredients: [],
    likes: 0,
  }
}

/**
 * complexSearch and information over the fixture recipes. Every request is pushed to `requests`
 * (to check the key travels only in the x-api-key header).
 */
export function spoonacularHandlers(requests: Request[] = []) {
  const all = Object.values(spoonacularRecipes)
  return [
    http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, ({ request }) => {
      requests.push(request.clone())
      const have = new URL(request.url).searchParams.get('includeIngredients')!.split(',')
      const results = all
        .filter((recipe) =>
          recipe.extendedIngredients.some((entry) =>
            have.some((name) => entry.name.includes(name)),
          ),
        )
        .map((recipe) => asSearchResult(recipe, have))
      return HttpResponse.json({
        results,
        offset: 0,
        number: results.length,
        totalResults: results.length,
      })
    }),
    http.get(`${SPOONACULAR_BASE}/recipes/:id/information`, ({ request, params }) => {
      requests.push(request.clone())
      const recipe = all.find((candidate) => String(candidate.id) === params.id)
      if (!recipe) {
        return HttpResponse.json(
          { status: 'failure', code: 404, message: 'A recipe with the id was not found.' },
          { status: 404 },
        )
      }
      return HttpResponse.json(recipe)
    }),
  ]
}

/** Spoonacular's answer once the daily points are used up. */
export function quotaExceeded() {
  return HttpResponse.json(
    {
      status: 'failure',
      code: 402,
      message:
        'Your daily points limit of 150 has been reached. Please upgrade your plan to continue using the API.',
    },
    { status: 402 },
  )
}
