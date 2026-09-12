import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RefreshCw, PartyPopper } from 'lucide-react';
import { useRenewalCandidates, useRenewContract } from '../api/contractApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import { useToast } from '../../../shared/hooks/useToast';
import type { Contract } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

function daysUntil(dateString: string): number {
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <Badge tone="neutral">No expiry date</Badge>;
  const days = daysUntil(expiryDate);
  if (days < 0) return <Badge tone="danger">Expired {Math.abs(days)}d ago</Badge>;
  if (days <= 30) return <Badge tone="warning">Expires in {days}d</Badge>;
  return <Badge tone="neutral">Expires in {days}d</Badge>;
}

function RenewalRow({ contract, delay = 0 }: { contract: Contract; delay?: number }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const renewContract = useRenewContract(contract._id);

  const handleSubmit = () => {
    setError(null);
    renewContract.mutate(
      {
        newExpiryDate: newExpiryDate ? localDateInputToISOString(newExpiryDate) : undefined,
        contractValue: contractValue ? Number(contractValue) : undefined,
      },
      {
        onSuccess: (renewed) => {
          showToast('Contract renewed');
          navigate(`/contracts/${renewed._id}`);
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      }
    );
  };

  return (
    <li className="py-3 animate-fade-in-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/contracts/${contract._id}`} className="font-medium text-slate-900 dark:text-white hover:text-brass-600 dark:hover:text-brass-300 hover:underline">
            {contract.title}
          </Link>
          <span className="text-slate-400 dark:text-slate-500 text-sm ml-2">{contract.contractNumber}</span>
          <div className="flex items-center gap-2 mt-1">
            <Badge tone="neutral">{humanizeLabel(contract.status)}</Badge>
            <ExpiryBadge expiryDate={contract.expiryDate} />
          </div>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setExpanded((v) => !v)}>
          <RefreshCw size={13} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Cancel' : 'Renew'}
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-end gap-2 bg-slate-50 dark:bg-ink-950 border border-slate-200 dark:border-ink-800 rounded-lg p-3 animate-fade-in-up">
          <div>
            <label htmlFor={`renew-expiry-${contract._id}`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              New expiry date (optional)
            </label>
            <Input
              id={`renew-expiry-${contract._id}`}
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`renew-value-${contract._id}`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Contract value (optional)
            </label>
            <Input
              id={`renew-value-${contract._id}`}
              type="number"
              step="0.01"
              placeholder={contract.contractValue?.toString() ?? ''}
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} loading={renewContract.isPending}>
            {renewContract.isPending ? 'Renewing…' : 'Confirm renewal'}
          </Button>
          {error && <p className="text-sm text-danger-600 dark:text-danger-400 w-full">{error}</p>}
        </div>
      )}
    </li>
  );
}

export default function RenewalsPage() {
  const { data: contracts, isLoading } = useRenewalCandidates();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader eyebrow="Workspace" title="Renewals" description="Active and expired contracts eligible for renewal, soonest first." />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : contracts?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
              <PartyPopper size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nothing needs renewal right now</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-ink-800">
            {contracts?.map((contract, i) => (
              <RenewalRow key={contract._id} contract={contract} delay={Math.min(i, 10) * 40} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
