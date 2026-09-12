import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { BusinessUnit, Department } from '../types';

interface ListResponse<T> {
  data: T[];
}
interface ItemResponse<T> {
  data: T;
}

export function useBusinessUnits() {
  return useQuery({
    queryKey: ['business-units'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<BusinessUnit>>('/business-units');
      return res.data.data;
    },
  });
}

export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; code: string; parentUnit?: string | null }) => {
      const res = await axiosClient.post<ItemResponse<BusinessUnit>>('/business-units', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-units'] }),
  });
}

export function useUpdateBusinessUnit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; code?: string; parentUnit?: string | null }) => {
      const res = await axiosClient.patch<ItemResponse<BusinessUnit>>(`/business-units/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-units'] }),
  });
}

export function useDeleteBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/business-units/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-units'] }),
  });
}

export function useDepartments(businessUnit?: string) {
  return useQuery({
    queryKey: ['departments', businessUnit ?? 'all'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<Department>>('/departments', {
        params: businessUnit ? { businessUnit } : undefined,
      });
      return res.data.data;
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; code: string; businessUnit: string; headOfDept?: string | null }) => {
      const res = await axiosClient.post<ItemResponse<Department>>('/departments', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; code?: string; businessUnit?: string; headOfDept?: string | null }) => {
      const res = await axiosClient.patch<ItemResponse<Department>>(`/departments/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/departments/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}
