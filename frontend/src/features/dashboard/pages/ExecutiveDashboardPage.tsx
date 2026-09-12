import { TrendingDown, Building2, Handshake, DollarSign, ShieldAlert, ListChecks } from 'lucide-react';
import { useDashboardSummary, useExpiringContracts, useDepartmentBreakdown, useVendorBreakdown, useTopRiskContracts } from '../api/dashboardApi';
import { KpiCards } from '../components/KpiCards';
import { ExpiringContractsChart } from '../components/ExpiringContractsChart';
import { DeptBreakdownChart } from '../components/DeptBreakdownChart';
import { VendorBreakdownChart } from '../components/VendorBreakdownChart';
import { ValueByTypeChart } from '../components/ValueByTypeChart';
import { RiskScoreTable } from '../components/RiskScoreTable';
import { Card } from '../../../shared/components/ui/Card';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { ChartSkeleton, Skeleton } from '../../../shared/components/ui/Skeleton';
import { humanizeLabel } from '../../../shared/lib/display';

export default function ExecutiveDashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: expiring, isLoading: expiringLoading } = useExpiringContracts();
  const { data: byDepartment, isLoading: deptLoading } = useDepartmentBreakdown();
  const { data: byVendor, isLoading: vendorLoading } = useVendorBreakdown();
  const { data: topRisk, isLoading: riskLoading } = useTopRiskContracts(10);

  return (
    <div>
      {

}
      <div className="relative overflow-hidden bg-ink-wash px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="absolute inset-0 bg-grid-ink opacity-[0.06] pointer-events-none" aria-hidden="true" />
        <div
          className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brass-500/10 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '7s' }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brass-400 mb-1.5 animate-fade-in-up">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight animate-fade-in-up">
            Executive Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl animate-fade-in-up">
            Portfolio-wide visibility across every active contract.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto -mt-6 sm:-mt-8 relative">

      {summaryLoading || !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} elevated className="p-5 h-[92px]">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <KpiCards summary={summary} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <Card className="p-4 sm:p-5 interactive-lift animate-fade-in-up" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={TrendingDown} title="Contracts Expiring (next 30 days)" />
          {expiringLoading ? <ChartSkeleton /> : <ExpiringContractsChart contracts={expiring ?? []} />}
        </Card>

        <Card className="p-4 sm:p-5 interactive-lift animate-fade-in-up" style={{ animationDelay: '110ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={Building2} title="Contracts by Department" />
          {deptLoading ? <ChartSkeleton /> : <DeptBreakdownChart data={byDepartment ?? []} />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <Card className="p-4 sm:p-5 interactive-lift animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={Handshake} title="Contracts by Vendor" />
          {vendorLoading ? <ChartSkeleton /> : <VendorBreakdownChart data={byVendor ?? []} />}
        </Card>

        <Card className="p-4 sm:p-5 interactive-lift animate-fade-in-up" style={{ animationDelay: '210ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={DollarSign} title="Contract Value by Type" description="Hover a bar for total value and contract count." />
          {summaryLoading ? <ChartSkeleton /> : <ValueByTypeChart data={summary?.valueByContractType ?? []} />}
        </Card>
      </div>

      {summary && (
        <Card className="p-4 sm:p-5 mt-4 sm:mt-6 animate-fade-in-up" style={{ animationDelay: '260ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={ListChecks} title="Obligation Compliance Status" />
          {summary.complianceStatus.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No obligation data recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {summary.complianceStatus.map((row, i) => (
                <div
                  key={row.status}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: 'backwards' }}
                >
                  <p className="font-display text-xl font-semibold text-ink-950 dark:text-white">{row.count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{humanizeLabel(row.status)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 sm:p-5 mt-4 sm:mt-6 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <SectionHeading icon={ShieldAlert} title="Contract Risk Scoring" description="Click a row to see what's driving its score." />
        {riskLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : (
          <RiskScoreTable contracts={topRisk ?? []} />
        )}
      </Card>
      </div>
    </div>
  );
}
