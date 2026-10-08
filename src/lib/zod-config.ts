import { z } from 'zod'

/**
 * Zod probes `Function("")` on first use to compile faster validators. The Content-Security-Policy
 * forbids eval, so the probe fails and Chrome reports a CSP issue on every page. Zod works the
 * same without it, so skip the probe (imported once, before any schema runs in the browser).
 */
z.config({ jitless: true })
