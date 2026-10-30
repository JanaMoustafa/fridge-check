import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from '@/lib/i18n/locale'

const SYNC_FLAG = 'fc:locale-sync'

/**
 * Inline script that runs in <head> before first paint (rendered with the CSP nonce). Keeps the
 * locale cookie (read by the server) and localStorage (owner requirement) in sync:
 * - cookie present, storage empty → mirror the cookie into storage;
 * - storage holds a different locale than the cookie → rewrite the cookie and reload once per session.
 * Every storage access is guarded: private browsing modes can throw on access.
 */
export const PREPAINT_SCRIPT = `(function(){var d=document.documentElement;try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);var c=m?m[1]:null;var s=localStorage.getItem('${LOCALE_STORAGE_KEY}');var ok=function(v){return v==='en'||v==='ar'};if(ok(c)&&!ok(s)){localStorage.setItem('${LOCALE_STORAGE_KEY}',c)}else if(ok(s)&&s!==c){if(sessionStorage.getItem('${SYNC_FLAG}')!==s){sessionStorage.setItem('${SYNC_FLAG}',s);document.cookie='${LOCALE_COOKIE}='+s+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');if(s!==d.lang)location.reload()}}}catch(e){}})();`
