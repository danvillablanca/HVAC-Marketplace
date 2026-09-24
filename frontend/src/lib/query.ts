import { QueryClient } from "@tanstack/react-query";

/** Cliente de React Query para cache y fetching de datos. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
