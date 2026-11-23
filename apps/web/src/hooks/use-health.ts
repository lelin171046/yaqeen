import { useQuery } from '@tanstack/react-query';
import type { ApiHealth } from '@anando-deal/shared';
import { api } from '@/lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<ApiHealth>('/health');
      return response.data;
    },
    refetchInterval: 60_000,
    retry: 1,
  });
}
