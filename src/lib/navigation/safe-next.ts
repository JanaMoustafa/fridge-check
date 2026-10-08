/**
 * A "next" page to return to after signing in or saving, only if it is a path on this site:
 * "/recipe/local/53027?i=rice" is kept; "//evil.example", "https://…", "javascript:" and
 * backslash tricks are refused (null), so the parameter can never redirect off-site.
 */
export function safeNext(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (/[\u0000-\u001f\u007f]/.test(value)) return null
  return value
}
