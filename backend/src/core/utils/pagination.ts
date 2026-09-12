import { Types } from 'mongoose';

export interface CursorPageParams {
  cursor?: string; 
  limit?: number;
}

export function buildCursorQuery(cursor?: string): Record<string, unknown> {
  if (!cursor || !Types.ObjectId.isValid(cursor)) return {};
  return { _id: { $gt: new Types.ObjectId(cursor) } };
}

export function resolveLimit(limit?: number, max = 100, fallback = 25): number {
  if (!limit || limit <= 0) return fallback;
  return Math.min(limit, max);
}
