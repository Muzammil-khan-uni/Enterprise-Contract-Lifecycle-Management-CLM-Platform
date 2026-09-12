import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { Obligation, ObligationStatus } from '../types';

export function useContractObligations(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-obligations', contractId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Obligation[] }>(`/contracts/${contractId}/obligations`);
      return res.data.data;
    },
    enabled: !!contractId,
  });
}

export function useMyObligations(status?: ObligationStatus) {
  return useQuery({
    queryKey: ['my-obligations', status],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Obligation[] }>('/obligations/mine', { params: { status } });
      return res.data.data;
    },
  });
}

export function useCreateObligation(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      type: string;
      description: string;
      dueDate: string;
      recurrence?: string;
      assignedTo?: string;
      amount?: number;
      currency?: string;
      slaThreshold?: string;
      slaPenalty?: string;
    }) => {
      const res = await axiosClient.post<{ data: Obligation }>(`/contracts/${contractId}/obligations`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-obligations', contractId] });
      
      
      
      
      
      queryClient.invalidateQueries({ queryKey: ['my-obligations'] });
    },
  });
}

export function useCompleteObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, evidence }: { id: string; evidence?: string }) => {
      const res = await axiosClient.post<{ data: Obligation }>(`/obligations/${id}/complete`, { evidence });
      return res.data.data;
    },
    onSuccess: (obligation) => {
      
      
      
      
      const contractId = typeof obligation.contract === 'string' ? obligation.contract : obligation.contract._id;
      queryClient.invalidateQueries({ queryKey: ['contract-obligations', contractId] });
      queryClient.invalidateQueries({ queryKey: ['my-obligations'] });
    },
  });
}
