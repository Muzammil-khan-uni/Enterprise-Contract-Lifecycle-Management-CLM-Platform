

import { Client } from '@elastic/elasticsearch';
import Mock from '@elastic/elasticsearch-mock';
import { Types } from 'mongoose';

const mock = new Mock();
const mockedClient = new Client({
  node: 'http://localhost:9200',
  Connection: mock.getConnection(),
});

jest.mock('../../src/core/search/es-client', () => ({
  esClient: mockedClient,
  isSearchConfigured: () => true,
  logSearchUnavailableOnce: jest.fn(),
}));

jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { findById: jest.fn() },
}));

jest.mock('../../src/core/tenancy/tenant-context', () => ({
  getCurrentTenantId: jest.fn(),
}));

import { contractRepository } from '../../src/modules/contracts/contract.repository';
import { getCurrentTenantId } from '../../src/core/tenancy/tenant-context';
import { indexContractNow, searchContractIds } from '../../src/modules/contracts/contract-search.service';
import { ContractType, ContractStatus, PartyType } from '../../src/modules/contracts/contract.types';

describe('contract-search.service (real ES client, mocked transport)', () => {
  afterEach(() => {
    mock.clearAll();
    jest.clearAllMocks();
  });

  describe('indexContractNow', () => {
    it('sends the mapped document to the real client with the correct id and index', async () => {
      const contractId = new Types.ObjectId().toString();
      const tenantId = new Types.ObjectId();

      (contractRepository.findById as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(contractId),
        tenant: tenantId,
        contractNumber: 'CLM-2026-000042',
        title: 'Services Agreement',
        contractType: ContractType.SERVICE,
        status: ContractStatus.ACTIVE,
        tags: [],
        parties: [{ partyType: PartyType.VENDOR, name: 'Acme', role: 'Supplier' }],
        businessUnit: new Types.ObjectId(),
        department: new Types.ObjectId(),
        createdAt: new Date(),
      });

      let capturedBody: unknown = null;
      mock.add({ method: 'PUT', path: '/contracts/_doc/:id' }, (params) => {
        capturedBody = params.body;
        return { result: 'created' };
      });

      await indexContractNow(contractId);

      expect(capturedBody).toMatchObject({
        contractNumber: 'CLM-2026-000042',
        title: 'Services Agreement',
        tenant: tenantId.toString(),
        partyNames: ['Acme'],
      });
    });

    it('does nothing if the contract no longer exists (deleted between enqueue and processing)', async () => {
      (contractRepository.findById as jest.Mock).mockResolvedValue(null);
      let called = false;
      mock.add({ method: 'PUT', path: '/contracts/_doc/:id' }, () => {
        called = true;
        return { result: 'created' };
      });

      await indexContractNow('missing-id');
      expect(called).toBe(false);
    });
  });

  describe('searchContractIds', () => {
    it('returns hit ids in the order Elasticsearch ranked them', async () => {
      (getCurrentTenantId as jest.Mock).mockReturnValue('tenant-abc');
      mock.add({ method: ['GET', 'POST'], path: '/contracts/_search' }, () => ({
        hits: { hits: [{ _id: 'contract-2', _score: 1.5 }, { _id: 'contract-1', _score: 0.8 }] },
      }));

      const ids = await searchContractIds('services agreement', 10);
      expect(ids).toEqual(['contract-2', 'contract-1']);
    });

    it('scopes the query to the current tenant', async () => {
      (getCurrentTenantId as jest.Mock).mockReturnValue('tenant-xyz');
      let capturedBody: { query?: { bool?: { filter?: unknown[] } } } = {};
      mock.add({ method: ['GET', 'POST'], path: '/contracts/_search' }, (params) => {
        capturedBody = params.body as typeof capturedBody;
        return { hits: { hits: [] } };
      });

      await searchContractIds('anything', 10);

      expect(capturedBody.query?.bool?.filter).toContainEqual({ term: { tenant: 'tenant-xyz' } });
    });

    it('refuses to search and returns null when there is no tenant context', async () => {
      (getCurrentTenantId as jest.Mock).mockReturnValue(null);
      let called = false;
      mock.add({ method: ['GET', 'POST'], path: '/contracts/_search' }, () => {
        called = true;
        return { hits: { hits: [] } };
      });

      const result = await searchContractIds('anything', 10);
      expect(result).toBeNull();
      expect(called).toBe(false);
    });
  });
});
