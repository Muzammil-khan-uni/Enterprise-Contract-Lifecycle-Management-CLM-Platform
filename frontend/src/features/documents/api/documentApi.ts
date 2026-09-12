import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { ContractDocument, DocumentType } from '../types';

export function useContractDocuments(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: async () => {
      const res = await axiosClient.get<{ data: ContractDocument[] }>(`/contracts/${contractId}/documents`);
      return res.data.data;
    },
    enabled: !!contractId,
  });
}

export function useUploadDocument(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: DocumentType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const res = await axiosClient.post<{ data: ContractDocument }>(
        `/contracts/${contractId}/documents`,
        formData
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', contractId] });
    },
  });
}

export function useDeleteDocument(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await axiosClient.delete(`/contracts/${contractId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', contractId] });
    },
  });
}

export function useDownloadDocument(contractId: string) {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await axiosClient.get<{ data: { url: string } }>(
        `/contracts/${contractId}/documents/${documentId}/download`
      );
      return res.data.data.url;
    },
    onSuccess: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}
