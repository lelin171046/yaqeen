import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CategoryDto,
  ProductDto,
  ProductListResponse,
} from '@/lib/types';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
  page?: number;
  limit?: number;
  featured?: boolean;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ items: CategoryDto[] }>('/categories');
      return response.data.items;
    },
    staleTime: 5 * 60_000,
  });
}

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await api.get<ProductListResponse>('/products', {
        params: {
          ...params,
          featured: params.featured === undefined ? undefined : String(params.featured),
        },
      });
      return response.data;
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await api.get<{ product: ProductDto }>(`/products/${slug}`);
      return response.data.product;
    },
    enabled: Boolean(slug),
  });
}
