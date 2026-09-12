import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileX2 } from 'lucide-react';
import { useContracts } from '../api/contractApi';
import { ContractTable } from '../components/ContractTable';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import type { ContractStatus } from '../types';

const STATUS_OPTIONS: ContractStatus[] = [
  'Draft', 'InReview', 'PendingApproval', 'Approved', 'PendingSignature',
  'Signed', 'Active', 'Expired', 'Terminated', 'Renewed', 'Archived',
];

export default function ContractListPage() {
  const [status, setStatus] = useState<ContractStatus | ''>('');
  const [search, setSearch] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useContracts({
    status: status || undefined,
    search: search || undefined,
  });

  const contracts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Contracts"
        description="Every contract across your organization, searchable and filterable in one place."
        actions={
          <Link to="/contracts/new">
            <Button>
              <Plus size={16} />
              New Contract
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative sm:max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus | '')} className="sm:max-w-[200px]">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <Card className="p-3 sm:p-4">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600">
              <FileX2 size={24} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {search || status ? 'No contracts match your filters' : 'No contracts yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {search || status ? 'Try a different search term or status.' : 'Get started by creating your first contract.'}
              </p>
            </div>
            {search || status ? (
              <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatus(''); }}>
                Clear filters
              </Button>
            ) : (
              <Link to="/contracts/new">
                <Button size="sm">
                  <Plus size={14} />
                  New contract
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <ContractTable contracts={contracts} />
            {hasNextPage && (
              <div className="pt-4 text-center">
                <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
