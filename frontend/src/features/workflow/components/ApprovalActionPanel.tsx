import { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { useApproveStep, useRejectStep } from '../api/workflowApi';
import { Button } from '../../../shared/components/ui/Button';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { useToast } from '../../../shared/hooks/useToast';
import type { ApprovalWorkflow } from '../types';

export function ApprovalActionPanel({ workflow }: { workflow: ApprovalWorkflow }) {
  const [comments, setComments] = useState('');
  const approve = useApproveStep();
  const reject = useRejectStep();
  const { showToast } = useToast();

  if (workflow.status !== 'InProgress') return null;

  const currentStep = workflow.steps[workflow.currentStepIndex];
  const error = approve.error || reject.error;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-ink-800 animate-fade-in-up">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
        Awaiting <span className="font-medium">{currentStep.level}</span> approval.
      </p>
      <Textarea
        placeholder="Comments (optional)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="mb-2"
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          onClick={() =>
            approve.mutate(
              { workflowId: workflow._id, comments: comments || undefined },
              { onSuccess: () => showToast('Approved') }
            )
          }
          loading={approve.isPending}
          disabled={reject.isPending}
        >
          <Check size={15} />
          {approve.isPending ? 'Approving…' : 'Approve'}
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            reject.mutate(
              { workflowId: workflow._id, comments: comments || undefined },
              { onSuccess: () => showToast('Rejected', 'info') }
            )
          }
          loading={reject.isPending}
          disabled={approve.isPending}
        >
          <X size={15} />
          {reject.isPending ? 'Rejecting…' : 'Reject'}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 mt-2 animate-fade-in">
          <AlertCircle size={14} className="shrink-0" />
          Action failed — you may not hold the permission required for this step.
        </p>
      )}
    </div>
  );
}
