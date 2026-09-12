import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { VersionRangeCompare } from './VersionRangeCompare';
import type { ContractVersion } from '../types';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn() },
}));

const V1: ContractVersion = {
  _id: 'v1',
  contract: 'c1',
  versionNumber: 1,
  content: {},
  changeSummary: null,
  editedBy: 'user1',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const V2: ContractVersion = { ...V1, _id: 'v2', versionNumber: 2 };

function renderCompare() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <VersionRangeCompare contractId="c1" versions={[V1, V2]} />
    </QueryClientProvider>
  );
}

describe('VersionRangeCompare', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders an em-dash for a null "before" value rather than the literal text "null"', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { data: { from: 1, to: 2, diffs: [{ field: 'contractValue', before: null, after: 50000 }] } },
    });
    renderCompare();

    const row = (await screen.findByText('contractValue')).closest('tr')!;
    expect(within(row).getByText('—')).toBeInTheDocument();
    expect(within(row).getByText('50000')).toBeInTheDocument();
    expect(within(row).queryByText('null')).not.toBeInTheDocument();
  });

  it('JSON-stringifies an object value rather than showing "[object Object]"', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        data: {
          from: 1,
          to: 2,
          diffs: [{ field: 'parties', before: null, after: { name: 'Acme Corp', role: 'Vendor' } }],
        },
      },
    });
    renderCompare();

    const row = (await screen.findByText('parties')).closest('tr')!;
    expect(within(row).getByText('{"name":"Acme Corp","role":"Vendor"}')).toBeInTheDocument();
  });

  it('shows a no-differences message when the diff array is empty', async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: { from: 1, to: 2, diffs: [] } } });
    renderCompare();

    expect(await screen.findByText(/no field-level differences/i)).toBeInTheDocument();
  });

  it('defaults the from/to selects to the lowest and highest version numbers', () => {
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: { from: 1, to: 2, diffs: [] } } });
    renderCompare();

    const selects = screen.getAllByRole('combobox');
    expect((selects[0] as HTMLSelectElement).value).toBe('1');
    expect((selects[1] as HTMLSelectElement).value).toBe('2');
  });
});
