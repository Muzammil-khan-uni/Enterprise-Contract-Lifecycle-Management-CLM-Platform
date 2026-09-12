import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { Contract, ContractVersion, ContractListFilters } from '../types';

interface ListResponse {
  data: Contract[];
  meta: { nextCursor: string | null; hasNextPage: boolean };
}

export function useContracts(filters: Omit<ContractListFilters, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: ['contracts', filters],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const res = await axiosClient.get<ListResponse>('/contracts', {
        params: { ...filters, cursor: pageParam },
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.nextCursor ?? undefined : undefined),
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Contract }>(`/contracts/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useContractVersions(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-versions', contractId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ContractVersion[] }>(`/contracts/${contractId}/versions`);
      return res.data.data;
    },
    enabled: !!contractId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await axiosClient.post<{ data: Contract }>('/contracts', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await axiosClient.patch<{ data: Contract }>(`/contracts/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export interface FieldDiff {
  field: string;
  before: unknown;
  after: unknown;
}

interface CompareResponse {
  versionNumber: number;
  comparedTo: number | null;
  diffs: FieldDiff[];
}

export function useVersionComparison(contractId: string | undefined, versionId: string | null) {
  return useQuery({
    queryKey: ['version-comparison', contractId, versionId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: CompareResponse }>(
        `/contracts/${contractId}/versions/${versionId}/compare`
      );
      return res.data.data;
    },
    enabled: !!contractId && !!versionId,
  });
}

interface CompareRangeResponse {
  from: number | null;
  to: number;
  diffs: FieldDiff[];
}

export function useVersionRangeComparison(contractId: string | undefined, from: number | null, to: number | null) {
  return useQuery({
    queryKey: ['version-range-comparison', contractId, from, to],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: CompareRangeResponse }>(`/contracts/${contractId}/versions/compare`, {
        params: { from, to },
      });
      return res.data.data;
    },
    enabled: !!contractId && from != null && to != null,
  });
}

export function useRollbackVersion(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetVersionNumber: number) => {
      const res = await axiosClient.post<{ data: ContractVersion }>(`/contracts/${contractId}/versions/rollback`, {
        targetVersionNumber,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-versions', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

export function useArchiveContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await axiosClient.delete<{ data: Contract }>(`/contracts/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useRenewContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { newExpiryDate?: string; contractValue?: number }) => {
      const res = await axiosClient.post<{ data: Contract }>(`/contracts/${id}/renew`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-candidates'] });
    },
  });
}

export function useRenewalCandidates() {
  return useQuery({
    queryKey: ['renewal-candidates'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Contract[] }>('/contracts/renewals');
      return res.data.data;
    },
  });
}
