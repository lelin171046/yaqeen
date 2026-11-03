import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductInput, ProductUpdateInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { ProductDto, ProductListResponse } from '@/lib/types';

export interface AdminProductQueryParams {
  search?: string;
  category?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
}

export function useAdminProducts(params: AdminProductQueryParams) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const response = await api.get<ProductListResponse>('/admin/products', {
        params: {
          ...params,
          active: params.active === undefined ? undefined : String(params.active),
        },
      });
      return response.data;
    },
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const response = await api.get<{ product: ProductDto }>(`/admin/products/${id}`);
      return response.data.product;
    },
    enabled: Boolean(id),
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'product'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const response = await api.post<{ product: ProductDto }>('/admin/products', input);
      return response.data.product;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductUpdateInput }) => {
      const response = await api.patch<{ product: ProductDto }>(
        `/admin/products/${id}`,
        input,
      );
      return response.data.product;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`);
    },
    onSuccess: invalidate,
  });
}
