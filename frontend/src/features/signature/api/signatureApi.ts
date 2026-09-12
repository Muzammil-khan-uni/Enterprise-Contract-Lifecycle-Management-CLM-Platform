import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { Signature, SignerType } from '../types';

export function useMySignatures() {
  return useQuery({
    queryKey: ['my-signatures'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Signature[] }>('/signature/mine');
      return res.data.data;
    },
    refetchInterval: (query) => {
      const signatures = query.state.data;
      const stillPending = signatures?.some((s) => s.signatureStatus === 'Pending');
      return stillPending ? 15_000 : false;
    },
  });
}

export function useContractSignatures(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-signatures', contractId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: Signature[] }>(`/contracts/${contractId}/signature`);
      return res.data.data;
    },
    enabled: !!contractId,
    
    
    
    
    refetchInterval: (query) => {
      const signatures = query.state.data;
      const stillPending = signatures?.some((s) => s.signatureStatus === 'Pending');
      return stillPending ? 15_000 : false;
    },
  });
}

export function useInitiateSignature(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (signers: Array<{ signerType: SignerType; name: string; email: string; userId?: string }>) => {
      const res = await axiosClient.post<{ data: Signature[] }>(`/contracts/${contractId}/signature/initiate`, {
        signers,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-signatures', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}
