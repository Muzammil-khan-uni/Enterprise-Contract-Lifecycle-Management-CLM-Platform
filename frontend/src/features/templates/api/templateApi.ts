import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { Template, Clause, TemplateVersion, TemplateVersionComparison } from '../types';

interface ListResponse<T> {
  data: T[];
}
interface ItemResponse<T> {
  data: T;
}

export function useActiveTemplates() {
  return useQuery({
    queryKey: ['active-templates'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<Template>>('/templates');
      return res.data.data;
    },
  });
}

export function useAdminTemplates() {
  return useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<Template>>('/templates/admin');
      return res.data.data;
    },
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const res = await axiosClient.get<ItemResponse<Template>>(`/templates/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useTemplateForAuthoring(id: string | undefined) {
  return useQuery({
    queryKey: ['template-for-authoring', id],
    queryFn: async () => {
      const res = await axiosClient.get<ItemResponse<Template>>(`/templates/${id}/for-authoring`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export interface TemplateInput {
  name: string;
  contractType: string;
  sections: { title: string; order: number; clauses: string[] }[];
  variables: { name: string; label: string; type: 'text' | 'number' | 'date' | 'boolean'; required: boolean }[];
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TemplateInput) => {
      const res = await axiosClient.post<ItemResponse<Template>>('/templates', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-templates'] }),
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TemplateInput> & { isActive?: boolean; changeSummary?: string }) => {
      const res = await axiosClient.patch<ItemResponse<Template>>(`/templates/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['template-versions', id] });
    },
  });
}

export function useTemplateVersions(templateId: string | undefined) {
  return useQuery({
    queryKey: ['template-versions', templateId],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<TemplateVersion>>(`/templates/${templateId}/versions`);
      return res.data.data;
    },
    enabled: !!templateId,
  });
}

export function useCompareTemplateVersions(templateId: string | undefined, from: number | null, to: number | null) {
  return useQuery({
    queryKey: ['template-version-compare', templateId, from, to],
    queryFn: async () => {
      const res = await axiosClient.get<ItemResponse<TemplateVersionComparison>>(
        `/templates/${templateId}/versions/compare`,
        { params: { from, to } }
      );
      return res.data.data;
    },
    enabled: !!templateId && from !== null && to !== null,
  });
}

export function useRollbackTemplateVersion(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetVersionNumber: number) => {
      const res = await axiosClient.post<ItemResponse<Template>>(`/templates/${templateId}/versions/rollback`, {
        targetVersionNumber,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] });
    },
  });
}

export function useClauses(category?: string) {
  return useQuery({
    queryKey: ['clauses', category ?? 'all'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse<Clause>>('/templates/clauses/all', {
        params: category ? { category } : undefined,
      });
      return res.data.data;
    },
  });
}

export interface ClauseInput {
  title: string;
  category: string;
  text: string;
  isMandatory: boolean;
  applicableContractTypes: string[];
}

export function useCreateClause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClauseInput) => {
      const res = await axiosClient.post<ItemResponse<Clause>>('/templates/clauses', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clauses'] }),
  });
}

export function useUpdateClause(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ClauseInput>) => {
      const res = await axiosClient.patch<ItemResponse<Clause>>(`/templates/clauses/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clauses'] }),
  });
}

export function useDeleteClause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/templates/clauses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clauses'] }),
  });
}
