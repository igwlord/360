import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';

// 1. Create the Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data considers fresh for 5 mins)
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours (data stays in cache for 24h)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't aggressive refetch on tab switch (save battery/data)
    },
  },
});

// 2. Create the Persister (IndexedDB wrapper)
// We use idb-keyval for a simple Promise-based key-val store on top of IndexedDB
const idbPersister = {
  persistClient: async (client) => {
    await set('reactQueryClient', client);
  },
  restoreClient: async () => {
    return await get('reactQueryClient');
  },
  removeClient: async () => {
    await del('reactQueryClient');
  },
};

// 3. Initialize Persistence
// This automatically saves the cache to IndexedDB and rehydrates it on load
export const persistOptions = {
  persister: idbPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
};
