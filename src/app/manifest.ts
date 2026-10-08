import type { MetadataRoute } from 'next'

/**
 * Lets the site be added to a phone's home screen, opening full-screen with its own name, icon
 * and colours. No service worker: favorites and the shopping list already work offline through
 * the browser's storage, and recipes need the network anyway.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fridge Check',
    short_name: 'Fridge Check',
    description: 'Add the ingredients in your fridge and find recipes that use them.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#edf2ef',
    theme_color: '#edf2ef',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
