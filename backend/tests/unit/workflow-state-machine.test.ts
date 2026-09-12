import {
  buildInitialSteps,
  assertCanAct,
  applyApproval,
  applyRejection,
} from '../../src/modules/workflow/workflow.state-machine';
import { StepStatus, WorkflowStatus, ApprovalLevel } from '../../src/modules/workflow/workflow.types';

describe('workflow.state-machine', () => {
  it('builds three Pending steps in Legal -> Finance -> Executive order', () => {
    const steps = buildInitialSteps();
    expect(steps.map((s) => s.level)).toEqual([ApprovalLevel.LEGAL, ApprovalLevel.FINANCE, ApprovalLevel.EXECUTIVE]);
    expect(steps.every((s) => s.status === StepStatus.PENDING)).toBe(true);
  });

  it('assertCanAct throws if the workflow is not InProgress', () => {
    const steps = buildInitialSteps();
    expect(() => assertCanAct(steps, 0, WorkflowStatus.APPROVED)).toThrow();
  });

  it('assertCanAct throws if the current step is not Pending', () => {
    const steps = buildInitialSteps();
    steps[0].status = StepStatus.APPROVED;
    expect(() => assertCanAct(steps, 0, WorkflowStatus.IN_PROGRESS)).toThrow();
  });

  it('assertCanAct returns the current step when valid', () => {
    const steps = buildInitialSteps();
    const step = assertCanAct(steps, 0, WorkflowStatus.IN_PROGRESS);
    expect(step.level).toBe(ApprovalLevel.LEGAL);
  });

  it('applyApproval advances to the next step when not last', () => {
    const steps = buildInitialSteps();
    const result = applyApproval(steps, 0);
    expect(result).toEqual({ nextStepIndex: 1, workflowStatus: WorkflowStatus.IN_PROGRESS, isComplete: false });
  });

  it('applyApproval completes the workflow on the last step', () => {
    const steps = buildInitialSteps();
    const result = applyApproval(steps, steps.length - 1);
    expect(result).toEqual({
      nextStepIndex: steps.length - 1,
      workflowStatus: WorkflowStatus.APPROVED,
      isComplete: true,
    });
  });

  it('applyRejection always ends the workflow as Rejected', () => {
    const result = applyRejection();
    expect(result.workflowStatus).toBe(WorkflowStatus.REJECTED);
    expect(result.isComplete).toBe(true);
  });
});
