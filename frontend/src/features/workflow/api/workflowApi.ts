import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { ApprovalWorkflow } from '../types';

export function useContractWorkflows(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-workflows', contractId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ApprovalWorkflow[] }>(`/contracts/${contractId}/workflow`);
      return res.data.data;
    },
    enabled: !!contractId,
  });
}

export function useSubmitForApproval(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post<{ data: ApprovalWorkflow }>(`/contracts/${contractId}/workflow/submit`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-workflows', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['approval-queue'],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ApprovalWorkflow[] }>('/workflow/queue');
      return res.data.data;
    },
  });
}

export function useApproveStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, comments }: { workflowId: string; comments?: string }) => {
      const res = await axiosClient.post<{ data: ApprovalWorkflow }>(`/workflow/${workflowId}/approve`, { comments });
      return res.data.data;
    },
    onSuccess: (workflow) => {
      const contractId = typeof workflow.contract === 'string' ? workflow.contract : workflow.contract._id;
      queryClient.invalidateQueries({ queryKey: ['contract-workflows', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
    },
  });
}

export function useRejectStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, comments }: { workflowId: string; comments?: string }) => {
      const res = await axiosClient.post<{ data: ApprovalWorkflow }>(`/workflow/${workflowId}/reject`, { comments });
      return res.data.data;
    },
    onSuccess: (workflow) => {
      const contractId = typeof workflow.contract === 'string' ? workflow.contract : workflow.contract._id;
      queryClient.invalidateQueries({ queryKey: ['contract-workflows', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
    },
  });
}
