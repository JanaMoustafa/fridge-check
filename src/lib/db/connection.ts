const LENIENT_SSL_MODES: ReadonlySet<string> = new Set(['prefer', 'require', 'verify-ca'])

/**
 * pg 8 treats sslmode=prefer/require/verify-ca as verify-full (certificate and host checked); pg 9
 * will give them their weaker libpq meaning. Neon's connection strings say "require", so pin the
 * strict mode here: an upgrade can never quietly stop checking the server's certificate.
 */
export function withStrictSsl(connectionString: string): string {
  const url = new URL(connectionString)
  if (LENIENT_SSL_MODES.has(url.searchParams.get('sslmode') ?? '')) {
    url.searchParams.set('sslmode', 'verify-full')
  }
  return url.toString()
}
