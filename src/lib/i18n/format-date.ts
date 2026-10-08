/** "7 November 2026" / "٧ نوفمبر ٢٠٢٦" with Western digits in Arabic too (owner decision). */
export function formatLongDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'long',
    numberingSystem: 'latn',
    timeZone: 'Africa/Cairo',
  }).format(date)
}
