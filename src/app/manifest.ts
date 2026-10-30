import type { MetadataRoute } from 'next'
import { THEME_COLOR } from '@/lib/theme/theme'

/**
 * Lets the site be added to a phone's home screen, opening full-screen with its own name, icon
 * and colours. No service worker: favorites and the shopping list already work offline through
 * the browser's storage, and recipes need the network anyway.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BiteDoneRight',
    short_name: 'BiteDoneRight',
    description: 'Add the ingredients in your fridge and find recipes that use them.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
