import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePrefetchData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all data simultaneously for instant loading
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['/api/complaints'],
        staleTime: 0, // Always fetch fresh data
      }),
      queryClient.prefetchQuery({
        queryKey: ['/api/complaints/stats'],
        staleTime: 0, // Critical: stats must be instant like chat
      }),
      queryClient.prefetchQuery({
        queryKey: ['/api/profile'],
        staleTime: 0,
      })
    ]);
  }, [queryClient]);
}