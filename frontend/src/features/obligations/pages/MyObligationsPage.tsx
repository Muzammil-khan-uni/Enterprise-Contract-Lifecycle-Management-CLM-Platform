import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { useMyObligations } from '../api/obligationApi';
import { ObligationList } from '../components/ObligationList';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Select } from '../../../shared/components/ui/Select';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import type { ObligationStatus } from '../types';

export default function MyObligationsPage() {
  const [status, setStatus] = useState<ObligationStatus | ''>('');
  const { data: obligations, isLoading } = useMyObligations(status || undefined);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="My Obligations"
        description="Payments, deliverables, and SLAs tied to your contracts."
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value as ObligationStatus | '')} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
            <option value="Waived">Waived</option>
          </Select>
        }
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : obligations?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <ListChecks size={22} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {status ? `No ${status.toLowerCase()} obligations` : 'Nothing tracked yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {status ? 'Try a different status filter.' : "Obligations appear here once they're added to a contract."}
              </p>
            </div>
          </div>
        ) : (
          <ObligationList obligations={obligations ?? []} showContractLink />
        )}
      </Card>
    </div>
  );
}
