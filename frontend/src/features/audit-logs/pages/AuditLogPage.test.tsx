import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import AuditLogPage from './AuditLogPage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn() },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuditLogPage />
    </QueryClientProvider>
  );
}

describe('AuditLogPage — actor column', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the actor name for a normal entry', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a1',
            actor: { _id: 'u1', name: 'Jamie Legal', email: 'jamie@acme.com' },
            action: 'Approve',
            entityType: 'ApprovalWorkflow',
            entityId: 'w1',
            changes: null,
            ipAddress: null,
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: { nextCursor: null, hasNextPage: false },
      },
    });

    renderPage();

    expect(await screen.findByText('Jamie Legal')).toBeInTheDocument();
  });

  it('shows "System" rather than blank for a null actor', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a2',
            actor: null,
            action: 'Login',
            entityType: 'Auth',
            entityId: null,
            changes: null,
            ipAddress: null,
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: { nextCursor: null, hasNextPage: false },
      },
    });

    renderPage();

    expect(await screen.findByText('System')).toBeInTheDocument();
  });
});
