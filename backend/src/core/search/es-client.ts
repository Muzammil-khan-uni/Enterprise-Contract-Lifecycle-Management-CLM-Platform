import { Client } from '@elastic/elasticsearch';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

export const esClient: Client | null = env.ELASTICSEARCH_URL
  ? new Client({ node: env.ELASTICSEARCH_URL, requestTimeout: 3000 })
  : null;

export function isSearchConfigured(): boolean {
  return esClient !== null;
}

let loggedUnavailable = false;

export function logSearchUnavailableOnce(context: string, error: unknown): void {
  if (!loggedUnavailable) {
    logger.warn('Elasticsearch unavailable, falling back to MongoDB text search', {
      context,
      error: error instanceof Error ? error.message : String(error),
    });
    loggedUnavailable = true;
  }
}
