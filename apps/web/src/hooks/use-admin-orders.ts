import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  OrderNotesUpdateInput,
  OrderPaymentUpdateInput,
  OrderStatusUpdateInput,
} from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { AdminOrderDto } from '@/lib/types';
import type { PaginationDto } from '@/lib/types';

export interface AdminOrderQueryParams {
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
}

export function useAdminOrders(params: AdminOrderQueryParams) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => {
      const response = await api.get<{
        items: AdminOrderDto[];
        pagination: PaginationDto;
      }>('/admin/orders', { params });
      return response.data;
    },
  });
}

export function useAdminOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'order', orderNumber],
    queryFn: async () => {
      const response = await api.get<{ order: AdminOrderDto }>(
        `/admin/orders/${encodeURIComponent(orderNumber ?? '')}`,
      );
      return response.data.order;
    },
    enabled: Boolean(orderNumber),
  });
}

function useInvalidateOrders() {
  const queryClient = useQueryClient();

  return (orderNumber?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });

    if (orderNumber) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderNumber] });
    }
  };
}

export function useUpdateOrderStatus(orderNumber: string) {
  const invalidate = useInvalidateOrders();

  return useMutation({
    mutationFn: async (input: OrderStatusUpdateInput) => {
      const response = await api.patch<{ order: AdminOrderDto }>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        input,
      );
      return response.data.order;
    },
    onSuccess: () => invalidate(orderNumber),
  });
}

export function useUpdateOrderPayment(orderNumber: string) {
  const invalidate = useInvalidateOrders();

  return useMutation({
    mutationFn: async (input: OrderPaymentUpdateInput) => {
      const response = await api.patch<{ order: AdminOrderDto }>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/payment`,
        input,
      );
      return response.data.order;
    },
    onSuccess: () => invalidate(orderNumber),
  });
}

export function useUpdateOrderNotes(orderNumber: string) {
  const invalidate = useInvalidateOrders();

  return useMutation({
    mutationFn: async (input: OrderNotesUpdateInput) => {
      const response = await api.patch<{ order: AdminOrderDto }>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/notes`,
        input,
      );
      return response.data.order;
    },
    onSuccess: () => invalidate(orderNumber),
  });
}
