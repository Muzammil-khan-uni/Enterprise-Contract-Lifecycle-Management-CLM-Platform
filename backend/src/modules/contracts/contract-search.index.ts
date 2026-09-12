import { IContract } from './contract.model';

export const CONTRACT_INDEX_NAME = 'contracts';

export const CONTRACT_INDEX_MAPPING = {
  properties: {
    tenant: { type: 'keyword' },
    contractNumber: { type: 'keyword' },
    title: { type: 'text' },
    contractType: { type: 'keyword' },
    status: { type: 'keyword' },
    tags: { type: 'text' },
    partyNames: { type: 'text' },
    businessUnit: { type: 'keyword' },
    department: { type: 'keyword' },
    createdAt: { type: 'date' },
    ocrText: { type: 'text' },
  },
} as const;

export interface ContractSearchDocument {
  tenant: string;
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  tags: string[];
  partyNames: string[];
  businessUnit: string;
  department: string;
  createdAt: string;
  ocrText: string;
}

export function buildSearchDocument(contract: IContract, ocrText = ''): ContractSearchDocument {
  return {
    tenant: contract.tenant.toString(),
    contractNumber: contract.contractNumber,
    title: contract.title,
    contractType: contract.contractType,
    status: contract.status,
    tags: contract.tags ?? [],
    partyNames: (contract.parties ?? []).map((p) => p.name),
    businessUnit: contract.businessUnit.toString(),
    department: contract.department.toString(),
    createdAt: contract.createdAt.toISOString(),
    ocrText,
  };
}
