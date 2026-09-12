import { esClient, isSearchConfigured, logSearchUnavailableOnce } from '../../core/search/es-client';
import { getQueue } from '../../core/queues/queue.factory';
import { QueueName } from '../../core/queues/queue.names';
import { contractRepository } from './contract.repository';
import { documentRepository } from '../documents/document.repository';
import { CONTRACT_INDEX_NAME, CONTRACT_INDEX_MAPPING, buildSearchDocument } from './contract-search.index';
import { getCurrentTenantId } from '../../core/tenancy/tenant-context';
import { logger } from '../../core/utils/logger';

export async function ensureSearchIndex(): Promise<void> {
  if (!esClient) return;
  try {
    const exists = await esClient.indices.exists({ index: CONTRACT_INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: CONTRACT_INDEX_NAME,
        mappings: CONTRACT_INDEX_MAPPING,
      });
      logger.info('Elasticsearch contract index created', { index: CONTRACT_INDEX_NAME });
    }
  } catch (err) {
    logSearchUnavailableOnce('ensureSearchIndex', err);
  }
}

export async function enqueueContractIndexing(contractId: string): Promise<void> {
  if (!isSearchConfigured()) return;
  try {
    await getQueue(QueueName.SEARCH_INDEXING).add('index-contract', { contractId });
  } catch (err) {
    // Indexing is best-effort — a contract must still be creatable/editable
    // even if Elasticsearch or the Redis-backed job queue is unreachable.
    // Same fallback behavior as ensureSearchIndex/searchContractIds below.
    logSearchUnavailableOnce('enqueueContractIndexing', err);
  }
}

export async function indexContractNow(contractId: string): Promise<void> {
  if (!esClient) return;
  const contract = await contractRepository.findById(contractId);
  if (!contract) {
    
    
    return;
  }
  
  
  
  
  
  
  
  const documents = await documentRepository.listForContract(contractId);
  const ocrText = documents
    .map((doc) => doc.ocrText)
    .filter((text): text is string => !!text)
    .join('\n\n');

  await esClient.index({
    index: CONTRACT_INDEX_NAME,
    id: contract._id.toString(),
    document: buildSearchDocument(contract, ocrText),
  });
}

export async function searchContractIds(query: string, limit: number): Promise<string[] | null> {
  if (!esClient) return null;

  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    
    
    
    
    
    
    logger.error('searchContractIds called with no tenant context — refusing to search unscoped');
    return null;
  }

  try {
    const result = await esClient.search({
      index: CONTRACT_INDEX_NAME,
      query: {
        bool: {
          filter: [{ term: { tenant: tenantId } }],
          must: [
            {
              multi_match: {
                query,
                fields: ['title^2', 'contractNumber', 'tags', 'partyNames', 'ocrText'],
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      size: limit,
    });
    return result.hits.hits.map((hit) => hit._id as string);
  } catch (err) {
    logSearchUnavailableOnce('searchContractIds', err);
    return null;
  }
}
