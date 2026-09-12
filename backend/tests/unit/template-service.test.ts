

jest.mock('../../src/modules/templates/template.repository', () => ({
  templateRepository: {
    listActive: jest.fn(),
    listAllForAdmin: jest.fn(),
    findById: jest.fn(),
    findByIdPopulated: jest.fn(),
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
jest.mock('../../src/modules/templates/template-version.repository', () => ({
  templateVersionRepository: {
    listForTemplate: jest.fn(),
    getLatest: jest.fn(),
    getByVersionNumber: jest.fn(),
    create: jest.fn(),
  },
}));

import { templateService } from '../../src/modules/templates/template.service';
import { templateRepository, clauseRepository } from '../../src/modules/templates/template.repository';
import { templateVersionRepository } from '../../src/modules/templates/template-version.repository';
import { AppError } from '../../src/core/errors/AppError';

describe('templateService', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('getByIdOrThrow / getForAuthoringOrThrow', () => {
    it('throws AppError.notFound when the template does not exist', async () => {
      (templateRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(templateService.getByIdOrThrow('missing')).rejects.toThrow(AppError);
    });

    it('throws when a template exists but is inactive (authoring path only)', async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({ _id: 't1', isActive: false });
      await expect(templateService.getForAuthoringOrThrow('t1')).rejects.toThrow(/not found/i);
    });

    it('returns an active template on the authoring path', async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({ _id: 't1', isActive: true });
      await expect(templateService.getForAuthoringOrThrow('t1')).resolves.toEqual({ _id: 't1', isActive: true });
    });
  });

  describe('deleteClause', () => {
    it('blocks deleting a clause still referenced by a template', async () => {
      (clauseRepository.findById as jest.Mock).mockResolvedValue({ _id: 'c1' });
      (clauseRepository.isReferencedByAnyTemplate as jest.Mock).mockResolvedValue(true);

      await expect(templateService.deleteClause('c1')).rejects.toThrow(/still used in one or more templates/);
      expect(clauseRepository.deleteById).not.toHaveBeenCalled();
    });

    it('allows deleting an unreferenced clause', async () => {
      (clauseRepository.findById as jest.Mock).mockResolvedValue({ _id: 'c1' });
      (clauseRepository.isReferencedByAnyTemplate as jest.Mock).mockResolvedValue(false);

      await templateService.deleteClause('c1');
      expect(clauseRepository.deleteById).toHaveBeenCalledWith('c1');
    });
  });

  describe('renderContentForContract', () => {
    it('rejects when the template contract type does not match', async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({
        _id: 't1',
        name: 'Employment Offer',
        isActive: true,
        contractType: 'Employment',
        sections: [],
        variables: [],
      });

      await expect(templateService.renderContentForContract('t1', 'Vendor', {})).rejects.toThrow(
        /is for contract type "Employment"/
      );
    });

    it('renders content for a matching, active template', async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({
        _id: 't1',
        name: 'Vendor Agreement',
        isActive: true,
        contractType: 'Vendor',
        sections: [{ title: 'Terms', order: 1, clauses: [{ title: 'A', text: 'Pay {{amount}}.' }] }],
        variables: [{ name: 'amount', label: 'Amount', type: 'number', required: true }],
      });
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 2 });

      const { content } = await templateService.renderContentForContract('t1', 'Vendor', { amount: 250 });
      expect(content['1. Terms']).toBe('Pay 250.');
    });

    

    it("reports the template's current version number alongside the rendered content", async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({
        _id: 't1',
        name: 'Vendor Agreement',
        isActive: true,
        contractType: 'Vendor',
        sections: [],
        variables: [],
      });
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 7 });

      const result = await templateService.renderContentForContract('t1', 'Vendor', {});
      expect(result.templateVersionNumber).toBe(7);
    });

    it('falls back to version 1 when the template has no TemplateVersion yet (pre-dates versioning)', async () => {
      (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue({
        _id: 't1',
        name: 'Vendor Agreement',
        isActive: true,
        contractType: 'Vendor',
        sections: [],
        variables: [],
      });
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue(null);

      const result = await templateService.renderContentForContract('t1', 'Vendor', {});
      expect(result.templateVersionNumber).toBe(1);
    });
  });

  

  describe('create — versioning', () => {
    it('creates a TemplateVersion #1 snapshotting the initial state, and points the template at it', async () => {
      const savedTemplate = {
        _id: 't1',
        name: 'Vendor Agreement',
        contractType: 'Vendor',
        sections: [],
        variables: [],
        currentVersion: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (templateRepository.create as jest.Mock).mockResolvedValue(savedTemplate);
      (templateVersionRepository.create as jest.Mock).mockResolvedValue({ _id: 'tv1', versionNumber: 1 });

      await templateService.create({ name: 'Vendor Agreement', contractType: 'Vendor' } as never, 'user1');

      expect(templateVersionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ template: 't1', versionNumber: 1, changeSummary: 'Initial version' })
      );
      expect(savedTemplate.currentVersion).toBe('tv1');
      expect(savedTemplate.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update — versioning', () => {
    it('creates a new version numbered one past the current latest, and separates changeSummary from persisted template fields', async () => {
      const updatedTemplate = {
        _id: 't1',
        name: 'Vendor Agreement v2',
        contractType: 'Vendor',
        sections: [],
        variables: [],
        currentVersion: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (templateRepository.updateById as jest.Mock).mockResolvedValue(updatedTemplate);
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 3 });
      (templateVersionRepository.create as jest.Mock).mockResolvedValue({ _id: 'tv4', versionNumber: 4 });

      await templateService.update('t1', { name: 'Vendor Agreement v2', changeSummary: 'Renamed' }, 'user1');

      expect(templateRepository.updateById).toHaveBeenCalledWith('t1', { name: 'Vendor Agreement v2' });
      expect(templateVersionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 4, changeSummary: 'Renamed' })
      );
      expect(updatedTemplate.currentVersion).toBe('tv4');
    });

    it('starts at version 1 when no TemplateVersion exists yet', async () => {
      const updatedTemplate = {
        _id: 't1',
        name: 'X',
        contractType: 'Vendor',
        sections: [],
        variables: [],
        currentVersion: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (templateRepository.updateById as jest.Mock).mockResolvedValue(updatedTemplate);
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue(null);
      (templateVersionRepository.create as jest.Mock).mockResolvedValue({ _id: 'tv1', versionNumber: 1 });

      await templateService.update('t1', { name: 'X' }, 'user1');

      expect(templateVersionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ versionNumber: 1 }));
    });

    it('throws AppError.notFound when the template does not exist', async () => {
      (templateRepository.updateById as jest.Mock).mockResolvedValue(null);
      await expect(templateService.update('missing', { name: 'X' }, 'user1')).rejects.toThrow(AppError);
      expect(templateVersionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('rollbackToVersion', () => {
    it("restores the template's editable fields from the target version and records the rollback as a new version", async () => {
      const template = {
        _id: 't1',
        name: 'Old Name',
        contractType: 'Vendor',
        sections: [],
        variables: [],
        currentVersion: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      const target = {
        _id: 'tv2',
        versionNumber: 2,
        name: 'Restored Name',
        contractType: 'Vendor',
        sections: [],
        variables: [],
      };
      (templateRepository.findById as jest.Mock).mockResolvedValue(template);
      (templateVersionRepository.getByVersionNumber as jest.Mock).mockResolvedValue(target);
      (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 5 });
      (templateVersionRepository.create as jest.Mock).mockResolvedValue({ _id: 'tv6', versionNumber: 6 });

      const result = await templateService.rollbackToVersion('t1', 2, 'user1');

      expect(result.name).toBe('Restored Name');
      expect(templateVersionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 6, isRollbackOf: 'tv2', changeSummary: 'Rolled back to version 2' })
      );
    });

    it('throws AppError.notFound when the target version does not exist', async () => {
      (templateRepository.findById as jest.Mock).mockResolvedValue({ _id: 't1' });
      (templateVersionRepository.getByVersionNumber as jest.Mock).mockResolvedValue(null);

      await expect(templateService.rollbackToVersion('t1', 99, 'user1')).rejects.toThrow(AppError);
    });
  });
});
