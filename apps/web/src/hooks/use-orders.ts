import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateOrderInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { OrderDto } from '@/lib/types';

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const response = await api.post<{ order: OrderDto }>('/orders', input);
      return response.data.order;
    },
  });
}

export function useTrackOrder(orderNumber: string | undefined, phone: string | undefined) {
  return useQuery({
    queryKey: ['order', orderNumber, phone],
    queryFn: async () => {
      const response = await api.get<{ order: OrderDto }>(
        `/orders/track/${encodeURIComponent(orderNumber ?? '')}`,
        { params: { phone } },
      );
      return response.data.order;
    },
    enabled: Boolean(orderNumber && phone),
    retry: false,
  });
}
