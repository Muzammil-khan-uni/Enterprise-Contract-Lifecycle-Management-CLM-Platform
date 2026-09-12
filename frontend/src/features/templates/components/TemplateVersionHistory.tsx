import { useState } from 'react';
import { History, GitCompareArrows, Undo2 } from 'lucide-react';
import { useTemplateVersions, useCompareTemplateVersions, useRollbackTemplateVersion } from '../api/templateApi';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { useConfirm } from '../../../shared/hooks/useConfirm';

export function TemplateVersionHistory({ templateId }: { templateId: string }) {
  const { data: versions, isLoading } = useTemplateVersions(templateId);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const comparison = useCompareTemplateVersions(templateId, compareFrom, compareTo);
  const rollback = useRollbackTemplateVersion(templateId);
  const { showToast } = useToast();
  const confirm = useConfirm();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    );
  }
  if (!versions?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center animate-fade-in">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <History size={18} />
        </span>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No version history yet</p>
      </div>
    );
  }

  const handleRollback = async (versionNumber: number) => {
    setRollbackError(null);
    const ok = await confirm({
      title: `Roll back to version ${versionNumber}?`,
      message: 'This creates a new version restoring that state — it does not affect contracts already generated from this template.',
      confirmLabel: 'Roll back',
      tone: 'neutral',
    });
    if (!ok) return;
    rollback.mutate(versionNumber, {
      onSuccess: () => showToast(`Rolled back to version ${versionNumber}`),
      onError: (err) => setRollbackError(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
        <History size={14} className="text-slate-400 dark:text-slate-500" />
        Version history
      </h3>
      {rollbackError && <p className="text-sm text-danger-600 dark:text-danger-400">{rollbackError}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-ink-800 border border-slate-200 dark:border-ink-800 rounded-md">
        {versions.map((version, i) => (
          <li
            key={version._id}
            className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
          >
            <div className="min-w-0">
              <span className="font-medium text-slate-900 dark:text-white">v{version.versionNumber}</span>
              {version.isRollbackOf && <Badge tone="warning">Rollback</Badge>}
              <span className="text-slate-500 dark:text-slate-400 ml-2">{version.changeSummary ?? 'No summary'}</span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(version.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCompareTo(version.versionNumber);
                  setCompareFrom(version.versionNumber > 1 ? version.versionNumber - 1 : null);
                }}
              >
                <GitCompareArrows size={13} />
                Compare to previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleRollback(version.versionNumber)} loading={rollback.isPending}>
                <Undo2 size={13} />
                Roll back to this
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {compareTo !== null && (
        <div className="border border-slate-200 dark:border-ink-800 rounded-md p-3 animate-fade-in-up">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <GitCompareArrows size={13} className="text-slate-400 dark:text-slate-500" />
            Comparing v{compareFrom ?? '—'} → v{compareTo}
          </p>
          {comparison.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !comparison.data?.diffs.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No differences.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
                  <th className="pb-1.5 pr-2 font-semibold text-[10px] uppercase tracking-wider">Field</th>
                  <th className="pb-1.5 pr-2 font-semibold text-[10px] uppercase tracking-wider">Before</th>
                  <th className="pb-1.5 font-semibold text-[10px] uppercase tracking-wider">After</th>
                </tr>
              </thead>
              <tbody>
                {comparison.data.diffs.map((diff) => (
                  <tr key={diff.field} className="border-t border-slate-100 dark:border-ink-800 align-top">
                    <td className="py-1 pr-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{diff.field}</td>
                    <td className="py-1 pr-2 text-danger-600 dark:text-danger-400 break-all">{JSON.stringify(diff.before)}</td>
                    <td className="py-1 text-success-600 dark:text-success-300 break-all">{JSON.stringify(diff.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
