/**
 * Message key for a cuisine or category label ("Saudi Arabian" → "saudi-arabian"), used as
 * `cuisine.<slug>` / `category.<slug>` in messages/*.json. Labels come from the data in English,
 * so the slug is the stable bridge to both catalogs.
 */
export function labelSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
