import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ClipboardCheck,
  FileSignature,
  PenTool,
  Pencil,
  Info,
  Users,
  ListChecks,
  FileStack,
  History,
  FileQuestion,
} from 'lucide-react';
import { useContract, useContractVersions, useRollbackVersion, useArchiveContract, useRenewContract } from '../api/contractApi';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { EditContractForm } from '../components/EditContractForm';
import { VersionCompareView } from '../components/VersionCompareView';
import { VersionRangeCompare } from '../components/VersionRangeCompare';
import { useContractWorkflows, useSubmitForApproval } from '../../workflow/api/workflowApi';
import { ApprovalTimeline } from '../../workflow/components/ApprovalTimeline';
import { ApprovalActionPanel } from '../../workflow/components/ApprovalActionPanel';
import { useContractSignatures } from '../../signature/api/signatureApi';
import { SignatureStatusList } from '../../signature/components/SignatureStatusList';
import { InitiateSignatureForm } from '../../signature/components/InitiateSignatureForm';
import { useContractObligations } from '../../obligations/api/obligationApi';
import { ObligationList } from '../../obligations/components/ObligationList';
import { CreateObligationForm } from '../../obligations/components/CreateObligationForm';
import { useContractDocuments } from '../../documents/api/documentApi';
import { DocumentList } from '../../documents/components/DocumentList';
import { DocumentUpload } from '../../documents/components/DocumentUpload';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { Input } from '../../../shared/components/ui/Input';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { humanizeLabel } from '../../../shared/lib/display';
import { useToast } from '../../../shared/hooks/useToast';
import { useConfirm } from '../../../shared/hooks/useConfirm';
import { localDateInputToISOString } from '../../../shared/lib/localDate';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

const RENEWABLE_STATUSES = ['Active', 'Expired'];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { data: contract, isLoading } = useContract(id);
  const { data: versions } = useContractVersions(id);
  const { data: workflows } = useContractWorkflows(id);
  const submitForApproval = useSubmitForApproval(id ?? '');
  const { data: signatures } = useContractSignatures(id);
  const { data: obligations } = useContractObligations(id);
  const { data: documents } = useContractDocuments(id);
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [showRangeCompare, setShowRangeCompare] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const rollback = useRollbackVersion(id ?? '');
  const archiveContract = useArchiveContract(id ?? '');
  const renewContract = useRenewContract(id ?? '');
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [renewExpiryDate, setRenewExpiryDate] = useState('');
  const [renewValue, setRenewValue] = useState('');
  const [renewError, setRenewError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!contract) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center gap-3 text-center animate-fade-in max-w-md mx-auto">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <FileQuestion size={24} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Contract not found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">It may have been moved, or you may not have access to it.</p>
        </div>
        <Link to="/contracts">
          <Button variant="secondary" size="sm">
            <ArrowLeft size={13} />
            Back to contracts
          </Button>
        </Link>
      </div>
    );
  }

  const activeWorkflow = workflows?.find((w) => w.status === 'InProgress');
  
  
  
  const canEdit = contract.status === 'Draft' || contract.status === 'InReview';
  const canSubmit = canEdit;
  const canArchive = contract.status !== 'Archived';
  const canRenew = RENEWABLE_STATUSES.includes(contract.status) && !contract.renewedTo;
  
  
  
  
  
  
  const renewDisabledReason = contract.renewedTo
    ? 'This contract has already been renewed.'
    : !RENEWABLE_STATUSES.includes(contract.status)
      ? `Only Active or Expired contracts can be renewed (current status: ${humanizeLabel(contract.status)}).`
      : undefined;

  const handleArchive = async () => {
    const ok = await confirm({
      title: 'Archive this contract?',
      message: 'It will be moved out of active views. You can still find it later through search or filters.',
      confirmLabel: 'Archive',
      tone: 'neutral',
    });
    if (!ok) return;
    archiveContract.mutate(undefined, { onSuccess: () => showToast('Contract archived') });
  };

  const handleRenewSubmit = () => {
    setRenewError(null);
    renewContract.mutate(
      {
        
        newExpiryDate: renewExpiryDate ? localDateInputToISOString(renewExpiryDate) : undefined,
        contractValue: renewValue ? Number(renewValue) : undefined,
      },
      {
        onSuccess: (renewed) => {
          showToast('Contract renewed');
          navigate(`/contracts/${renewed._id}`);
        },
        onError: (err) => setRenewError(getApiErrorMessage(err)),
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/contracts" className="inline-flex items-center gap-1.5 text-sm text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
        <ArrowLeft size={14} />
        Back to contracts
      </Link>

      <Card elevated className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-4 mb-6 p-4 sm:p-5 animate-fade-in-up">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brass-600 dark:text-brass-400 mb-1">{humanizeLabel(contract.contractType)}</p>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-950 dark:text-white break-words">{contract.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">{contract.contractNumber}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <ContractStatusBadge status={contract.status} />
          {canEdit && (
            <Button variant="secondary" onClick={() => setIsEditing((v) => !v)}>
              <Pencil size={15} />
              {isEditing ? 'Cancel Edit' : 'Edit Details'}
            </Button>
          )}
          {canSubmit && (
            <Button onClick={() => submitForApproval.mutate(undefined, { onSuccess: () => showToast('Submitted for approval') })} loading={submitForApproval.isPending}>
              {submitForApproval.isPending ? 'Submitting…' : 'Submit for Approval'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowRenewForm((v) => !v)}
            disabled={!canRenew}
            title={renewDisabledReason}
          >
            <RefreshCw size={15} />
            Renew
          </Button>
          {canArchive && (
            <Button variant="secondary" onClick={handleArchive} loading={archiveContract.isPending}>
              {archiveContract.isPending ? 'Archiving…' : 'Archive'}
            </Button>
          )}
        </div>
      </Card>

      {contract.renewedTo && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          This contract has been renewed —{' '}
          <Link to={`/contracts/${contract.renewedTo}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
            view the renewal
          </Link>
          .
        </p>
      )}
      {contract.renewedFrom && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Renewed from{' '}
          <Link to={`/contracts/${contract.renewedFrom}`} className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
            the original contract
          </Link>
          .
        </p>
      )}
      {contract.sourceTemplate && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Generated from template version {contract.sourceTemplateVersionNumber}.
        </p>
      )}

      {showRenewForm && canRenew && (
        <Card className="p-4 mb-6 animate-fade-in-up">
          <SectionHeading
            icon={RefreshCw}
            title="Renew Contract"
            description="Creates a new contract continuing from this one's latest terms, starting as a Draft for its own review."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="renew-expiry-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Expiry Date</label>
              <Input
                id="renew-expiry-date"
                type="date"
                value={renewExpiryDate}
                onChange={(e) => setRenewExpiryDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="renew-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Value <span className="font-normal text-slate-400 dark:text-slate-500">(optional — keeps current value if blank)</span>
              </label>
              <Input
                id="renew-value"
                type="number"
                step="0.01"
                value={renewValue}
                onChange={(e) => setRenewValue(e.target.value)}
              />
            </div>
          </div>
          {renewError && <p className="text-sm text-danger-600 dark:text-danger-400 mb-3">{renewError}</p>}
          <Button onClick={handleRenewSubmit} loading={renewContract.isPending}>
            {renewContract.isPending ? 'Renewing…' : 'Confirm Renewal'}
          </Button>
        </Card>
      )}

      {(activeWorkflow || (workflows && workflows.length > 0)) && (
        <Card className="p-4 mb-6 animate-fade-in-up">
          <SectionHeading icon={ClipboardCheck} title="Approval Workflow" />
          <ApprovalTimeline workflow={activeWorkflow ?? workflows![0]} />
          {activeWorkflow && <ApprovalActionPanel workflow={activeWorkflow} />}
        </Card>
      )}

      {contract.status === 'Approved' && (
        <Card className="p-4 mb-6 animate-fade-in-up">
          <SectionHeading icon={FileSignature} title="Initiate Signature" />
          <InitiateSignatureForm contractId={contract._id} />
        </Card>
      )}

      {(contract.status === 'PendingSignature' || contract.status === 'Signed') && (
        <Card className="p-4 mb-6 animate-fade-in-up">
          <SectionHeading icon={PenTool} title="Signatures" />
          <SignatureStatusList signatures={signatures ?? []} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {isEditing ? (
          <Card className="p-4 md:col-span-2 animate-fade-in-up">
            <SectionHeading icon={Pencil} title="Edit Contract Details" />
            <EditContractForm contract={contract} onDone={() => setIsEditing(false)} />
          </Card>
        ) : (
          <>
            <Card className="p-4 animate-fade-in-up">
              <SectionHeading icon={Info} title="Details" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Type</dt>
                  <dd className="text-slate-900 dark:text-white text-right">{humanizeLabel(contract.contractType)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Effective Date</dt>
                  <dd className="text-slate-900 dark:text-white text-right">{formatDate(contract.effectiveDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Expiry Date</dt>
                  <dd className="text-slate-900 dark:text-white text-right">{formatDate(contract.expiryDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Confidentiality</dt>
                  <dd className="text-slate-900 dark:text-white text-right">{contract.confidentialityLevel}</dd>
                </div>
                {contract.contractValue != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Value</dt>
                    <dd className="text-slate-900 dark:text-white text-right">
                      {contract.currency ?? ''} {contract.contractValue.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="p-4 animate-fade-in-up">
              <SectionHeading icon={Users} title="Parties" />
              {contract.parties.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No parties recorded yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {contract.parties.map((p, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-right">{p.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>

      <Card className="p-4 mb-6 animate-fade-in-up">
        <SectionHeading icon={ListChecks} title="Obligations" />
        <div className="mb-4">
          <CreateObligationForm contractId={contract._id} />
        </div>
        <ObligationList obligations={obligations ?? []} />
      </Card>

      <Card className="p-4 mb-6 animate-fade-in-up">
        <SectionHeading icon={FileStack} title="Documents" />
        <div className="mb-4">
          <DocumentUpload contractId={contract._id} />
        </div>
        <DocumentList documents={documents ?? []} contractId={contract._id} />
      </Card>

      <Card className="p-4 animate-fade-in-up">
        <SectionHeading
          icon={History}
          title="Version History"
          action={
            versions && versions.length > 1 ? (
              <button
                onClick={() => setShowRangeCompare((v) => !v)}
                className="text-xs text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline text-left sm:text-right"
              >
                {showRangeCompare ? 'Hide comparison report' : 'Compare any two versions'}
              </button>
            ) : undefined
          }
        />

        {showRangeCompare && versions && versions.length > 1 && (
          <VersionRangeCompare contractId={contract._id} versions={versions} />
        )}

        {rollbackError && <p className="text-sm text-danger-600 dark:text-danger-400 mb-3">{rollbackError}</p>}

        {!versions || versions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No versions recorded.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-ink-800">
            {versions.map((v) => {
              const isLatest = v.versionNumber === versions[0].versionNumber;
              return (
                <li key={v._id} className="py-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900 dark:text-white">v{v.versionNumber}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">{v.changeSummary ?? 'No summary'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
                      <span className="text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleString()}</span>
                      {v.versionNumber > 1 && (
                        <button
                          onClick={() => setComparingVersionId(comparingVersionId === v._id ? null : v._id)}
                          className="text-xs text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline"
                        >
                          {comparingVersionId === v._id ? 'Hide diff' : 'Compare to previous'}
                        </button>
                      )}
                      {!isLatest && (
                        <button
                          onClick={async () => {
                            setRollbackError(null);
                            const ok = await confirm({
                              title: `Roll back to version ${v.versionNumber}?`,
                              message: 'This creates a new version with that content.',
                              confirmLabel: 'Roll back',
                              tone: 'neutral',
                            });
                            if (!ok) return;
                            rollback.mutate(v.versionNumber, {
                              onSuccess: () => showToast(`Rolled back to version ${v.versionNumber}`),
                              onError: (err) => setRollbackError(getApiErrorMessage(err)),
                            });
                          }}
                          disabled={rollback.isPending}
                          className="text-xs text-warning-700 dark:text-warning-200 hover:underline disabled:opacity-40"
                        >
                          Roll back to this
                        </button>
                      )}
                    </div>
                  </div>
                  {comparingVersionId === v._id && (
                    <VersionCompareView contractId={contract._id} versionId={v._id} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
