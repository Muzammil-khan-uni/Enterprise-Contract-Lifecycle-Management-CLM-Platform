import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useAuditLogs } from '../api/auditApi';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Select } from '../../../shared/components/ui/Select';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import type { AuditAction } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

const ACTION_TONE: Record<AuditAction, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  Create: 'success',
  Update: 'info',
  Delete: 'danger',
  Approve: 'success',
  Reject: 'danger',
  Sign: 'success',
  Download: 'neutral',
  StatusChange: 'info',
  Login: 'neutral',
};

const ENTITY_TYPES = ['Contract', 'ApprovalWorkflow', 'Signature', 'Obligation', 'Document', 'Auth'];

export default function AuditLogPage() {
  const [entityType, setEntityType] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
  });

  const entries = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Administration"
        title="Audit Log"
        description="A verified, append-only record of every action taken across your organization."
        actions={
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="sm:w-52">
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        }
      />

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <ScrollText size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No audit entries match this filter</p>
          </div>
        ) : (
          <TableContainer className="p-3 sm:p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
                <th className="py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider">Actor</th>
                <th className="py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                <th className="py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider">Entity</th>
                <th className="py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider">Entity ID</th>
                <th className="py-2.5 px-4 font-semibold text-[11px] uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry._id}
                  className="border-b border-slate-50 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 15) * 25}ms`, animationFillMode: 'backwards' }}
                >
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                    {entry.actor ? (
                      <span title={entry.actor.email}>{entry.actor.name}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">System</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge tone={ACTION_TONE[entry.action]}>{humanizeLabel(entry.action)}</Badge>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{humanizeLabel(entry.entityType)}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{entry.entityId ?? '—'}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </TableContainer>
        )}

        {hasNextPage && (
          <div className="py-4 text-center border-t border-slate-100 dark:border-ink-800">
            <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
