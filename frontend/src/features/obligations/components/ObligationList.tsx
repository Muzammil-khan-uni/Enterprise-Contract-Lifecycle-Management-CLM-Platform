import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, FileCheck } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { useCompleteObligation } from '../api/obligationApi';
import { useContractDocuments } from '../../documents/api/documentApi';
import type { Obligation, ObligationStatus } from '../types';
import { useToast } from '../../../shared/hooks/useToast';
import { humanizeLabel } from '../../../shared/lib/display';

const TONE: Record<ObligationStatus, 'neutral' | 'success' | 'danger' | 'warning'> = {
  Pending: 'neutral',
  Completed: 'success',
  Overdue: 'danger',
  Waived: 'warning',
};

function contractIdOf(ob: Obligation): string {
  return typeof ob.contract === 'string' ? ob.contract : ob.contract._id;
}

function CompleteDeliverableControl({ obligation }: { obligation: Obligation }) {
  const contractId = contractIdOf(obligation);
  const { data: documents } = useContractDocuments(contractId);
  const complete = useCompleteObligation();
  const { showToast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState('');

  return (
    <div className="flex items-center gap-1.5">
      <Select
        className="w-auto text-xs py-1"
        value={selectedDoc}
        onChange={(e) => setSelectedDoc(e.target.value)}
        aria-label="Select evidence document"
      >
        <option value="">Select evidence…</option>
        {documents?.map((doc) => (
          <option key={doc._id} value={doc._id}>
            {doc.fileName}
          </option>
        ))}
      </Select>
      <Button
        variant="secondary"
        size="sm"
        disabled={!selectedDoc}
        loading={complete.isPending}
        onClick={() => complete.mutate({ id: obligation._id, evidence: selectedDoc }, { onSuccess: () => showToast('Obligation marked done') })}
      >
        <FileCheck size={13} />
        Mark done
      </Button>
    </div>
  );
}

export function ObligationList({ obligations, showContractLink = false }: { obligations: Obligation[]; showContractLink?: boolean }) {
  const complete = useCompleteObligation();
  const { showToast } = useToast();

  if (obligations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-in">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <ListChecks size={20} />
        </span>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No obligations recorded</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-ink-800">
      {obligations.map((ob, i) => (
        <li
          key={ob._id}
          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm animate-fade-in-up"
          style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
        >
          <div className="min-w-0">
            <span className="font-medium text-slate-900 dark:text-white">{humanizeLabel(ob.type)}</span>
            {ob.type === 'Payment' && ob.amount !== null && (
              <span className="font-medium text-slate-700 dark:text-slate-300 ml-2">
                {ob.currency} {ob.amount.toLocaleString()}
              </span>
            )}
            {ob.type === 'SLA' && ob.breached && <Badge tone="danger">Breached</Badge>}
            <span className="text-slate-500 dark:text-slate-400 ml-2">{ob.description}</span>
            {ob.type === 'SLA' && (ob.slaThreshold || ob.slaPenalty) && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {ob.slaThreshold && <span>Threshold: {ob.slaThreshold}</span>}
                {ob.slaThreshold && ob.slaPenalty && ' · '}
                {ob.slaPenalty && <span>Penalty: {ob.slaPenalty}</span>}
              </p>
            )}
            {ob.recurrence !== 'None' && (
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">({ob.recurrence})</span>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Due {new Date(ob.dueDate).toLocaleDateString()}
              {showContractLink && (
                <>
                  {' · '}
                  {typeof ob.contract === 'string' ? (
                    <Link to={`/contracts/${ob.contract}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
                      View contract
                    </Link>
                  ) : (
                    <Link to={`/contracts/${ob.contract._id}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
                      {ob.contract.title} ({ob.contract.contractNumber})
                    </Link>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={TONE[ob.status]}>{humanizeLabel(ob.status)}</Badge>
            {ob.status === 'Pending' &&
              (ob.type === 'Deliverable' ? (
                <CompleteDeliverableControl obligation={ob} />
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => complete.mutate({ id: ob._id }, { onSuccess: () => showToast('Obligation marked done') })}
                  loading={complete.isPending}
                >
                  <FileCheck size={13} />
                  Mark done
                </Button>
              ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
