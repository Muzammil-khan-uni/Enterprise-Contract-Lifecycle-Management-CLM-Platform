import { Link } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import type { Contract } from '../types';
import { ContractStatusBadge } from './ContractStatusBadge';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import { humanizeLabel } from '../../../shared/lib/display';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function ContractTable({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <FileSearch size={20} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No contracts match your filters</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try a different status or search term.</p>
        </div>
      </div>
    );
  }

  return (
    <TableContainer>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Contract #</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Title</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Type</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Status</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Expiry</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c, i) => (
            <tr
              key={c._id}
              className="border-b border-slate-100 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 15) * 30}ms`, animationFillMode: 'backwards' }}
            >
              <td className="py-2.5 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.contractNumber}</td>
              <td className="py-2.5 pr-4">
                <Link to={`/contracts/${c._id}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium">
                  {c.title}
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{humanizeLabel(c.contractType)}</td>
              <td className="py-2.5 pr-4">
                <ContractStatusBadge status={c.status} />
              </td>
              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(c.expiryDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableContainer>
  );
}
