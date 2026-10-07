import { describe, expect, it } from 'vitest'
import fixture from '../../../tests/fixtures/mealdb-meals.sample.json'
import {
  COUNTRY_CUISINES,
  CUISINE_LABELS,
  MENA_CUISINES,
  OVERRIDE_ONLY_CUISINES,
  cuisineForCountry,
} from './cuisines'

/** Every strCountry in TheMealDB's 793 meals when the dataset was seeded (2026-10-06 snapshot). */
const SNAPSHOT_COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bangladesh',
  'Barbados',
  'Belgium',
  'Botswana',
  'Brazil',
  'Bulgaria',
  'Cambodia',
  'Canada',
  'Cayman Islands',
  'Chile',
  'China',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Denmark',
  'Dominica',
  'Egypt',
  'Estonia',
  'France',
  'Greece',
  'India',
  'Ireland',
  'Italy',
  'Jamaica',
  'Japan',
  'Kenya',
  'Laos',
  'Malaysia',
  'Mexico',
  'Morocco',
  'Netherlands',
  'Norway',
  'Philippines',
  'Poland',
  'Portugal',
  'Russia',
  'Saudi Arabia',
  'Slovakia',
  'Spain',
  'Syria',
  'Thailand',
  'Tunisia',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Venezuela',
  'Vietnam',
]

describe('cuisineForCountry', () => {
  it('maps every country in the snapshot', () => {
    expect(SNAPSHOT_COUNTRIES).toHaveLength(63)
    expect(
      SNAPSHOT_COUNTRIES.filter((country) => cuisineForCountry(country) === undefined),
    ).toEqual([])
  })

  it('maps every country in the fixture', () => {
    for (const meal of fixture.meals) expect(cuisineForCountry(meal.strCountry)).toBeDefined()
  })

  it.each([
    ['Egypt', 'Egyptian'],
    ['Saudi Arabia', 'Saudi Arabian'],
    ['United Kingdom', 'British'],
    ['United States', 'American'],
    ['Netherlands', 'Dutch'],
    ['Philippines', 'Filipino'],
  ])('%s → %s', (country, cuisine) => {
    expect(cuisineForCountry(country)).toBe(cuisine)
  })

  it('knows no other country, so a new one is never guessed', () => {
    expect(Object.keys(COUNTRY_CUISINES).sort()).toEqual(SNAPSHOT_COUNTRIES)
    expect(cuisineForCountry('Lebanon')).toBeUndefined()
    expect(cuisineForCountry('toString')).toBeUndefined()
  })
})

describe('cuisine labels', () => {
  it('are unique per country and sorted A–Z with the override-only labels', () => {
    const labels = Object.values(COUNTRY_CUISINES)
    expect(new Set(labels).size).toBe(labels.length)
    expect(CUISINE_LABELS).toEqual([...labels, ...OVERRIDE_ONLY_CUISINES].sort())
    expect(CUISINE_LABELS).toContain('Arabian')
  })

  it('count every MENA cuisine as a known label', () => {
    for (const cuisine of MENA_CUISINES) expect(CUISINE_LABELS).toContain(cuisine)
  })
})
