import { useState } from 'react';
import { useVersionRangeComparison } from '../api/contractApi';
import type { ContractVersion } from '../types';

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export function VersionRangeCompare({ contractId, versions }: { contractId: string; versions: ContractVersion[] }) {
  const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const [from, setFrom] = useState<number>(sorted[0].versionNumber);
  const [to, setTo] = useState<number>(sorted[sorted.length - 1].versionNumber);

  const { data, isLoading } = useVersionRangeComparison(contractId, from, to);

  return (
    <div className="bg-slate-50 dark:bg-ink-950 rounded-md p-3 mb-4">
      <div className="flex items-center gap-3 mb-3 text-sm">
        <label htmlFor="version-compare-from" className="text-slate-600 dark:text-slate-400">From</label>
        <select id="version-compare-from" className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
          {sorted.map((v) => (
            <option key={v._id} value={v.versionNumber}>v{v.versionNumber}</option>
          ))}
        </select>
        <label htmlFor="version-compare-to" className="text-slate-600 dark:text-slate-400">To</label>
        <select id="version-compare-to" className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20" value={to} onChange={(e) => setTo(Number(e.target.value))}>
          {sorted.map((v) => (
            <option key={v._id} value={v.versionNumber}>v{v.versionNumber}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Comparing…</p>
      ) : !data || data.diffs.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No field-level differences between these versions.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
              <th className="pb-1.5 pr-3 font-semibold text-[10px] uppercase tracking-wider">Field</th>
              <th className="pb-1.5 pr-3 font-semibold text-[10px] uppercase tracking-wider">v{data.from ?? '—'}</th>
              <th className="pb-1.5 font-semibold text-[10px] uppercase tracking-wider">v{data.to}</th>
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
      )}
    </div>
  );
}
