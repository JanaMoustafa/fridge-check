import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'

/** One MSW server for unit tests; each test adds the handlers it needs with server.use(). */
export const server = setupServer()

/** Intercepts fetch for the calling test file; any request without a handler fails the test. */
export function interceptExternalApis() {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}
