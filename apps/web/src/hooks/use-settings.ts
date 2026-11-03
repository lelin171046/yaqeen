import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { StoreSettingsDto } from '@/lib/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get<{ settings: StoreSettingsDto }>('/settings');
      return response.data.settings;
    },
    staleTime: 5 * 60_000,
  });
}
