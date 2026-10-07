/**
 * TheMealDB strCountry → the English cuisine label stored on each local recipe (the UI translates
 * it by slug). strArea is null on about a quarter of the meals while strCountry is always set, so
 * the label comes from the country. Covers every country TheMealDB used when the dataset was
 * seeded; a new one makes the seed stop and ask for a label rather than guess.
 */
export const COUNTRY_CUISINES: Readonly<Record<string, string>> = {
  Afghanistan: 'Afghan',
  Albania: 'Albanian',
  Algeria: 'Algerian',
  Andorra: 'Andorran',
  Angola: 'Angolan',
  'Antigua and Barbuda': 'Antiguan',
  Argentina: 'Argentinian',
  Armenia: 'Armenian',
  Aruba: 'Aruban',
  Australia: 'Australian',
  Austria: 'Austrian',
  Azerbaijan: 'Azerbaijani',
  Bahamas: 'Bahamian',
  Bangladesh: 'Bangladeshi',
  Barbados: 'Barbadian',
  Belgium: 'Belgian',
  Botswana: 'Botswanan',
  Brazil: 'Brazilian',
  Bulgaria: 'Bulgarian',
  Cambodia: 'Cambodian',
  Canada: 'Canadian',
  'Cayman Islands': 'Caymanian',
  Chile: 'Chilean',
  China: 'Chinese',
  Colombia: 'Colombian',
  'Costa Rica': 'Costa Rican',
  Croatia: 'Croatian',
  Cuba: 'Cuban',
  Denmark: 'Danish',
  // The island nation, not the Dominican Republic; both use the same English adjective.
  Dominica: 'Dominican',
  Egypt: 'Egyptian',
  Estonia: 'Estonian',
  France: 'French',
  Greece: 'Greek',
  India: 'Indian',
  Ireland: 'Irish',
  Italy: 'Italian',
  Jamaica: 'Jamaican',
  Japan: 'Japanese',
  Kenya: 'Kenyan',
  Laos: 'Lao',
  Malaysia: 'Malaysian',
  Mexico: 'Mexican',
  Morocco: 'Moroccan',
  Netherlands: 'Dutch',
  Norway: 'Norwegian',
  Philippines: 'Filipino',
  Poland: 'Polish',
  Portugal: 'Portuguese',
  Russia: 'Russian',
  'Saudi Arabia': 'Saudi Arabian',
  Slovakia: 'Slovak',
  Spain: 'Spanish',
  Syria: 'Syrian',
  Thailand: 'Thai',
  Tunisia: 'Tunisian',
  Turkey: 'Turkish',
  Ukraine: 'Ukrainian',
  'United Kingdom': 'British',
  'United States': 'American',
  Uruguay: 'Uruguayan',
  Venezuela: 'Venezuelan',
  Vietnam: 'Vietnamese',
}

/**
 * Labels no country maps to, used only by data/cuisine-overrides.json: TheMealDB files Beef and
 * Chicken Mandi under India, but mandi is from the Arabian Peninsula (Yemen and Saudi Arabia).
 */
export const OVERRIDE_ONLY_CUISINES: readonly string[] = ['Arabian']

/** Every label a local recipe can carry, A–Z: the list the UI needs a translation for. */
export const CUISINE_LABELS: readonly string[] = [
  ...new Set([...Object.values(COUNTRY_CUISINES), ...OVERRIDE_ONLY_CUISINES]),
].sort()

/** Middle East and North Africa cuisines, for the dataset's regional balance target. */
export const MENA_CUISINES: ReadonlySet<string> = new Set([
  'Algerian',
  'Arabian',
  'Egyptian',
  'Moroccan',
  'Saudi Arabian',
  'Syrian',
  'Tunisian',
  'Turkish',
])

export function cuisineForCountry(country: string): string | undefined {
  return Object.hasOwn(COUNTRY_CUISINES, country) ? COUNTRY_CUISINES[country] : undefined
}
