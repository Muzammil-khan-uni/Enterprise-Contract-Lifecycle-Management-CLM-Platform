jest.mock('../../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

import { redisClient } from '../../src/config/redis';
import { cached } from '../../src/modules/dashboard/dashboard.cache.util';

describe('dashboard cache.cached()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the cached value without calling compute() on a hit', async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({ count: 42 }));
    const compute = jest.fn();

    const result = await cached('key1', 60, compute);

    expect(result).toEqual({ count: 42 });
    expect(compute).not.toHaveBeenCalled();
  });

  it('calls compute() and caches the result on a miss', async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    const compute = jest.fn().mockResolvedValue({ count: 7 });

    const result = await cached('key2', 60, compute);

    expect(result).toEqual({ count: 7 });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith('key2', JSON.stringify({ count: 7 }), 'EX', 60);
  });

  it('falls through to compute() if Redis read fails, rather than throwing', async () => {
    (redisClient.get as jest.Mock).mockRejectedValue(new Error('connection lost'));
    const compute = jest.fn().mockResolvedValue({ count: 1 });

    const result = await cached('key3', 60, compute);

    expect(result).toEqual({ count: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
