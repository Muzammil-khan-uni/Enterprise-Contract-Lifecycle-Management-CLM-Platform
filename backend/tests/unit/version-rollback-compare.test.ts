

jest.mock('../../src/modules/contract-versions/version.repository', () => ({
  versionRepository: {
    findById: jest.fn(),
    getByVersionNumber: jest.fn(),
    getLatest: jest.fn(),
  },
}));
jest.mock('../../src/modules/contracts/contract.service', () => ({
  contractService: {
    rollbackToVersion: jest.fn(),
  },
}));

import { versionController } from '../../src/modules/contract-versions/version.controller';
import { versionRepository } from '../../src/modules/contract-versions/version.repository';
import { contractService } from '../../src/modules/contracts/contract.service';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('version rollback', () => {
  beforeEach(() => jest.resetAllMocks());

  it('delegates to contractService.rollbackToVersion with the parsed target version', async () => {
    (contractService.rollbackToVersion as jest.Mock).mockResolvedValue({ _id: 'v3', versionNumber: 3 });
    const req: any = {
      params: { contractId: 'c1' },
      body: { targetVersionNumber: 1 },
      user: { sub: 'user1' },
    };
    const res = mockRes();

    await versionController.rollback(req, res, jest.fn());
    await flushPromises();

    expect(contractService.rollbackToVersion).toHaveBeenCalledWith('c1', 1, 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects a non-integer targetVersionNumber before calling the service', async () => {
    const req: any = {
      params: { contractId: 'c1' },
      body: { targetVersionNumber: 'not-a-number' },
      user: { sub: 'user1' },
    };
    const res = mockRes();
    const next = jest.fn();

    await versionController.rollback(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/targetVersionNumber must be an integer/) })
    );
    expect(contractService.rollbackToVersion).not.toHaveBeenCalled();
  });
});

describe('compareVersions', () => {
  beforeEach(() => jest.resetAllMocks());

  it('diffs two arbitrary version numbers, not just adjacent ones', async () => {
    (versionRepository.getByVersionNumber as jest.Mock)
      .mockImplementation((_contractId: string, versionNumber: number) => {
        if (versionNumber === 1) return Promise.resolve({ versionNumber: 1, content: { title: 'A' } });
        if (versionNumber === 5) return Promise.resolve({ versionNumber: 5, content: { title: 'E' } });
        return Promise.resolve(null);
      });

    const req: any = { params: { contractId: 'c1' }, query: { from: '1', to: '5' } };
    const res = mockRes();

    await versionController.compareVersions(req, res, jest.fn());
    await flushPromises();

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.from).toBe(1);
    expect(payload.data.to).toBe(5);
    expect(payload.data.diffs).toEqual([{ field: 'title', before: 'A', after: 'E' }]);
  });

  it('404s when the "to" version does not exist for this contract', async () => {
    (versionRepository.getByVersionNumber as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { contractId: 'c1' }, query: { from: '1', to: '99' } };
    const res = mockRes();
    const next = jest.fn();

    await versionController.compareVersions(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Version 99 not found/) }));
  });

  it('rejects non-integer from/to query params', async () => {
    const req: any = { params: { contractId: 'c1' }, query: { from: 'abc', to: '2' } };
    const res = mockRes();
    const next = jest.fn();

    await versionController.compareVersions(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/must be integers/) })
    );
  });
});
