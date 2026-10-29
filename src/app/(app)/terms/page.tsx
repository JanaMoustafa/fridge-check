import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { LegalArticle } from '@/components/legal/LegalArticle'
import { legalDocument } from '@/lib/legal/documents'

export async function generateMetadata(): Promise<Metadata> {
  const doc = legalDocument('terms', await getLocale())
  return { title: doc.title, description: doc.description, alternates: { canonical: '/terms' } }
}

export default function TermsPage() {
  return <LegalArticle page="terms" />
}
