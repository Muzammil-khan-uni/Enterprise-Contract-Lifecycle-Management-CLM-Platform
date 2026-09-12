

jest.mock('../../src/modules/templates/template.repository', () => ({
  templateRepository: {
    listActive: jest.fn(),
    listAllForAdmin: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
  },
  clauseRepository: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    isReferencedByAnyTemplate: jest.fn(),
  },
}));

import { templateController } from '../../src/modules/templates/template.controller';
import { templateRepository, clauseRepository } from '../../src/modules/templates/template.repository';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('template controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('public list only calls listActive, not the admin listing', async () => {
    (templateRepository.listActive as jest.Mock).mockResolvedValue([]);
    const req: any = {};
    const res = mockRes();

    await templateController.list(req, res, jest.fn());
    await flushPromises();
    expect(templateRepository.listActive).toHaveBeenCalled();
    expect(templateRepository.listAllForAdmin).not.toHaveBeenCalled();
  });

  it('adminList calls listAllForAdmin', async () => {
    (templateRepository.listAllForAdmin as jest.Mock).mockResolvedValue([{ _id: 't1', isActive: false }]);
    const req: any = {};
    const res = mockRes();

    await templateController.adminList(req, res, jest.fn());
    await flushPromises();
    expect(templateRepository.listAllForAdmin).toHaveBeenCalled();
  });

  it('update 404s for a non-existent template', async () => {
    (templateRepository.updateById as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { id: 'missing' }, body: { isActive: false }, user: { sub: 'user1' } };
    const res = mockRes();
    const next = jest.fn();

    await templateController.update(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Template not found/) }));
  });
});

describe('clause controller', () => {
  beforeEach(() => jest.resetAllMocks());

  it('deleteClause 404s for a non-existent clause', async () => {
    (clauseRepository.findById as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { id: 'missing' } };
    const res = mockRes();
    const next = jest.fn();

    await templateController.deleteClause(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Clause not found/) }));
  });

  it('blocks deleting a clause still referenced by a template', async () => {
    (clauseRepository.findById as jest.Mock).mockResolvedValue({ _id: 'c1' });
    (clauseRepository.isReferencedByAnyTemplate as jest.Mock).mockResolvedValue(true);
    const req: any = { params: { id: 'c1' } };
    const res = mockRes();
    const next = jest.fn();

    await templateController.deleteClause(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/still used in one or more templates/) })
    );
    expect(clauseRepository.deleteById).not.toHaveBeenCalled();
  });

  it('allows deleting an unreferenced clause', async () => {
    (clauseRepository.findById as jest.Mock).mockResolvedValue({ _id: 'c1' });
    (clauseRepository.isReferencedByAnyTemplate as jest.Mock).mockResolvedValue(false);
    (clauseRepository.deleteById as jest.Mock).mockResolvedValue({ _id: 'c1' });
    const req: any = { params: { id: 'c1' } };
    const res = mockRes();

    await templateController.deleteClause(req, res, jest.fn());
    await flushPromises();
    expect(clauseRepository.deleteById).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('updateClause 404s for a non-existent clause', async () => {
    (clauseRepository.updateById as jest.Mock).mockResolvedValue(null);
    const req: any = { params: { id: 'missing' }, body: { title: 'New title' } };
    const res = mockRes();
    const next = jest.fn();

    await templateController.updateClause(req, res, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Clause not found/) }));
  });
});
