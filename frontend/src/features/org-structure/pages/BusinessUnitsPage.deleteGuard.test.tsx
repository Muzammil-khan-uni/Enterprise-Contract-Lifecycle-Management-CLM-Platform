import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { axiosClient } from '../../../shared/lib/axiosClient';
import BusinessUnitsPage from './BusinessUnitsPage';
import type { BusinessUnit } from '../types';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const ENGINEERING: BusinessUnit = {
  _id: 'bu1',
  name: 'Engineering',
  code: 'ENG',
  parentUnit: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BusinessUnitsPage />
    </QueryClientProvider>
  );
}

describe('BusinessUnitsPage delete guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: [ENGINEERING] } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it("surfaces the backend's orphan-guard message when deletion is blocked", async () => {
    const conflictError = new AxiosError('Request failed');
    conflictError.response = {
      data: { success: false, message: 'Cannot delete a business unit that still has child units, departments, users, or contracts referencing it' },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    vi.mocked(axiosClient.delete).mockRejectedValue(conflictError);

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/cannot delete a business unit that still has child units, departments, users, or contracts/i)
      ).toBeInTheDocument();
    });
  });

  it('does not show a delete error before any delete has been attempted', async () => {
    renderPage();
    await screen.findByText('Engineering (ENG)');
    expect(screen.queryByText(/cannot delete/i)).not.toBeInTheDocument();
  });
});
