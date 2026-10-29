/**
 * Which built-in recipes the daily plan may suggest on its own: main dishes without pork or
 * alcohol (a default that suits members in Egypt and the Gulf; Fridge Check still shows every
 * recipe when someone searches for it).
 */
export const PLAN_EXCLUDED_CATEGORIES = new Set(['Dessert', 'Side', 'Starter', 'Pork', 'Breakfast'])

export const PLAN_EXCLUDED_INGREDIENTS = new Set([
  'pork',
  'bacon',
  'ham',
  'prosciutto',
  'chorizo',
  'italian sausage',
  'sausage',
  'wine',
  'red wine',
  'white wine',
  'brandy',
  'sherry',
  'sake',
])

export function isPlanFriendly(recipe: {
  category: string
  ingredients: ReadonlyArray<{ name: string }>
}): boolean {
  return (
    !PLAN_EXCLUDED_CATEGORIES.has(recipe.category) &&
    !recipe.ingredients.some((ingredient) => PLAN_EXCLUDED_INGREDIENTS.has(ingredient.name))
  )
}
