import { PenTool, FileSignature } from 'lucide-react';
import { useMySignatures } from '../api/signatureApi';
import { SignatureStatusList } from '../components/SignatureStatusList';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Skeleton } from '../../../shared/components/ui/Skeleton';

export default function MySignaturesPage() {
  const { data: signatures, isLoading } = useMySignatures();
  const pendingCount = signatures?.filter((s) => s.signatureStatus === 'Pending').length ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="My Signatures"
        description="Signature requests addressed to you. Signing happens on the provider's own page — check your email for each pending request's link."
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : signatures?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <FileSignature size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No signature requests yet</p>
          </div>
        ) : (
          <>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 mb-3 animate-fade-in">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-600/15 text-warning-600 dark:text-warning-300">
                  <PenTool size={12} />
                </span>
                <Badge tone="warning">{pendingCount} awaiting your signature</Badge>
              </div>
            )}
            <SignatureStatusList signatures={signatures ?? []} showContractLink />
          </>
        )}
      </Card>
    </div>
  );
}
