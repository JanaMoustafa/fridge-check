import { http, HttpResponse } from 'msw'
import fixture from '../fixtures/mealdb-meals.sample.json'

export const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

type Meal = (typeof fixture.meals)[number]
export const mealDbMeals: readonly Meal[] = fixture.meals

function ingredientsOf(meal: Meal): string[] {
  return Array.from(
    { length: 20 },
    (_, i) => (meal as Record<string, string | null>)[`strIngredient${i + 1}`],
  )
    .map((name) => name?.trim() ?? '')
    .filter((name) => name !== '')
}

/** Every ingredient name the fixture meals use, as TheMealDB's list.php would list them. */
export const mealDbIngredientNames = [...new Set(mealDbMeals.flatMap(ingredientsOf))].sort()

/**
 * TheMealDB's free API over the fixture meals: list.php, filter.php (exact name, case-insensitive,
 * "_" for spaces) and lookup.php. Every request URL is pushed to `calls`.
 */
export function mealDbHandlers(calls: string[] = []) {
  return [
    http.get(`${MEALDB_BASE}/list.php`, ({ request }) => {
      calls.push(request.url)
      return HttpResponse.json({
        meals: mealDbIngredientNames.map((name, i) => ({
          idIngredient: String(i + 1),
          strIngredient: name,
          strDescription: null,
          strType: null,
        })),
      })
    }),
    http.get(`${MEALDB_BASE}/filter.php`, ({ request }) => {
      calls.push(request.url)
      const wanted = new URL(request.url).searchParams.get('i')!.replace(/_/g, ' ').toLowerCase()
      const found = mealDbMeals.filter((meal) =>
        ingredientsOf(meal).some((name) => name.toLowerCase() === wanted),
      )
      return HttpResponse.json({
        meals:
          found.length === 0
            ? null
            : found.map(({ idMeal, strMeal, strMealThumb }) => ({ idMeal, strMeal, strMealThumb })),
      })
    }),
    http.get(`${MEALDB_BASE}/lookup.php`, ({ request }) => {
      calls.push(request.url)
      const id = new URL(request.url).searchParams.get('i')
      const meal = mealDbMeals.find((candidate) => candidate.idMeal === id)
      return HttpResponse.json({ meals: meal ? [meal] : null })
    }),
  ]
}
