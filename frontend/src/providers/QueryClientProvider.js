import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configurar QueryClient con tiempos apropiados para móvil + offline
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

export const AppQueryClientProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
