import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CategoryInput, CategoryUpdateInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { CategoryDto } from '@/lib/types';

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await api.get<{ items: CategoryDto[] }>('/admin/categories');
      return response.data.items;
    },
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const response = await api.post<{ category: CategoryDto }>('/admin/categories', input);
      return response.data.category;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CategoryUpdateInput }) => {
      const response = await api.patch<{ category: CategoryDto }>(
        `/admin/categories/${id}`,
        input,
      );
      return response.data.category;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: invalidate,
  });
}
