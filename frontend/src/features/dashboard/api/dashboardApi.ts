import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { DashboardSummary, ExpiringContract, DepartmentBreakdown, VendorBreakdown, ScoredContract } from '../types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: DashboardSummary }>('/dashboard/summary');
      return res.data.data;
    },
  });
}

export function useExpiringContracts() {
  return useQuery({
    queryKey: ['dashboard-expiring'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ExpiringContract[] }>('/dashboard/expiring');
      return res.data.data;
    },
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: ['dashboard-by-department'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: DepartmentBreakdown[] }>('/dashboard/by-department');
      return res.data.data;
    },
  });
}

export function useVendorBreakdown() {
  return useQuery({
    queryKey: ['dashboard-by-vendor'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: VendorBreakdown[] }>('/dashboard/by-vendor');
      return res.data.data;
    },
  });
}

export function useTopRiskContracts(limit = 10) {
  return useQuery({
    queryKey: ['dashboard-risk', limit],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ScoredContract[] }>('/dashboard/risk', { params: { limit } });
      return res.data.data;
    },
  });
}
