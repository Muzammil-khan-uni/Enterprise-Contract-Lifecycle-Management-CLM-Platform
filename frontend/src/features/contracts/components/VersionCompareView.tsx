import { useVersionComparison } from '../api/contractApi';
import { Skeleton } from '../../../shared/components/ui/Skeleton';

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export function VersionCompareView({ contractId, versionId }: { contractId: string; versionId: string }) {
  const { data, isLoading } = useVersionComparison(contractId, versionId);

  if (isLoading) return <Skeleton className="h-16 w-full mt-2" />;
  if (!data) return null;

  if (data.diffs.length === 0) {
    return <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 animate-fade-in">No field-level changes from the previous version.</p>;
  }

  return (
    <div className="mt-2 bg-slate-50 dark:bg-ink-950 rounded-md p-3 animate-fade-in-up">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Comparing v{data.versionNumber} to v{data.comparedTo ?? '—'}
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
            <th className="pb-1.5 pr-3 font-semibold text-[10px] uppercase tracking-wider">Field</th>
            <th className="pb-1.5 pr-3 font-semibold text-[10px] uppercase tracking-wider">Before</th>
            <th className="pb-1.5 font-semibold text-[10px] uppercase tracking-wider">After</th>
          </tr>
        </thead>
        <tbody>
          {data.diffs.map((d) => (
            <tr key={d.field} className="border-t border-slate-200 dark:border-ink-800">
              <td className="pr-3 py-1 text-slate-700 dark:text-slate-300">{d.field}</td>
              <td className="pr-3 py-1 text-danger-600 dark:text-danger-400">{formatValue(d.before)}</td>
              <td className="py-1 text-success-700 dark:text-success-200">{formatValue(d.after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
