import { buildSearchDocument } from '../../src/modules/contracts/contract-search.index';
import { ContractType, ContractStatus, PartyType } from '../../src/modules/contracts/contract.types';
import { Types } from 'mongoose';

function fakeContract(overrides: Partial<Record<string, unknown>> = {}) {
  const base = {
    tenant: new Types.ObjectId(),
    contractNumber: 'CLM-2026-000001',
    title: 'Vendor Agreement',
    contractType: ContractType.VENDOR,
    status: ContractStatus.ACTIVE,
    tags: ['procurement'],
    parties: [{ partyType: PartyType.VENDOR, name: 'Acme Supplies', role: 'Supplier' }],
    businessUnit: new Types.ObjectId(),
    department: new Types.ObjectId(),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
  return base as unknown as Parameters<typeof buildSearchDocument>[0];
}

describe('buildSearchDocument', () => {
  it('maps contract fields to the flat ES document shape, ids stringified', () => {
    const tenantId = new Types.ObjectId();
    const businessUnitId = new Types.ObjectId();
    const contract = fakeContract({ tenant: tenantId, businessUnit: businessUnitId });
    const doc = buildSearchDocument(contract);

    expect(doc.title).toBe('Vendor Agreement');
    expect(doc.contractNumber).toBe('CLM-2026-000001');
    expect(doc.status).toBe(ContractStatus.ACTIVE);
    expect(doc.tenant).toBe(tenantId.toString());
    expect(doc.businessUnit).toBe(businessUnitId.toString());
    expect(doc.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('extracts party names into a flat searchable array', () => {
    const contract = fakeContract();
    const doc = buildSearchDocument(contract);
    expect(doc.partyNames).toEqual(['Acme Supplies']);
  });

  it('defaults tags and parties to empty arrays rather than throwing when absent', () => {
    const contract = fakeContract({ tags: undefined, parties: undefined });
    const doc = buildSearchDocument(contract);
    expect(doc.tags).toEqual([]);
    expect(doc.partyNames).toEqual([]);
  });

  it('defaults ocrText to an empty string when the caller passes nothing', () => {
    const doc = buildSearchDocument(fakeContract());
    expect(doc.ocrText).toBe('');
  });

  it('includes the caller-supplied ocrText (concatenated document OCR text) when provided', () => {
    const doc = buildSearchDocument(fakeContract(), 'Extracted text from a scanned copy');
    expect(doc.ocrText).toBe('Extracted text from a scanned copy');
  });
});
