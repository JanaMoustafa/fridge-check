import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from '@/lib/i18n/locale'
import { THEME_COLOR_META_ID, THEME_COLORS, THEME_STORAGE_KEY } from '@/lib/theme/theme'

const SYNC_FLAG = 'fc:locale-sync'

/**
 * Inline script that runs in <head> before first paint (rendered with the CSP nonce).
 * 1. Applies a stored light/dark theme (data-theme + browser-chrome theme-color) so there is no
 *    flash of the wrong theme.
 * 2. Keeps the locale cookie (read by the server) and localStorage (owner requirement) in sync:
 *    - cookie present, storage empty → mirror the cookie into storage;
 *    - storage holds a different locale than the cookie → rewrite the cookie and reload once per session.
 * Every storage access is guarded: private browsing modes can throw on access.
 */
export const PREPAINT_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);var tc=document.createElement('meta');tc.id='${THEME_COLOR_META_ID}';tc.setAttribute('name','theme-color');tc.setAttribute('content',t==='dark'?'${THEME_COLORS.dark}':'${THEME_COLORS.light}');document.head.prepend(tc)}}catch(e){}try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);var c=m?m[1]:null;var s=localStorage.getItem('${LOCALE_STORAGE_KEY}');var ok=function(v){return v==='en'||v==='ar'};if(ok(c)&&!ok(s)){localStorage.setItem('${LOCALE_STORAGE_KEY}',c)}else if(ok(s)&&s!==c){if(sessionStorage.getItem('${SYNC_FLAG}')!==s){sessionStorage.setItem('${SYNC_FLAG}',s);document.cookie='${LOCALE_COOKIE}='+s+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');if(s!==d.lang)location.reload()}}}catch(e){}})();`
