/**
 * Which database a maintenance script talks to: DATABASE_URL (this Mac's local database) by
 * default, the live one only with --production (PRODUCTION_DATABASE_URL), announced loudly.
 */
export function databaseUrl(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const production = args.includes('--production')
  const url = production ? env.PRODUCTION_DATABASE_URL : env.DATABASE_URL
  const name = production ? 'PRODUCTION_DATABASE_URL' : 'DATABASE_URL'
  if (!url) throw new Error(`${name} is not set (add it to .env.local).`)
  if (production) console.warn('⚠ Using the LIVE database.')
  return url
}

/** The arguments without the --production flag. */
export function withoutFlags(args: readonly string[]): string[] {
  return args.filter((arg) => arg !== '--production')
}
