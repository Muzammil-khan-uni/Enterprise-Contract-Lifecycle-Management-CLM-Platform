

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { create: jest.fn() },
}));
jest.mock('../../src/modules/contract-versions/version.repository', () => ({
  versionRepository: { create: jest.fn() },
}));
jest.mock('../../src/modules/templates/template.repository', () => ({
  templateRepository: { findByIdPopulated: jest.fn() },
}));
jest.mock('../../src/modules/templates/template-version.repository', () => ({
  templateVersionRepository: { getLatest: jest.fn() },
}));
jest.mock('../../src/modules/contracts/contract-number.util', () => ({
  generateContractNumber: jest.fn().mockResolvedValue('CLM-2026-000001'),
}));
jest.mock('../../src/modules/contracts/contract-search.service', () => ({
  enqueueContractIndexing: jest.fn().mockResolvedValue(undefined),
  searchContractIds: jest.fn(),
}));
jest.mock('../../src/core/events/event-bus', () => ({
  eventBus: { emitEvent: jest.fn() },
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { versionRepository } from '../../src/modules/contract-versions/version.repository';
import { templateRepository } from '../../src/modules/templates/template.repository';
import { templateVersionRepository } from '../../src/modules/templates/template-version.repository';
import { contractService } from '../../src/modules/contracts/contract.service';
import { runWithTenant } from '../../src/core/tenancy/tenant-context';
import { AppError } from '../../src/core/errors/AppError';

function buildPopulatedTemplate(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'template1',
    name: 'Vendor Agreement',
    contractType: 'Vendor',
    isActive: true,
    sections: [
      {
        title: 'Payment Terms',
        order: 1,
        clauses: [{ title: 'Payment', text: 'Vendor shall be paid {{amount}}.' }],
      },
    ],
    variables: [{ name: 'amount', label: 'Payment Amount', type: 'number', required: true }],
    ...overrides,
  };
}

describe('contractService.createContract — template authoring path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contractRepository.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({ ...data, _id: 'contract1', save: jest.fn().mockResolvedValue(undefined) })
    );
    (versionRepository.create as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, _id: 'version1' }));
    (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 3 });
  });

  it('renders the template into the first version content when templateId is supplied', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(buildPopulatedTemplate());

    await runWithTenant('tenant1', () =>
      contractService.createContract(
        {
          title: 'Acme Supply Agreement',
          contractType: 'Vendor',
          department: 'dept1',
          businessUnit: 'bu1',
          templateId: 'template1',
          variableValues: { amount: 7500 },
        },
        'user1'
      )
    );

    expect(versionRepository.create).toHaveBeenCalledTimes(1);
    const versionArg = (versionRepository.create as jest.Mock).mock.calls[0][0];
    expect(versionArg.content['1. Payment Terms']).toBe('Vendor shall be paid 7500.');
    expect(versionArg.content['Variable: Payment Amount']).toBe(7500);
    expect(versionArg.changeSummary).toMatch(/template/i);
  });

  

  it('stamps the contract with its source template and the exact version it was rendered from', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(buildPopulatedTemplate());
    (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue({ versionNumber: 5 });

    await runWithTenant('tenant1', () =>
      contractService.createContract(
        {
          title: 'Acme Supply Agreement',
          contractType: 'Vendor',
          department: 'dept1',
          businessUnit: 'bu1',
          templateId: 'template1',
          variableValues: { amount: 7500 },
        },
        'user1'
      )
    );

    const contractArg = (contractRepository.create as jest.Mock).mock.calls[0][0];
    expect(contractArg.sourceTemplate).toBe('template1');
    expect(contractArg.sourceTemplateVersionNumber).toBe(5);
  });

  it('falls back to version 1 when the template predates versioning (no TemplateVersion exists yet)', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(buildPopulatedTemplate());
    (templateVersionRepository.getLatest as jest.Mock).mockResolvedValue(null);

    await runWithTenant('tenant1', () =>
      contractService.createContract(
        {
          title: 'Acme Supply Agreement',
          contractType: 'Vendor',
          department: 'dept1',
          businessUnit: 'bu1',
          templateId: 'template1',
          variableValues: { amount: 7500 },
        },
        'user1'
      )
    );

    const contractArg = (contractRepository.create as jest.Mock).mock.calls[0][0];
    expect(contractArg.sourceTemplateVersionNumber).toBe(1);
  });

  it('still supports the free-form-content path when no templateId is given', async () => {
    await runWithTenant('tenant1', () =>
      contractService.createContract(
        {
          title: 'Handwritten Agreement',
          contractType: 'Vendor',
          department: 'dept1',
          businessUnit: 'bu1',
          content: { body: 'free-form text' },
        },
        'user1'
      )
    );

    expect(templateRepository.findByIdPopulated).not.toHaveBeenCalled();
    const versionArg = (versionRepository.create as jest.Mock).mock.calls[0][0];
    expect(versionArg.content).toEqual({ body: 'free-form text' });
    const contractArg = (contractRepository.create as jest.Mock).mock.calls[0][0];
    expect(contractArg.sourceTemplate).toBeNull();
    expect(contractArg.sourceTemplateVersionNumber).toBeNull();
  });

  it('rejects before writing anything if the template contractType does not match the contract', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(
      buildPopulatedTemplate({ contractType: 'Employment' })
    );

    await expect(
      runWithTenant('tenant1', () =>
        contractService.createContract(
          {
            title: 'Mismatched',
            contractType: 'Vendor',
            department: 'dept1',
            businessUnit: 'bu1',
            templateId: 'template1',
            variableValues: { amount: 100 },
          },
          'user1'
        )
      )
    ).rejects.toThrow(AppError);

    expect(contractRepository.create).not.toHaveBeenCalled();
    expect(versionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects before writing anything if a required variable is missing', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(buildPopulatedTemplate());

    await expect(
      runWithTenant('tenant1', () =>
        contractService.createContract(
          {
            title: 'Missing Variable',
            contractType: 'Vendor',
            department: 'dept1',
            businessUnit: 'bu1',
            templateId: 'template1',
            variableValues: {},
          },
          'user1'
        )
      )
    ).rejects.toThrow(/Payment Amount/);

    expect(contractRepository.create).not.toHaveBeenCalled();
    expect(versionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects if the template does not exist or is inactive', async () => {
    (templateRepository.findByIdPopulated as jest.Mock).mockResolvedValue(null);

    await expect(
      runWithTenant('tenant1', () =>
        contractService.createContract(
          {
            title: 'No Template',
            contractType: 'Vendor',
            department: 'dept1',
            businessUnit: 'bu1',
            templateId: 'missing-template',
            variableValues: {},
          },
          'user1'
        )
      )
    ).rejects.toThrow(/not found/i);
  });
});
