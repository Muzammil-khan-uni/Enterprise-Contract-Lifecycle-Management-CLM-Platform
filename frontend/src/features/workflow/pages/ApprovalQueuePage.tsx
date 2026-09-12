import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, FileText, AlarmClockOff } from 'lucide-react';
import { useApprovalQueue } from '../api/workflowApi';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { ApprovalActionPanel } from '../components/ApprovalActionPanel';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import type { WorkflowContractSummary } from '../types';

function contractSummary(contract: string | WorkflowContractSummary): WorkflowContractSummary | null {
  return typeof contract === 'string' ? null : contract;
}

function deadlineTone(deadline: string): 'danger' | 'warning' | 'neutral' {
  const hoursLeft = (new Date(deadline).getTime() - Date.now()) / 36e5;
  if (hoursLeft < 0) return 'danger';
  if (hoursLeft < 48) return 'warning';
  return 'neutral';
}

const DEADLINE_CLASSES: Record<ReturnType<typeof deadlineTone>, string> = {
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-600/15 dark:text-danger-200',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200',
  neutral: 'text-slate-500 dark:text-slate-400',
};

export default function ApprovalQueuePage() {
  const { data: queue, isLoading } = useApprovalQueue();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Workflow"
        title="My Approval Queue"
        description={queue && queue.length > 0 ? `${queue.length} contract${queue.length === 1 ? '' : 's'} waiting on your decision` : undefined}
      />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-40 mb-3" style={{ animationDelay: `${i * 80}ms` }} />
              <Skeleton className="h-16 w-full" style={{ animationDelay: `${i * 80}ms` }} />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!queue || queue.length === 0) && (
        <Card elevated className="p-10 flex flex-col items-center gap-2 text-center animate-fade-in">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">You're all caught up</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Nothing waiting on your approval right now.</p>
        </Card>
      )}

      <div className="space-y-4">
        {queue?.map((workflow, i) => {
          const contract = contractSummary(workflow.contract);
          const tone = workflow.slaDeadline ? deadlineTone(workflow.slaDeadline) : 'neutral';
          return (
            <Card
              key={workflow._id}
              className="p-4 interactive-lift animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink-950/5 dark:bg-white/10 text-ink-900 dark:text-slate-200 mt-0.5">
                    <FileText size={15} />
                  </span>
                  <div className="min-w-0">
                    {contract ? (
                      <Link to={`/contracts/${contract._id}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium">
                        {contract.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900 dark:text-white">Contract</span>
                    )}
                    {contract && <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{contract.contractNumber}</p>}
                  </div>
                </div>
                {workflow.slaDeadline && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 whitespace-nowrap ${DEADLINE_CLASSES[tone]}`}>
                    {tone === 'danger' ? <AlarmClockOff size={12} /> : <Clock3 size={12} />}
                    {tone === 'danger' ? 'Overdue · ' : ''}
                    {new Date(workflow.slaDeadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              <ApprovalTimeline workflow={workflow} />
              <ApprovalActionPanel workflow={workflow} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
