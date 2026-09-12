import { AppError } from '../../core/errors/AppError';
import { ApprovalStep } from './workflow.model';
import { StepStatus, WorkflowStatus, APPROVAL_LEVEL_ORDER } from './workflow.types';

export function buildInitialSteps(): ApprovalStep[] {
  return APPROVAL_LEVEL_ORDER.map((level) => ({
    level,
    status: StepStatus.PENDING,
    approver: null,
    actionedAt: null,
    comments: null,
    escalatedTo: null,
    isEscalated: false,
  }));
}

export function assertCanAct(steps: ApprovalStep[], currentStepIndex: number, workflowStatus: WorkflowStatus): ApprovalStep {
  if (workflowStatus !== WorkflowStatus.IN_PROGRESS) {
    throw AppError.conflict(`Workflow is already ${workflowStatus} and cannot be acted on`);
  }
  const step = steps[currentStepIndex];
  if (!step) {
    throw AppError.conflict('No current step to act on');
  }
  if (step.status !== StepStatus.PENDING) {
    throw AppError.conflict(`Current step is already ${step.status}`);
  }
  return step;
}

export interface TransitionResult {
  nextStepIndex: number;
  workflowStatus: WorkflowStatus;
  isComplete: boolean;
}

export function applyApproval(steps: ApprovalStep[], currentStepIndex: number): TransitionResult {
  const isLastStep = currentStepIndex === steps.length - 1;
  return {
    nextStepIndex: isLastStep ? currentStepIndex : currentStepIndex + 1,
    workflowStatus: isLastStep ? WorkflowStatus.APPROVED : WorkflowStatus.IN_PROGRESS,
    isComplete: isLastStep,
  };
}

export function applyRejection(): TransitionResult {
  return {
    nextStepIndex: -1, 
    workflowStatus: WorkflowStatus.REJECTED,
    isComplete: true,
  };
}
