import type { Meal } from './portions'

/**
 * The meal a recipe most likely is, from its source's category (TheMealDB: "Breakfast",
 * "Dessert", "Side"…; Spoonacular dish types: "breakfast", "snack", "main course"…). The user can
 * pick another; anything else is lunch, the biggest share of the day in the default split.
 */
export function defaultMeal(category: string | undefined): Meal {
  const text = category?.toLowerCase() ?? ''
  if (/breakfast|brunch|morning meal/.test(text)) return 'breakfast'
  if (/dessert|snack|side|starter|appetizer|antipasti|fingerfood|beverage|drink/.test(text)) {
    return 'snacks'
  }
  if (/dinner/.test(text)) return 'dinner'
  return 'lunch'
}
