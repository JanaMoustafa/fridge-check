/**
 * Case, Latin accents and the Arabic spellings people type interchangeably (hamza seats, taa
 * marbuta, alef maqsura, short vowels, tatweel) all compare equal.
 */
export const foldForSearch = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
