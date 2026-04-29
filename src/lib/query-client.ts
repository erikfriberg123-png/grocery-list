import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // realtime subscriptions handle item freshness; 5 min prevents needless refetches
      retry: 2,
    },
  },
});
