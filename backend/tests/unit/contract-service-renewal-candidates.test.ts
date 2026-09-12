

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { findRenewalCandidates: jest.fn() },
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { contractService } from '../../src/modules/contracts/contract.service';

describe('contractService.listRenewalCandidates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates to contractRepository.findRenewalCandidates', async () => {
    (contractRepository.findRenewalCandidates as jest.Mock).mockResolvedValue([{ _id: 'contract1' }]);

    const result = await contractService.listRenewalCandidates();

    expect(contractRepository.findRenewalCandidates).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ _id: 'contract1' }]);
  });
});
