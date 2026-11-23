import type {
  SupportMessageInput,
  SupportMessageStatus,
  SupportMessageStatusUpdateInput,
  SupportReplyInput,
} from '@anando-deal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginationDto, SupportMessageDto } from '@/lib/types';

export interface SupportMessageQueryParams {
  status?: SupportMessageStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useSendSupportMessage() {
  return useMutation({
    mutationFn: async (input: SupportMessageInput) => {
      const response = await api.post<{ message: SupportMessageDto; delivered: boolean }>(
        '/support',
        input,
      );
      return response.data;
    },
  });
}

export function useAdminSupportMessages(params: SupportMessageQueryParams) {
  return useQuery({
    queryKey: ['admin', 'support', params],
    queryFn: async () => {
      const response = await api.get<{ items: SupportMessageDto[]; pagination: PaginationDto }>(
        '/admin/support',
        { params },
      );
      return response.data;
    },
  });
}

export function useAdminSupportMessage(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'support', id],
    queryFn: async () => {
      const response = await api.get<{ message: SupportMessageDto }>(
        `/admin/support/${encodeURIComponent(id ?? '')}`,
      );
      return response.data.message;
    },
    enabled: Boolean(id),
  });
}

function useInvalidateSupportMessages() {
  const queryClient = useQueryClient();

  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });

    if (id) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', id] });
    }
  };
}

export function useUpdateSupportMessageStatus(id: string) {
  const invalidate = useInvalidateSupportMessages();

  return useMutation({
    mutationFn: async (input: SupportMessageStatusUpdateInput) => {
      const response = await api.patch<{ message: SupportMessageDto }>(
        `/admin/support/${encodeURIComponent(id)}/status`,
        input,
      );
      return response.data.message;
    },
    onSuccess: () => invalidate(id),
  });
}

export function useReplySupportMessage(id: string) {
  const invalidate = useInvalidateSupportMessages();

  return useMutation({
    mutationFn: async (input: SupportReplyInput) => {
      const response = await api.post<{ message: SupportMessageDto }>(
        `/admin/support/${encodeURIComponent(id)}/reply`,
        input,
      );
      return response.data.message;
    },
    onSuccess: () => invalidate(id),
  });
}
