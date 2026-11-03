import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardSummaryDto } from '@/lib/types';

export function useAdminDashboard(range: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', range],
    queryFn: async () => {
      const response = await api.get<DashboardSummaryDto>('/admin/dashboard', {
        params: { range },
      });
      return response.data;
    },
  });
}
