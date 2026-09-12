

jest.mock('../../src/modules/contracts/contract.service', () => ({
  contractService: { sweepExpiringContracts: jest.fn(), syncLifecycleStatuses: jest.fn() },
}));
jest.mock('../../src/modules/obligations/obligation.service', () => ({
  obligationService: { sweepDueSoon: jest.fn(), sweepOverdue: jest.fn() },
}));
jest.mock('../../src/modules/workflow/workflow.service', () => ({
  workflowService: { autoEscalateOverdue: jest.fn() },
}));
jest.mock('../../src/modules/signature/signature.service', () => ({
  signatureService: { sweepMissingSignatures: jest.fn() },
}));

import { contractService } from '../../src/modules/contracts/contract.service';
import { obligationService } from '../../src/modules/obligations/obligation.service';
import { workflowService } from '../../src/modules/workflow/workflow.service';
import { signatureService } from '../../src/modules/signature/signature.service';
import { runReminderScan } from '../../src/core/scheduler/reminder-scan.job';

describe('runReminderScan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contractService.sweepExpiringContracts as jest.Mock).mockResolvedValue(0);
    (contractService.syncLifecycleStatuses as jest.Mock).mockResolvedValue({ activated: 0, expired: 0 });
    (obligationService.sweepDueSoon as jest.Mock).mockResolvedValue(0);
    (obligationService.sweepOverdue as jest.Mock).mockResolvedValue(0);
    (workflowService.autoEscalateOverdue as jest.Mock).mockResolvedValue(0);
    (signatureService.sweepMissingSignatures as jest.Mock).mockResolvedValue(0);
  });

  it('calls signatureService.sweepMissingSignatures with the documented lookback window', async () => {
    await runReminderScan();

    expect(signatureService.sweepMissingSignatures).toHaveBeenCalledTimes(1);
    expect(signatureService.sweepMissingSignatures).toHaveBeenCalledWith(3);
  });

  it('includes missingSignaturesNotified in the returned summary, reflecting the sweep result', async () => {
    (signatureService.sweepMissingSignatures as jest.Mock).mockResolvedValue(4);

    const result = await runReminderScan();

    expect(result.missingSignaturesNotified).toBe(4);
  });

  it('delegates obligation due-soon and overdue sweeping to obligationService, not an inline query', async () => {
    await runReminderScan();

    expect(obligationService.sweepDueSoon).toHaveBeenCalledTimes(1);
    expect(obligationService.sweepDueSoon).toHaveBeenCalledWith(7);
    expect(obligationService.sweepOverdue).toHaveBeenCalledTimes(1);
  });

  it('delegates contract expiry to contractService.sweepExpiringContracts with a 30-day lookahead, not an inline query', async () => {
    await runReminderScan();

    expect(contractService.sweepExpiringContracts).toHaveBeenCalledTimes(1);
    expect(contractService.sweepExpiringContracts).toHaveBeenCalledWith(30);
  });

  it('calls contractService.syncLifecycleStatuses exactly once per run, and reflects both counts in the summary', async () => {
    (contractService.syncLifecycleStatuses as jest.Mock).mockResolvedValue({ activated: 3, expired: 1 });

    const result = await runReminderScan();

    expect(contractService.syncLifecycleStatuses).toHaveBeenCalledTimes(1);
    expect(result.activated).toBe(3);
    expect(result.expired).toBe(1);
  });

  it('still calls every other trigger (expiry, obligations, escalation) in the same run', async () => {
    (contractService.sweepExpiringContracts as jest.Mock).mockResolvedValue(1);
    (contractService.syncLifecycleStatuses as jest.Mock).mockResolvedValue({ activated: 2, expired: 0 });
    (obligationService.sweepDueSoon as jest.Mock).mockResolvedValue(1);
    (obligationService.sweepOverdue as jest.Mock).mockResolvedValue(0);
    (workflowService.autoEscalateOverdue as jest.Mock).mockResolvedValue(2);

    const result = await runReminderScan();

    expect(result).toEqual({
      expiring: 1,
      activated: 2,
      expired: 0,
      obligationsDue: 1,
      obligationsOverdue: 0,
      escalated: 2,
      missingSignaturesNotified: 0,
    });
  });
});
