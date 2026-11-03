import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderLinkInput, OrderLinkUpdateInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { OrderLinkDto } from '@/lib/types';

export function useAdminLinks() {
  return useQuery({
    queryKey: ['admin', 'links'],
    queryFn: async () => {
      const response = await api.get<{ items: OrderLinkDto[] }>('/admin/links');
      return response.data.items;
    },
  });
}

function useInvalidateLinks() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'links'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };
}

export function useCreateLink() {
  const invalidate = useInvalidateLinks();

  return useMutation({
    mutationFn: async (input: OrderLinkInput) => {
      const response = await api.post<{ link: OrderLinkDto }>('/admin/links', input);
      return response.data.link;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateLink() {
  const invalidate = useInvalidateLinks();

  return useMutation({
    mutationFn: async ({ code, input }: { code: string; input: OrderLinkUpdateInput }) => {
      const response = await api.patch<{ link: OrderLinkDto }>(
        `/admin/links/${encodeURIComponent(code)}`,
        input,
      );
      return response.data.link;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteLink() {
  const invalidate = useInvalidateLinks();

  return useMutation({
    mutationFn: async (code: string) => {
      await api.delete(`/admin/links/${encodeURIComponent(code)}`);
    },
    onSuccess: invalidate,
  });
}
