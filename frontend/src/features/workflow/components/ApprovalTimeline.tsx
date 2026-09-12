import { CheckCircle2, XCircle, Clock, TriangleAlert, MinusCircle, ArrowRight } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import type { ApprovalWorkflow, StepStatus } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

const STEP_TONE: Record<StepStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  Pending: 'neutral',
  Approved: 'success',
  Rejected: 'danger',
  Escalated: 'warning',
  Skipped: 'neutral',
};

const STEP_ICON: Record<StepStatus, typeof CheckCircle2> = {
  Pending: Clock,
  Approved: CheckCircle2,
  Rejected: XCircle,
  Escalated: TriangleAlert,
  Skipped: MinusCircle,
};

export function ApprovalTimeline({ workflow }: { workflow: ApprovalWorkflow }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {workflow.steps.map((step, i) => {
        const isActive = i === workflow.currentStepIndex && workflow.status === 'InProgress';
        const Icon = STEP_ICON[step.status];
        return (
          <div key={step.level} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md border transition-all duration-200 animate-fade-in-up ${
                isActive
                  ? 'border-brass-400 dark:border-brass-500/60 shadow-glow-brass dark:shadow-glow-brass-dark'
                  : 'border-slate-200 dark:border-ink-800'
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Icon size={12} className={isActive ? 'animate-pulse' : ''} />
                {step.level}
              </span>
              <div className="flex items-center gap-1">
                <Badge tone={STEP_TONE[step.status]}>{humanizeLabel(step.status)}</Badge>
                {step.isEscalated && <Badge tone={STEP_TONE.Escalated}>{humanizeLabel('Escalated')}</Badge>}
              </div>
            </div>
            {i < workflow.steps.length - 1 && <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
