import { Badge } from '../../../shared/components/ui/Badge';
import { humanizeLabel } from '../../../shared/lib/display';
import type { ContractStatus } from '../types';

const STATUS_TONE: Record<ContractStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  Draft: 'neutral',
  InReview: 'info',
  PendingApproval: 'warning',
  Approved: 'info',
  PendingSignature: 'warning',
  Signed: 'success',
  Active: 'success',
  Expired: 'danger',
  Terminated: 'danger',
  Renewed: 'success',
  Archived: 'neutral',
};

const DOT_TONE: Record<ContractStatus, string> = {
  Draft: 'bg-slate-400 dark:bg-slate-500',
  InReview: 'bg-info-500',
  PendingApproval: 'bg-warning-600',
  Approved: 'bg-info-500',
  PendingSignature: 'bg-warning-600',
  Signed: 'bg-success-500',
  Active: 'bg-success-500',
  Expired: 'bg-danger-500',
  Terminated: 'bg-danger-500',
  Renewed: 'bg-success-500',
  Archived: 'bg-slate-400 dark:bg-slate-500',
};

const PULSING_STATUSES: ContractStatus[] = ['Active'];

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]}>
      <span className="relative flex h-1.5 w-1.5 -ml-0.5 mr-1">
        {PULSING_STATUSES.includes(status) && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT_TONE[status]}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOT_TONE[status]}`} />
      </span>
      {humanizeLabel(status)}
    </Badge>
  );
}
