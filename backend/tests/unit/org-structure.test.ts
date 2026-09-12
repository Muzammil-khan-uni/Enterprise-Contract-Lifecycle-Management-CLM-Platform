

jest.mock('../../src/modules/business-units/business-unit.repository', () => ({
  businessUnitRepository: {
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    listAll: jest.fn(),
    hasChildren: jest.fn(),
  },
}));
jest.mock('../../src/modules/departments/department.repository', () => ({
  departmentRepository: {
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    listAll: jest.fn(),
    listByBusinessUnit: jest.fn(),
  },
}));
jest.mock('../../src/modules/departments/department.model', () => ({
  DepartmentModel: { countDocuments: jest.fn() },
}));
jest.mock('../../src/modules/users/user.model', () => ({
  UserModel: { countDocuments: jest.fn() },
}));
jest.mock('../../src/modules/contracts/contract.model', () => ({
  ContractModel: { countDocuments: jest.fn() },
}));

import { businessUnitController } from '../../src/modules/business-units/business-unit.controller';
import { departmentController } from '../../src/modules/departments/department.controller';
import { businessUnitRepository } from '../../src/modules/business-units/business-unit.repository';
import { departmentRepository } from '../../src/modules/departments/department.repository';
import { DepartmentModel } from '../../src/modules/departments/department.model';
import { UserModel } from '../../src/modules/users/user.model';
import { ContractModel } from '../../src/modules/contracts/contract.model';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('business unit controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('rejects creating a business unit with a non-existent parentUnit', async () => {
    (businessUnitRepository.findById as jest.Mock).mockResolvedValue(null);
    const req: any = { body: { name: 'Engineering', code: 'ENG', parentUnit: 'missing-id' } };
    const res = mockRes();
    const next = jest.fn();

    await businessUnitController.create(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/parentUnit does not reference/) }));
    expect(businessUnitRepository.create).not.toHaveBeenCalled();
  });

  it('blocks deletion when departments, users, or contracts still reference the unit', async () => {
    (businessUnitRepository.findById as jest.Mock).mockResolvedValue({ _id: 'bu1' });
    (businessUnitRepository.hasChildren as jest.Mock).mockResolvedValue(false);
    (DepartmentModel.countDocuments as jest.Mock).mockResolvedValue(2);
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
    (ContractModel.countDocuments as jest.Mock).mockResolvedValue(0);

    const req: any = { params: { id: 'bu1' } };
    const res = mockRes();
    const next = jest.fn();

    await businessUnitController.remove(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/still has child units, departments, users, or contracts/) })
    );
    expect(businessUnitRepository.deleteById).not.toHaveBeenCalled();
  });

  it('allows deletion when nothing references the unit', async () => {
    (businessUnitRepository.findById as jest.Mock).mockResolvedValue({ _id: 'bu1' });
    (businessUnitRepository.hasChildren as jest.Mock).mockResolvedValue(false);
    (DepartmentModel.countDocuments as jest.Mock).mockResolvedValue(0);
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
    (ContractModel.countDocuments as jest.Mock).mockResolvedValue(0);
    (businessUnitRepository.deleteById as jest.Mock).mockResolvedValue({ _id: 'bu1' });

    const req: any = { params: { id: 'bu1' } };
    const res = mockRes();

    await businessUnitController.remove(req, res, jest.fn());
    await flushPromises();
    expect(businessUnitRepository.deleteById).toHaveBeenCalledWith('bu1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('rejects a business unit being set as its own parent', async () => {
    const req: any = { params: { id: 'bu1' }, body: { parentUnit: 'bu1' } };
    const res = mockRes();
    const next = jest.fn();

    await businessUnitController.update(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/cannot be its own parent/) }));
  });
});

describe('department controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('rejects creating a department against a non-existent business unit', async () => {
    (businessUnitRepository.findById as jest.Mock).mockResolvedValue(null);
    const req: any = { body: { name: 'Payroll', code: 'PAY', businessUnit: 'missing-id' } };
    const res = mockRes();
    const next = jest.fn();

    await departmentController.create(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/businessUnit does not reference/) }));
    expect(departmentRepository.create).not.toHaveBeenCalled();
  });

  it('blocks deletion when users or contracts still reference the department', async () => {
    (departmentRepository.findById as jest.Mock).mockResolvedValue({ _id: 'dep1' });
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
    (ContractModel.countDocuments as jest.Mock).mockResolvedValue(5);

    const req: any = { params: { id: 'dep1' } };
    const res = mockRes();
    const next = jest.fn();

    await departmentController.remove(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/still has users or contracts/) }));
    expect(departmentRepository.deleteById).not.toHaveBeenCalled();
  });
  it('filters by businessUnit query param when listing', async () => {
    (departmentRepository.listByBusinessUnit as jest.Mock).mockResolvedValue([{ _id: 'dep1' }]);
    const req: any = { query: { businessUnit: 'bu1' } };
    const res = mockRes();

    await departmentController.list(req, res, jest.fn());
    await flushPromises();
    expect(departmentRepository.listByBusinessUnit).toHaveBeenCalledWith('bu1');
    expect(departmentRepository.listAll).not.toHaveBeenCalled();
  });
});
