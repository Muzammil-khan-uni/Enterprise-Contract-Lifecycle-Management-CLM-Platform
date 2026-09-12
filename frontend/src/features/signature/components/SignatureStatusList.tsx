import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileSignature } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import type { Signature, SignatureStatus } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

const TONE: Record<SignatureStatus, 'neutral' | 'success' | 'danger'> = {
  Pending: 'neutral',
  Signed: 'success',
  Declined: 'danger',
  Voided: 'danger',
};

export function SignatureStatusList({ signatures, showContractLink = false }: { signatures: Signature[]; showContractLink?: boolean }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (signatures.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-in">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <FileSignature size={20} />
        </span>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No signatures requested yet</p>
      </div>
    );
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-ink-800">
      {signatures.map((sig) => {
        const isExpanded = expanded.has(sig._id);
        return (
          <li key={sig._id} className="py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-sm">
              <button
                type="button"
                onClick={() => toggle(sig._id)}
                className="flex items-center gap-1.5 min-w-0 text-left"
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Hide' : 'Show'} audit trail for ${sig.externalSignerName ?? sig.signer ?? 'this signer'}`}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                )}
                <span className="min-w-0">
                  <span className="text-slate-900 dark:text-white font-medium">
                    {sig.externalSignerName ?? sig.signer ?? 'Internal signer'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs">({humanizeLabel(sig.signerType)})</span>
                  {sig.signatureStatus === 'Pending' && (
                    <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs block sm:inline">— awaiting signature via {sig.provider}</span>
                  )}
                  {sig.signedAt && (
                    <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs block sm:inline">
                      — {sig.signatureStatus.toLowerCase()} {new Date(sig.signedAt).toLocaleString()}
                    </span>
                  )}
                  {showContractLink && typeof sig.contract !== 'string' && (
                    <Link
                      to={`/contracts/${sig.contract._id}`}
                      className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline ml-2 text-xs block sm:inline"
                    >
                      {sig.contract.title} ({sig.contract.contractNumber})
                    </Link>
                  )}
                </span>
              </button>
              <Badge tone={TONE[sig.signatureStatus]}>{humanizeLabel(sig.signatureStatus)}</Badge>
            </div>

            {isExpanded && (
              <ol className="mt-2 ml-[22px] space-y-1.5 border-l-2 border-slate-100 dark:border-ink-800 pl-3">
                {sig.auditTrail.length === 0 ? (
                  <li className="text-xs text-slate-400 dark:text-slate-500">No audit events recorded yet.</li>
                ) : (
                  sig.auditTrail.map((entry, i) => (
                    <li key={i} className="text-xs">
                      <span className="text-slate-700 dark:text-slate-300">{humanizeLabel(entry.action)}</span>
                      <span className="text-slate-400 dark:text-slate-500"> — {new Date(entry.timestamp).toLocaleString()} · {entry.actor}</span>
                    </li>
                  ))
                )}
              </ol>
            )}
          </li>
        );
      })}
    </ul>
  );
}
