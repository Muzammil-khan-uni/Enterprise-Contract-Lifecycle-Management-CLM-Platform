import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { AdminUserProfile, DirectoryUser, UserRole } from '../types';

interface ListResponse<T> {
  data: T[];
}
interface ItemResponse<T> {
  data: T;
}

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<AdminUserProfile>>('/users');
      return res.data.data;
    },
  });
}

export function useUserDirectory() {
  return useQuery({
    queryKey: ['user-directory'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<DirectoryUser>>('/users/directory');
      return res.data.data;
    },
  });
}

export interface UpdateUserInput {
  role?: UserRole;
  businessUnit?: string | null;
  department?: string | null;
  permissionOverrides?: string[];
  isActive?: boolean;
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const res = await axiosClient.patch<ItemResponse<AdminUserProfile>>(`/users/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useCreateTeammate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string; role: UserRole }) => {
      const res = await axiosClient.post<ItemResponse<{ id: string }>>('/auth/register', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}
