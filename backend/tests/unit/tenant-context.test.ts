import { runWithTenant, getCurrentTenantId } from '../../src/core/tenancy/tenant-context';

describe('tenant-context (AsyncLocalStorage)', () => {
  it('returns null outside any runWithTenant call', () => {
    expect(getCurrentTenantId()).toBeNull();
  });

  it('returns the tenant id inside runWithTenant', () => {
    runWithTenant('tenant-A', () => {
      expect(getCurrentTenantId()).toBe('tenant-A');
    });
  });

  it('propagates across an async chain started inside runWithTenant', async () => {
    const result = await runWithTenant('tenant-B', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return getCurrentTenantId();
    });
    expect(result).toBe('tenant-B');
  });

  it('isolates concurrent contexts from each other', async () => {
    const [a, b] = await Promise.all([
      runWithTenant('tenant-X', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCurrentTenantId();
      }),
      runWithTenant('tenant-Y', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return getCurrentTenantId();
      }),
    ]);
    expect(a).toBe('tenant-X');
    expect(b).toBe('tenant-Y');
  });

  it('does not leak context after runWithTenant returns', () => {
    runWithTenant('tenant-C', () => {});
    expect(getCurrentTenantId()).toBeNull();
  });
});
