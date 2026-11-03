import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SettingsUpdateInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { AdminSettingsDto } from '@/lib/types';

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const response = await api.get<{ settings: AdminSettingsDto }>('/admin/settings');
      return response.data.settings;
    },
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SettingsUpdateInput) => {
      const response = await api.patch<{ settings: AdminSettingsDto }>(
        '/admin/settings',
        input,
      );
      return response.data.settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['admin', 'settings'], settings);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
