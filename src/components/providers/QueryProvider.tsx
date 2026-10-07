'use client'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import {
  PersistQueryClientProvider,
  type PersistedClient,
} from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'
import {
  deserializePersistedCache,
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_KEY,
  QUERY_CACHE_MAX_AGE,
} from '@/lib/search/persist'
import { sessionStore } from '@/lib/storage/safe-storage'

/**
 * Search results are cached for the tab's session (sessionStorage), so list → recipe → back
 * restores instantly with no network request. Results stay fresh for an hour (server TTL).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_CACHE_MAX_AGE,
            gcTime: QUERY_CACHE_MAX_AGE,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      key: QUERY_CACHE_KEY,
      storage: {
        getItem: (key) => sessionStore.get(key),
        setItem: (key, value) => void sessionStore.set(key, value),
        removeItem: (key) => sessionStore.remove(key),
      },
      // Validated against our schemas; TanStack's type is wider than what we accept.
      deserialize: (text) => deserializePersistedCache(text) as unknown as PersistedClient,
      throttleTime: 500,
    }),
  )

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && query.queryKey[0] === 'search',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
