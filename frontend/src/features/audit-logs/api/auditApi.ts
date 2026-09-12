import { useInfiniteQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import type { AuditLogEntry } from '../types';

interface ListResponse {
  data: AuditLogEntry[];
  meta: { nextCursor: string | null; hasNextPage: boolean };
}

export function useAuditLogs(filters: { entityType?: string; action?: string }) {
  return useInfiniteQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const res = await axiosClient.get<ListResponse>('/audit-logs', {
        params: { ...filters, cursor: pageParam },
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.nextCursor ?? undefined : undefined),
  });
}
