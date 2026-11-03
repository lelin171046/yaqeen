import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput } from '@yaqeen/shared';
import { api } from '@/lib/api';
import type { AdminDto } from '@/lib/types';

const SESSION_KEY = ['admin', 'session'];

export function useAdminSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      const response = await api.get<{ admin: AdminDto }>('/admin/auth/me');
      return response.data.admin;
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await api.post<{ admin: AdminDto }>('/admin/auth/login', input);
      return response.data.admin;
    },
    onSuccess: (admin) => {
      queryClient.setQueryData(SESSION_KEY, admin);
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/admin/auth/logout');
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['admin'] });
      window.location.assign('/admin/login');
    },
  });
}
