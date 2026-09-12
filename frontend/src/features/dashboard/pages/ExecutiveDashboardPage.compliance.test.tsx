import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import ExecutiveDashboardPage from './ExecutiveDashboardPage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn() },
}));

const EMPTY_SUMMARY = {
  activeContracts: 0,
  expiringContracts: 0,
  pendingApprovals: 0,
  complianceStatus: [],
  valueByContractType: [],
};

function mockGet(withComplianceData: boolean) {
  return (url: string) => {
    if (url === '/dashboard/summary') {
      return Promise.resolve({
        data: {
          data: withComplianceData
            ? { ...EMPTY_SUMMARY, complianceStatus: [{ status: 'Completed', count: 5 }] }
            : EMPTY_SUMMARY,
        },
      });
    }
    if (url === '/dashboard/expiring') return Promise.resolve({ data: { data: [] } });
    if (url === '/dashboard/by-department') return Promise.resolve({ data: { data: [] } });
    if (url === '/dashboard/by-vendor') return Promise.resolve({ data: { data: [] } });
    if (url === '/dashboard/risk') return Promise.resolve({ data: { data: [] } });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ExecutiveDashboardPage />
    </QueryClientProvider>
  );
}

describe('ExecutiveDashboardPage — Compliance Status widget', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an empty-state message, not a vanished card, when there is no obligation data', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGet(false));
    renderDashboard();

    expect(await screen.findByText('Obligation Compliance Status')).toBeInTheDocument();
    expect(await screen.findByText('No obligation data recorded yet.')).toBeInTheDocument();
  });

  it('shows the real breakdown when compliance data exists', async () => {
    vi.mocked(axiosClient.get).mockImplementation(mockGet(true));
    renderDashboard();

    expect(await screen.findByText('Obligation Compliance Status')).toBeInTheDocument();
    expect(await screen.findByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('No obligation data recorded yet.')).not.toBeInTheDocument();
  });
});
