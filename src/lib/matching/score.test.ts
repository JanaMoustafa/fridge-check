import { describe, expect, it } from 'vitest'
import { FAMILIES, isFamilyMatch } from './families'
import { EXACT_WEIGHT, FAMILY_WEIGHT, rankRecipes, scoreRecipe } from './score'
import { STAPLES, isStaple } from './staples'
import type { SortableRecipe } from './types'

function recipe(...names: string[]) {
  return { ingredients: names.map((name) => ({ name })) }
}

function titled(title: string, names: string[], readyInMinutes?: number): SortableRecipe {
  return { title, readyInMinutes, ...recipe(...names) }
}

describe('weights', () => {
  it('are the spec values', () => {
    expect(EXACT_WEIGHT).toBe(1)
    expect(FAMILY_WEIGHT).toBe(0.8)
  })
})

describe('scoreRecipe: exact and family matches', () => {
  it('scores an exact match at 1', () => {
    expect(scoreRecipe(['tomato'], recipe('tomato'))).toEqual({
      usedIngredients: ['tomato'],
      missingIngredients: [],
      matchedUserIngredients: ['tomato'],
      matchScore: 1,
    })
  })

  // Both directions earn partial credit: the child stands in for the parent and vice versa.
  it.each([
    ['chicken breast', 'chicken'],
    ['chicken', 'chicken breast'],
    ['cheddar', 'cheese'],
    ['cheese', 'cheddar'],
    ['basmati rice', 'rice'],
    ['spaghetti', 'pasta'],
    ['red onion', 'onion'],
    ['smoked paprika', 'paprika'],
    ['fish', 'cod'],
    ['cod', 'fish'],
  ])('user %s covers recipe %s at 0.8', (user, needed) => {
    expect(scoreRecipe([user], recipe(needed))).toEqual({
      usedIngredients: [needed],
      missingIngredients: [],
      matchedUserIngredients: [user],
      matchScore: 0.8,
    })
  })

  it.each([
    ['cheddar', 'mozzarella'],
    ['chicken breast', 'chicken thigh'],
    ['cod', 'salmon'],
    ['red lentil', 'kidney bean'],
    ['tomato paste', 'tomato'],
    ['ground ginger', 'ginger'],
    ['ground coriander', 'coriander'],
  ])('%s does not cover %s (siblings and unrelated forms)', (user, needed) => {
    expect(scoreRecipe([user], recipe(needed))).toEqual({
      usedIngredients: [],
      missingIngredients: [needed],
      matchedUserIngredients: [],
      matchScore: 0,
    })
  })

  it('prefers an exact match over a family match for the same line', () => {
    const result = scoreRecipe(['chicken', 'chicken breast'], recipe('chicken breast'))
    expect(result.matchScore).toBe(1)
    expect(result.matchedUserIngredients).toEqual(['chicken breast'])
  })

  it('combines exact and family weights over N', () => {
    const result = scoreRecipe(
      ['tomato', 'chicken thigh', 'cheddar'],
      recipe('tomato', 'chicken', 'cheese', 'basil', 'onion'),
    )
    expect(result.usedIngredients).toEqual(['tomato', 'chicken', 'cheese'])
    expect(result.missingIngredients).toEqual(['basil', 'onion'])
    expect(result.matchScore).toBe(0.52)
  })

  it.each([
    [['onion'], ['onion', 'garlic', 'carrot'], 0.3333],
    [['onion', 'garlic'], ['onion', 'garlic', 'carrot'], 0.6667],
    [['chicken'], ['chicken breast', 'garlic', 'carrot'], 0.2667],
    [['chicken'], ['chicken breast', 'chicken thigh', 'chicken wing'], 0.8],
    [['chicken', 'garlic'], ['chicken breast', 'garlic', 'chicken thigh'], 0.8667],
  ])('rounds %j against %j to %d', (user, names, score) => {
    expect(scoreRecipe(user, recipe(...names)).matchScore).toBe(score)
  })
})

describe('scoreRecipe: staples', () => {
  const dish = recipe('salt', 'chicken', 'black pepper', 'olive oil', 'garlic')

  it('drops staples by default', () => {
    expect(scoreRecipe(['chicken'], dish)).toEqual({
      usedIngredients: ['chicken'],
      missingIngredients: ['garlic'],
      matchedUserIngredients: ['chicken'],
      matchScore: 0.5,
    })
    expect(scoreRecipe(['chicken'], dish, { assumeStaples: true })).toEqual(
      scoreRecipe(['chicken'], dish),
    )
  })

  it('never credits a staple the user typed while staples are assumed', () => {
    const result = scoreRecipe(['salt', 'chicken'], dish)
    expect(result.usedIngredients).toEqual(['chicken'])
    expect(result.matchedUserIngredients).toEqual(['chicken'])
  })

  it('counts staples like any other ingredient when the switch is off', () => {
    expect(scoreRecipe(['chicken'], dish, { assumeStaples: false })).toEqual({
      usedIngredients: ['chicken'],
      missingIngredients: ['salt', 'black pepper', 'olive oil', 'garlic'],
      matchedUserIngredients: ['chicken'],
      matchScore: 0.2,
    })
    expect(scoreRecipe(['chicken', 'salt'], dish, { assumeStaples: false })).toMatchObject({
      usedIngredients: ['salt', 'chicken'],
      matchedUserIngredients: ['chicken', 'salt'],
      matchScore: 0.4,
    })
  })

  it('lets staples match through families when the switch is off', () => {
    expect(scoreRecipe(['olive oil'], recipe('oil'), { assumeStaples: false }).matchScore).toBe(0.8)
  })

  // Every non-staple relative of a staple: sugar → brown sugar, butter → ghee, oil → peanut oil…
  const familyNames = [...new Set([...Object.keys(FAMILIES), ...Object.values(FAMILIES)])]
  const stapleRelatives = [...STAPLES].flatMap((staple) =>
    familyNames
      .filter((name) => !isStaple(name) && isFamilyMatch(staple, name))
      .map((name) => [staple, name] as const),
  )

  it('finds staples with non-staple relatives to test', () => {
    expect(stapleRelatives).toContainEqual(['sugar', 'brown sugar'])
    expect(stapleRelatives).toContainEqual(['butter', 'ghee'])
    expect(stapleRelatives).toContainEqual(['flour', 'self-raising flour'])
    expect(stapleRelatives).toContainEqual(['vegetable oil', 'peanut oil'])
  })

  it.each(stapleRelatives)(
    'a typed %s does not cover %s while staples are assumed, and does when they are not',
    (staple, relative) => {
      expect(scoreRecipe([staple], recipe(relative))).toEqual(scoreRecipe([], recipe(relative)))
      expect(scoreRecipe([staple], recipe(relative), { assumeStaples: false })).toEqual({
        usedIngredients: [relative],
        missingIngredients: [],
        matchedUserIngredients: [staple],
        matchScore: 0.8,
      })
    },
  )

  it('ignores typed staples entirely while they are assumed', () => {
    const brownie = recipe('brown sugar', 'egg', 'dark chocolate', 'butter', 'flour', 'ghee')
    const typed = ['egg', 'sugar', 'butter', 'olive oil', 'flour', 'salt']
    expect(scoreRecipe(typed, brownie)).toEqual(scoreRecipe(['egg'], brownie))
    expect(scoreRecipe(typed, brownie)).toEqual({
      usedIngredients: ['egg'],
      missingIngredients: ['brown sugar', 'dark chocolate', 'ghee'],
      matchedUserIngredients: ['egg'],
      matchScore: 0.25,
    })
  })

  it('does not infer staples from families: brown sugar is still needed', () => {
    expect(scoreRecipe([], recipe('sugar', 'brown sugar', 'self-raising flour'))).toMatchObject({
      missingIngredients: ['brown sugar', 'self-raising flour'],
      matchScore: 0,
    })
  })

  it('scores a staples-only recipe at 0 with nothing used or missing', () => {
    expect(scoreRecipe(['salt', 'flour'], recipe('salt', 'flour', 'water'))).toEqual({
      usedIngredients: [],
      missingIngredients: [],
      matchedUserIngredients: [],
      matchScore: 0,
    })
  })
})

describe('scoreRecipe: deduplication and ordering', () => {
  it('counts a repeated recipe ingredient once', () => {
    expect(scoreRecipe(['onion'], recipe('onion', 'garlic', 'onion'))).toEqual({
      usedIngredients: ['onion'],
      missingIngredients: ['garlic'],
      matchedUserIngredients: ['onion'],
      matchScore: 0.5,
    })
  })

  it('counts a repeated user ingredient once', () => {
    const result = scoreRecipe(['onion', 'onion', 'garlic', 'onion'], recipe('onion', 'garlic'))
    expect(result.matchedUserIngredients).toEqual(['onion', 'garlic'])
    expect(result.matchScore).toBe(1)
  })

  it('lists matched user ingredients in the user order, recipe lines in recipe order', () => {
    const result = scoreRecipe(['garlic', 'lemon', 'chicken'], recipe('chicken', 'garlic', 'thyme'))
    expect(result.usedIngredients).toEqual(['chicken', 'garlic'])
    expect(result.missingIngredients).toEqual(['thyme'])
    expect(result.matchedUserIngredients).toEqual(['garlic', 'chicken'])
  })

  it('credits one user item once even when it covers several recipe lines', () => {
    expect(
      scoreRecipe(['chicken'], recipe('chicken breast', 'chicken thigh', 'chicken wing')),
    ).toEqual({
      usedIngredients: ['chicken breast', 'chicken thigh', 'chicken wing'],
      missingIngredients: [],
      matchedUserIngredients: ['chicken'],
      matchScore: 0.8,
    })
  })

  // One recipe line credits at most one of the user's items (a maximum matching), and which
  // items are credited does not depend on the order the chips were added in. Before, the first
  // chip took every line it covered: beef left steak uncredited, but steak first credited both.
  it.each([
    [['mozzarella', 'cheddar'], ['cheese', 'tomato'], ['cheddar'], 0.4],
    [['cheddar', 'mozzarella'], ['cheese', 'tomato'], ['cheddar'], 0.4],
    [['beef', 'steak'], ['sirloin steak', 'ground beef'], ['beef', 'steak'], 0.8],
    [['steak', 'beef'], ['sirloin steak', 'ground beef'], ['steak', 'beef'], 0.8],
  ])('credits one item per line: %j for %j', (user, names, matched, score) => {
    expect(scoreRecipe(user, recipe(...names))).toMatchObject({
      usedIngredients: names.filter((name) => name !== 'tomato'),
      matchedUserIngredients: matched,
      matchScore: score,
    })
  })

  it('never counts more of the user items than the recipe has lines for', () => {
    const cuts = ['chicken breast', 'chicken thigh', 'chicken wing']
    expect(scoreRecipe(cuts, recipe('chicken', 'rice'))).toEqual({
      usedIngredients: ['chicken'],
      missingIngredients: ['rice'],
      matchedUserIngredients: ['chicken breast'],
      matchScore: 0.4,
    })
  })

  it('credits the exact item, not its relatives, when the user has the line itself', () => {
    expect(scoreRecipe(['cheese', 'cheddar'], recipe('cheddar', 'cheese'))).toMatchObject({
      matchedUserIngredients: ['cheese', 'cheddar'],
      matchScore: 1,
    })
    expect(scoreRecipe(['cheese', 'cheddar'], recipe('cheddar', 'tomato'))).toMatchObject({
      matchedUserIngredients: ['cheddar'],
      matchScore: 0.5,
    })
  })

  it('leaves out user ingredients that matched nothing', () => {
    expect(scoreRecipe(['banana', 'egg'], recipe('egg', 'milk')).matchedUserIngredients).toEqual([
      'egg',
    ])
  })
})

describe('scoreRecipe: edge cases and invariants', () => {
  it('scores 0 for an empty user list', () => {
    expect(scoreRecipe([], recipe('egg', 'milk'))).toEqual({
      usedIngredients: [],
      missingIngredients: ['egg', 'milk'],
      matchedUserIngredients: [],
      matchScore: 0,
    })
  })

  it('scores 0 for a recipe without ingredients', () => {
    expect(scoreRecipe(['egg'], recipe()).matchScore).toBe(0)
  })

  it('does not mutate its inputs', () => {
    const user = Object.freeze(['egg', 'egg', 'chicken'])
    const frozen = Object.freeze({
      ingredients: Object.freeze([Object.freeze({ name: 'egg' }), Object.freeze({ name: 'egg' })]),
    })
    expect(() => scoreRecipe(user, frozen)).not.toThrow()
    expect(user).toEqual(['egg', 'egg', 'chicken'])
  })

  // Every user subset of a small vocabulary against a recipe with exact, family, sibling, staple
  // and duplicate lines: the partition and bounds hold whatever the user has.
  const vocabulary = [
    'chicken',
    'chicken thigh',
    'cheddar',
    'mozzarella',
    'cheese',
    'rice',
    'salt',
    'sugar',
    'lemon',
  ]
  const subsets = Array.from({ length: 2 ** vocabulary.length }, (_, mask) =>
    vocabulary.filter((_, bit) => mask & (2 ** bit)),
  )
  const dish = recipe(
    'chicken thigh',
    'basmati rice',
    'cheese',
    'salt',
    'lemon',
    'cheese',
    'dill',
    'brown sugar',
  )
  const covers = (item: string, line: string) => item === line || isFamilyMatch(item, line)

  it.each([true, false])('keeps every invariant for all user subsets (staples %s)', (staples) => {
    const options = { assumeStaples: staples }
    for (const user of subsets) {
      const result = scoreRecipe(user, dish, options)
      const { usedIngredients: used, matchedUserIngredients: matched } = result
      const scored = [...used, ...result.missingIngredients]
      expect(new Set(scored).size).toBe(scored.length)
      expect(scored.length).toBe(staples ? 6 : 7)
      expect(result.matchScore).toBeGreaterThanOrEqual(0)
      expect(result.matchScore).toBeLessThanOrEqual(1)
      // One line credits at most one item, so there are never more matched items than used lines.
      expect(matched.length).toBeLessThanOrEqual(used.length)
      // Matched items are distinct user items in user order; each covers a used line, and each
      // used line is covered by a matched item.
      expect(matched).toEqual(user.filter((name) => matched.includes(name)))
      expect(matched.every((item) => used.some((line) => covers(item, line)))).toBe(true)
      expect(used.every((line) => matched.some((item) => covers(item, line)))).toBe(true)
      // The user's order changes nothing but the order of the matched list.
      const reversed = scoreRecipe([...user].reverse(), dish, options)
      expect({
        ...reversed,
        matchedUserIngredients: [...reversed.matchedUserIngredients].reverse(),
      }).toEqual(result)
      // While assumed, a typed staple is invisible.
      if (staples) {
        expect(result).toEqual(
          scoreRecipe(
            user.filter((name) => !isStaple(name)),
            dish,
            options,
          ),
        )
      }
      expect(result.matchScore === 0).toBe(result.usedIngredients.length === 0)
      expect(result.matchScore === 1).toBe(
        result.missingIngredients.length === 0 &&
          result.usedIngredients.every((name) => user.includes(name)),
      )
    }
  })
})

describe('rankRecipes', () => {
  const recipes = [
    titled('Chicken soup', ['chicken', 'carrot', 'celery', 'onion', 'leek', 'potato', 'salt'], 60),
    titled('Plain toast', ['bread', 'butter', 'salt']),
    titled('Salt water', ['salt', 'water'], 5),
    titled('Omelette', ['egg', 'cheddar', 'black pepper'], 10),
    titled('Chicken rice', ['chicken thigh', 'basmati rice', 'onion'], 40),
  ]

  it('drops recipes that use none of the user ingredients, staples-only ones included', () => {
    const ranked = rankRecipes(['chicken', 'onion', 'salt'], recipes, {
      assumeStaples: true,
      sort: 'fewest-missing',
    })
    expect(ranked.map((r) => r.title)).toEqual(['Chicken rice', 'Chicken soup'])
  })

  it('keeps staples-only recipes when staples are scored and the user has them', () => {
    const ranked = rankRecipes(['salt', 'water'], recipes, {
      assumeStaples: false,
      sort: 'best',
    })
    expect(ranked.map((r) => [r.title, r.matchScore])).toEqual([
      ['Salt water', 1],
      ['Plain toast', 0.3333],
      ['Chicken soup', 0.1429],
    ])
  })

  // Both orders of the same fridge rank the same. Before, the first chip took the "cheese" line,
  // so mozzarella first left Pizza with one credited item and the tie-break flipped the recipes.
  it.each([[['cheddar', 'mozzarella', 'tomato']], [['mozzarella', 'cheddar', 'tomato']]])(
    'ranks the same whatever the order of %j',
    (user) => {
      const pizzaAndToast = [
        titled('Pizza', ['cheese', 'mozzarella', 'basil']),
        titled('Tomato toast', ['cheese', 'tomato', 'basil']),
      ]
      const ranked = rankRecipes(user, pizzaAndToast, {
        assumeStaples: true,
        sort: 'fewest-missing',
      })
      expect(ranked.map((r) => [r.title, r.matchedUserIngredients.length, r.matchScore])).toEqual([
        ['Pizza', 2, 0.6],
        ['Tomato toast', 2, 0.6],
      ])
    },
  )

  it('returns nothing for a staples-only fridge while staples are assumed', () => {
    const sweets = [
      titled('Ghee rice', ['ghee', 'rice']),
      titled('Scones', ['self-raising flour', 'milk']),
      titled('Fudge', ['brown sugar', 'butter', 'cream']),
    ]
    const fridge = ['sugar', 'butter', 'flour', 'olive oil']
    expect(rankRecipes(fridge, sweets, { assumeStaples: true, sort: 'best' })).toEqual([])
    expect(
      rankRecipes(fridge, sweets, { assumeStaples: false, sort: 'best' }).map((r) => r.title),
    ).toEqual(['Fudge', 'Ghee rice', 'Scones'])
  })

  it('returns nothing for an empty user list', () => {
    expect(rankRecipes([], recipes, { assumeStaples: true, sort: 'best' })).toEqual([])
  })

  // Chicken rice: 0 missing, 0.8667, 40 min. Omelette: 1 missing, 0.5, 10 min.
  // Chicken soup: 2 missing, 0.6667, 60 min. Each key puts them in a different order.
  it.each([
    ['fewest-missing', ['Chicken rice', 'Omelette', 'Chicken soup']],
    ['best', ['Chicken rice', 'Chicken soup', 'Omelette']],
    ['quickest', ['Omelette', 'Chicken rice', 'Chicken soup']],
  ] as const)('orders by %s', (sort, titles) => {
    const ranked = rankRecipes(['chicken', 'onion', 'egg', 'rice', 'carrot', 'potato'], recipes, {
      assumeStaples: true,
      sort,
    })
    expect(ranked.map((r) => r.title)).toEqual(titles)
  })

  it('attaches fresh match fields to copies and leaves the inputs untouched', () => {
    const stale = {
      id: 'local:1',
      ...titled('Rice bowl', ['rice', 'egg']),
      usedIngredients: ['stale'],
      missingIngredients: [],
      matchedUserIngredients: ['stale'],
      matchScore: 1,
    }
    const input = [stale]
    const ranked = rankRecipes(['rice'], input, { assumeStaples: true, sort: 'best' })
    expect(ranked).not.toBe(input)
    expect(ranked[0]).not.toBe(stale)
    expect(ranked[0]).toEqual({
      ...stale,
      usedIngredients: ['rice'],
      missingIngredients: ['egg'],
      matchedUserIngredients: ['rice'],
      matchScore: 0.5,
    })
    expect(stale.matchScore).toBe(1)
    expect(stale.usedIngredients).toEqual(['stale'])
  })

  it('matches scoreRecipe for every ranked recipe', () => {
    const user = ['chicken', 'cheese', 'onion', 'rice']
    const options = { assumeStaples: true, sort: 'best' } as const
    for (const ranked of rankRecipes(user, recipes, options)) {
      const { title, readyInMinutes, ingredients, ...result } = ranked
      const source = recipes.find((r) => r.title === title)
      expect(source).toEqual({ title, readyInMinutes, ingredients })
      expect(result).toEqual(scoreRecipe(user, ranked, options))
    }
  })
})
