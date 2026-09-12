import { redisClient } from '../../config/redis';

export async function generateContractNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const seq = await redisClient.incr(`contract-number-seq:${tenantId}:${year}`);
    return `CLM-${year}-${String(seq).padStart(6, '0')}`;
  } catch {
    return `CLM-${year}-${Date.now()}`;
  }
}
