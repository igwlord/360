import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';

// 1. Create the Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (Fresh data)
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 Days (Keep cache garbage collection disabled for a week for offline)
      retry: 1, 
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // CRITICAL: Treat cache as source of truth if offline
    },
    mutations: {
        networkMode: 'offlineFirst', // CRITICAL: Allow mutations to fire (and fail/queue) even if offline
    }
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
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Days
};
