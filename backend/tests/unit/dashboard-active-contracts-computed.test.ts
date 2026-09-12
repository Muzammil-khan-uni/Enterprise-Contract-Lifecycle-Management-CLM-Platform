

jest.mock('../../src/config/redis', () => ({
  redisClient: { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue('OK') },
}));
jest.mock('../../src/modules/contracts/contract.model', () => ({
  ContractModel: { countDocuments: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../../src/modules/workflow/workflow.model', () => ({
  ApprovalWorkflowModel: { countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock('../../src/modules/obligations/obligation.model', () => ({
  ObligationModel: { aggregate: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../../src/core/tenancy/tenant-context', () => ({
  getCurrentTenantId: jest.fn().mockReturnValue('tenant1'),
}));

import { ContractModel } from '../../src/modules/contracts/contract.model';
import { redisClient } from '../../src/config/redis';
import { dashboardService } from '../../src/modules/dashboard/dashboard.service';

describe('dashboardService.getSummary — Active Contracts count', () => {
  beforeEach(() => jest.clearAllMocks());

  it('counts contracts by computed date logic, not a literal status:"Active" lookup', async () => {
    await dashboardService.getSummary();

    const activeCountCall = (ContractModel.countDocuments as jest.Mock).mock.calls[0][0];
    expect(activeCountCall).not.toEqual({ status: 'Active' });
    expect(activeCountCall.status).toEqual({ $in: ['Signed', 'Active'] });
  });

  it('requires effectiveDate to be set and already passed', async () => {
    await dashboardService.getSummary();

    const activeCountCall = (ContractModel.countDocuments as jest.Mock).mock.calls[0][0];
    expect(activeCountCall.effectiveDate.$ne).toBeNull();
    expect(activeCountCall.effectiveDate.$lte).toBeInstanceOf(Date);
  });

  it('excludes a contract whose expiryDate has already passed, but allows one with no expiryDate', async () => {
    await dashboardService.getSummary();

    const activeCountCall = (ContractModel.countDocuments as jest.Mock).mock.calls[0][0];
    expect(activeCountCall.$or).toEqual([{ expiryDate: null }, { expiryDate: { $gt: expect.any(Date) } }]);
  });

  

  it('includes both Signed and Active statuses, not Signed alone', async () => {
    await dashboardService.getSummary();

    const activeCountCall = (ContractModel.countDocuments as jest.Mock).mock.calls[0][0];
    expect(activeCountCall.status.$in).toContain('Signed');
    expect(activeCountCall.status.$in).toContain('Active');
  });

  

  it('recomputes activeContracts fresh on every call, even when the Redis cache is warm', async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(
      JSON.stringify({ expiringContracts: 5, pendingApprovals: 2, complianceStatus: [], valueByContractType: [] })
    );

    await dashboardService.getSummary();
    await dashboardService.getSummary();

    const activeCountCalls = (ContractModel.countDocuments as jest.Mock).mock.calls.filter(
      (call) => call[0]?.status?.$in
    );
    expect(activeCountCalls).toHaveLength(2);
  });

  it('still merges the fresh activeContracts count together with the (still cached) other four metrics', async () => {
    (ContractModel.countDocuments as jest.Mock).mockImplementation((query: Record<string, unknown>) =>
      Promise.resolve(query.status ? 7 : 3)
    );

    const summary = await dashboardService.getSummary();

    expect(summary.activeContracts).toBe(7);
    expect(summary.expiringContracts).toBe(3);
  });
});
