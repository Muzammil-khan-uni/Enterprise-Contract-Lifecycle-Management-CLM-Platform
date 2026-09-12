

jest.mock('../../src/modules/signature/signature.repository', () => ({
  signatureRepository: { listForSigner: jest.fn() },
}));

import { signatureRepository } from '../../src/modules/signature/signature.repository';
import { signatureService } from '../../src/modules/signature/signature.service';

describe('signatureService.listMine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates to signatureRepository.listForSigner with the given user id', async () => {
    (signatureRepository.listForSigner as jest.Mock).mockResolvedValue([{ _id: 'sig1' }]);

    const result = await signatureService.listMine('user1');

    expect(signatureRepository.listForSigner).toHaveBeenCalledWith('user1');
    expect(result).toEqual([{ _id: 'sig1' }]);
  });
});
