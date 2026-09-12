

jest.mock('../../src/modules/vendors/vendor.repository', () => ({
  vendorRepository: {
    find: jest.fn(),
    listAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
  },
}));

import { vendorController } from '../../src/modules/vendors/vendor.controller';
import { vendorRepository } from '../../src/modules/vendors/vendor.repository';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('vendor controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('public list only requests active vendors', async () => {
    (vendorRepository.find as jest.Mock).mockResolvedValue([]);
    const req: any = {};
    const res = mockRes();

    await vendorController.list(req, res, jest.fn());
    await flushPromises();
    expect(vendorRepository.find).toHaveBeenCalledWith({ isActive: true }, 200);
  });

  it('adminList returns the full roster via listAll, not the active-only filter', async () => {
    (vendorRepository.listAll as jest.Mock).mockResolvedValue([{ _id: 'v1', isActive: false }]);
    const req: any = {};
    const res = mockRes();

    await vendorController.adminList(req, res, jest.fn());
    await flushPromises();
    expect(vendorRepository.listAll).toHaveBeenCalled();
    expect(vendorRepository.find).not.toHaveBeenCalled();
  });

  it('update 404s for a non-existent vendor', async () => {
    (vendorRepository.updateById as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { id: 'missing' }, body: { isActive: false } };
    const res = mockRes();
    const next = jest.fn();

    await vendorController.update(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Vendor not found/) }));
  });

  it('update deactivates a vendor', async () => {
    (vendorRepository.updateById as jest.Mock).mockResolvedValue({ _id: 'v1', isActive: false });
    const req: any = { params: { id: 'v1' }, body: { isActive: false } };
    const res = mockRes();

    await vendorController.update(req, res, jest.fn());
    await flushPromises();
    expect(vendorRepository.updateById).toHaveBeenCalledWith('v1', { isActive: false });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
