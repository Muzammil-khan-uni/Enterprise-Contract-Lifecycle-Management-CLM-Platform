import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { Vendor } from '../types';

interface ListResponse<T> {
  data: T[];
}
interface ItemResponse<T> {
  data: T;
}

export function useAdminVendors() {
  return useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<Vendor>>('/vendors/admin');
      return res.data.data;
    },
  });
}

export interface CreateVendorInput {
  name: string;
  vendorCode: string;
  contactEmail?: string;
  contactPhone?: string;
  country: string;
  businessUnits?: string[];
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const res = await axiosClient.post<ItemResponse<Vendor>>('/vendors', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-vendors'] }),
  });
}

export interface UpdateVendorInput {
  name?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string;
  riskRating?: 'Low' | 'Medium' | 'High' | null;
  isActive?: boolean;
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateVendorInput) => {
      const res = await axiosClient.patch<ItemResponse<Vendor>>(`/vendors/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-vendors'] }),
  });
}
