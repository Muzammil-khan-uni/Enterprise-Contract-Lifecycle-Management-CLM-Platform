import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import type { ScoredContract } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

const LEVEL_TONE: Record<ScoredContract['risk']['level'], 'neutral' | 'info' | 'warning' | 'danger'> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Critical: 'danger',
};

export function RiskScoreTable({ contracts }: { contracts: ScoredContract[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-in">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
          <ShieldCheck size={20} />
        </span>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No contracts currently flagged for risk</p>
      </div>
    );
  }

  return (
    <TableContainer>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-ink-800">
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap"></th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Contract</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Status</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Risk</th>
            <th className="py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">Score</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c, i) => {
            const isExpanded = expandedId === c.contractId;
            return (
              <Fragment key={c.contractId}>
                <tr
                  className="border-b border-slate-50 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                  onClick={() => setExpandedId(isExpanded ? null : c.contractId)}
                >
                  <td className="py-2.5 pl-1 w-5">
                    <ChevronRight
                      size={14}
                      className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link
                      to={`/contracts/${c.contractId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium"
                    >
                      {c.title}
                    </Link>
                    <span className="text-slate-400 dark:text-slate-500 text-xs ml-2 font-mono whitespace-nowrap">{c.contractNumber}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{humanizeLabel(c.status)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={LEVEL_TONE[c.risk.level]}>
                      {c.risk.level === 'Critical' && <ShieldAlert size={11} className="-ml-0.5 mr-1" />}
                      {humanizeLabel(c.risk.level)}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300 font-medium">{c.risk.score}</td>
                </tr>
                {isExpanded && (
                  <tr className="bg-slate-50 dark:bg-ink-950 animate-fade-in-up">
                    <td colSpan={5} className="px-4 py-3">
                      {c.risk.factors.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No contributing factors.</p>
                      ) : (
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {c.risk.factors.map((f, j) => (
                            <li key={j} className="flex justify-between max-w-xs">
                              <span>{f.label}</span>
                              <span className="font-medium">+{f.points}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </TableContainer>
  );
}
