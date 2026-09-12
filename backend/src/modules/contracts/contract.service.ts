import { contractRepository } from './contract.repository';
import { versionRepository } from '../contract-versions/version.repository';
import { diffContent } from '../contract-versions/version.diff.util';
import { generateContractNumber } from './contract-number.util';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event-bus';
import { DomainEvent } from '../../core/events/event-types';
import { EDITABLE_STATUSES, ContractStatus } from './contract.types';
import { logger } from '../../core/utils/logger';
import { getCurrentTenantId, runWithTenant } from '../../core/tenancy/tenant-context';
import { enqueueContractIndexing, searchContractIds } from './contract-search.service';
import { templateService } from '../templates/template.service';

function computeChangedFields(before: Record<string, unknown> | null, after: Record<string, unknown>): string[] {
  return diffContent(before, after).map((diff) => diff.field);
}

interface CreateContractInput {
  title: string;
  contractType: string;
  department: string;
  businessUnit: string;
  parties?: unknown[];
  effectiveDate?: string;
  expiryDate?: string;
  governingLawCountry?: string;
  timezone?: string;
  contractValue?: number;
  currency?: string;
  tags?: string[];
  confidentialityLevel?: string;
  content?: Record<string, unknown>;
  templateId?: string;
  variableValues?: Record<string, unknown>;
}

export const contractService = {
  

  async createContract(input: CreateContractInput, createdBy: string) {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      
      
      
      
      
      throw AppError.badRequest('No tenant context available for contract creation');
    }
    const contractNumber = await generateContractNumber(tenantId);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let content: Record<string, unknown>;
    let sourceTemplateVersionNumber: number | null = null;
    if (input.templateId) {
      const rendered = await templateService.renderContentForContract(
        input.templateId,
        input.contractType,
        input.variableValues ?? {}
      );
      content = rendered.content;
      sourceTemplateVersionNumber = rendered.templateVersionNumber;
    } else {
      content = input.content ?? {};
    }

    const contract = await contractRepository.create({
      contractNumber,
      title: input.title,
      contractType: input.contractType as never,
      department: input.department as never,
      businessUnit: input.businessUnit as never,
      parties: (input.parties ?? []) as never,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      governingLawCountry: input.governingLawCountry ?? null,
      timezone: input.timezone ?? 'UTC',
      status: ContractStatus.DRAFT,
      contractValue: input.contractValue ?? null,
      currency: input.currency ?? null,
      tags: input.tags ?? [],
      confidentialityLevel: (input.confidentialityLevel ?? 'Internal') as never,
      createdBy: createdBy as never,
      owner: createdBy as never,
      sourceTemplate: (input.templateId as never) ?? null,
      sourceTemplateVersionNumber,
    });

    const version = await versionRepository.create({
      contract: contract._id,
      versionNumber: 1,
      content,
      changedFields: computeChangedFields(null, content),
      changeSummary: input.templateId
        ? `Generated from template (v${sourceTemplateVersionNumber})`
        : 'Initial draft',
      editedBy: createdBy as never,
      isRollbackOf: null,
    });

    contract.currentVersion = version._id;
    await contract.save();

    eventBus.emitEvent(DomainEvent.CONTRACT_CREATED, {
      contractId: contract._id.toString(),
      createdBy,
    });

    await enqueueContractIndexing(contract._id.toString());

    logger.info('Contract created', { contractId: contract._id.toString(), contractNumber });

    return contract;
  },

  async getContractOrThrow(id: string) {
    const contract = await contractRepository.findById(id);
    if (!contract) throw AppError.notFound('Contract not found');
    return contract;
  },

  

  async updateContract(id: string, updates: Partial<CreateContractInput>) {
    const contract = await this.getContractOrThrow(id);

    if (!EDITABLE_STATUSES.includes(contract.status)) {
      throw AppError.conflict(
        `Contract in status "${contract.status}" cannot be edited directly — use version history instead`
      );
    }

    Object.assign(contract, {
      ...updates,
      effectiveDate: updates.effectiveDate ? new Date(updates.effectiveDate) : contract.effectiveDate,
      expiryDate: updates.expiryDate ? new Date(updates.expiryDate) : contract.expiryDate,
    });

    await contract.save();
    await enqueueContractIndexing(contract._id.toString());
    return contract;
  },

  async saveNewVersion(contractId: string, content: Record<string, unknown>, changeSummary: string | null, editedBy: string) {
    const contract = await this.getContractOrThrow(contractId);
    const latest = await versionRepository.getLatest(contractId);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await versionRepository.create({
      contract: contract._id,
      versionNumber: nextVersionNumber,
      content,
      changedFields: computeChangedFields(latest?.content ?? null, content),
      changeSummary,
      editedBy: editedBy as never,
      isRollbackOf: null,
    });

    contract.currentVersion = version._id;
    await contract.save();

    return version;
  },

  async rollbackToVersion(contractId: string, targetVersionNumber: number, editedBy: string) {
    const contract = await this.getContractOrThrow(contractId);
    const target = await versionRepository.getByVersionNumber(contractId, targetVersionNumber);
    if (!target) throw AppError.notFound(`Version ${targetVersionNumber} not found for this contract`);

    const latest = await versionRepository.getLatest(contractId);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    
    
    
    const rollbackVersion = await versionRepository.create({
      contract: contract._id,
      versionNumber: nextVersionNumber,
      content: target.content,
      changedFields: computeChangedFields(latest?.content ?? null, target.content),
      changeSummary: `Rolled back to version ${targetVersionNumber}`,
      editedBy: editedBy as never,
      isRollbackOf: target._id,
    });

    contract.currentVersion = rollbackVersion._id;
    await contract.save();

    return rollbackVersion;
  },

  async listContracts(filters: Parameters<typeof contractRepository.listContracts>[0]) {
    if (filters.search) {
      const ids = await searchContractIds(filters.search, filters.limit ?? 25);
      if (ids !== null) {
        
        
        
        
        const docs = await contractRepository.findByIds(ids);
        const byId = new Map(docs.map((d) => [d._id.toString(), d]));
        const items = ids.map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => !!d);
        return { items, nextCursor: null, hasNextPage: false };
      }
      
      
      
    }
    return contractRepository.listContracts(filters);
  },

  async archiveContract(id: string) {
    const contract = await this.getContractOrThrow(id);
    const fromStatus = contract.status;
    contract.status = ContractStatus.ARCHIVED;
    await contract.save();

    eventBus.emitEvent(DomainEvent.CONTRACT_STATUS_CHANGED, {
      contractId: id,
      fromStatus,
      toStatus: ContractStatus.ARCHIVED,
    });

    await enqueueContractIndexing(id);

    return contract;
  },

  

  async renewContract(
    id: string,
    input: { newExpiryDate?: string; contractValue?: number },
    renewedBy: string
  ) {
    const original = await this.getContractOrThrow(id);

    const RENEWABLE_STATUSES = [ContractStatus.ACTIVE, ContractStatus.EXPIRED];
    if (!RENEWABLE_STATUSES.includes(original.status)) {
      throw AppError.conflict(
        `Contract in status "${original.status}" cannot be renewed — only Active or Expired contracts are eligible`
      );
    }
    if (original.renewedTo) {
      throw AppError.conflict('This contract has already been renewed');
    }

    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw AppError.badRequest('No tenant context available for contract renewal');
    }
    const contractNumber = await generateContractNumber(tenantId);

    
    
    
    
    
    const latestVersion = await versionRepository.getLatest(id);

    const renewed = await contractRepository.create({
      contractNumber,
      title: original.title,
      contractType: original.contractType,
      department: original.department,
      businessUnit: original.businessUnit,
      parties: original.parties,
      effectiveDate: new Date(),
      expiryDate: input.newExpiryDate ? new Date(input.newExpiryDate) : null,
      governingLawCountry: original.governingLawCountry,
      timezone: original.timezone,
      status: ContractStatus.DRAFT,
      contractValue: input.contractValue ?? original.contractValue,
      currency: original.currency,
      tags: original.tags,
      confidentialityLevel: original.confidentialityLevel,
      createdBy: renewedBy as never,
      owner: original.owner,
      renewedFrom: original._id,
      
      
      
      
      
      sourceTemplate: original.sourceTemplate,
      sourceTemplateVersionNumber: original.sourceTemplateVersionNumber,
    });

    const version = await versionRepository.create({
      contract: renewed._id,
      versionNumber: 1,
      content: latestVersion?.content ?? {},
      changedFields: computeChangedFields(null, latestVersion?.content ?? {}),
      changeSummary: `Renewed from ${original.contractNumber}`,
      editedBy: renewedBy as never,
      isRollbackOf: null,
    });
    renewed.currentVersion = version._id;
    await renewed.save();

    const fromStatus = original.status;
    original.status = ContractStatus.RENEWED;
    original.renewedTo = renewed._id;
    await original.save();

    eventBus.emitEvent(DomainEvent.CONTRACT_STATUS_CHANGED, {
      contractId: id,
      fromStatus,
      toStatus: ContractStatus.RENEWED,
    });
    eventBus.emitEvent(DomainEvent.CONTRACT_CREATED, {
      contractId: renewed._id.toString(),
      createdBy: renewedBy,
    });

    await enqueueContractIndexing(id);
    await enqueueContractIndexing(renewed._id.toString());

    logger.info('Contract renewed', {
      originalContractId: id,
      renewedContractId: renewed._id.toString(),
      renewedContractNumber: contractNumber,
    });

    return renewed;
  },

  

  async listRenewalCandidates() {
    return contractRepository.findRenewalCandidates();
  },

  

  async sweepExpiringContracts(days = 30) {
    const expiring = await contractRepository.findExpiringWithinDays(days);
    for (const contract of expiring) {
      eventBus.emitEvent(DomainEvent.CONTRACT_EXPIRING, {
        contractId: contract._id.toString(),
        expiryDate: (contract.expiryDate as Date).toISOString(),
        recipientId: contract.owner.toString(),
        tenantId: contract.tenant.toString(),
      });
    }
    return expiring.length;
  },

  

  async syncLifecycleStatuses(): Promise<{ activated: number; expired: number }> {
    const dueToActivate = await contractRepository.findSignedPastEffectiveDate();
    for (const contract of dueToActivate) {
      const fromStatus = contract.status;
      contract.status = ContractStatus.ACTIVE;
      await runWithTenant(contract.tenant.toString(), () => contract.save());
      eventBus.emitEvent(DomainEvent.CONTRACT_STATUS_CHANGED, {
        contractId: contract._id.toString(),
        fromStatus,
        toStatus: ContractStatus.ACTIVE,
      });
      await enqueueContractIndexing(contract._id.toString());
    }

    const dueToExpire = await contractRepository.findActivePastExpiryDate();
    for (const contract of dueToExpire) {
      const fromStatus = contract.status;
      contract.status = ContractStatus.EXPIRED;
      await runWithTenant(contract.tenant.toString(), () => contract.save());
      eventBus.emitEvent(DomainEvent.CONTRACT_STATUS_CHANGED, {
        contractId: contract._id.toString(),
        fromStatus,
        toStatus: ContractStatus.EXPIRED,
      });
      await enqueueContractIndexing(contract._id.toString());
    }

    return { activated: dueToActivate.length, expired: dueToExpire.length };
  },
};
