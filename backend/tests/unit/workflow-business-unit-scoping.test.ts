

jest.mock('../../src/modules/workflow/workflow.repository', () => ({
  workflowRepository: { findById: jest.fn() },
}));
jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { findById: jest.fn() },
}));

import { workflowRepository } from '../../src/modules/workflow/workflow.repository';
import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { workflowService } from '../../src/modules/workflow/workflow.service';
import { Permission } from '../../src/modules/users/user.types';
import { ApprovalLevel, StepStatus, WorkflowStatus } from '../../src/modules/workflow/workflow.types';

function buildWorkflow() {
  return {
    _id: 'wf1',
    contract: { toString: () => 'contract1' },
    currentStepIndex: 0,
    status: WorkflowStatus.IN_PROGRESS,
    steps: [
      { level: ApprovalLevel.LEGAL, status: StepStatus.PENDING, approver: null, actionedAt: null, comments: null, escalatedTo: null },
      { level: ApprovalLevel.FINANCE, status: StepStatus.PENDING, approver: null, actionedAt: null, comments: null, escalatedTo: null },
    ],
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function buildContract(businessUnit: string | null) {
  return {
    _id: 'contract1',
    status: 'PendingApproval',
    businessUnit: businessUnit ? { toString: () => businessUnit } : null,
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('workflow business-unit scoping', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects approval from a LegalOfficer in a different business unit', async () => {
    (workflowRepository.findById as jest.Mock).mockResolvedValue(buildWorkflow());
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildContract('unit-A'));

    await expect(
      workflowService.approveStep('wf1', 'user1', [Permission.WORKFLOW_APPROVE_LEGAL], 'unit-B')
    ).rejects.toThrow(/outside your business unit/);
  });

  it('allows approval from a LegalOfficer in the matching business unit', async () => {
    (workflowRepository.findById as jest.Mock).mockResolvedValue(buildWorkflow());
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildContract('unit-A'));

    const result = await workflowService.approveStep('wf1', 'user1', [Permission.WORKFLOW_APPROVE_LEGAL], 'unit-A');
    expect(result.steps[0].status).toBe(StepStatus.APPROVED);
  });

  it('allows approval across business units when the actor holds CONTRACT_READ_ALL_UNITS', async () => {
    (workflowRepository.findById as jest.Mock).mockResolvedValue(buildWorkflow());
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildContract('unit-A'));

    const result = await workflowService.approveStep(
      'wf1',
      'exec1',
      [Permission.WORKFLOW_APPROVE_LEGAL, Permission.CONTRACT_READ_ALL_UNITS],
      'unit-B'
    );
    expect(result.steps[0].status).toBe(StepStatus.APPROVED);
  });

  it('rejects a cross-unit rejection attempt the same way as approval', async () => {
    (workflowRepository.findById as jest.Mock).mockResolvedValue(buildWorkflow());
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildContract('unit-A'));

    await expect(
      workflowService.rejectStep('wf1', 'user1', [Permission.WORKFLOW_APPROVE_LEGAL], 'unit-B')
    ).rejects.toThrow(/outside your business unit/);
  });

  it('does not scope when the contract has no business unit set', async () => {
    (workflowRepository.findById as jest.Mock).mockResolvedValue(buildWorkflow());
    (contractRepository.findById as jest.Mock).mockResolvedValue(buildContract(null));

    const result = await workflowService.approveStep('wf1', 'user1', [Permission.WORKFLOW_APPROVE_LEGAL], 'unit-B');
    expect(result.steps[0].status).toBe(StepStatus.APPROVED);
  });
});
